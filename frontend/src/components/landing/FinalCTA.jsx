import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-hairline px-6 py-16 text-center sm:px-16">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 aurora opacity-80" />
              <div className="absolute inset-0 landing-grid opacity-40" />
            </div>

            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Your next winning proposal starts here
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Create your workspace in under a minute and draft your first proposal today.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
              >
                Create Your First Proposal
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-surface-2/50 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-surface-2 active:scale-[0.98] sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
