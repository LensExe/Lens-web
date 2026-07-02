import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = usePrefersReducedMotion();

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolvedTheme === "dark" ? "light" : "dark";

    // Fallback: reduced motion or no View Transitions support → swap instantly.
    if (reduceMotion || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    // Real content reveal: the new theme is wiped in as a circle growing from the
    // toggle button, UNDER the content (the changing layer is the page snapshot,
    // content stays visible throughout). Tradeoff: while the transition runs, the
    // page is a snapshot, so other animations pause briefly then resume.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius =
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      ) + 8;

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      aria-label="Chuyển giao diện sáng/tối"
      onClick={toggle}
    >
      {/* Icon swap is driven by the .dark class on <html> — no state, no flash. */}
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
