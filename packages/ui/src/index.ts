// @lens/ui — shared design system (UI primitives, effects, theme, hooks, utils).
// Data (types/services/queries/mock) lives in each app, NOT here.

// shadcn primitives
export * from "./components/ui/avatar";
export * from "./components/ui/badge";
export * from "./components/ui/button";
export * from "./components/ui/calendar";
export * from "./components/ui/card";
export * from "./components/ui/checkbox";
export * from "./components/ui/dialog";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/input";
export * from "./components/ui/pagination";
export * from "./components/ui/popover";
export * from "./components/ui/select";
export * from "./components/ui/separator";
export * from "./components/ui/sheet";
export * from "./components/ui/sidebar";
export * from "./components/ui/skeleton";
export * from "./components/ui/slider";
export * from "./components/ui/sonner";
export * from "./components/ui/spinner";
export * from "./components/ui/table";
export * from "./components/ui/tabs";
export * from "./components/ui/tooltip";

// ReUI Data Grid (TanStack Table — used by data-heavy admin tables)
export * from "./components/reui/data-grid/data-grid";
export * from "./components/reui/data-grid/data-grid-table";
export * from "./components/reui/data-grid/data-grid-column-header";
export * from "./components/reui/data-grid/data-grid-pagination";

// React Bits effects (default exports re-exported as named)
export { default as ClickSpark } from "./components/effects/ClickSpark";
export { default as CountUp } from "./components/effects/CountUp";
export { LogoLoop } from "./components/effects/LogoLoop";
export { default as Magnet } from "./components/effects/Magnet";
export { default as Masonry } from "./components/effects/Masonry";
export { default as RotatingText } from "./components/effects/RotatingText";
export { default as ScrollFloat } from "./components/effects/ScrollFloat";
export { default as ScrollReveal } from "./components/effects/ScrollReveal";
export { ScrollVelocity } from "./components/effects/ScrollVelocity";
export { default as Stack } from "./components/effects/Stack";
export { default as TiltedCard } from "./components/effects/TiltedCard";

// Theme
export { ThemeProvider } from "./components/theme/theme-provider";
export { ThemeToggle } from "./components/theme/ThemeToggle";

// Hooks
export { useIsMobile } from "./hooks/use-mobile";
export { useReveal } from "./hooks/useReveal";
export { useSmoothScroll } from "./hooks/useSmoothScroll";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

// Utils
export { cn } from "./lib/utils";
export { delay } from "./lib/delay";
export { formatPrice } from "./lib/format";
export { photo, avatar } from "./lib/placeholderImg";
