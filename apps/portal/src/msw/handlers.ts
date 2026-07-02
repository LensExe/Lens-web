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
import { myPhotographer } from "@/mock/dashboard";
import { photographerPayout } from "@/lib/booking";
import { rankForSessions } from "@/lib/achievements";
import {
  generateReply,
  HANDOFF_MESSAGE,
  needsHandoff,
} from "@/lib/assistant";
import { seedAssistantConfig } from "@/mock/assistant";
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
  Message,
  PaymentInput,
  Photographer,
  PhotographerAchievements,
  AssistantConfig,
  StoragePlanTier,
} from "@/types";

// Mock backend for portal. Handlers play the role of the server: own the
// business logic (sorting, filtering, status changes) and the "database".
//
// Bookings are a SINGLE table persisted to localStorage so they survive a full
// reload — which is what a role switch (re-login) is. That makes the cross-role
// flow real: log in as a client, book a photographer, then log in as that
// photographer and the request is waiting. (Availability/conversations are
// lighter and still reset on reload.) Clear localStorage to reseed.

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

// ── Bookings "table" — persisted to localStorage (survives reload) ───────────
const BOOKINGS_DB_KEY = "lens.bookings.v1";
const loadBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(BOOKINGS_DB_KEY);
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {
    /* storage blocked — fall back to a fresh seed */
  }
  return seedBookings.map((b) => ({ ...b }));
};
let bookings: Booking[] = loadBookings();
const saveBookings = () => {
  try {
    localStorage.setItem(BOOKINGS_DB_KEY, JSON.stringify(bookings));
  } catch {
    /* storage blocked — state still lives in memory for this session */
  }
};

// ── Signed-in photographer profile — persisted (survives reload) so edits stick.
const PROFILE_DB_KEY = "lens.profile.v1";
const loadProfile = (): Photographer => {
  try {
    const raw = localStorage.getItem(PROFILE_DB_KEY);
    if (raw) return JSON.parse(raw) as Photographer;
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

// ── In-memory stores (reset on reload) ───────────────────────────────────────
let availableDates: string[] = [...myPhotographer.availableDates];

// The photographer's profile + her live availability, as the public sees it.
const profileWithDates = (): Photographer => ({
  ...profile,
  availableDates: [...availableDates].sort(),
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
      p.id === "me" ? profileWithDates() : p
    );
    const featured = new URL(request.url).searchParams.get("featured");
    const data =
      featured === "true" ? roster.filter((p) => p.featured) : roster;
    return HttpResponse.json(data.map(withRank));
  }),

  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    if (params.id === "me") return HttpResponse.json(withRank(profileWithDates()));
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ? withRank(found) : null);
  }),

  http.get("/api/photographers/:id/reviews", async ({ params }) => {
    await delay();
    return HttpResponse.json(
      mockReviews.filter((r) => r.photographerId === params.id)
    );
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
    return HttpResponse.json(
      bookings.filter((b) => b.clientId === userId).sort(byUpcomingFirst)
    );
  }),

  http.post("/api/bookings", async ({ request }) => {
    await delay();
    const input = (await request.json()) as BookingInput;
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      clientId: userIdOf(request),
      clientName: input.contactName,
      photographerId: input.photographerId,
      photographerName: input.photographerName,
      style: input.style,
      date: input.date,
      location: input.location,
      price: input.price,
      status: "pending",
    };
    // One row in the shared table → instantly visible to the photographer too.
    bookings = [booking, ...bookings];
    saveBookings();
    return HttpResponse.json(booking, { status: 201 });
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
    // Clamp the redemption to what's actually allowed (cap % + balance).
    const coins = Math.min(
      Math.max(0, Math.round(coinsToRedeem)),
      maxRedeemableCoins(booking.price, coinBalanceOf(userId))
    );
    const cash = booking.price - coins;
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
    if (!gallery || gallery.photos.length === 0) {
      return HttpResponse.json(
        { message: "Nhiếp ảnh gia chưa giao ảnh" },
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
    if (booking.status !== "held" && booking.status !== "confirmed") {
      return HttpResponse.json(
        { message: "Không thể huỷ lịch ở trạng thái này" },
        { status: 409 }
      );
    }
    // Only a held booking had money/coins taken — refund those.
    if (booking.status === "held") {
      const coins = booking.coinsRedeemed ?? 0;
      paymentProvider.refund({
        bookingId: booking.id,
        clientId: userId,
        amount: booking.price - coins,
      });
      if (coins > 0) {
        paymentProvider.creditCoins({
          userId,
          amount: coins,
          bookingId: booking.id,
          expiresAt: coinExpiryISO(),
          note: "Hoàn lại xu do huỷ buổi chụp",
        });
      }
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

  // ── Signed-in photographer: profile, incoming requests, availability ───────
  http.get("/api/me/photographer", async () => {
    await delay();
    return HttpResponse.json(profileWithDates());
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
      ...(p.packages !== undefined && { packages: p.packages }),
    };
    saveProfile();
    return HttpResponse.json(profileWithDates());
  }),

  // Booking requests sent TO the signed-in photographer.
  http.get("/api/me/bookings", async ({ request }) => {
    await delay();
    const userId = userIdOf(request);
    return HttpResponse.json(
      bookings.filter((b) => b.photographerId === userId).sort(byUpcomingFirst)
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

  http.get("/api/me/availability", async () => {
    await delay();
    return HttpResponse.json([...availableDates].sort());
  }),

  http.put("/api/me/availability", async ({ request }) => {
    await delay();
    const { date } = (await request.json()) as { date: string };
    availableDates = availableDates.includes(date)
      ? availableDates.filter((d) => d !== date)
      : [...availableDates, date];
    return HttpResponse.json([...availableDates].sort());
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
        aiEnabled: true,
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

      // The photographer's AI assistant auto-replies when the OTHER side (a
      // client) writes and AI is on — unless the topic needs a human
      // (complaint/cancel/refund/dispute), where it hands off and turns off.
      const photographer = conv.participants.find((p) => p.role === "photographer");
      if (conv.aiEnabled && photographer && photographer.id !== viewer) {
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
    return HttpResponse.json({ balance: walletBalanceOf(userIdOf(request)) });
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
