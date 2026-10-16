import {
  Sparkles,
  LayoutTemplate,
  BookOpen,
  UploadCloud,
  PenLine,
  Download,
  FolderKanban,
} from "lucide-react";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI proposal drafting",
    body: "Describe the opportunity and Draftly writes a complete, structured proposal — grounded in your own material, never invented facts.",
  },
  {
    icon: BookOpen,
    title: "Company knowledge library",
    body: "Upload past proposals, case studies and credentials. Draftly retrieves the most relevant passages so every draft sounds like you.",
  },
  {
    icon: LayoutTemplate,
    title: "Professional templates",
    body: "Start from proven structures for common engagements, or save your own winning proposals as reusable templates.",
  },
  {
    icon: UploadCloud,
    title: "Document upload & analysis",
    body: "Drop in a PDF or DOCX RFP and Draftly reads the requirements, then tailors the response to what the buyer actually asked for.",
  },
  {
    icon: PenLine,
    title: "Rich proposal editor",
    body: "Refine any section with a clean editor, regenerate individual parts, adjust tone and length, and preview before you send.",
  },
  {
    icon: Download,
    title: "Export anywhere",
    body: "Export finished proposals to PDF, DOCX or plain text — ready to attach to your submission or send straight to the client.",
  },
  {
    icon: FolderKanban,
    title: "Proposal management",
    body: "Keep every draft, version and status organised in one library, with search, filters and quick duplication.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet">Features</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to win the bid
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            One focused workspace that takes you from raw requirements to a polished, on-brand
            proposal.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 80}>
              <div className="group h-full rounded-2xl border border-hairline bg-surface-1/50 p-6 backdrop-blur transition duration-300 hover:border-hairline-strong hover:bg-surface-2/60">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-surface-2 text-violet transition group-hover:text-cyan">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </Reveal>
          ))}

          {/* Accent tile to balance the 7-item grid */}
          <Reveal delay={160}>
            <div className="flex h-full flex-col justify-between rounded-2xl border border-hairline bg-gradient-to-br from-violet/15 via-surface-1/40 to-surface-1/40 p-6 backdrop-blur">
              <Sparkles className="h-5 w-5 text-cyan" />
              <div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  Ready when you are
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Start free — no credit card required. Upgrade only when Draftly is earning its
                  keep.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
