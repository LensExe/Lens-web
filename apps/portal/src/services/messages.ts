import { delay } from "@lens/ui";
import { mockConversations, mockMessages } from "@/mock/messages";
import type { Conversation, Message } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API for messaging. In-memory stores (UI phase) so sent
// messages and read state persist within the session; a full reload resets them.
let conversations: Conversation[] = mockConversations.map((c) => ({ ...c }));
const threads: Record<string, Message[]> = Object.fromEntries(
  Object.entries(mockMessages).map(([id, msgs]) => [id, msgs.map((m) => ({ ...m }))])
);

export async function getConversations(): Promise<Conversation[]> {
  await delay();
  // Most recent activity first.
  return [...conversations].sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt)
  );
  // LATER: return (await api.get<Conversation[]>("/conversations")).data;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  await delay();
  return (threads[conversationId] ?? []).map((m) => ({ ...m }));
  // LATER: return (await api.get<Message[]>(`/conversations/${conversationId}/messages`)).data;
}

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<Message> {
  await delay();
  const message: Message = {
    id: `m-${Date.now()}`,
    conversationId,
    senderId: "me",
    text,
    sentAt: new Date().toISOString(),
  };
  threads[conversationId] = [...(threads[conversationId] ?? []), message];
  conversations = conversations.map((c) =>
    c.id === conversationId
      ? { ...c, lastMessage: text, lastMessageAt: message.sentAt }
      : c
  );
  return message;
  // LATER: return (await api.post<Message>(`/conversations/${conversationId}/messages`, { text })).data;
}

/** Clear the unread badge for a conversation the user just opened. */
export async function markConversationRead(
  conversationId: string
): Promise<void> {
  await delay();
  conversations = conversations.map((c) =>
    c.id === conversationId ? { ...c, unreadCount: 0 } : c
  );
  // LATER: await api.post(`/conversations/${conversationId}/read`);
}
