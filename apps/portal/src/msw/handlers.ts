import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";
import { mockReviews } from "@/mock/reviews";
import { mockConversations, mockMessages } from "@/mock/messages";
import { seedBookings } from "@/mock/bookings";
import { myPhotographer } from "@/mock/dashboard";
import type {
  Booking,
  BookingInput,
  BookingStatus,
  Conversation,
  Message,
  Photographer,
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
let conversations: Conversation[] = mockConversations.map((c) => ({ ...c }));
const threads: Record<string, Message[]> = Object.fromEntries(
  Object.entries(mockMessages).map(([id, msgs]) => [
    id,
    msgs.map((m) => ({ ...m })),
  ])
);

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
    return HttpResponse.json(data);
  }),

  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    if (params.id === "me") return HttpResponse.json(profileWithDates());
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ?? null);
  }),

  http.get("/api/photographers/:id/reviews", async ({ params }) => {
    await delay();
    return HttpResponse.json(
      mockReviews.filter((r) => r.photographerId === params.id)
    );
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

  // Client pays in full → platform holds the money in escrow (status "held").
  http.post("/api/bookings/:id/pay", async ({ params, request }) => {
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
    if (booking.status !== "confirmed") {
      return HttpResponse.json(
        { message: "Chỉ có thể thanh toán cho lịch đã được xác nhận" },
        { status: 409 }
      );
    }
    const updated: Booking = { ...booking, status: "held" };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Client confirms delivery → escrow releases to the photographer ("released").
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
    const updated: Booking = { ...booking, status: "released" };
    bookings = bookings.map((b) => (b.id === booking.id ? updated : b));
    saveBookings();
    return HttpResponse.json(updated);
  }),

  // Client cancels a held booking → escrow refunds in full (status "cancelled").
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
    const updated: Booking = { ...booking, status: "cancelled" };
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

  // ── Messaging ─────────────────────────────────────────────────────────────
  http.get("/api/conversations", async () => {
    await delay();
    return HttpResponse.json(
      [...conversations].sort((a, b) =>
        b.lastMessageAt.localeCompare(a.lastMessageAt)
      )
    );
  }),

  http.get("/api/conversations/:id/messages", async ({ params }) => {
    await delay();
    const id = params.id as string;
    return HttpResponse.json((threads[id] ?? []).map((m) => ({ ...m })));
  }),

  http.post("/api/conversations/:id/messages", async ({ params, request }) => {
    await delay();
    const id = params.id as string;
    const { text } = (await request.json()) as { text: string };
    const message: Message = {
      id: `m-${Date.now()}`,
      conversationId: id,
      senderId: "me",
      text,
      sentAt: new Date().toISOString(),
    };
    threads[id] = [...(threads[id] ?? []), message];
    conversations = conversations.map((c) =>
      c.id === id
        ? { ...c, lastMessage: text, lastMessageAt: message.sentAt }
        : c
    );
    return HttpResponse.json(message, { status: 201 });
  }),

  http.post("/api/conversations/:id/read", async ({ params }) => {
    await delay();
    conversations = conversations.map((c) =>
      c.id === params.id ? { ...c, unreadCount: 0 } : c
    );
    return new HttpResponse(null, { status: 204 });
  }),
];
