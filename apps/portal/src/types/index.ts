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
  /** Upcoming dates with at least one free slot, as ISO `yyyy-MM-dd` strings.
   *  Computed by the API from the photographer's work schedule + bookings. */
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
  /** General description (what's included, the vibe…) — free text. */
  description: string;
  /** Price for this package (VND). */
  price: number;
  /** Edited photos delivered — a booking only completes once this many arrive. */
  photoCount: number;
  /** Shooting time, in hours. */
  durationHours: number;
  /** Days after the shoot within which the photos are delivered. */
  deliveryDays: number;
}

/** A half-hour precision interval used by working hours and busy exceptions. */
export interface TimeRange {
  start: string;
  end: string;
}

/**
 * A photographer's working hours. `weekly[d]` lists one or more working
 * windows for weekday `d` (0 = Sunday, like `Date.getDay()`). An empty list is
 * a day off. `busy` carves date-specific exceptions out of that template.
 */
export interface WorkSchedule {
  weekly: TimeRange[][];
  busy: BusyBlock[];
}

export interface BusyBlock {
  date: string;
  /** Empty ranges means the photographer is busy all day. */
  ranges: TimeRange[];
}

/** 30-minute start points: free = bookable · busy = blocked · booked = held by a client. */
export type SlotStatus = "free" | "busy" | "booked";

/** One day of a photographer's public availability (only slots they work). */
export interface DayAvailability {
  date: string;
  slots: { time: string; status: SlotStatus }[];
}

/** A photographer's payouts (after platform fee) per month, oldest → newest. */
export interface EarningsSummary {
  months: { label: string; amount: number }[];
  thisMonth: number;
  lastMonth: number;
  /** % change this month vs last; null when last month had nothing. */
  changePct: number | null;
}

/** The package terms frozen onto a booking when it's made (later edits don't change it). */
export type PackageTerms = Pick<
  PhotographerPackage,
  "name" | "photoCount" | "durationHours" | "deliveryDays"
>;

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
export type PortalRole = Exclude<UserRole, "admin">;

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: UserRole;
  city: string;
}

// ── Authentication (UI phase — mock backend) ────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: PortalRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: PortalRole;
}

export interface DemoAccount {
  email: string;
  password: string;
  role: PortalRole;
}

// Escrow lifecycle: the client books and pays a DEPOSIT to hold the slot; the
// photographer then accepts; the client pays the REMAINDER before the shoot; the
// platform HOLDS the money and RELEASES it after the client confirms delivery.
export type BookingStatus =
  | "awaiting_deposit" // booked, deposit not paid yet (hidden from the photographer)
  | "pending" // deposit paid, awaiting the photographer's decision
  | "confirmed" // photographer accepted, awaiting the remaining payment
  | "held" // paid in full, platform holds the money in escrow
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
  packageId?: string;
  /** Snapshot of the chosen package's terms (photo count gates completion). */
  packageSnapshot?: PackageTerms;
  /** "HH:mm" start time. */
  timeSlot?: string;
  contactPhone?: string;
  note?: string;
  /** Deposit that holds the slot (VND), part of `price`. */
  depositAmount: number;
  /** ISO datetime the deposit was paid. */
  depositPaidAt?: string;
  /** ISO datetime after which an unpaid booking is released. */
  depositDeadline?: string;
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

/** Payload sent when a client pays the deposit for a new booking. */
export interface DepositInput {
  method: PaymentMethod;
}

/** Payload sent when a client pays the remainder of a confirmed booking. */
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

/** Real-money wallet summary (derived from the wallet ledger + bookings). */
export interface WalletSummary {
  balance: number;
  /** Photographer: their share (after fees) of shoots the platform still holds. */
  pendingPayout: number;
  pendingPayoutCount: number;
  /** Payouts received this calendar month. */
  receivedThisMonth: number;
  /** Cashed out to the bank, all time. */
  withdrawnTotal: number;
  /** Refunds received, all time. */
  refundedTotal: number;
}

/** Lens Xu summary (derived from the coin ledger). */
export interface CoinSummary {
  balance: number;
  /** Coins expiring within the warning window (e.g. next 30 days). */
  expiringSoon: number;
  /** ISO date of the soonest upcoming expiry, if any. */
  nextExpiryAt?: string;
  /** All-time coins earned as cashback / spent on bookings. */
  earnedTotal: number;
  redeemedTotal: number;
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
  /** The other participant in the thread (their user / photographer id). */
  participantId: string;
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
  /** Whether the photographer's AI assistant is answering this thread. Only a
   *  client ↔ photographer thread can have one. */
  aiEnabled?: boolean;
}

// ── Account profile & settings (both roles) ──────────────────────────────────
export type Gender = "male" | "female" | "other";

/** Which notifications the user wants to receive. */
export interface NotificationPrefs {
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
  emailDigest: boolean;
}

/** The signed-in user's personal info — also used to pre-fill booking forms. */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  /** ISO `yyyy-MM-dd`, empty = not set. */
  birthday: string;
  gender: Gender | "";
  /** Default city + address for bookings. */
  city: string;
  addressDetail: string;
  notifications: NotificationPrefs;
}

/** Editable profile fields (email + id are fixed). */
export type ProfileInput = Partial<Omit<UserProfile, "id" | "email" | "avatar">>;

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Rating overview for a photographer's reviews tab (computed by the backend). */
export interface ReviewSummary {
  average: number;
  total: number;
  /** Review counts per star, 5 → 1. */
  breakdown: { stars: number; count: number }[];
}
