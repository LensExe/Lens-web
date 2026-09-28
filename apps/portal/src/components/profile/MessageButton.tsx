import type { ComponentProps } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button, Spinner, cn, toast } from "@lens/ui";
import { useStartConversation } from "@/queries/useMessages";
import { isSignedIn, sessionUser } from "@/lib/session";
import { portalLogin } from "@/lib/links";

/** Who the conversation is with. */
export interface MessageParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: "client" | "photographer";
}

/**
 * "Nhắn tin" — opens (or starts) the conversation with `participant` and goes
 * straight to it. Used wherever the two people meet: a photographer's profile,
 * a booking's detail page, the deposit confirmation. Guests sign in first.
 */
export function MessageButton({
  participant,
  label = "Nhắn tin",
  variant = "outline",
  size = "lg",
  className,
}: {
  participant: MessageParticipant;
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const navigate = useNavigate();
  const startChat = useStartConversation();

  // No chatting with yourself.
  if (sessionUser?.id === participant.id) return null;

  const open = () => {
    // Guests sign in first, then return to this page.
    if (!isSignedIn) {
      window.location.href = portalLogin();
      return;
    }
    startChat.mutate(
      { ...participant, avatar: participant.avatar ?? "" },
      {
        onSuccess: (conv) => navigate(`/messages?c=${conv.id}`),
        onError: () => toast.error("Không thể mở tin nhắn, vui lòng thử lại"),
      }
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("rounded-full", className)}
      disabled={startChat.isPending}
      onClick={open}
    >
      {startChat.isPending ? <Spinner /> : <MessageSquare className="size-4" />}
      {label}
    </Button>
  );
}
