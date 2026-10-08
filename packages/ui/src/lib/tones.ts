/**
 * Tones for STATUS pills and warnings only — never decoration (icons, cards and
 * shortcuts stay neutral; see DESIGN.md "Restrained palette"). Each tone is a
 * soft tint with a readable foreground in both themes.
 *   ember   → the brand accent (#ff5a00)
 *   sky     → scheduled / booked
 *   emerald → done / success
 *   violet  → money held by the platform
 *   amber   → waiting / needs attention
 *   rose    → problem / over a limit
 */
export type Tone = "neutral" | "ember" | "sky" | "emerald" | "violet" | "amber" | "rose";

/** Soft chip: tinted background + foreground (icon badges, pills). */
export const TONE_CHIP: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  ember: "bg-ember/10 text-ember",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
};

/** Solid fill for bars / progress indicators in the same tone. */
export const TONE_FILL: Record<Tone, string> = {
  neutral: "bg-foreground",
  ember: "bg-ember",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};
