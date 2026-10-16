import {
  Home,
  ClipboardList,
  FileText,
  Brain,
  BarChart3,
  Settings,
  Sparkles,
  Layers,
  Fingerprint,
  Paperclip,
  ArrowUp,
} from "lucide-react";

const NAV = [Home, ClipboardList, FileText, Brain, BarChart3];

const PRESETS = [
  "Web platform redesign for a fintech startup",
  "Mobile app for a healthcare provider",
  "Custom CRM for a growing agency",
  "Data analytics dashboard build-out",
];

const PILLARS = [
  { icon: Sparkles, title: "AI drafting", body: "Grounded, on-brand copy" },
  { icon: Layers, title: "10 sections", body: "Structured every time" },
  { icon: Fingerprint, title: "Your knowledge", body: "Learns from your library" },
];

/**
 * A faithful, non-interactive preview of the Draftly generator, rendered with
 * the same design tokens as the live app so the public site and product share
 * one visual identity. Decorative only (aria-hidden).
 */
export function ProductPreview() {
  return (
    <div
      aria-hidden
      className="liquid overflow-hidden rounded-2xl p-0 shadow-[var(--shadow-panel)]"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-magenta/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald/70" />
        <div className="ml-3 flex-1">
          <div className="mx-auto flex max-w-[220px] items-center justify-center gap-1.5 rounded-md border border-hairline bg-surface-2/60 px-3 py-1 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            app.draftly — generator
          </div>
        </div>
      </div>

      <div className="flex min-h-[360px]">
        {/* Rail */}
        <div className="hidden w-14 shrink-0 flex-col items-center gap-2 border-r border-hairline py-4 sm:flex">
          <img src="/logo.png" alt="" className="mb-2 h-7 w-7 object-contain" />
          {NAV.map((Icon, i) => (
            <span
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                i === 0 ? "bg-surface-3 text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
          ))}
          <span className="mt-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground">
            <Settings className="h-4 w-4" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            Session · live
          </div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
            What would you like to propose today?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Describe your RFP or attach documents. Draftly drafts a polished, on-brand proposal in
            seconds.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <div
                key={p}
                className="rounded-xl border border-hairline bg-surface-2/50 px-3 py-2.5 text-xs text-muted-foreground"
              >
                {p}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-2 rounded-xl border border-hairline bg-surface-1/60 px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-3 text-violet">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="mt-4 rounded-xl border border-hairline bg-surface-2/40 p-3">
            <p className="text-xs text-muted-foreground/80">
              Describe the proposal you need… or drop a PDF / DOCX RFP here.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-1 px-2 py-1 text-[10px] text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Tone · Persuasive
              </span>
              <span className="hidden items-center gap-1 rounded-lg border border-hairline bg-surface-1 px-2 py-1 text-[10px] text-muted-foreground sm:flex">
                Length · Standard
              </span>
              <span className="ml-auto flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[10px] font-semibold text-background">
                Generate
                <ArrowUp className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
