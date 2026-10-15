import { Link, useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button, CountBadge } from "@lens/ui";
import { useConversations } from "@/queries/useMessages";

export function MessagesMenu() {
  const { pathname } = useLocation();
  const { data: conversations = [] } = useConversations(pathname.startsWith("/messages"));
  const unreadCount = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  return (
    <Button asChild variant="outline" size="icon" className="relative rounded-full" aria-label={`Tin nhắn${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}>
      <Link to="/messages">
        <MessageSquare />
        <CountBadge count={unreadCount} onIcon className="absolute -right-1 -top-1" />
      </Link>
    </Button>
  );
}
