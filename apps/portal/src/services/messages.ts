import type { Conversation, Message } from "@/types";

export interface StartConversationInput {
  id: string;
  name: string;
  avatar: string;
  role: "client" | "photographer";
}

const unsupported = () => new Error("lens-backend chưa cung cấp API tin nhắn.");

export async function getConversations(): Promise<Conversation[]> { throw unsupported(); }
export async function startConversation(participant: StartConversationInput): Promise<Conversation> { void participant; throw unsupported(); }
export async function getMessages(conversationId: string): Promise<Message[]> { void conversationId; throw unsupported(); }
export async function sendMessage(conversationId: string, text: string): Promise<Message> { void conversationId; void text; throw unsupported(); }
export async function markConversationRead(conversationId: string): Promise<void> { void conversationId; throw unsupported(); }
