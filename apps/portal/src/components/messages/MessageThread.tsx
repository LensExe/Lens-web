import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Send, Sparkles } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Skeleton,
  Switch,
  cn,
} from "@lens/ui";
import { useMessages, useSendMessage } from "@/queries/useMessages";
import { useToggleConversationAI } from "@/queries/useAssistant";
import { aiDisclaimer } from "@/lib/assistant";
import { currentUser } from "@/lib/session";
import { formatClock } from "@/lib/time";
import type { Conversation } from "@/types";

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
  const { data: messages = [], isLoading } = useMessages(conversation.id);
  const { mutate: send, isPending } = useSendMessage(conversation.id);
  const toggleAI = useToggleConversationAI(conversation.id);
  const isPhotographer = currentUser.role === "photographer";
  const aiOn = !!conversation.aiEnabled;
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Stick to the latest message when the thread or its messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, conversation.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isPending) return;
    send(text);
    setDraft("");
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
        {isPhotographer && (
          <label className="ml-auto flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-4 text-ember" />
            <span className="hidden sm:inline">Trợ lý AI</span>
            <Switch
              checked={aiOn}
              onCheckedChange={(v) => toggleAI.mutate(v)}
              aria-label="Bật trợ lý AI cho hội thoại"
            />
          </label>
        )}
      </header>

      {/* AI disclaimer — clients must know they're talking to a bot. */}
      {aiOn && (
        <div className="flex items-center gap-2 border-b border-border bg-ember/5 px-4 py-2 text-xs text-muted-foreground">
          <Bot className="size-3.5 shrink-0 text-ember" />
          <span>
            {isPhotographer
              ? "Trợ lý AI đang tự động trả lời khách trong hội thoại này."
              : aiDisclaimer(conversation.participantName)}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-40 rounded-2xl" />
            <Skeleton className="h-10 w-56 rounded-2xl" />
          </div>
        ) : (
          messages.map((m) => {
            // "Mine" is decided by the REAL signed-in user id, so each side sees
            // its own messages on the right. AI replies are sent on the
            // photographer's behalf but always styled as an AI bubble.
            const ai = m.isAI || m.senderId === "ai";
            const mine = m.senderId === currentUser.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2",
                    mine ? "rounded-br-md" : "rounded-bl-md",
                    ai
                      ? "bg-ember/10 text-foreground ring-1 ring-ember/20"
                      : mine
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                  )}
                >
                  {ai && (
                    <p className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-ember">
                      <Bot className="size-3" />
                      Trợ lý AI
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{m.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[11px]",
                      mine && !ai ? "text-background/60" : "text-muted-foreground"
                    )}
                  >
                    {formatClock(m.sentAt)}
                  </p>
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
    </div>
  );
}
