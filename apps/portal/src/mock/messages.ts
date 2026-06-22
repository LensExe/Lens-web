import { avatar } from "@lens/ui";
import type { Conversation, Message } from "@/types";

// Mock conversations + messages for the signed-in user. Imported ONLY by the
// service layer. "me" is the signed-in user (see lib/session.ts); the other
// senderId matches the conversation id so threads read naturally.
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const av = (seed: string) => avatar(seed);

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    participantName: "Nguyễn Thuý An",
    participantAvatar: av("thuyan-av"),
    participantRole: "client",
    lastMessage: "Dạ chị ơi, buổi chụp mình bắt đầu lúc mấy giờ ạ?",
    lastMessageAt: minsAgo(8),
    unreadCount: 2,
  },
  {
    id: "c2",
    participantName: "Phạm Mai Chi",
    participantAvatar: av("maichi-av"),
    participantRole: "client",
    lastMessage: "Em cảm ơn chị, hẹn gặp chị cuối tuần nhé!",
    lastMessageAt: minsAgo(95),
    unreadCount: 0,
  },
  {
    id: "c3",
    participantName: "Trần Quốc Bảo",
    participantAvatar: av("quocbao-av"),
    participantRole: "photographer",
    lastMessage: "Mình gửi bạn bảng giá gói chụp cưới nhé.",
    lastMessageAt: minsAgo(60 * 26),
    unreadCount: 0,
  },
  {
    id: "c4",
    participantName: "Hoàng Thị Em",
    participantAvatar: av("thiem-av"),
    participantRole: "client",
    lastMessage: "Ảnh đẹp lắm ạ, em rất thích luôn ❤️",
    lastMessageAt: minsAgo(60 * 24 * 4),
    unreadCount: 0,
  },
];

// Threads keyed by conversation id. Oldest → newest.
export const mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: "m1-1",
      conversationId: "c1",
      senderId: "c1",
      text: "Chào chị, em vừa gửi yêu cầu đặt lịch chụp chân dung ạ.",
      sentAt: minsAgo(40),
    },
    {
      id: "m1-2",
      conversationId: "c1",
      senderId: "me",
      text: "Chào em, chị đã nhận được yêu cầu rồi nhé. Chị xác nhận lịch luôn đây.",
      sentAt: minsAgo(32),
    },
    {
      id: "m1-3",
      conversationId: "c1",
      senderId: "c1",
      text: "Em cảm ơn chị nhiều ạ!",
      sentAt: minsAgo(20),
    },
    {
      id: "m1-4",
      conversationId: "c1",
      senderId: "c1",
      text: "Dạ chị ơi, buổi chụp mình bắt đầu lúc mấy giờ ạ?",
      sentAt: minsAgo(8),
    },
  ],
  c2: [
    {
      id: "m2-1",
      conversationId: "c2",
      senderId: "c2",
      text: "Chị ơi, địa điểm chụp ở Phố cổ mình hẹn nhau ở đâu ạ?",
      sentAt: minsAgo(140),
    },
    {
      id: "m2-2",
      conversationId: "c2",
      senderId: "me",
      text: "Mình gặp ở đầu phố Hàng Mã lúc 8h sáng em nhé.",
      sentAt: minsAgo(120),
    },
    {
      id: "m2-3",
      conversationId: "c2",
      senderId: "c2",
      text: "Em cảm ơn chị, hẹn gặp chị cuối tuần nhé!",
      sentAt: minsAgo(95),
    },
  ],
  c3: [
    {
      id: "m3-1",
      conversationId: "c3",
      senderId: "me",
      text: "Chào anh, mình muốn hỏi về gói chụp cưới phóng sự ạ.",
      sentAt: minsAgo(60 * 30),
    },
    {
      id: "m3-2",
      conversationId: "c3",
      senderId: "c3",
      text: "Chào bạn, gói cưới của mình có 3 mức, tuỳ số giờ chụp.",
      sentAt: minsAgo(60 * 28),
    },
    {
      id: "m3-3",
      conversationId: "c3",
      senderId: "c3",
      text: "Mình gửi bạn bảng giá gói chụp cưới nhé.",
      sentAt: minsAgo(60 * 26),
    },
  ],
  c4: [
    {
      id: "m4-1",
      conversationId: "c4",
      senderId: "me",
      text: "Em ơi, chị đã giao toàn bộ ảnh đã chỉnh qua link rồi nhé.",
      sentAt: minsAgo(60 * 24 * 4 + 30),
    },
    {
      id: "m4-2",
      conversationId: "c4",
      senderId: "c4",
      text: "Ảnh đẹp lắm ạ, em rất thích luôn ❤️",
      sentAt: minsAgo(60 * 24 * 4),
    },
  ],
};
