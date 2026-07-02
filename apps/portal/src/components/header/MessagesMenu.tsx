import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Skeleton,
  cn,
} from "@lens/ui";
import { formatRelative } from "@/lib/time";
import { useConversations } from "@/queries/useMessages";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function MessagesMenu() {
  const { data: conversations = [], isLoading } = useConversations();
  const unreadTotal = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const recent = conversations.slice(0, 5);

  return (
    <div className="relative">
      <HoverCard openDelay={100} closeDelay={150}>
        <HoverCardTrigger asChild>
          <Button asChild variant="outline" size="icon" className="rounded-full">
            <Link to="/messages" aria-label="Tin nhắn">
              <MessageSquare />
            </Link>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="end" sideOffset={10} className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Tin nhắn</p>
            {unreadTotal > 0 && (
              <span className="text-xs text-muted-foreground">{unreadTotal} chưa đọc</span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-1 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Chưa có tin nhắn.
            </p>
          ) : (
            <div className="p-1.5">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  to={`/messages?c=${c.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={c.participantAvatar} alt={c.participantName} />
                    <AvatarFallback>{initialsOf(c.participantName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                        {c.participantName}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelative(c.lastMessageAt)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "truncate text-xs",
                        c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="border-t border-border p-1.5">
            <Link
              to="/messages"
              className="block rounded-xl px-3 py-2 text-center text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              Xem tất cả
            </Link>
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* Unread count overlaid on the trigger — pointer-events-none so it never
          blocks the hover/click target underneath. */}
      {unreadTotal > 0 && (
        <span className="pointer-events-none absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-[18px] text-white">
          {unreadTotal > 9 ? "9+" : unreadTotal}
        </span>
      )}
    </div>
  );
}
