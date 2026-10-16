import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/auth";
import { LandingNav } from "../components/landing/LandingNav";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingFeatures } from "../components/landing/LandingFeatures";
import { HowItWorks } from "../components/landing/HowItWorks";
import { LandingPricing } from "../components/landing/LandingPricing";
import { LandingFAQ } from "../components/landing/LandingFAQ";
import { FinalCTA } from "../components/landing/FinalCTA";
import { LandingFooter } from "../components/landing/LandingFooter";

/**
 * Public marketing website — served at "/" and requires no authentication.
 * Signed-in visitors are redirected straight into the application.
 */
export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="app-backdrop" />
      <div className="app-grain" />

      <div className="relative z-10">
        <LandingNav />
        <main>
          <LandingHero />
          <LandingFeatures />
          <HowItWorks />
          <LandingPricing />
          <LandingFAQ />
          <FinalCTA />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
