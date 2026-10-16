import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Sparkles, Star, Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/auth";
import api from "../api/client";
import { PLANS, BILLING_CADENCES } from "../lib/plans";

// Icons are presentation-only; pricing data lives in src/lib/plans.js.
const ICONS = { free: Zap, solo: Sparkles, studio: Star, agency: Crown };
const ICON_COLORS = {
  free: "text-cyan",
  solo: "text-violet",
  studio: "text-magenta",
  agency: "text-amber",
};

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const [upgrading, setUpgrading] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const currentTier = user?.org?.subscription_tier ?? "free";
  const plans = PLANS[billing];

  const handleUpgrade = async (tier) => {
    if (tier === "free") {
      navigate("/app");
      return;
    }

    setUpgrading(tier);
    try {
      const { data } = await api.post("/billing/checkout/", {
        tier,
        billing_cadence: billing,
      });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not start checkout.");
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <h1 className="mb-3 font-display text-3xl font-semibold tracking-tight text-foreground">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-muted-foreground">
            Choose the plan that fits your team. Upgrade or downgrade at any time.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-hairline bg-surface p-1">
            {BILLING_CADENCES.map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
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
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = ICONS[plan.id];
            const isCurrent = plan.id === currentTier;
            const isLoading = upgrading === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  plan.highlight
                    ? "border-hairline-strong bg-gradient-to-b from-violet/10 via-surface to-surface"
                    : "border-hairline bg-surface hover:border-hairline-strong"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name & icon */}
                <div className="mb-4 flex items-center gap-2">
                  <span className={`rounded-lg bg-surface-2 p-1.5 ${ICON_COLORS[plan.id]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-base font-semibold text-foreground">{plan.name}</span>
                </div>

                {/* Price */}
                <div className="mb-1 flex items-end gap-1">
                  <span className="font-display text-4xl font-semibold text-foreground">
                    {plan.priceLabel}
                  </span>
                  <span className="mb-1 text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice ? (
                  <p className="mb-5 text-xs text-muted-foreground">
                    <span className="line-through">{plan.originalPrice}</span> · {plan.annualNote}
                  </p>
                ) : (
                  <p className="mb-5 text-sm text-muted-foreground">{plan.tagline}</p>
                )}

                {/* CTA button */}
                {isCurrent ? (
                  <div className="mb-5 flex h-10 items-center justify-center rounded-xl border border-hairline text-sm text-muted-foreground">
                    Your current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    className={`mb-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                        : "bg-surface-2 text-foreground hover:bg-surface-3 active:scale-[0.98]"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}

                <hr className="mb-5 border-hairline" />

                {/* Features */}
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          All plans include SSL encryption and GDPR-compliant data handling. Payments are securely
          processed by Stripe.
        </p>
      </div>
    </div>
  );
}
