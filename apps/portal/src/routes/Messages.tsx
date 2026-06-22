import { useSearchParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { cn } from "@lens/ui";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { useConversations, useMarkConversationRead } from "@/queries/useMessages";

export function Messages() {
  const { data: conversations = [], isLoading } = useConversations();
  const { mutate: markRead } = useMarkConversationRead();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get("c");
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setSearchParams({ c: id }, { replace: true });
    const convo = conversations.find((c) => c.id === id);
    if (convo && convo.unreadCount > 0) markRead(id);
  };

  const handleBack = () => setSearchParams({}, { replace: true });

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Conversation list */}
      <aside
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r border-border md:w-80 lg:w-96",
          selected ? "hidden md:block" : "block"
        )}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <h1 className="text-lg font-semibold tracking-tight">Tin nhắn</h1>
        </div>
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </aside>

      {/* Thread / empty state */}
      <section className={cn("min-w-0 flex-1", selected ? "block" : "hidden md:block")}>
        {selected ? (
          <MessageThread conversation={selected} onBack={handleBack} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-5 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
              <MessagesSquare className="size-7" />
            </span>
            <p className="font-medium">Chọn một cuộc trò chuyện</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Chọn một cuộc trò chuyện ở bên trái để xem và trả lời tin nhắn.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
