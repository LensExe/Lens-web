import { avatar } from "@lens/ui";
import { backendApi, backendBaseURL, backendGet } from "@/lib/backend-api";
import type { Conversation, Message } from "@/types";

export interface StartConversationInput {
  id: string;
  name: string;
  avatar?: string;
  role: "client" | "photographer";
  bookingId?: string;
}

interface ChatChannel {
  id: string;
  peer_id: string;
  last_message_id?: string;
  last_message_seq: number;
  last_message_at?: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  seq: number;
  revision?: number;
  created_at: string;
  recalled_at?: string | null;
  sender_kind?: "user" | "ai";
}

interface ChatSocketMessage extends ChatMessage {
  client_message_id?: string;
  type?: "text" | "image" | "file";
  updated_at?: string;
  recalled_at?: string | null;
}

export type ChatRealtimeEvent =
  | {
      kind: "message";
      eventId?: string;
      aggregateVersion?: number;
      event: "NEW_MESSAGE" | "UPDATED_MESSAGE" | "RECALLED_MESSAGE";
      channelId: string;
      message: Message;
    }
  | {
      kind: "read-cursor";
      eventId?: string;
      aggregateVersion?: number;
      channelId: string;
      userId: string;
      lastReadSequence: number;
    };

interface ChatPeer {
  peer_id: string;
  profile_id: string;
  fullname: string;
  avatar_url?: string | null;
  role: "customer" | "photographer";
}

function serviceBaseURL(value: string | undefined, suffix: string): string {
  const base = value?.trim().replace(/\/+$/, "") ?? "";
  if (!base) return `${backendBaseURL}/${suffix}`;
  if (base.endsWith(`/api/v1/${suffix}`)) return base;
  if (base.endsWith("/api/v1")) return `${base}/${suffix}`;
  if (base.endsWith("/api")) return `${base}/v1/${suffix}`;
  return `${base}/api/v1/${suffix}`;
}

const chatBaseURL = serviceBaseURL(import.meta.env.VITE_CHAT_API_URL, "chat");

function unwrapServiceData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    const envelope = value as { data: T; success?: unknown };
    if ("success" in value || Object.keys(value).length === 1) return envelope.data;
  }
  return value as T;
}

async function chatRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  data?: unknown,
  params?: Record<string, string | number>,
): Promise<T> {
  const response = await backendApi.request<unknown>({
    baseURL: chatBaseURL,
    method,
    url: path,
    data,
    params,
  });
  return unwrapServiceData<T>(response.data);
}

