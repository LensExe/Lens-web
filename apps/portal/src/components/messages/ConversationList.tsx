import { MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Skeleton, cn } from "@lens/ui";
import { formatRelative } from "@/lib/time";
import type { Conversation } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center px-5 py-12 text-center">
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessagesSquare className="size-5" />
        </span>
        <p className="text-sm font-medium">Chưa có cuộc trò chuyện nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Tin nhắn với khách hàng và nhiếp ảnh gia sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {conversations.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "focus-ring flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
              active ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            <Avatar className="size-11 shrink-0">
              <AvatarImage src={c.participantAvatar} alt={c.participantName} />
              <AvatarFallback>{initialsOf(c.participantName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                  {c.participantName}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelative(c.lastMessageAt)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm",
                    c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.lastMessage}
                </p>
                {c.unreadCount > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-medium text-background">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
