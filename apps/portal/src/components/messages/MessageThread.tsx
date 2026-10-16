import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, Send, Undo2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
  Textarea,
  cn,
  toast,
} from "@lens/ui";
import {
  useEditMessage,
  useMarkConversationRead,
  useMessages,
  useRecallMessage,
  useSendMessage,
} from "@/queries/useMessages";
import { getBackendSubject } from "@/lib/backend-api";
import { formatClock } from "@/lib/time";
import type { Conversation, Message } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

const ROLE_LABEL: Record<Conversation["participantRole"], string> = {
  client: "Khách hàng",
  photographer: "Nhiếp ảnh gia",
};

interface MessageThreadProps {
  conversation: Conversation;
  /** Shown on mobile to return to the conversation list. */
  onBack: () => void;
}

export function MessageThread({ conversation, onBack }: MessageThreadProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(conversation.id);
  const messages = useMemo(
    () => (data?.pages.flat() ?? []).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [data],
  );
  const { mutate: send, isPending } = useSendMessage(conversation.id);
  const edit = useEditMessage(conversation.id);
  const recall = useRecallMessage(conversation.id);
  const markRead = useMarkConversationRead();
  const currentSubject = getBackendSubject();
  const lastSequence = messages.reduce((latest, message) => Math.max(latest, message.sequence ?? 0), 0);
  const [draft, setDraft] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number | null>(null);

  // Keep the current viewport when older pages are prepended; follow new messages at the bottom.
  useLayoutEffect(() => {
    const list = messageListRef.current;
    if (list && previousScrollHeight.current !== null) {
      list.scrollTop += list.scrollHeight - previousScrollHeight.current;
      previousScrollHeight.current = null;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, conversation.id]);

  useEffect(() => {
    if (!isLoading && lastSequence > 0) {
      markRead.mutate(
        { conversationId: conversation.id, lastReadSeq: lastSequence },
        { onError: () => toast.error("Không cập nhật được trạng thái đã đọc.") },
      );
    }
  }, [conversation.id, isLoading, lastSequence, markRead.mutate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isPending) return;
    send(text, {
      onSuccess: () => setDraft(""),
      onError: () => toast.error("Không gửi được tin nhắn. Vui lòng thử lại."),
    });
  };

  const openEdit = (message: Message) => {
    setEditingMessage(message);
    setEditDraft(message.text);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = editDraft.trim();
    if (!editingMessage || !content || edit.isPending) return;
    edit.mutate(
      { messageId: editingMessage.id, content },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật tin nhắn.");
          setEditingMessage(null);
        },
        onError: () => toast.error("Không sửa được tin nhắn. Có thể tin đã bị thu hồi."),
      },
    );
  };

  const loadOlderMessages = () => {
    if (!messageListRef.current || isFetchingNextPage) return;
    previousScrollHeight.current = messageListRef.current.scrollHeight;
    void fetchNextPage({ throwOnError: true }).catch(() => {
      previousScrollHeight.current = null;
      toast.error("Không tải thêm được tin nhắn cũ.");
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Quay lại"
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={conversation.participantAvatar} alt={conversation.participantName} />
          <AvatarFallback>{initialsOf(conversation.participantName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{conversation.participantName}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABEL[conversation.participantRole]}
          </p>
        </div>
        <span className="ml-auto" />
      </header>

      {/* Messages */}
      <div ref={messageListRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {hasNextPage && (
          <div className="flex justify-center pb-1">
            <Button type="button" variant="ghost" size="sm" onClick={loadOlderMessages} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Đang tải…" : "Tải tin nhắn cũ hơn"}
            </Button>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-40 rounded-2xl" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
          </div>
        ) : isError && messages.length === 0 ? (
          <div className="rounded-xl border border-destructive/30 p-4 text-center">
            <p role="alert" className="text-sm text-destructive">Không tải được tin nhắn từ Chat Service.</p>
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => void refetch()}>
              Thử tải lại
            </Button>
          </div>
        ) : (
          messages.map((m) => {
            // Chat Service sender IDs are Keycloak subjects, not Lens database IDs.
            const mine = m.senderId === currentSubject;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2",
                    mine ? "rounded-br-md" : "rounded-bl-md",
                    m.isAI
                      ? "border border-ember/20 bg-ember/5 text-foreground"
                      : mine
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                  )}
                >
                  {m.isAI && (
                    <p className="mb-1 text-[11px] font-semibold text-ember">Trợ lý AI</p>
                  )}
                  <p className={cn("text-sm leading-relaxed", m.isRecalled && "italic opacity-75")}>{m.text}</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className={cn("text-[11px]", mine && !m.isAI ? "text-background/60" : "text-muted-foreground")}>
                      {formatClock(m.sentAt)}{(m.revision ?? 1) > 1 && !m.isRecalled ? " · đã sửa" : ""}
                    </p>
                    {mine && !m.isAI && !m.isRecalled && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Sửa tin nhắn"
                          title="Sửa tin nhắn"
                          onClick={() => openEdit(m)}
                          className="rounded p-1 text-background/70 transition-colors hover:bg-background/10 hover:text-background"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          aria-label="Thu hồi tin nhắn"
                          title="Thu hồi tin nhắn"
                          disabled={recall.isPending}
                          onClick={() => {
                            if (!window.confirm("Bạn muốn thu hồi tin nhắn này?")) return;
                            recall.mutate(m.id, {
                              onSuccess: () => toast.success("Đã thu hồi tin nhắn."),
                              onError: () => toast.error("Không thu hồi được tin nhắn. Vui lòng thử lại."),
                            });
                          }}
                          className="rounded p-1 text-background/70 transition-colors hover:bg-background/10 hover:text-background disabled:opacity-50"
                        >
                          <Undo2 className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={draft}
          maxLength={10000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="rounded-full"
          aria-label="Nội dung tin nhắn"
        />
        <Button
          type="submit"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={!draft.trim() || isPending}
          aria-label="Gửi tin nhắn"
        >
          <Send className="size-4" />
        </Button>
      </form>

      <Dialog open={!!editingMessage} onOpenChange={(open) => { if (!open) setEditingMessage(null); }}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa tin nhắn</DialogTitle>
            <DialogDescription>Nội dung đã sửa sẽ được đồng bộ cho cả hai bên.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <Textarea
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              maxLength={10000}
              rows={5}
              autoFocus
              aria-label="Nội dung tin nhắn đã sửa"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingMessage(null)}>Huỷ</Button>
              <Button type="submit" disabled={!editDraft.trim() || edit.isPending}>
                {edit.isPending ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
