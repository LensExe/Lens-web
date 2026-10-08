import type { ComponentProps } from "react";
import { Input, cn } from "@lens/ui";

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn("h-11 rounded-xl px-3.5", className)} {...props} />;
}
