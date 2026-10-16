import type { Config } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { getStore } from "@netlify/blobs";
import OpenAI from "openai";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { documents, profiles, proposals, rfps, usageRecords } from "../../db/schema.js";

const MAX_GENERATIONS_PER_MONTH = 20;
const sectionKeys = ["executive_summary", "understanding", "solution", "deliverables", "timeline", "investment", "next_steps"];

const error = (message: string, status = 400) => Response.json({ detail: message }, { status });
const clean = (value: unknown, max = 12000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const titleFrom = (text: string) => text.split(/[.\n]/)[0].replace(/[^\w\s&-]/g, "").trim().slice(0, 80) || "New proposal";

async function identity() {
  const user = await getUser();
  return user?.id ? user : null;
}

async function ensureProfile(user: NonNullable<Awaited<ReturnType<typeof identity>>>) {
  const found = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  if (!found[0]) {
    await db.insert(profiles).values({ userId: user.id, email: user.email || "", fullName: user.name || "" });
  }
  return (await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1))[0];
}

function proposalDto(row: typeof proposals.$inferSelect) {
  return { id: row.id, rfp: row.rfpId, rfp_title: row.title, title: row.title, tone: row.tone, status: row.status, sections: row.sections, created_at: row.createdAt, updated_at: row.updatedAt };
}

