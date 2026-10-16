import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Describe the opportunity",
    body: "Tell Draftly what you're bidding on, or upload the RFP document. Add your tone, length and industry preferences in a couple of clicks.",
  },
  {
    n: "02",
    title: "Let AI draft the proposal",
    body: "Draftly analyses the requirements and writes a structured, ten-section proposal grounded in your company knowledge — never generic filler.",
  },
  {
    n: "03",
    title: "Refine, export and send",
    body: "Edit any section, regenerate what you need, then export a polished PDF or DOCX and send it off with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 landing-grid opacity-30" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From idea to proposal in three steps
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No blank page, no formatting marathon — just a clear path to a finished document.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="relative h-full rounded-2xl border border-hairline bg-surface-1/50 p-7 backdrop-blur">
                <span className="font-display text-4xl font-semibold text-gradient">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-1/2 hidden h-px w-4 translate-x-full bg-hairline md:block"
                  />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
