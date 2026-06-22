import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
} from "@/services/messages";

// Layer 2 — Query hooks for messaging.
export const messageKeys = {
  conversations: ["conversations"] as const,
  thread: (id: string) => ["messages", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations,
    queryFn: getConversations,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: messageKeys.thread(conversationId),
    queryFn: () => getMessages(conversationId),
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

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}