async function generateProposal(userId: string, rfp: typeof rfps.$inferSelect, tone = "professional", length = "standard") {
  const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(usageRecords).where(and(eq(usageRecords.userId, userId), eq(usageRecords.action, "generation")));
  if ((countRows[0]?.count || 0) >= MAX_GENERATIONS_PER_MONTH) throw new Error("Monthly proposal generation limit reached. Upgrade your plan to continue.");
  const requested = rfp.requestedSections?.length ? rfp.requestedSections : sectionKeys;
  const ai = new OpenAI();
  const response = await ai.chat.completions.create({
    model: "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `You are a senior proposal writer. Return JSON only: {"sections":{"key":"content"}}. Create polished, specific business proposal sections. Keys: ${requested.join(", ")}. Do not invent client facts.` },
      { role: "user", content: `Write a ${length}, ${tone} proposal based only on this client brief:\n${rfp.rawText}` },
    ],
  });
  let sections: Record<string, string>;
  try {
    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    sections = parsed.sections;
    if (!sections || typeof sections !== "object" || !Object.values(sections).some((v) => typeof v === "string" && v.trim())) throw new Error();
  } catch { throw new Error("The AI response could not be processed. Please try again."); }
  const [proposal] = await db.insert(proposals).values({ userId, rfpId: rfp.id, title: rfp.title, tone, sections }).returning();
  await db.insert(usageRecords).values({ userId, action: "generation" });
  return proposalDto(proposal);
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const user = await identity();
  if (!user) return error("Sign in to continue.", 401);
  const profile = await ensureProfile(user);

  if (path === "auth/me" && req.method === "GET") return Response.json({ id: user.id, email: user.email, full_name: profile.fullName, org_name: profile.companyName, role: "member", plan: "free" });
  if (path === "auth/org" && req.method === "PATCH") {
    const body = await req.json(); const companyName = clean(body.name, 120);
    if (companyName.length < 2) return error("Company name must be at least 2 characters.");
    await db.update(profiles).set({ companyName, updatedAt: new Date() }).where(eq(profiles.userId, user.id));
    return Response.json({ ok: true });
  }
  if (path === "rfps" && req.method === "POST") {
    const data = req.headers.get("content-type")?.includes("multipart/form-data") ? await req.formData() : await req.json();
    const rawText = clean(data instanceof FormData ? data.get("raw_text") : data.raw_text, 50000);
    if (rawText.length < 20) return error("Add a little more project context before generating.");
    const title = clean(data instanceof FormData ? data.get("title") : data.title, 100) || titleFrom(rawText);
    const list = data instanceof FormData ? data.getAll("sections").map((v) => clean(v, 80)).filter(Boolean) : Array.isArray(data.sections) ? data.sections.map((v: unknown) => clean(v, 80)).filter(Boolean) : [];
    const [rfp] = await db.insert(rfps).values({ userId: user.id, title, rawText, requestedSections: list }).returning();
    return Response.json({ id: rfp.id, title: rfp.title }, { status: 201 });
  }
  const generation = path.match(/^rfps\/([\w-]+)\/generate$/);
  if (generation && req.method === "POST") {
    const source = await db.select().from(rfps).where(and(eq(rfps.id, generation[1]), eq(rfps.userId, user.id))).limit(1);
    if (!source[0]) return error("Proposal source not found.", 404);
    const body = await req.json().catch(() => ({}));
    try { return Response.json(await generateProposal(user.id, source[0], clean(body.tone, 30) || "professional", clean(body.length, 30) || "standard"), { status: 201 }); }
    catch (cause) { return error(cause instanceof Error ? cause.message : "Proposal generation failed.", cause instanceof Error && cause.message.includes("limit") ? 403 : 502); }
  }
  if (path === "proposals" && req.method === "GET") {
    const rows = await db.select().from(proposals).where(eq(proposals.userId, user.id)).orderBy(desc(proposals.updatedAt));
    return Response.json({ results: rows.map(proposalDto) });
  }
  const proposalMatch = path.match(/^proposals\/([\w-]+)$/);
  if (proposalMatch) {
    const where = and(eq(proposals.id, proposalMatch[1]), eq(proposals.userId, user.id));
    if (req.method === "GET") { const row = (await db.select().from(proposals).where(where).limit(1))[0]; return row ? Response.json(proposalDto(row)) : error("Proposal not found.", 404); }
    if (req.method === "PATCH") { const body = await req.json(); const values: Partial<typeof proposals.$inferInsert> = { updatedAt: new Date() }; if (body.sections && typeof body.sections === "object") values.sections = body.sections; if (["draft", "final"].includes(body.status)) values.status = body.status; const row = (await db.update(proposals).set(values).where(where).returning())[0]; return row ? Response.json(proposalDto(row)) : error("Proposal not found.", 404); }
    if (req.method === "DELETE") { await db.delete(proposals).where(where); return new Response(null, { status: 204 }); }
  }
  if (path === "documents" && req.method === "GET") {
    const rows = await db.select().from(documents).where(eq(documents.userId, user.id)).orderBy(desc(documents.createdAt));
    return Response.json({ results: rows.map((d) => ({ id: d.id, title: d.title, category: d.category, status: d.status, chunk_count: Number(d.chunkCount), size: Number(d.sizeBytes), created_at: d.createdAt })) });
  }
  if (path === "documents" && req.method === "POST") {
    const form = await req.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024) return error("Upload a PDF, DOCX, or TXT file up to 5 MB.");
    const ext = file.name.split(".").pop()?.toLowerCase(); if (!ext || !["pdf", "docx", "txt"].includes(ext)) return error("Only PDF, DOCX, and TXT files are supported.");
    const id = crypto.randomUUID(); const blobKey = `${user.id}/${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await getStore("draftly-private-documents").set(blobKey, file);
    const [doc] = await db.insert(documents).values({ id, userId: user.id, title: clean(form.get("title"), 160) || file.name, category: clean(form.get("category"), 50) || "company_profile", blobKey, sizeBytes: String(file.size), chunkCount: "0" }).returning();
    return Response.json({ id: doc.id, title: doc.title, category: doc.category, status: doc.status, chunk_count: 0, size: file.size, created_at: doc.createdAt }, { status: 201 });
  }
  const documentMatch = path.match(/^documents\/([\w-]+)$/);
  if (documentMatch && req.method === "DELETE") { const row = (await db.select().from(documents).where(and(eq(documents.id, documentMatch[1]), eq(documents.userId, user.id))).limit(1))[0]; if (row) { await getStore("draftly-private-documents").delete(row.blobKey); await db.delete(documents).where(eq(documents.id, row.id)); } return new Response(null, { status: 204 }); }
  if (path === "templates" && req.method === "GET") return Response.json({ results: [] });
  if (path === "analytics/stats" && req.method === "GET") { const rows = await db.select().from(proposals).where(eq(proposals.userId, user.id)); const byTone = Object.entries(rows.reduce<Record<string, number>>((a, p) => ({ ...a, [p.tone]: (a[p.tone] || 0) + 1 }), {})).map(([tone, count]) => ({ tone, count })); return Response.json({ total_proposals: rows.length, success_rate: rows.length ? Math.round(rows.filter((p) => p.status === "final").length / rows.length * 100) : 0, avg_response_seconds: 0, final_count: rows.filter((p) => p.status === "final").length, draft_count: rows.filter((p) => p.status === "draft").length, generating_count: 0, failed_count: 0, by_tone: byTone, monthly_performance: [] }); }
  return error("Endpoint not found.", 404);
};

export const config: Config = { path: "/api/*" };
