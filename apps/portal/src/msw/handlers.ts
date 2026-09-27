import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";
import { mockReviews } from "@/mock/reviews";
import {
  seedConversations,
  seedThreads,
  type ConversationSeed,
  type ConvParticipant,
} from "@/mock/messages";
import { seedBookings } from "@/mock/bookings";
import { myPhotographer, seedMonthlyEarnings } from "@/mock/dashboard";
import { rosterSchedule, seedMySchedule } from "@/mock/schedules";
import {
  DEPOSIT_HOLD_MINUTES,
  cancelTerms,
  depositAmount,
  normalizePackage,
  packageTerms,
  resolvePackages,
  photographerPayout,
  remainingAmount,
} from "@/lib/booking";
import {
  BOOKING_WINDOW_DAYS,
  addDaysISO,
  countSlots,
  dayAvailability,
  occupiesSlot,
  sanitizeSchedule,
} from "@/lib/schedule";
import { rankForSessions } from "@/lib/achievements";
import {
  generateReply,
  HANDOFF_MESSAGE,
  needsHandoff,
} from "@/lib/assistant";
import { seedAssistantConfig } from "@/mock/assistant";
import { seedProfiles } from "@/mock/profiles";
import {
  cashbackCoins,
  COIN_EXPIRY_MONTHS,
  maxRedeemableCoins,
} from "@/lib/wallet";
import { fallbackAchievement, seedAchievements } from "@/mock/achievements";
import {
  addPhotos,
  galleriesOf,
  galleryOf,
  setPlan,
  storageSummaryOf,
} from "@/msw/storage";
import type { PayoutRecipient } from "@/lib/payments/provider";
import {
  coinBalanceOf,
  coinSummaryOf,
  coinTransactionsOf,
  paymentProvider,
  walletBalanceOf,
  walletTransactionsOf,
} from "@/msw/payments";
import type {
  Booking,
  BookingInput,
  BookingStatus,
  Conversation,
  DayAvailability,
  EarningsSummary,
  Message,
  PaymentInput,
  Photographer,
  PhotographerAchievements,
  AssistantConfig,
  ChangePasswordInput,
  ProfileInput,
  ReviewSummary,
  StoragePlanTier,
  UserProfile,
  WalletSummary,
  WorkSchedule,
} from "@/types";

// Mock backend for portal. Handlers play the role of the server: own the
// business logic (sorting, filtering, status changes) and the "database".
//
// Bookings are a SINGLE table persisted to localStorage so they survive a full
// reload — which is what a role switch (re-login) is. That makes the cross-role
// flow real: log in as a client, book a photographer, then log in as that
// photographer and the request is waiting. The photographer's work schedule
// persists the same way. Clear localStorage to reseed.

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Upcoming first (soonest → latest), then past (most recent → oldest).
const byUpcomingFirst = (a: Booking, b: Booking) => {
  const today = todayISO();
  const af = a.date >= today;
  const bf = b.date >= today;
  if (af !== bf) return af ? -1 : 1;
  return af ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
};

const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

// UI-phase auth stand-in: the signed-in user's id, sent by the axios client (see
// lib/api.ts) as a header. Lets handlers scope data to the current user.
const userIdOf = (request: Request) => request.headers.get("X-User-Id") ?? "";

// Expiry timestamp for freshly earned cashback coins.
const coinExpiryISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + COIN_EXPIRY_MONTHS);
  return d.toISOString();
};

// Split the (post-commission) payout across the lead photographer + any accepted
// collaborators by their agreed share. Single recipient when there are none —
// so the escrow release is identical to the current 1-photographer flow, and the
// "liên kết thợ" feature just adds accepted collaborators to the same seam.
const payoutRecipients = (b: Booking): PayoutRecipient[] => {
  const net = photographerPayout(b.price);
  const accepted = (b.collaborators ?? []).filter((c) => c.status === "accepted");
  if (accepted.length === 0) return [{ payeeId: b.photographerId, amount: net }];
  const collabs = accepted.map((c) => ({
    payeeId: c.photographerId,
    amount: Math.round((net * c.sharePct) / 100 / 1_000) * 1_000,
  }));
  const mainAmount = net - collabs.reduce((s, r) => s + r.amount, 0);
  return [{ payeeId: b.photographerId, amount: mainAmount }, ...collabs];
};

// Derive a photographer's rank + perks from their seeded metrics.
const achievementFor = (id: string): PhotographerAchievements => {
  const seed = seedAchievements[id] ?? fallbackAchievement(id);
  const rank = rankForSessions(seed.stats.completedSessions);
  return {
    photographerId: id,
    rank: rank.id,
    stats: seed.stats,
    badges: seed.badges,
    commissionRate: rank.commissionRate,
  };
};

// Attach the rank to a roster payload so browse cards render it without firing a
// per-card achievements request (the grid stays light — CLAUDE.md §7b).
const withRank = (p: Photographer): Photographer => ({
  ...p,
  rank: achievementFor(p.id).rank,
});

