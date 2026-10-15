import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Layer 2 — Query hooks for messaging.
export const messageKeys = {
  conversations: ["conversations"] as const,
  thread: (id: string) => ["messages", id] as const,
};

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: messageKeys.conversations,
    queryFn: getConversations,
    enabled,
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messageKeys.thread(conversationId),
    queryFn: ({ pageParam }) => getMessages(conversationId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 100) return undefined;
      const oldest = lastPage[0]?.sequence;
      return oldest && oldest > 1 ? oldest : undefined;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendMessage(conversationId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      editMessage(messageId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

export function useRecallMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => recallMessage(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (participant: StartConversationInput) =>
      startConversation(participant),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, lastReadSeq }: { conversationId: string; lastReadSeq: number }) =>
      markConversationRead(conversationId, lastReadSeq),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}
