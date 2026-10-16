import { useReveal } from "./useReveal";

/**
 * Wraps children in a scroll-reveal container.
 * `delay` (ms) staggers multiple items.
 */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