// ── Signed-in photographer profile — persisted (survives reload) so edits stick.
// Packages saved before the structured fields existed are upgraded on load.
const PROFILE_DB_KEY = "lens.profile.v1";
const withNormalizedPackages = (p: Photographer): Photographer => ({
  ...p,
  packages: p.packages?.map((pkg) => normalizePackage(pkg)),
});
const loadProfile = (): Photographer => {
  try {
    const raw = localStorage.getItem(PROFILE_DB_KEY);
    if (raw) return withNormalizedPackages(JSON.parse(raw) as Photographer);
  } catch {
    /* storage blocked — fall back to the seed */
  }
  return { ...myPhotographer };
};
let profile: Photographer = loadProfile();
const saveProfile = () => {
  try {
    localStorage.setItem(PROFILE_DB_KEY, JSON.stringify(profile));
  } catch {
    /* storage blocked */
  }
};

// The package list a photographer offers right now (the signed-in one is live).
const packagesOf = (photographerId: string) => {
  const owner =
    photographerId === profile.id
      ? profile
      : mockPhotographers.find((p) => p.id === photographerId);
  return owner ? resolvePackages(owner) : [];
};

// Give a booking its package snapshot if it lacks one (seeds / older rows):
// the booked package by id, else the tier closest in price. For shoots already
// delivered, the required count never exceeds what was delivered, so the demo
// bookings can still complete.
const withTerms = (b: Booking): Booking => {
  if (b.packageSnapshot && b.packageSnapshot.photoCount > 0) return b;
  const pkgs = packagesOf(b.photographerId);
  const pkg =
    pkgs.find((p) => p.id === b.packageId) ??
    [...pkgs].sort((x, y) => Math.abs(x.price - b.price) - Math.abs(y.price - b.price))[0];
  if (!pkg) return b;
  const terms = packageTerms(pkg);
  const delivered = galleryOf(b.id)?.photos.length;
  return {
    ...b,
    packageSnapshot:
      delivered && (b.status === "held" || b.status === "released")
        ? { ...terms, photoCount: Math.min(terms.photoCount, delivered) }
        : terms,
  };
};

// ── Bookings "table" — persisted to localStorage (survives reload) ───────────
// v2: bookings carry a deposit (older v1 rows would lack it).
const BOOKINGS_DB_KEY = "lens.bookings.v2";
const loadBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_DB_KEY);
    if (raw) return (JSON.parse(raw) as Booking[]).map(withTerms);
  } catch {
    /* storage blocked — fall back to a fresh seed */
  }
  // Seeds get their deposit derived here; past "awaiting_deposit" it's paid,
  // and an unpaid seed gets a fresh hold window.
  return seedBookings.map((b) =>
    withTerms({
      ...b,
      depositAmount: depositAmount(b.price),
      ...(b.status === "awaiting_deposit"
        ? { depositDeadline: minutesFromNow(DEPOSIT_HOLD_MINUTES) }
        : { depositPaidAt: new Date().toISOString() }),
    })
  );
};
let bookings: Booking[] = loadBookings();
const saveBookings = () => {
  try {
    localStorage.setItem(BOOKINGS_DB_KEY, JSON.stringify(bookings));
  } catch {
    /* storage blocked — state still lives in memory for this session */
  }
};

// ── Account profiles (personal info + settings), keyed by user id — persisted.
const USER_PROFILES_DB_KEY = "lens.userProfile.v1";
const loadUserProfiles = (): Record<string, UserProfile> => {
  try {
    const raw = localStorage.getItem(USER_PROFILES_DB_KEY);
    if (raw) return JSON.parse(raw) as Record<string, UserProfile>;
  } catch {
    /* storage blocked — fall back to the seed */
  }
  return structuredClone(seedProfiles);
};
let userProfiles: Record<string, UserProfile> = loadUserProfiles();
const saveUserProfiles = () => {
  try {
    localStorage.setItem(USER_PROFILES_DB_KEY, JSON.stringify(userProfiles));
  } catch {
    /* storage blocked */
  }
};

// ── Work schedules — the signed-in photographer's is persisted (saved only via
// "Lưu lịch"); roster photographers use a fixed seed. Public availability is
// computed from the schedule + the bookings table, so a booked slot disappears
// for every other client.
const SCHEDULE_DB_KEY = "lens.schedule.v1";
const loadMySchedule = (): WorkSchedule => {
  try {
    const raw = localStorage.getItem(SCHEDULE_DB_KEY);
    if (raw) return sanitizeSchedule(JSON.parse(raw) as WorkSchedule, todayISO());
  } catch {
    /* storage blocked — fall back to the seed */
  }
  return structuredClone(seedMySchedule);
};
let mySchedule: WorkSchedule = loadMySchedule();
const saveMySchedule = () => {
  try {
    localStorage.setItem(SCHEDULE_DB_KEY, JSON.stringify(mySchedule));
  } catch {
    /* storage blocked */
  }
};

const scheduleOf = (photographerId: string): WorkSchedule | null => {
  if (photographerId === profile.id) return mySchedule;
  const index = mockPhotographers.findIndex((p) => p.id === photographerId);
  return index < 0 ? null : rosterSchedule(index);
};

// Bookable window starts tomorrow (no same-day bookings).
const availabilityOf = (photographerId: string, days = BOOKING_WINDOW_DAYS): DayAvailability[] => {
  const schedule = scheduleOf(photographerId);
  if (!schedule) return [];
  const now = new Date().toISOString();
  const held = bookings.filter((b) => b.photographerId === photographerId && occupiesSlot(b, now));
  const from = addDaysISO(todayISO(), 1);
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(from, i);
    const booked = held.filter((b) => b.date === date).flatMap((b) => b.timeSlot ?? []);
    return dayAvailability(schedule, date, booked);
  });
};

