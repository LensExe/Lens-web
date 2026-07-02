import { api } from "@/lib/api";
import type { Conversation, Message } from "@/types";

// Layer 3 — Service / API for messaging. Thin HTTP calls; the mock backend
// (src/msw) owns the conversation/thread stores and answers these.

export async function getConversations(): Promise<Conversation[]> {
  return (await api.get<Conversation[]>("/conversations")).data;
}

/** The other person to open a chat with (e.g. a photographer from their profile). */
export interface StartConversationInput {
  id: string;
  name: string;
  avatar: string;
  role: "client" | "photographer";
}

/** Open (or create) a conversation with a given person; returns the thread. */
export async function startConversation(
  participant: StartConversationInput
): Promise<Conversation> {
  return (
    await api.post<Conversation>("/conversations/start", { participant })
  ).data;
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
