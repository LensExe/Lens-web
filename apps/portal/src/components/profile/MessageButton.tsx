import type { ComponentProps } from "react";
import { MessageSquare } from "lucide-react";
import { Button, cn } from "@lens/ui";
import { sessionUser } from "@/lib/session";

/** Disabled until lens-backend provides conversation and message endpoints. */
export function MessageButton({
  participant,
  label = "Nhắn tin",
  variant = "outline",
  size = "lg",
  className,
}: {
  participant: { id: string; name: string; avatar?: string; role: "client" | "photographer" };
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  if (sessionUser?.id === participant.id) return null;
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled
      title="Backend chưa có API tin nhắn."
      aria-label={`${label} — backend chưa hỗ trợ`}
    >
      <MessageSquare className="size-4" />
      {label}
    </Button>
  );
}
