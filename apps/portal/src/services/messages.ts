import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";

// Layer 3 — Service / API for messaging. Thin HTTP calls; the mock backend
// (src/msw) owns the conversation/thread stores and answers these.

export async function getConversations(): Promise<Conversation[]> {
  return (await api.get<Conversation[]>("/conversations")).data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return (
    await api.get<Message[]>(`/conversations/${conversationId}/messages`)
  ).data;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<Message> {
  return (
    await api.post<Message>(`/conversations/${conversationId}/messages`, {
      text,
    })
  ).data;
}

/** Clear the unread badge for a conversation the user just opened. */
export async function markConversationRead(
  conversationId: string
): Promise<void> {
  await api.post(`/conversations/${conversationId}/read`);
}