// A photographer as the public sees it: the dates that still have a free slot.
const withAvailability = (p: Photographer): Photographer => ({
  ...p,
  availableDates: availabilityOf(p.id)
    .filter((d) => countSlots(d, "free") > 0)
    .map((d) => d.date),
});
// ── Conversations + threads — 2-party shared threads, persisted (survive reload
// + cross-role, like bookings). Each conversation is between two real users; the
// GET maps it to the current viewer's perspective (the OTHER participant).
const CONVERSATIONS_DB_KEY = "lens.conversations.v2";
const THREADS_DB_KEY = "lens.threads.v1";
const loadConversations = (): ConversationSeed[] => {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_DB_KEY);
    if (raw) return JSON.parse(raw) as ConversationSeed[];
  } catch {
    /* storage blocked */
  }
  return seedConversations.map((c) => ({ ...c, unread: { ...c.unread } }));
};
const loadThreads = (): Record<string, Message[]> => {
  try {
    const raw = localStorage.getItem(THREADS_DB_KEY);
    if (raw) return JSON.parse(raw) as Record<string, Message[]>;
  } catch {
    /* storage blocked */
  }
  return Object.fromEntries(
    Object.entries(seedThreads).map(([id, msgs]) => [id, msgs.map((m) => ({ ...m }))])
  );
};
let conversations: ConversationSeed[] = loadConversations();
const threads: Record<string, Message[]> = loadThreads();
const saveConversations = () => {
  try {
    localStorage.setItem(CONVERSATIONS_DB_KEY, JSON.stringify(conversations));
  } catch {
    /* storage blocked */
  }
};
const saveThreads = () => {
  try {
    localStorage.setItem(THREADS_DB_KEY, JSON.stringify(threads));
  } catch {
    /* storage blocked */
  }
};

// ── AI assistant configs — one per photographer, persisted ───────────────────
// Keyed by photographerId so each photographer's assistant answers in THEIR own
// persona (not whoever is signed in). Seeded with "me"; others get a default
// derived from their public roster profile.
const ASSISTANT_DB_KEY = "lens.assistant.v2";
const loadAssistants = (): Record<string, AssistantConfig> => {
  try {
    const raw = localStorage.getItem(ASSISTANT_DB_KEY);
    if (raw) return JSON.parse(raw) as Record<string, AssistantConfig>;
  } catch {
    /* storage blocked */
  }
  return { [seedAssistantConfig.photographerId]: { ...seedAssistantConfig } };
};
let assistantConfigs: Record<string, AssistantConfig> = loadAssistants();
const saveAssistants = () => {
  try {
    localStorage.setItem(ASSISTANT_DB_KEY, JSON.stringify(assistantConfigs));
  } catch {
    /* storage blocked */
  }
};
// A usable config for ANY photographer: the stored one, else a default built
// from their roster profile (so replies stay in that photographer's context).
const assistantFor = (id: string): AssistantConfig => {
  const stored = assistantConfigs[id];
  if (stored) return stored;
  const p = mockPhotographers.find((x) => x.id === id);
  return {
    photographerId: id,
    services: p ? `Giá từ ${p.pricePerSession.toLocaleString("vi-VN")}₫ / buổi chụp.` : "",
    style: p?.styles.join(", ") ?? "",
    area: p?.city ?? "",
    faqs: [],
    tone: "Thân thiện, ngắn gọn",
    enabled: true,
  };
};

// Map a stored 2-party conversation to the response shape from ONE viewer's
// perspective: the "participant" is always the OTHER person.
const conversationForViewer = (c: ConversationSeed, viewer: string): Conversation => {
  const other = c.participants.find((p) => p.id !== viewer) ?? c.participants[0];
  const msgs = threads[c.id] ?? [];
  const last = msgs[msgs.length - 1];
  return {
    id: c.id,
    participantId: other.id,
    participantName: other.name,
    participantAvatar: other.avatar,
    participantRole: other.role,
    lastMessage: last?.text ?? "",
    lastMessageAt: last?.sentAt ?? "",
    unreadCount: c.unread[viewer] ?? 0,
    aiEnabled: c.aiEnabled,
  };
};

// Directory of known people (from the seed) so "start a conversation" can build
// the viewer's participant from just their id. Demo logins (me, u-khachhang) are
// always present here.
const participantRegistry: Record<string, ConvParticipant> = {};
for (const c of seedConversations)
  for (const p of c.participants) participantRegistry[p.id] = p;

