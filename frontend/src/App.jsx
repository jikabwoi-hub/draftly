import { lazy, Suspense, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import useAuthStore from "./store/auth";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppShell } from "./components/AppShell";
import CookieConsentBanner from "./components/CookieConsentBanner";

// Public marketing site (no auth)
const Landing = lazy(() => import("./pages/Landing"));

// Application (auth required)
const Generator = lazy(() =>
  import("./components/Generator").then((m) => ({ default: m.Generator }))
);
const Templates = lazy(() => import("./pages/Templates"));
const Knowledge = lazy(() => import("./pages/knowledge"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Proposals = lazy(() => import("./pages/Proposals"));
const Settings = lazy(() => import("./pages/Settings"));
const NewRFP = lazy(() => import("./pages/NewRFP"));
const Editor = lazy(() => import("./pages/Editor"));
const Pricing = lazy(() => import("./pages/Pricing"));

// Auth + legal
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <PageFallback />;
  return user ? children : <Navigate to="/login" replace />;
}

// Static hosts that serve the SPA from a sub-path (e.g. an S3 preview) can't use
// history-based routing. Set VITE_USE_HASH_ROUTER=true at build time to switch to
// hash routing (#/path) so deep links survive a hard refresh.
const Router = import.meta.env.VITE_USE_HASH_ROUTER === "true" ? HashRouter : BrowserRouter;

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "no-client-id"}>
      <Sentry.ErrorBoundary fallback={<PageFallback />}>
        <ThemeProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--radius-xl)",
                  fontSize: "0.875rem",
                  maxWidth: "400px",
                  boxShadow: "var(--shadow-panel)",
                },
                success: {
                  iconTheme: {
                    primary: "var(--emerald)",
                    secondary: "var(--surface)",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "var(--destructive)",
                    secondary: "var(--surface)",
                  },
                },
              }}
            />
            <CookieConsentBanner />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* ── Public marketing website ─────────────────────────── */}
                <Route path="/" element={<Landing />} />

                {/* ── Authentication ───────────────────────────────────── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />

                {/* ── Legal ────────────────────────────────────────────── */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                {/* ── Application (protected) ──────────────────────────── */}
                <Route
                  path="/app"
                  element={
                    <PrivateRoute>
                      <AppShell />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Generator />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="knowledge" element={<Knowledge />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="proposals" element={<Proposals />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="rfps/new" element={<NewRFP />} />
                  <Route path="proposals/:id" element={<Editor />} />
                  <Route path="pricing" element={<Pricing />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
      </Sentry.ErrorBoundary>
    </GoogleOAuthProvider>
  );
}
