import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductPreview } from "./ProductPreview";
import { Reveal } from "./Reveal";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Ambient aurora + grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 aurora opacity-70" />
        <div className="absolute inset-0 landing-grid opacity-[0.5]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-2/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
              AI-powered proposal drafting
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Turn Your Ideas Into{" "}
              <span className="text-gradient">Winning Proposals.</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Create polished business proposals faster with AI-powered drafting, reusable company
              knowledge, and professional templates.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background shadow-[var(--shadow-soft)] transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
              >
                Create Your First Proposal
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface-2/50 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-surface-2 active:scale-[0.98] sm:w-auto"
              >
                Explore Features
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={320} className="mt-16 sm:mt-20">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[2rem] opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--violet) 30%, transparent), transparent 70%)",
              }}
            />
            <ProductPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
