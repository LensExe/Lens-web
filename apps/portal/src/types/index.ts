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
  /** Service packages this photographer offers. Empty/absent → default tiers. */
  packages?: PhotographerPackage[];
}

/** A bookable service package configured by a photographer. */
export interface PhotographerPackage {
  id: string;
  name: string;
  /** Short description, e.g. "2 giờ chụp". */
  duration: string;
  /** Price for this package (VND). */
  price: number;
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

// Escrow lifecycle: the client pays in full once the photographer confirms; the
// platform HOLDS the money, then RELEASES it to the photographer after the
// client confirms the photos were delivered.
export type BookingStatus =
  | "pending" // client requested, awaiting photographer
  | "confirmed" // photographer accepted, awaiting payment
  | "held" // client paid in full, platform holds the money in escrow
  | "released" // client confirmed delivery, money released to photographer (done)
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

/** Mock payment methods offered at the payment step (UI phase only). */
export type PaymentMethod = "bank" | "card" | "momo";

/** Payload sent when a client pays in full for a confirmed booking. */
export interface PaymentInput {
  method: PaymentMethod;
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
