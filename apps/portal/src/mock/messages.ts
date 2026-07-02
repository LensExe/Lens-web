import { avatar } from "@lens/ui";
import type { Message } from "@/types";

// Mock conversations + threads. Imported ONLY by src/msw/handlers.ts.
//
// A conversation is a SHARED thread between TWO real users (like a booking row):
// each side sees "the other participant". Message.senderId is the REAL user id of
// the sender ("ai" for AI replies) — the UI decides "mine" via currentUser.id, so
// each signed-in user sees their own inbox. Demo logins (lib/session.ts): the
// photographer "me" (Lý Gia Hân) and the client "u-khachhang" (Trần Khách Hàng).
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const av = (seed: string) => avatar(seed);

export interface ConvParticipant {
  id: string;
  name: string;
  avatar: string;
  role: "client" | "photographer";
}

export interface ConversationSeed {
  id: string;
  participants: [ConvParticipant, ConvParticipant];
  /** Unread count per userId (from the other participant's messages). */
  unread: Record<string, number>;
  aiEnabled: boolean;
}

// Known people (ids match bookings' clients + the photographer roster).
const ME: ConvParticipant = { id: "me", name: "Lý Gia Hân", avatar: av("giahan-av"), role: "photographer" };
const UK: ConvParticipant = { id: "u-khachhang", name: "Trần Khách Hàng", avatar: av("client-av"), role: "client" };
const C_ANH: ConvParticipant = { id: "c-anh", name: "Nguyễn Thuý An", avatar: av("thuyan-av"), role: "client" };
const C_CHI: ConvParticipant = { id: "c-chi", name: "Phạm Mai Chi", avatar: av("maichi-av"), role: "client" };
const C_EM: ConvParticipant = { id: "c-em", name: "Hoàng Thị Em", avatar: av("thiem-av"), role: "client" };
const P2: ConvParticipant = { id: "p2", name: "Trần Quốc Bảo", avatar: av("quocbao-av"), role: "photographer" };

// AI is ON by default for every conversation (it hands off + turns itself off
// when a message needs a human — see handlers.ts needsHandoff).
export const seedConversations: ConversationSeed[] = [
  // ── Photographer "me"'s inbox (with her clients + one where she's the client) ──
  { id: "c1", participants: [ME, C_ANH], unread: { me: 2 }, aiEnabled: true },
  { id: "c2", participants: [ME, C_CHI], unread: {}, aiEnabled: true },
  { id: "c3", participants: [ME, P2], unread: {}, aiEnabled: true }, // me asks p2 as a client
  { id: "c4", participants: [ME, C_EM], unread: {}, aiEnabled: true },
  // ── Cross-role thread: both demo users can log in and see it ──────────────────
  { id: "c5", participants: [UK, ME], unread: { me: 1 }, aiEnabled: true }, // AI-testable
  { id: "c6", participants: [UK, P2], unread: {}, aiEnabled: true },
];

// Threads keyed by conversation id, oldest → newest. senderId = real user id.
export const seedThreads: Record<string, Message[]> = {
  c1: [
    { id: "m1-1", conversationId: "c1", senderId: "c-anh", text: "Chào chị, em vừa gửi yêu cầu đặt lịch chụp chân dung ạ.", sentAt: minsAgo(40) },
    { id: "m1-2", conversationId: "c1", senderId: "me", text: "Chào em, chị đã nhận được yêu cầu rồi nhé. Chị xác nhận lịch luôn đây.", sentAt: minsAgo(32) },
    { id: "m1-3", conversationId: "c1", senderId: "c-anh", text: "Em cảm ơn chị nhiều ạ!", sentAt: minsAgo(20) },
    { id: "m1-4", conversationId: "c1", senderId: "c-anh", text: "Dạ chị ơi, buổi chụp mình bắt đầu lúc mấy giờ ạ?", sentAt: minsAgo(8) },
  ],
  c2: [
    { id: "m2-1", conversationId: "c2", senderId: "c-chi", text: "Chị ơi, địa điểm chụp ở Phố cổ mình hẹn nhau ở đâu ạ?", sentAt: minsAgo(140) },
    { id: "m2-2", conversationId: "c2", senderId: "me", text: "Mình gặp ở đầu phố Hàng Mã lúc 8h sáng em nhé.", sentAt: minsAgo(120) },
    { id: "m2-3", conversationId: "c2", senderId: "c-chi", text: "Em cảm ơn chị, hẹn gặp chị cuối tuần nhé!", sentAt: minsAgo(95) },
  ],
  c3: [
    { id: "m3-1", conversationId: "c3", senderId: "me", text: "Chào anh, mình muốn hỏi về gói chụp cưới phóng sự ạ.", sentAt: minsAgo(60 * 30) },
    { id: "m3-2", conversationId: "c3", senderId: "p2", text: "Chào bạn, gói cưới của mình có 3 mức, tuỳ số giờ chụp.", sentAt: minsAgo(60 * 28) },
    { id: "m3-3", conversationId: "c3", senderId: "p2", text: "Mình gửi bạn bảng giá gói chụp cưới nhé.", sentAt: minsAgo(60 * 26) },
  ],
  c4: [
    { id: "m4-1", conversationId: "c4", senderId: "me", text: "Em ơi, chị đã giao toàn bộ ảnh đã chỉnh qua link rồi nhé.", sentAt: minsAgo(60 * 24 * 4 + 30) },
    { id: "m4-2", conversationId: "c4", senderId: "c-em", text: "Ảnh đẹp lắm ạ, em rất thích luôn ❤️", sentAt: minsAgo(60 * 24 * 4) },
  ],
  c5: [
    { id: "m5-1", conversationId: "c5", senderId: "u-khachhang", text: "Chào chị, em muốn hỏi cuối tháng chị còn lịch trống không ạ?", sentAt: minsAgo(180) },
    { id: "m5-2", conversationId: "c5", senderId: "me", text: "Chào em, cuối tháng chị còn ngày 28 và 30 nhé.", sentAt: minsAgo(150) },
    { id: "m5-3", conversationId: "c5", senderId: "u-khachhang", text: "Dạ em cảm ơn, để em sắp xếp rồi báo lại chị ạ.", sentAt: minsAgo(30) },
  ],
  c6: [
    { id: "m6-1", conversationId: "c6", senderId: "p2", text: "Mình gửi bạn bảng giá gói chụp cưới nhé.", sentAt: minsAgo(60 * 20) },
    { id: "m6-2", conversationId: "c6", senderId: "u-khachhang", text: "Cảm ơn anh, em xem rồi sẽ đặt lịch ạ.", sentAt: minsAgo(60 * 19) },
  ],
};
