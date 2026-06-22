// Shared domain types for the Lens marketplace (UI-only phase).

export type PhotoStyle =
  | "Chân dung"
  | "Cưới"
  | "Sự kiện"
  | "Thời trang"
  | "Sản phẩm"
  | "Gia đình"
  | "Du lịch"
  | "Ẩm thực"
  | "Kiến trúc"
  | "Đường phố";

export interface Photographer {
  id: string;
  name: string;
  avatar: string;
  cover: string;
  city: string;
  styles: PhotoStyle[];
  /** Giá khởi điểm cho một buổi chụp (VND). */
  pricePerSession: number;
  rating: number;
  reviewCount: number;
  bio: string;
  /** Số năm kinh nghiệm. */
  experienceYears: number;
  featured: boolean;
  portfolio: string[];
  /** Upcoming dates the photographer is free, as ISO `yyyy-MM-dd` strings. */
  availableDates: string[];
}

export type UserRole = "client" | "photographer" | "admin";

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  city: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  photographerId: string;
  photographerName: string;
  style: PhotoStyle;
  /** ISO date string. */
  date: string;
  location: string;
  price: number;
  status: BookingStatus;
}

/** Payload sent when a client creates a booking request. */
export interface BookingInput {
  photographerId: string;
  photographerName: string;
  style: PhotoStyle;
  packageId: string;
  /** ISO date string `yyyy-MM-dd`. */
  date: string;
  timeSlot: string;
  location: string;
  contactName: string;
  contactPhone: string;
  note?: string;
  price: number;
}

export interface Review {
  id: string;
  photographerId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  /** ISO date string. */
  date: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** "me" for the signed-in user, otherwise the other participant. */
  senderId: string;
  text: string;
  /** ISO datetime string. */
  sentAt: string;
}

export interface Conversation {
  id: string;
  /** The other participant in the thread. */
  participantName: string;
  participantAvatar: string;
  /** Their role, shown as a subtle label in the thread. */
  participantRole: Exclude<UserRole, "admin">;
  /** Preview of the most recent message. */
  lastMessage: string;
  /** ISO datetime of the most recent message. */
  lastMessageAt: string;
  /** Unread messages from the other participant. */
  unreadCount: number;
}
