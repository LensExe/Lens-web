import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

/** Centered "done" state for the deposit / payment pages. */
export function CheckoutResult({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[560px] py-8 text-center duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-6 text-left">{children}</div>
    </div>
  );
}