function readCursors(): Record<string, number> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("lens.chat.read-cursors.v1") ?? "{}");
    return value && typeof value === "object" ? (value as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveReadCursor(channelId: string, sequence: number): void {
  try {
    const cursors = readCursors();
    cursors[channelId] = Math.max(cursors[channelId] ?? 0, sequence);
    localStorage.setItem("lens.chat.read-cursors.v1", JSON.stringify(cursors));
  } catch {
    // The server cursor is still updated when local storage is unavailable.
  }
}

export function getReadCursor(channelId: string): number | undefined {
  const sequence = readCursors()[channelId];
  return typeof sequence === "number" && Number.isInteger(sequence) && sequence >= 0
    ? sequence
    : undefined;
}

export function syncReadCursor(channelId: string, sequence: number): void {
  saveReadCursor(channelId, sequence);
}

function mapMessage(message: ChatMessage): Message {
  return {
    id: message.id,
    conversationId: message.channel_id,
    senderId: message.sender_id,
    text: message.recalled_at ? "Tin nhắn đã được thu hồi" : message.content,
    sentAt: message.created_at,
    sequence: message.seq,
    revision: message.revision,
    isRecalled: !!message.recalled_at,
    isAI: message.sender_kind === "ai",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/** Parse the stable Socket.IO envelope emitted by Notification for Chat events. */
export function parseChatRealtimeEvent(value: unknown): ChatRealtimeEvent | null {
  if (!isRecord(value) || !isRecord(value.payload)) return null;

  const payload = value.payload;
  const eventId = typeof value.event_id === "string" ? value.event_id : undefined;
  const aggregateVersion = positiveInteger(value.aggregate_version);
  const channelId = typeof payload.channel_id === "string" ? payload.channel_id : "";
  const lastReadSequence = nonNegativeInteger(payload.last_read_seq);
  if (!channelId) return null;

  if (
    value.event === "READ_CURSOR" &&
    typeof payload.user_id === "string" &&
    lastReadSequence !== undefined
  ) {
    return {
      kind: "read-cursor",
      eventId,
      aggregateVersion,
      channelId,
      userId: payload.user_id,
      lastReadSequence,
    };
  }

  if (
    value.event !== "NEW_MESSAGE" &&
    value.event !== "UPDATED_MESSAGE" &&
    value.event !== "RECALLED_MESSAGE"
  ) {
    return null;
  }

  const message = payload as unknown as Partial<ChatSocketMessage>;
  const sequence = positiveInteger(message.seq);
  if (
    typeof message.id !== "string" ||
    typeof message.channel_id !== "string" ||
    message.channel_id !== channelId ||
    typeof message.sender_id !== "string" ||
    typeof message.content !== "string" ||
    !sequence
  ) {
    return null;
  }

  const parsedMessage: ChatSocketMessage = {
    id: message.id,
    channel_id: channelId,
    sender_id: message.sender_id,
    content: message.content,
    seq: sequence,
    revision: positiveInteger(message.revision) ?? 1,
    created_at:
      typeof message.created_at === "string" ? message.created_at : new Date().toISOString(),
    ...(message.sender_kind === "ai" ? { sender_kind: "ai" as const } : {}),
    ...(typeof message.recalled_at === "string" ? { recalled_at: message.recalled_at } : {}),
  };

  return {
    kind: "message",
    eventId,
    aggregateVersion,
    event: value.event,
    channelId,
    message: mapMessage(parsedMessage),
  };
}

async function getPeer(peerId: string): Promise<ChatPeer> {
  return backendGet<ChatPeer>(`/users/chat-peers/${encodeURIComponent(peerId)}`);
}

async function latestMessage(channel: ChatChannel): Promise<ChatMessage | undefined> {
  if (!channel.last_message_seq) return undefined;
  const messages = await chatRequest<ChatMessage[]>(
    "GET",
    `/channels/${encodeURIComponent(channel.id)}/messages`,
    undefined,
    { limit: 1 },
  );
  return messages[0];
}

function toConversation(channel: ChatChannel, peer: ChatPeer, message?: ChatMessage): Conversation {
  const cursors = readCursors();
  const hasReadCursor = Object.prototype.hasOwnProperty.call(cursors, channel.id);
  const readSeq = hasReadCursor ? cursors[channel.id] : channel.last_message_seq;
  const isUnreadFromPeer = !!message && message.sender_id === peer.peer_id;
  return {
    id: channel.id,
    peerKeycloakId: peer.peer_id,
    participantId: peer.profile_id,
    participantName: peer.fullname,
    participantAvatar: peer.avatar_url || avatar(peer.profile_id),
    participantRole: peer.role === "customer" ? "client" : "photographer",
    lastMessage: message?.recalled_at
      ? "Tin nhắn đã được thu hồi"
      : message?.sender_kind === "ai"
        ? "Trợ lý AI: " + (message.content ?? "")
        : (message?.content ?? ""),
    lastMessageAt: message?.created_at ?? channel.last_message_at ?? channel.updated_at,
    unreadCount: isUnreadFromPeer ? Math.max(1, channel.last_message_seq - readSeq) : 0,
    lastMessageId: message?.id ?? channel.last_message_id,
    lastMessageSequence: message?.seq ?? channel.last_message_seq,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const channels = await chatRequest<ChatChannel[]>("GET", "/channels");
  const conversations = await Promise.all(
    channels.map(async (channel) => {
      const [peer, message] = await Promise.all([getPeer(channel.peer_id), latestMessage(channel)]);
      return toConversation(channel, peer, message);
    }),
  );
  return conversations.sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
}

export async function startConversation(
  participant: StartConversationInput,
): Promise<Conversation> {
  const peer = participant.bookingId
    ? await backendGet<ChatPeer>(`/bookings/${encodeURIComponent(participant.bookingId)}/chat-peer`)
    : participant.role === "photographer"
      ? await backendGet<ChatPeer>(`/photographers/${encodeURIComponent(participant.id)}/chat-peer`)
      : null;
  if (!peer) {
    throw new Error(
      "Chỉ có thể bắt đầu chat với khách hàng từ một booking đang có quyền truy cập.",
    );
  }
  const channel = await chatRequest<ChatChannel>("POST", "/channels/direct", {
    peer_id: peer.peer_id,
  });
  return toConversation(channel, peer);
}

export async function getMessages(
  conversationId: string,
  beforeSequence?: number,
): Promise<Message[]> {
  const messages = await chatRequest<ChatMessage[]>(
    "GET",
    `/channels/${encodeURIComponent(conversationId)}/messages`,
    undefined,
    { limit: 100, ...(beforeSequence ? { before_seq: beforeSequence } : {}) },
  );
  return messages.map(mapMessage).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
}

export async function sendMessage(conversationId: string, text: string): Promise<Message> {
  const message = await chatRequest<ChatMessage>(
    "POST",
    `/channels/${encodeURIComponent(conversationId)}/messages`,
    {
      client_message_id: crypto.randomUUID(),
      type: "text",
      content: text,
    },
  );
  return mapMessage(message);
}

export async function editMessage(messageId: string, content: string): Promise<Message> {
  const message = await chatRequest<ChatMessage>(
    "PATCH",
    `/messages/${encodeURIComponent(messageId)}`,
    { content },
  );
  return mapMessage(message);
}

export async function recallMessage(messageId: string): Promise<Message> {
  const message = await chatRequest<ChatMessage>(
    "POST",
    `/messages/${encodeURIComponent(messageId)}/recall`,
  );
  return mapMessage(message);
}

export async function markConversationRead(
  conversationId: string,
  lastReadSeq: number,
): Promise<void> {
  if (lastReadSeq < 1) return;
  await chatRequest<{ last_read_seq: number }>(
    "PUT",
    `/channels/${encodeURIComponent(conversationId)}/read-cursor`,
    { last_read_seq: lastReadSeq },
  );
  saveReadCursor(conversationId, lastReadSeq);
}
