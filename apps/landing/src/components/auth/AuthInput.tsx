import type { ComponentProps } from "react";
import { Input, cn } from "@lens/ui";

/** The auth forms' input: taller, rounder field than the compact default. */
export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn("h-11 rounded-xl px-3.5", className)} {...props} />;
}
