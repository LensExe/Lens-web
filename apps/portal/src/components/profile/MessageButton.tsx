import type { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button, cn, toast } from "@lens/ui";
import { portalLogin } from "@/lib/links";
import { sessionUser } from "@/lib/session";
import { useStartConversation } from "@/queries/useMessages";

export function MessageButton({
  participant,
  label = "Nhắn tin",
  variant = "outline",
  size = "lg",
  className,
  bookingId,
}: {
  participant: { id: string; name: string; avatar?: string; role: "client" | "photographer" };
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  bookingId?: string;
}) {
  const navigate = useNavigate();
  const start = useStartConversation();

  if (sessionUser?.role === "photographer" && participant.role === "photographer") return null;
  if (sessionUser?.role === participant.role && sessionUser.id === participant.id) return null;

  if (!sessionUser) {
    return (
      <Button asChild variant={variant} size={size} className={cn("rounded-full", className)}>
        <a href={portalLogin(window.location.href)} aria-label={`${label} — đăng nhập để tiếp tục`}>
          <MessageSquare className="size-4" />
          {label}
        </a>
      </Button>
    );
  }

  const begin = () => {
    start.mutate(
      { ...participant, bookingId },
      {
        onSuccess: (conversation) => {
          navigate(`/messages?conversation=${encodeURIComponent(conversation.id)}`);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Không thể mở hội thoại.");
        },
      },
    );
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={start.isPending}
      onClick={begin}
      title={start.isPending ? "Đang mở hội thoại…" : undefined}
      aria-label={label}
    >
      <MessageSquare className={cn("size-4", start.isPending && "animate-pulse")} />
      {label}
    </Button>
  );
}
