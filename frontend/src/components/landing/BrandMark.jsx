import { Link } from "react-router-dom";

/**
 * Shared Draftly brand lockup used on the public site and in the app.
 * Keeps the wordmark + logo consistent everywhere (Phase 5 requirement).
 */
export function BrandMark({ to = "/", size = "md", showWord = true, className = "" }) {
  const dims = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const word = size === "lg" ? "text-xl" : "text-lg";

  return (
    <Link to={to} className={`group flex items-center gap-2.5 ${className}`} aria-label="Draftly home">
      <span className={`relative flex ${dims} items-center justify-center`}>
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl opacity-0 blur-[14px] transition-opacity duration-300 group-hover:opacity-70"
          style={{ background: "linear-gradient(135deg, var(--violet), var(--cyan))" }}
        />
        <img
          src="/logo.png"
          alt=""
          className={`relative ${dims} object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105`}
        />
      </span>
      {showWord && (
        <span className={`font-display ${word} font-semibold tracking-tight text-foreground`}>
          Draftly
        </span>
      )}
    </Link>
  );
}
