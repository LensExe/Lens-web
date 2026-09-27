import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesSquare, Search } from "lucide-react";
import { CountBadge, Input, Sheet, SheetContent, SheetTitle, cn } from "@lens/ui";
import { ConversationList } from "@/components/messages/ConversationList";
import { MessageThread } from "@/components/messages/MessageThread";
import { ConversationInfo } from "@/components/messages/ConversationInfo";
import { useConversations, useMarkConversationRead } from "@/queries/useMessages";

// Accent-insensitive match, so "thuy an" finds "Thuý An".
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Inbox: conversations · thread · who-is-this (+ bookings between you). */
export function Messages() {
  const { data: conversations = [], isLoading } = useConversations();
  const { mutate: markRead } = useMarkConversationRead();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const selectedId = searchParams.get("c");
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // Opening a thread — by click or through a ?c= link — marks it read.
  const selectedUnread = selected?.unreadCount ?? 0;
  useEffect(() => {
    if (selectedId && selectedUnread > 0) markRead(selectedId);
  }, [selectedId, selectedUnread, markRead]);

  const unreadThreads = conversations.filter((c) => c.unreadCount > 0).length;
  const q = fold(query.trim());
  const visible = conversations.filter(
    (c) =>
      // Keep the open thread listed after it turns read in the "Chưa đọc" tab.
      (!unreadOnly || c.unreadCount > 0 || c.id === selectedId) &&
      (!q || fold(`${c.participantName} ${c.lastMessage}`).includes(q))
  );

  const select = (id: string) => setSearchParams({ c: id }, { replace: true });
  const back = () => setSearchParams({}, { replace: true });

  return (
    <div className="flex h-full">
      {/* Conversations */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-r border-border md:flex md:w-80 lg:w-96",
          selected ? "hidden" : "flex"
        )}
      >
        <div className="space-y-3 border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc nội dung"
              aria-label="Tìm cuộc trò chuyện"
              className="h-10 rounded-full pl-9"
            />
          </div>
          <div role="tablist" aria-label="Lọc hội thoại" className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm">
            {[
              { unread: false, label: "Tất cả" },
              { unread: true, label: "Chưa đọc" },
            ].map((tab) => {
              const active = unreadOnly === tab.unread;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setUnreadOnly(tab.unread)}
                  className={cn(
                    "focus-ring flex items-center justify-center gap-1.5 rounded-full py-1.5 font-medium transition-colors",
                    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {tab.unread && <CountBadge count={unreadThreads} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!isLoading && conversations.length > 0 && visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {q ? "Không tìm thấy cuộc trò chuyện phù hợp." : "Bạn đã đọc hết tin nhắn."}
            </p>
          ) : (
            <ConversationList
              conversations={visible}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={select}
            />
          )}
        </div>
      </aside>

      {/* Thread / empty state */}
      <section className={cn("min-w-0 flex-1", selected ? "block" : "hidden md:block")}>
        {selected ? (
          <MessageThread
            conversation={selected}
            onBack={back}
            onShowInfo={() => setInfoOpen(true)}
          />
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

      {/* Context — docked on wide screens, a sheet below that */}
      {selected && (
        <aside className="hidden w-80 shrink-0 border-l border-border xl:block">
          <ConversationInfo conversation={selected} />
        </aside>
      )}
      <Sheet open={infoOpen && !!selected} onOpenChange={setInfoOpen}>
        <SheetContent side="right" className="w-80 gap-0 p-0 xl:hidden">
          <SheetTitle className="sr-only">Thông tin hội thoại</SheetTitle>
          {selected && <ConversationInfo conversation={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
