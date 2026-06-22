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

    // Fallback: no View Transitions support or the user prefers reduced motion.
    if (reduceMotion || !document.startViewTransition) {
      setTheme(next);
      return;
    }

    // Reveal the new theme with a circle growing from the toggle button to the
    // farthest screen corner. flushSync forces next-themes to apply the `.dark`
    // class synchronously so the snapshot captures the new theme.
    const { clientX: x, clientY: y } = e;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

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
          duration: 480,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
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
