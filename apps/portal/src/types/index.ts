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
  /** Career rank, attached by the API to the roster payload so browse cards can
   *  show it without a per-card achievements request. */
  rank?: RankId;
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

// ── Career Achievement (ranks + badges) ─────────────────────────────────────
export type RankId = "newbie" | "bronze" | "silver" | "gold" | "diamond";

/** Metrics a photographer's rank + badges are derived from (giả định tạm —
 *  anti-fraud rules like verified-client-only reviews land with the backend). */
export interface AchievementStats {
  /** Completed shoots that count toward rank (min-value shoots only). */
  completedSessions: number;
  /** Share of reviews that are 5★ (0–100). */
  fiveStarPct: number;
  /** Clients who booked again. */
  returningClients: number;
  /** Cancellation rate (0–100). */
  cancelRate: number;
}

export interface PhotographerAchievements {
  photographerId: string;
  rank: RankId;
  stats: AchievementStats;
  /** Ids of specialty badges this photographer has earned. */
  badges: string[];
  /** Platform commission for this rank (a rank perk — lower is better). */
  commissionRate: number;
}

// ── Cloud photo storage + delivery gallery ──────────────────────────────────
export type StoragePlanTier = "free" | "pro" | "studio";

export interface GalleryPhoto {
  id: string;
  url: string;
  name: string;
  sizeBytes: number;
}

/** Photos a photographer delivered for one shoot, with retention metadata. */
export interface ShootGallery {
  bookingId: string;
  photographerId: string;
  clientName: string;
  style: string;
  photos: GalleryPhoto[];
  sizeBytes: number;
  /** ISO datetime the photos were delivered. */
  deliveredAt: string;
  /** ISO datetime the gallery auto-deletes; null = long-term (while subscribed). */
  expiresAt: string | null;
  planTier: StoragePlanTier;
  /** True when a downgrade put this gallery over quota — access locked, not deleted. */
  locked: boolean;
}

/** A photographer's storage plan + usage (derived). */
export interface StorageSummary {
  plan: StoragePlanTier;
  usedBytes: number;
  galleryCount: number;
  quotaBytesPerShoot: number;
  /** Days photos are kept; null = long-term while subscribed. */
  retentionDays: number | null;
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
  /** Lens Xu applied at checkout (reduces the cash paid). Set on pay. */
  coinsRedeemed?: number;
  /** Lens Xu cashback credited when the shoot completed. Set on release. */
  coinsEarned?: number;
  /** Other photographers linked to this shoot (Feature: liên kết thợ). */
  collaborators?: BookingCollaborator[];
}

/** A photographer linked to a shoot led by the main photographer, with an
 *  agreed payout share. All must accept before the shoot. */
export interface BookingCollaborator {
  photographerId: string;
  photographerName: string;
  photographerAvatar: string;
  /** Agreed payout share of the booking, 0–100. Shares sum to 100. */
  sharePct: number;
  status: "invited" | "accepted" | "declined";
}

/** Mock payment methods offered at the payment step (UI phase only). */
export type PaymentMethod = "bank" | "card" | "momo";

/** Payload sent when a client pays in full for a confirmed booking. */
export interface PaymentInput {
  method: PaymentMethod;
  /** Lens Xu to apply, reducing the cash charged. Capped server-side. */
  coinsToRedeem?: number;
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

// ── Money & rewards ──────────────────────────────────────────────────────────
// TWO fully separate ledgers, both append-only (never mutate a balance directly;
// balance = sum of entries). Real money (VND) lives in the wallet ledger; "Lens
// Xu" reward points live in the coin ledger and are NOT withdrawable/transferable.
// NOTE (giả định tạm): the shapes below are UI-phase mocks — the real schema is
// designed when the backend + a licensed payment provider land (see §12 + the
// payment/payout abstraction in lib/payments/provider.ts).

/** A single real-money movement in the wallet ledger (VND). Append-only. */
export interface WalletTransaction {
  id: string;
  userId: string;
  /** payout = earnings released to a photographer; refund = money back to a
   *  client; withdraw = cash-out request; topup = money added. */
  type: "payout" | "refund" | "withdraw" | "topup";
  /** Signed VND: credits (+) increase balance, debits (−) decrease it. */
  amount: number;
  status: "completed" | "pending";
  bookingId?: string;
  /** ISO datetime string. */
  createdAt: string;
  note: string;
}

/** A single Lens Xu movement in the coin ledger. Append-only. 1 xu = 1 VND. */
export interface CoinTransaction {
  id: string;
  userId: string;
  /** earn = cashback after a completed shoot; redeem = spent on a booking;
   *  expire = points past their expiry; adjust = manual correction. */
  type: "earn" | "redeem" | "expire" | "adjust";
  /** Signed xu: earn/adjust(+) add, redeem/expire(−) remove. */
  amount: number;
  bookingId?: string;
  /** ISO datetime string. */
  createdAt: string;
  /** When earned coins expire (earn entries only). ISO datetime string. */
  expiresAt?: string;
  note: string;
}

/** Real-money wallet summary (derived from the wallet ledger). */
export interface WalletSummary {
  balance: number;
}

/** Lens Xu summary (derived from the coin ledger). */
export interface CoinSummary {
  balance: number;
  /** Coins expiring within the warning window (e.g. next 30 days). */
  expiringSoon: number;
  /** ISO date of the soonest upcoming expiry, if any. */
  nextExpiryAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  /** "me" for the signed-in user, "ai" for the AI assistant, else the participant. */
  senderId: string;
  text: string;
  /** ISO datetime string. */
  sentAt: string;
  /** True when this message was generated by the photographer's AI assistant. */
  isAI?: boolean;
}

// ── AI Assistant (per photographer) ─────────────────────────────────────────
export interface FAQItem {
  q: string;
  a: string;
}

/** Context a photographer feeds their AI assistant. NOTE (giả định tạm): the UI
 *  phase generates canned replies — no real LLM. Backend must secure the chat
 *  history used for training. */
export interface AssistantConfig {
  photographerId: string;
  /** Pricing / services blurb the AI may quote. */
  services: string;
  style: string;
  /** Areas the photographer accepts jobs in. */
  area: string;
  faqs: FAQItem[];
  /** Desired writing tone (e.g. "thân thiện, ngắn gọn"). */
  tone: string;
  /** Whether the assistant is configured/enabled at all. */
  enabled: boolean;
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
  /** Whether the photographer's AI assistant is answering this thread. */
  aiEnabled?: boolean;
}
