import type { ComponentProps, CSSProperties } from "react";
import { cn } from "../../lib/utils";

// Static brand asset served from each app's public/ dir (public/lens-logo.svg).
const logoUrl = "/lens-logo.svg";

// Render the wordmark as a CSS mask so it picks up `bg-foreground` — black in
// light mode, white in dark — instead of the SVG's fixed gray fill.
const maskStyle: CSSProperties = {
  maskImage: `url(${logoUrl})`,
  WebkitMaskImage: `url(${logoUrl})`,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
  maskSize: "contain",
  WebkitMaskSize: "contain",
};

/**
 * Lens wordmark. Themes via `currentColor`/`bg-foreground` (CSS mask).
 * Default height is h-6; override with className (e.g. `h-7`).
 */
export function Logo({ className, style, ...props }: ComponentProps<"span">) {
  return (
    <span
      role="img"
      aria-label="Lens"
      className={cn("inline-block aspect-[556/327] h-6 bg-foreground", className)}
      style={{ ...maskStyle, ...style }}
      {...props}
    />
  );
}
