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
export * from "./components/ui/hover-card";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/pagination";
export * from "./components/ui/popover";
export * from "./components/ui/progress";
export * from "./components/ui/radio-group";
export * from "./components/ui/select";
export * from "./components/ui/separator";
export * from "./components/ui/sheet";
export * from "./components/ui/sidebar";
export * from "./components/ui/skeleton";
export * from "./components/ui/slider";
export * from "./components/ui/sonner";
export * from "./components/ui/spinner";
export * from "./components/ui/switch";
export * from "./components/ui/table";
export * from "./components/ui/tabs";
export * from "./components/ui/textarea";
export * from "./components/ui/tooltip";

// ReUI Data Grid (TanStack Table — used by data-heavy admin tables)
export * from "./components/reui/data-grid/data-grid";
export * from "./components/reui/data-grid/data-grid-table";
export * from "./components/reui/data-grid/data-grid-column-header";
export * from "./components/reui/data-grid/data-grid-pagination";

// Layout & data-display blocks (shared by portal + admin)
export { PageContainer } from "./components/blocks/PageContainer";
export { PageHeader } from "./components/blocks/PageHeader";
export { StatusTabs, type StatusTab } from "./components/blocks/StatusTabs";
export { SaveBar } from "./components/blocks/SaveBar";
export { StatCard } from "./components/blocks/StatCard";
export { ErrorScreen } from "./components/blocks/ErrorScreen";
export { CountBadge } from "./components/blocks/CountBadge";
export { BarChart, type BarDatum } from "./components/charts/BarChart";
export { BarList, type BarListItem } from "./components/charts/BarList";
export { SegmentedBar, type Segment } from "./components/charts/SegmentedBar";

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

// Brand
export { Logo } from "./components/brand/Logo";

// Theme
export { ThemeProvider } from "./components/theme/theme-provider";
export { ThemeToggle } from "./components/theme/ThemeToggle";

// Hooks
export { useIsMobile } from "./hooks/use-mobile";
export { useReveal } from "./hooks/useReveal";
export { useSmoothScroll, scrollToHash } from "./hooks/useSmoothScroll";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

// Utils
export { cn } from "./lib/utils";
export { TONE_CHIP, TONE_FILL, type Tone } from "./lib/tones";
export { delay } from "./lib/delay";
export { formatPrice, formatPriceCompact } from "./lib/format";
export { photo, avatar } from "./lib/placeholderImg";
