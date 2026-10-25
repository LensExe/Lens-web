import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { sessionUser } from "@/lib/session";
import {
  getConversations,
  getMessages,
  editMessage,
  markConversationRead,
  recallMessage,
  sendMessage,
  startConversation,
  type StartConversationInput,
} from "@/services/messages";
import type { Conversation, Message } from "@/types";

// Layer 2 — Query hooks for messaging.
export const messageKeys = {
  root: ["messaging"] as const,
  user: (subject = sessionUser?.keycloakId ?? null) => ["messaging", subject ?? "anonymous"] as const,
  conversations: (subject = sessionUser?.keycloakId ?? null) =>
    [...messageKeys.user(subject), "conversations"] as const,
  thread: (id: string, subject = sessionUser?.keycloakId ?? null) =>
    [...messageKeys.user(subject), "thread", id] as const,
};

type ThreadData = InfiniteData<Message[], number | undefined>;
export type ChatMessageChange = "created" | "updated" | "recalled";

function previewText(message: Message): string {
  if (message.isRecalled) return "Tin nhắn đã được thu hồi";
  return message.isAI ? `Trợ lý AI: ${message.text}` : message.text;
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return conversations.sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
}

/** Patch cached thread and inbox data from a REST response or Socket.IO event. */
export function applyChatMessageToCache(
  queryClient: QueryClient,
  channelId: string,
  message: Message,
  change: ChatMessageChange,
  subject = sessionUser?.keycloakId ?? null,
): boolean {
  queryClient.setQueryData<ThreadData>(messageKeys.thread(channelId, subject), (current) => {
    if (!current || current.pages.length === 0) return current;

    let found = false;
    let changed = false;
    const pages = current.pages.map((page) =>
      page.map((existing) => {
        if (existing.id !== message.id) return existing;
        found = true;
        if (change === "created" || (existing.revision ?? 1) >= (message.revision ?? 1)) {
          return existing;
        }
        changed = true;
        return message;
      }),
    );

    if (change === "created" && !found) {
      pages[0] = [...pages[0], message].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      changed = true;
    }

    return changed ? { ...current, pages } : current;
  });

  const currentConversations = queryClient.getQueryData<Conversation[]>(
    messageKeys.conversations(subject),
  );
  queryClient.setQueryData<Conversation[]>(messageKeys.conversations(subject), (current) => {
    if (!current) return current;
    let changed = false;
    const conversations = current.map((conversation) => {
      if (conversation.id !== channelId) return conversation;
      const sequence = message.sequence ?? 0;
      const lastSequence = conversation.lastMessageSequence ?? 0;
      const isLatest =
        message.id === conversation.lastMessageId || (sequence > 0 && sequence === lastSequence);

      if (change !== "created") {
        if (!isLatest) return conversation;
        changed = true;
        return {
          ...conversation,
          lastMessage: previewText(message),
          lastMessageId: message.id,
        };
      }

      if (sequence <= lastSequence) return conversation;
      changed = true;
      return {
        ...conversation,
        lastMessage: previewText(message),
        lastMessageAt: message.sentAt,
        lastMessageId: message.id,
        lastMessageSequence: sequence,
        unreadCount:
          subject && message.senderId !== subject
            ? conversation.unreadCount + 1
            : conversation.unreadCount,
      };
    });

    return changed ? sortConversations(conversations) : current;
  });
  return currentConversations?.some((conversation) => conversation.id === channelId) ?? false;
}

function addConversationToCache(
  queryClient: QueryClient,
  conversation: Conversation,
  subject: string | null,
): void {
  queryClient.setQueryData<Conversation[]>(messageKeys.conversations(subject), (current) => {
    if (!current) return current;
    if (current.some((item) => item.id === conversation.id)) return current;
    return sortConversations([conversation, ...current]);
  });
}

function markConversationReadInCache(
  queryClient: QueryClient,
  channelId: string,
  subject: string | null,
): void {
  queryClient.setQueryData<Conversation[]>(messageKeys.conversations(subject), (current) =>
    current?.map((conversation) =>
      conversation.id === channelId ? { ...conversation, unreadCount: 0 } : conversation,
    ),
  );
}

export function useConversations(enabled = true) {
  const subject = sessionUser?.keycloakId ?? null;
  return useQuery({
    queryKey: messageKeys.conversations(subject),
    queryFn: getConversations,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useMessages(conversationId: string) {
  const subject = sessionUser?.keycloakId ?? null;
  return useInfiniteQuery({
    queryKey: messageKeys.thread(conversationId, subject),
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 100) return undefined;
      const oldest = lastPage[0]?.sequence;
      return oldest && oldest > 1 ? oldest : undefined;
    },
    enabled: !!conversationId,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const subject = sessionUser?.keycloakId ?? null;
  return useMutation({
    mutationFn: (text: string) => sendMessage(conversationId, text),
    onSuccess: (message) =>
      applyChatMessageToCache(qc, conversationId, message, "created", subject),
  });
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient();
  const subject = sessionUser?.keycloakId ?? null;
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editMessage(messageId, content),
    onSuccess: (message) =>
      applyChatMessageToCache(qc, conversationId, message, "updated", subject),
  });
}

export function useRecallMessage(conversationId: string) {
  const qc = useQueryClient();
  const subject = sessionUser?.keycloakId ?? null;
  return useMutation({
    mutationFn: (messageId: string) => recallMessage(messageId),
    onSuccess: (message) =>
      applyChatMessageToCache(qc, conversationId, message, "recalled", subject),
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  const subject = sessionUser?.keycloakId ?? null;
  return useMutation({
    mutationFn: (participant: StartConversationInput) => startConversation(participant),
    onSuccess: (conversation) => addConversationToCache(qc, conversation, subject),
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  const subject = sessionUser?.keycloakId ?? null;
  return useMutation({
    mutationFn: ({
      conversationId,
      lastReadSeq,
    }: {
      conversationId: string;
      lastReadSeq: number;
    }) => markConversationRead(conversationId, lastReadSeq),
    onSuccess: (_result, variables) =>
      markConversationReadInCache(qc, variables.conversationId, subject),
  });
}