export const handlers = [
  // ── Photographers (public discovery) ──────────────────────────────────────
  http.get("/api/photographers", async ({ request }) => {
    await delay();
    // Reflect the signed-in photographer's edits in the public roster too.
    const roster = mockPhotographers.map((p) =>
      withAvailability(p.id === "me" ? profile : p)
    );
    const featured = new URL(request.url).searchParams.get("featured");
    const data =
      featured === "true" ? roster.filter((p) => p.featured) : roster;
    return HttpResponse.json(data.map(withRank));
  }),

  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    if (params.id === "me") return HttpResponse.json(withRank(withAvailability(profile)));
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ? withRank(withAvailability(found)) : null);
  }),

  // Day-by-day slots for the booking calendar (free / busy / booked).
  http.get("/api/photographers/:id/availability", async ({ params, request }) => {
    await delay();
    const days = Number(new URL(request.url).searchParams.get("days")) || BOOKING_WINDOW_DAYS;
    return HttpResponse.json(availabilityOf(params.id as string, Math.min(days, 60)));
  }),

  http.get("/api/photographers/:id/reviews", async ({ params }) => {
    await delay();
    return HttpResponse.json(
      mockReviews.filter((r) => r.photographerId === params.id)
    );
  }),

  // Star breakdown consistent with the profile's headline numbers: the 5★ share
  // comes from the public achievement stats, the rest splits 4★ > 3★ > 2★ > 1★.
  http.get("/api/photographers/:id/reviews/summary", async ({ params }) => {
    await delay();
    const id = params.id as string;
    const p = id === profile.id ? profile : mockPhotographers.find((x) => x.id === id);
    if (!p) {
      return HttpResponse.json({ message: "Không tìm thấy nhiếp ảnh gia" }, { status: 404 });
    }
    const total = p.reviewCount;
    const five = Math.round((total * achievementFor(id).stats.fiveStarPct) / 100);
    const rest = total - five;
    const four = Math.round(rest * 0.75);
    const three = Math.round(rest * 0.17);
    const two = Math.round(rest * 0.05);
    const one = rest - four - three - two;
    const summary: ReviewSummary = {
      average: p.rating,
      total,
      breakdown: [
        { stars: 5, count: five },
        { stars: 4, count: four },
        { stars: 3, count: three },
        { stars: 2, count: two },
        { stars: 1, count: Math.max(0, one) },
      ],
    };
    return HttpResponse.json(summary);
  }),

  http.get("/api/photographers/:id/achievements", async ({ params }) => {
    await delay();
    return HttpResponse.json(achievementFor(params.id as string));
  }),

  http.get("/api/me/achievements", async ({ request }) => {
    await delay();
    return HttpResponse.json(achievementFor(userIdOf(request) || "me"));
  }),

  // ── Bookings the signed-in user made AS A CLIENT ──────────────────────────
  http.get("/api/bookings", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    // A slot held without a deposit is released once its window passes.
    const now = new Date().toISOString();
    const expired = bookings.some(
      (b) => b.status === "awaiting_deposit" && b.depositDeadline && b.depositDeadline < now
    );
    if (expired) {
      bookings = bookings.map((b) =>
        b.status === "awaiting_deposit" && b.depositDeadline && b.depositDeadline < now
          ? { ...b, status: "cancelled" }
          : b
      );
      saveBookings();
    }
    return HttpResponse.json(
      bookings.filter((b) => b.clientId === userId).sort(byUpcomingFirst)
    );
  }),

  http.post("/api/bookings", async ({ request }) => {
    await delay();
    const input = (await request.json()) as BookingInput;
    // Price + terms come from the photographer's current package, not the client.
    const pkg = packagesOf(input.photographerId).find((p) => p.id === input.packageId);
    if (!pkg) {
      return HttpResponse.json(
        { message: "Gói chụp này không còn tồn tại, vui lòng chọn lại" },
        { status: 400 }
      );
    }
    // The slot must still be open — another client may have just taken it.
    const slot = availabilityOf(input.photographerId)
      .find((d) => d.date === input.date)
      ?.slots.find((t) => t.time === input.timeSlot);
    if (slot?.status !== "free") {
      return HttpResponse.json(
        {
          message:
            slot?.status === "booked"
              ? "Khung giờ này vừa có người đặt, vui lòng chọn khung khác"
              : "Nhiếp ảnh gia không nhận lịch vào khung giờ này, vui lòng chọn khung khác",
        },
        { status: 409 }
      );
    }
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      clientId: userIdOf(request),
      clientName: input.contactName,
      photographerId: input.photographerId,
      photographerName: input.photographerName,
      style: input.style,
      date: input.date,
      location: input.location,
      price: pkg.price,
      packageId: pkg.id,
      packageSnapshot: packageTerms(pkg),
      timeSlot: input.timeSlot,
      contactPhone: input.contactPhone,
      note: input.note,
      status: "awaiting_deposit",
      depositAmount: depositAmount(pkg.price),
      depositDeadline: minutesFromNow(DEPOSIT_HOLD_MINUTES),
    };
    // One row in the shared table. The photographer only sees it once the
    // deposit is paid (GET /me/bookings hides "awaiting_deposit").
    bookings = [booking, ...bookings];
    saveBookings();
    return HttpResponse.json(booking, { status: 201 });
  }),

  // Client pays the deposit → the platform holds it and the request goes to the
  // photographer ("pending"). Expired holds are released instead.
  http.post("/api/bookings/:id/deposit", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const booking = bookings.find((b) => b.id === params.id && b.clientId === userId);
    if (!booking) {
      return HttpResponse.json({ message: "Không tìm thấy lịch đặt" }, { status: 404 });
    }
    if (booking.status !== "awaiting_deposit") {
      return HttpResponse.json(
        { message: "Lịch đặt này không còn chờ đặt cọc" },
        { status: 409 }
      );
    }
    if (booking.depositDeadline && booking.depositDeadline < new Date().toISOString()) {
      bookings = bookings.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b));
      saveBookings();
      return HttpResponse.json(
        { message: "Đã hết thời gian giữ lịch, vui lòng đặt lại" },
        { status: 409 }
      );
    }
    paymentProvider.hold({ bookingId: booking.id, clientId: userId, amount: booking.depositAmount });
    const updated: Booking = {
      ...booking,
      status: "pending",
      depositPaidAt: new Date().toISOString(),
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Client pays → platform holds the money in escrow (status "held"). Lens Xu may
  // be applied to reduce the cash charged (capped at a % of the order). Money
  // moves through the PaymentProvider seam, never touched directly here.
  http.post("/api/bookings/:id/pay", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const { coinsToRedeem = 0 } = ((await request
      .json()
      .catch(() => ({}))) as PaymentInput) ?? {};
    const booking = bookings.find(
      (b) => b.id === params.id && b.clientId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy lịch đặt" },
        { status: 404 }
      );
    }
    if (booking.status !== "confirmed") {
      return HttpResponse.json(
        { message: "Chỉ có thể thanh toán cho lịch đã được xác nhận" },
        { status: 409 }
      );
    }
    // The deposit is already held — only the remainder is due now. Lens Xu
    // apply to that remainder (capped by the usual % + balance rules).
    const remaining = remainingAmount(booking);
    const coins = Math.min(
      Math.max(0, Math.round(coinsToRedeem)),
      maxRedeemableCoins(booking.price, coinBalanceOf(userId)),
      remaining
    );
    const cash = remaining - coins;
    if (coins > 0) {
      paymentProvider.debitCoins({
        userId,
        amount: coins,
        bookingId: booking.id,
      });
    }
    paymentProvider.hold({ bookingId: booking.id, clientId: userId, amount: cash });
    const updated: Booking = {
      ...booking,
      status: "held",
      coinsRedeemed: coins || undefined,
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Client confirms delivery → escrow releases to the photographer(s) ("released")
  // AND cashback Lens Xu is credited on the CASH portion (not on coins → no
  // xu-on-xu). Cashback lands ONLY here (shoot done), never at booking time.
  http.post("/api/bookings/:id/confirm-receipt", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const booking = bookings.find(
      (b) => b.id === params.id && b.clientId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy lịch đặt" },
        { status: 404 }
      );
    }
    if (booking.status !== "held") {
      return HttpResponse.json(
        { message: "Chỉ có thể xác nhận khi sàn đang giữ tiền" },
        { status: 409 }
      );
    }
    // Client can only complete after the photographer has delivered photos.
    const gallery = galleryOf(booking.id);
    const required = booking.packageSnapshot?.photoCount ?? 1;
    const delivered = gallery?.photos.length ?? 0;
    if (delivered < required) {
      return HttpResponse.json(
        { message: `Nhiếp ảnh gia mới giao ${delivered}/${required} ảnh` },
        { status: 409 }
      );
    }
    // Release escrow to the photographer(s), net of commission.
    paymentProvider.release({
      bookingId: booking.id,
      recipients: payoutRecipients(booking),
    });
    // Cashback on the cash actually paid (price minus coins redeemed).
    const cashPaid = booking.price - (booking.coinsRedeemed ?? 0);
    const earned = cashbackCoins(cashPaid);
    if (earned > 0) {
      paymentProvider.creditCoins({
        userId,
        amount: earned,
        bookingId: booking.id,
        expiresAt: coinExpiryISO(),
        note: `Hoàn xu buổi chụp ${booking.style}`,
      });
    }
    const updated: Booking = {
      ...booking,
      status: "released",
      coinsEarned: earned || undefined,
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Client cancels a held/confirmed booking → refund the cash paid + return any
  // Lens Xu that were redeemed (client isn't penalized for a cancellation).
  http.post("/api/bookings/:id/cancel", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const booking = bookings.find(
      (b) => b.id === params.id && b.clientId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy lịch đặt" },
        { status: 404 }
      );
    }
    if (booking.status === "released" || booking.status === "cancelled") {
      return HttpResponse.json(
        { message: "Không thể huỷ lịch ở trạng thái này" },
        { status: 409 }
      );
    }
    // Cancellation policy (lib/booking.ts cancelTerms): free before the
    // photographer accepts or ≥ FREE_CANCEL_DAYS before the shoot; later, the
    // deposit is forfeited to the photographer (net of the platform fee) and the
    // rest of what was paid comes back.
    const terms = cancelTerms(booking);
    if (terms.refund > 0) {
      paymentProvider.refund({ bookingId: booking.id, clientId: userId, amount: terms.refund });
    }
    if (terms.coinsBack > 0) {
      paymentProvider.creditCoins({
        userId,
        amount: terms.coinsBack,
        bookingId: booking.id,
        expiresAt: coinExpiryISO(),
        note: "Hoàn lại xu do huỷ buổi chụp",
      });
    }
    if (terms.forfeit > 0) {
      paymentProvider.release({
        bookingId: booking.id,
        recipients: [{ payeeId: booking.photographerId, amount: photographerPayout(terms.forfeit) }],
      });
    }
    const updated: Booking = {
      ...booking,
      status: "cancelled",
      coinsRedeemed: undefined,
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // ── Signed-in user: account profile + settings (both roles) ────────────────
  http.get("/api/me/profile", async ({ request }) => {
    await delay();
    const found = userProfiles[userIdOf(request)];
    if (!found) {
      return HttpResponse.json({ message: "Không tìm thấy hồ sơ" }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  http.patch("/api/me/profile", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    const current = userProfiles[userId];
    if (!current) {
      return HttpResponse.json({ message: "Không tìm thấy hồ sơ" }, { status: 404 });
    }
    const p = (await request.json()) as ProfileInput;
    const updated: UserProfile = {
      ...current,
      ...(p.name !== undefined && { name: p.name.trim() }),
      ...(p.phone !== undefined && { phone: p.phone.trim() }),
      ...(p.birthday !== undefined && { birthday: p.birthday }),
      ...(p.gender !== undefined && { gender: p.gender }),
      ...(p.city !== undefined && { city: p.city }),
      ...(p.addressDetail !== undefined && { addressDetail: p.addressDetail.trim() }),
      ...(p.notifications !== undefined && {
        notifications: { ...current.notifications, ...p.notifications },
      }),
    };
    userProfiles = { ...userProfiles, [userId]: updated };
    saveUserProfiles();
    // A photographer's account name is also their public name.
    if (userId === profile.id && p.name !== undefined) {
      profile = { ...profile, name: updated.name };
      saveProfile();
    }
    return HttpResponse.json(updated);
  }),

  // UI phase: the portal holds no password store (accounts live with auth), so
  // this only validates the payload shape.
  http.post("/api/me/password", async ({ request }) => {
    await delay();
    const { currentPassword, newPassword } = (await request.json()) as ChangePasswordInput;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return HttpResponse.json({ message: "Mật khẩu không hợp lệ" }, { status: 400 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Signed-in photographer: profile, incoming requests, availability ───────
  http.get("/api/me/photographer", async () => {
    await delay();
    return HttpResponse.json(withAvailability(profile));
  }),

  // Photographer edits her own profile (bio, price, styles, portfolio, …).
  http.patch("/api/me/photographer", async ({ request }) => {
    await delay();
    const p = (await request.json()) as Partial<Photographer>;
    profile = {
      ...profile,
      ...(p.name !== undefined && { name: p.name }),
      ...(p.bio !== undefined && { bio: p.bio }),
      ...(p.city !== undefined && { city: p.city }),
      ...(p.pricePerSession !== undefined && { pricePerSession: p.pricePerSession }),
      ...(p.experienceYears !== undefined && { experienceYears: p.experienceYears }),
      ...(p.styles !== undefined && { styles: p.styles }),
      ...(p.portfolio !== undefined && { portfolio: p.portfolio }),
      ...(p.packages !== undefined && { packages: p.packages.map((pkg) => normalizePackage(pkg)) }),
    };
    saveProfile();
    return HttpResponse.json(withAvailability(profile));
  }),

  // Booking requests sent TO the signed-in photographer.
  http.get("/api/me/bookings", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    // A request only reaches the photographer once its deposit is paid.
    return HttpResponse.json(
      bookings
        .filter((b) => b.photographerId === userId && b.status !== "awaiting_deposit")
        .sort(byUpcomingFirst)
    );
  }),

  http.patch("/api/me/bookings/:id", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const { status } = (await request.json()) as { status: BookingStatus };
    const booking = bookings.find(
      (b) => b.id === params.id && b.photographerId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy yêu cầu đặt lịch" },
        { status: 404 }
      );
    }
    // The photographer only decides on a request whose deposit is paid.
    if (booking.status !== "pending" || (status !== "confirmed" && status !== "cancelled")) {
      return HttpResponse.json(
        { message: "Không thể cập nhật yêu cầu ở trạng thái này" },
        { status: 409 }
      );
    }
    // Declining returns the client's deposit in full.
    if (status === "cancelled") {
      paymentProvider.refund({
        bookingId: booking.id,
        clientId: booking.clientId,
        amount: booking.depositAmount,
      });
    }
    const updated: Booking = { ...booking, status };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // ── Liên kết thợ (multi-photographer) ───────────────────────────────────────
  // Lead photographer invites another photographer + agreed payout share.
  http.post("/api/me/bookings/:id/collaborators", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const input = (await request.json()) as {
      photographerId: string;
      photographerName: string;
      photographerAvatar: string;
      sharePct: number;
    };
    const booking = bookings.find(
      (b) => b.id === params.id && b.photographerId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy buổi chụp" },
        { status: 404 }
      );
    }
    // Collaboration window: only from confirmation until photos are delivered.
    if (booking.status !== "confirmed" && booking.status !== "held") {
      return HttpResponse.json(
        { message: "Chỉ ghép thợ khi đã xác nhận và chưa giao ảnh" },
        { status: 409 }
      );
    }
    if (galleryOf(booking.id)?.photos.length) {
      return HttpResponse.json(
        { message: "Đã giao ảnh — không thể ghép thợ nữa" },
        { status: 409 }
      );
    }
    const existing = booking.collaborators ?? [];
    if (existing.some((c) => c.photographerId === input.photographerId)) {
      return HttpResponse.json(
        { message: "Thợ này đã được mời" },
        { status: 409 }
      );
    }
    const used = existing.reduce((s, c) => s + c.sharePct, 0);
    if (used + input.sharePct > 100) {
      return HttpResponse.json(
        { message: "Tổng tỷ lệ chia vượt quá 100%" },
        { status: 409 }
      );
    }
    const updated: Booking = {
      ...booking,
      collaborators: [...existing, { ...input, status: "invited" }],
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Shoots where the signed-in photographer is invited as a collaborator.
  http.get("/api/me/collaborations", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    return HttpResponse.json(
      bookings
        .filter((b) =>
          (b.collaborators ?? []).some((c) => c.photographerId === userId)
        )
        .sort(byUpcomingFirst)
    );
  }),

  // Invited photographer accepts / declines their agreed share.
  http.patch("/api/me/collaborations/:id", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request);
    const { status } = (await request.json()) as {
      status: "accepted" | "declined";
    };
    const booking = bookings.find((b) => b.id === params.id);
    const isCollaborator = (booking?.collaborators ?? []).some(
      (c) => c.photographerId === userId
    );
    if (!booking || !isCollaborator) {
      return HttpResponse.json(
        { message: "Không tìm thấy lời mời" },
        { status: 404 }
      );
    }
    const updated: Booking = {
      ...booking,
      collaborators: (booking.collaborators ?? []).map((c) =>
        c.photographerId === userId ? { ...c, status } : c
      ),
    };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Payouts per month for the studio overview (seeded history + live releases).
  http.get("/api/me/earnings", async ({ request }) => {
    await delay();
    const viewer = userIdOf(request) || profile.id;
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `Th${d.getMonth() + 1}` };
    });
    const released = bookings.filter((b) => b.status === "released");
    const amounts = months.map(({ key }, i) => {
      const live = released
        .filter((b) => b.date.startsWith(key))
        .reduce((sum, b) => sum + (payoutRecipients(b).find((r) => r.payeeId === viewer)?.amount ?? 0), 0);
      return (viewer === profile.id ? seedMonthlyEarnings[i] : 0) + live;
    });
    const thisMonth = amounts[5];
    const lastMonth = amounts[4];
    const summary: EarningsSummary = {
      months: months.map((m, i) => ({ label: m.label, amount: amounts[i] })),
      thisMonth,
      lastMonth,
      changePct: lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null,
    };
    return HttpResponse.json(summary);
  }),

  http.get("/api/me/schedule", async () => {
    await delay();
    return HttpResponse.json(mySchedule);
  }),

  // Replaces the whole schedule — the studio only sends it on "Lưu lịch".
  http.put("/api/me/schedule", async ({ request }) => {
    await delay();
    mySchedule = sanitizeSchedule((await request.json()) as WorkSchedule, todayISO());
    saveMySchedule();
    return HttpResponse.json(mySchedule);
  }),

  // ── Messaging — scoped to the signed-in user (each side sees its own inbox) ──
  http.get("/api/conversations", async ({ request }) => {
    await delay();
    const viewer = userIdOf(request);
    return HttpResponse.json(
      conversations
        .filter((c) => c.participants.some((p) => p.id === viewer))
        .map((c) => conversationForViewer(c, viewer))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    );
  }),

  // Open (or create) a 2-party conversation with a given person — used by the
  // "Nhắn tin" button on a photographer's profile. AI is ON by default.
  http.post("/api/conversations/start", async ({ request }) => {
    await delay();
    const viewer = userIdOf(request);
    const { participant } = (await request.json()) as {
      participant: ConvParticipant;
    };
    const viewerP: ConvParticipant = participantRegistry[viewer] ?? {
      id: viewer,
      name: "Bạn",
      avatar: "",
      role: "client",
    };
    let conv = conversations.find(
      (c) =>
        c.participants.some((p) => p.id === viewer) &&
        c.participants.some((p) => p.id === participant.id)
    );
    if (!conv) {
      conv = {
        id: `c-${Date.now()}`,
        participants: [viewerP, participant],
        unread: {},
        // Assistant only between a client and a photographer.
        aiEnabled: viewerP.role !== participant.role,
      };
      conversations.push(conv);
      saveConversations();
    }
    return HttpResponse.json(conversationForViewer(conv, viewer));
  }),

  http.get("/api/conversations/:id/messages", async ({ params }) => {
    await delay();
    const id = params.id as string;
    return HttpResponse.json((threads[id] ?? []).map((m) => ({ ...m })));
  }),

  http.post("/api/conversations/:id/messages", async ({ params, request }) => {
    await delay();
    const id = params.id as string;
    const viewer = userIdOf(request);
    const { text } = (await request.json()) as { text: string };
    const now = Date.now();
    const message: Message = {
      id: `m-${now}`,
      conversationId: id,
      senderId: viewer, // real sender id — UI decides "mine" via currentUser.id
      text,
      sentAt: new Date().toISOString(),
    };
    threads[id] = [...(threads[id] ?? []), message];

    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      // The recipient(s) gain an unread message.
      for (const p of conv.participants) {
        if (p.id !== viewer) conv.unread[p.id] = (conv.unread[p.id] ?? 0) + 1;
      }

      // The photographer's AI assistant auto-replies when the client writes and
      // AI is on — unless the topic needs a human (complaint/cancel/refund/
      // dispute), where it hands off and turns off. Photographer ↔ photographer
      // threads never get an assistant.
      const photographer = conv.participants.find((p) => p.role === "photographer");
      const client = conv.participants.find((p) => p.role === "client");
      if (conv.aiEnabled && photographer && client?.id === viewer) {
        const handedOff = needsHandoff(text);
        const aiReply: Message = {
          id: `m-${now}-ai`,
          conversationId: id,
          senderId: photographer.id, // sent on the photographer's behalf
          text: handedOff
            ? HANDOFF_MESSAGE
            : generateReply(assistantFor(photographer.id), text),
          sentAt: new Date(now + 1).toISOString(),
          isAI: true,
        };
        threads[id] = [...threads[id], aiReply];
        if (handedOff) conv.aiEnabled = false;
      }
    }

    saveThreads();
    saveConversations();
    return HttpResponse.json(message, { status: 201 });
  }),

  // Toggle the AI assistant for a single conversation (set by the photographer).
  http.post("/api/conversations/:id/ai", async ({ params, request }) => {
    await delay();
    const viewer = userIdOf(request);
    const { enabled } = (await request.json()) as { enabled: boolean };
    const conv = conversations.find((c) => c.id === params.id);
    if (!conv) return HttpResponse.json(null);
    conv.aiEnabled = enabled;
    saveConversations();
    return HttpResponse.json(conversationForViewer(conv, viewer));
  }),

  http.post("/api/conversations/:id/read", async ({ params, request }) => {
    await delay();
    const viewer = userIdOf(request);
    const conv = conversations.find((c) => c.id === params.id);
    if (conv) {
      conv.unread[viewer] = 0;
      saveConversations();
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // ── AI assistant config (signed-in photographer) ────────────────────────────
  http.get("/api/me/assistant", async ({ request }) => {
    await delay();
    return HttpResponse.json(assistantFor(userIdOf(request) || "me"));
  }),

  http.patch("/api/me/assistant", async ({ request }) => {
    await delay();
    const uid = userIdOf(request) || "me";
    const patch = (await request.json()) as Partial<AssistantConfig>;
    assistantConfigs[uid] = {
      ...assistantFor(uid),
      ...(patch.services !== undefined && { services: patch.services }),
      ...(patch.style !== undefined && { style: patch.style }),
      ...(patch.area !== undefined && { area: patch.area }),
      ...(patch.tone !== undefined && { tone: patch.tone }),
      ...(patch.faqs !== undefined && { faqs: patch.faqs }),
      ...(patch.enabled !== undefined && { enabled: patch.enabled }),
    };
    saveAssistants();
    return HttpResponse.json(assistantConfigs[uid]);
  }),

  // ── Wallet (real money) — derived from the append-only wallet ledger ────────
  http.get("/api/me/wallet", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    const ledger = walletTransactionsOf(userId);
    const sumOf = (type: string) =>
      ledger.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
    const month = todayISO().slice(0, 7);
    // Money the platform still holds for shoots this photographer worked on.
    const held = bookings
      .filter((b) => b.status === "held")
      .map((b) => payoutRecipients(b).find((r) => r.payeeId === userId)?.amount ?? 0)
      .filter((amount) => amount > 0);
    const summary: WalletSummary = {
      balance: walletBalanceOf(userId),
      pendingPayout: held.reduce((s, a) => s + a, 0),
      pendingPayoutCount: held.length,
      receivedThisMonth: ledger
        .filter((t) => t.type === "payout" && t.createdAt.slice(0, 7) === month)
        .reduce((s, t) => s + t.amount, 0),
      withdrawnTotal: -sumOf("withdraw"),
      refundedTotal: sumOf("refund"),
    };
    return HttpResponse.json(summary);
  }),

  http.get("/api/me/wallet/transactions", async ({ request }) => {
    await delay();
    return HttpResponse.json(walletTransactionsOf(userIdOf(request)));
  }),

  http.post("/api/me/wallet/withdraw", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    const { amount } = (await request.json()) as { amount: number };
    const balance = walletBalanceOf(userId);
    if (!amount || amount <= 0) {
      return HttpResponse.json(
        { message: "Số tiền rút không hợp lệ" },
        { status: 400 }
      );
    }
    if (amount > balance) {
      return HttpResponse.json(
        { message: "Số dư không đủ để rút" },
        { status: 409 }
      );
    }
    paymentProvider.withdraw({ userId, amount });
    return HttpResponse.json({ balance: walletBalanceOf(userId) });
  }),

  // ── Lens Xu (reward points) — derived from the append-only coin ledger ──────
  http.get("/api/me/coins", async ({ request }) => {
    await delay();
    return HttpResponse.json(coinSummaryOf(userIdOf(request)));
  }),

  http.get("/api/me/coins/transactions", async ({ request }) => {
    await delay();
    return HttpResponse.json(coinTransactionsOf(userIdOf(request)));
  }),

  // ── Cloud storage + delivery galleries ──────────────────────────────────────
  http.get("/api/me/storage", async ({ request }) => {
    await delay();
    return HttpResponse.json(storageSummaryOf(userIdOf(request) || "me"));
  }),

  http.get("/api/me/galleries", async ({ request }) => {
    await delay();
    return HttpResponse.json(galleriesOf(userIdOf(request) || "me"));
  }),

  http.post("/api/me/storage/plan", async ({ request }) => {
    await delay();
    const { tier } = (await request.json()) as { tier: StoragePlanTier };
    return HttpResponse.json(setPlan(userIdOf(request) || "me", tier));
  }),

  // A booking's gallery — readable by the client who booked it or the photographer.
  http.get("/api/bookings/:id/gallery", async ({ params }) => {
    await delay();
    return HttpResponse.json(galleryOf(params.id as string));
  }),

  // Photographer delivers / adds photos to their booking's gallery.
  http.post("/api/me/bookings/:id/gallery", async ({ params, request }) => {
    await delay();
    const userId = userIdOf(request) || "me";
    const booking = bookings.find(
      (b) => b.id === params.id && b.photographerId === userId
    );
    if (!booking) {
      return HttpResponse.json(
        { message: "Không tìm thấy buổi chụp" },
        { status: 404 }
      );
    }
    return HttpResponse.json(
      addPhotos(booking.id, userId, booking.clientName, booking.style)
    );
  }),
];
