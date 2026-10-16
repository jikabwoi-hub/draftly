import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { PLANS, BILLING_CADENCES } from "../../lib/plans";
import { Reveal } from "./Reveal";

export function LandingPricing() {
  const [billing, setBilling] = useState("monthly");
  const plans = PLANS[billing];

  return (
    <section id="pricing" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Start free. Upgrade when Draftly is winning you work — cancel any time.
          </p>

          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-1/60 p-1 backdrop-blur">
            {BILLING_CADENCES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  billing === b
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b === "annual" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      billing === b ? "bg-background/20 text-background" : "bg-emerald/15 text-emerald"
                    }`}
                  >
                    −20%
                  </span>
                )}
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 80}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 backdrop-blur transition ${
                  plan.highlight
                    ? "border-hairline-strong bg-gradient-to-b from-violet/12 via-surface-1/60 to-surface-1/60"
                    : "border-hairline bg-surface-1/50 hover:border-hairline-strong"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-6 rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                    {plan.priceLabel}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="line-through">{plan.originalPrice}</span> · {plan.annualNote}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                )}

                <Link
                  to="/register"
                  className={`mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                    plan.highlight
                      ? "bg-foreground text-background hover:opacity-90"
                      : "border border-hairline bg-surface-2/60 text-foreground hover:bg-surface-2"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="my-5 h-px bg-hairline" />

                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Payments are securely processed by Stripe. All plans include encryption in transit and
            GDPR-conscious data handling.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
