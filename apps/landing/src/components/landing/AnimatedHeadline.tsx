import { Fragment, type ReactNode } from "react";
import { cn } from "@lens/ui";

interface AnimatedHeadlineProps {
  /** Lines of text; each line wraps. Use `accent: true` to tint a word group. */
  segments: { text: string; accent?: boolean }[][];
  className?: string;
  /** Inline node appended to the last line (e.g. a rotating word). */
  trailing?: ReactNode;
}

// Per-character "soft-blur-in" reveal (animate-text spec: soft-blur-in).
// from { opacity:0; y:16px; blur:12px } -> to { ... }, 900ms, 25ms stagger,
// cubic-bezier(0.22, 1, 0.36, 1). Transform/opacity/filter only.
// Characters are grouped into per-word wrappers so words never break mid-letter.
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const STAGGER_MS = 25;

export function AnimatedHeadline({
  segments,
  className,
  trailing,
}: AnimatedHeadlineProps) {
  // Pure derivation pass: assign each character a global stagger delay.
  let index = 0;
  const lines = segments.map((line) =>
    line.map((segment) => ({
      accent: segment.accent,
      words: segment.text.split(" ").map((word) =>
        [...word].map((char) => {
          const delay = index * STAGGER_MS;
          index += 1;
          return { char, delay };
        })
      ),
    }))
  );

  return (
    <h1 className={cn("font-semibold tracking-tight text-balance", className)}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block">
          {line.map((segment, segIdx) => (
            <span
              key={segIdx}
              className={segment.accent ? "text-ash dark:text-steel" : undefined}
            >
              {segment.words.map((chars, wIdx) => (
                <Fragment key={wIdx}>
                  <span className="inline-block whitespace-nowrap">
                    {chars.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-block will-change-transform motion-reduce:animate-none"
                        style={{
                          animation: `soft-blur-in 900ms ${EASING} ${c.delay}ms both`,
                        }}
                      >
                        {c.char}
                      </span>
                    ))}
                  </span>
                  {wIdx < segment.words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>
          ))}
          {/* trailing inline node (e.g. rotating word) on the last line */}
          {lineIdx === lines.length - 1 && trailing ? (
            <> {trailing}</>
          ) : null}
        </span>
      ))}
    </h1>
  );
}
