import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";
import { mockReviews } from "@/mock/reviews";
import { mockConversations, mockMessages } from "@/mock/messages";
import { seedBookings } from "@/mock/bookings";
import { incomingBookings, myPhotographer } from "@/mock/dashboard";
import type {
  Booking,
  BookingInput,
  BookingStatus,
  Conversation,
  Message,
} from "@/types";

// Mock backend for portal. Handlers play the role of the server: read the mock
// data ("database seed") and own the in-memory state + business logic that used
// to live in the services (sorting, persistence, status changes). State resets
// on a full reload — good enough to make actions feel real within a session.

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

// ── In-memory stores (the "database") ────────────────────────────────────────
let clientBookings: Booking[] = [...seedBookings];
let requestStore: Booking[] = [...incomingBookings];
let availableDates: string[] = [...myPhotographer.availableDates];
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
    const featured = new URL(request.url).searchParams.get("featured");
    const data =
      featured === "true"
        ? mockPhotographers.filter((p) => p.featured)
        : mockPhotographers;
    return HttpResponse.json(data);
  }),

  http.get("/api/photographers/:id", async ({ params }) => {
    await delay();
    const found = mockPhotographers.find((p) => p.id === params.id);
    return HttpResponse.json(found ?? null);
  }),

  http.get("/api/photographers/:id/reviews", async ({ params }) => {
    await delay();
    return HttpResponse.json(
      mockReviews.filter((r) => r.photographerId === params.id)
    );
  }),

  // ── Client's own bookings ─────────────────────────────────────────────────
  http.get("/api/bookings", async () => {
    await delay();
    return HttpResponse.json([...clientBookings].sort(byUpcomingFirst));
  }),

  http.post("/api/bookings", async ({ request }) => {
    await delay();
    const input = (await request.json()) as BookingInput;
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      clientId: "me",
      clientName: input.contactName,
      photographerId: input.photographerId,
      photographerName: input.photographerName,
      style: input.style,
      date: input.date,
      location: input.location,
      price: input.price,
      status: "pending",
    };
    clientBookings = [booking, ...clientBookings];
    return HttpResponse.json(booking, { status: 201 });
  }),

  // ── Signed-in photographer: profile, incoming requests, availability ───────
  http.get("/api/me/photographer", async () => {
    await delay();
    return HttpResponse.json({
      ...myPhotographer,
      availableDates: [...availableDates].sort(),
    });
  }),

  http.get("/api/me/bookings", async () => {
    await delay();
    return HttpResponse.json([...requestStore].sort(byUpcomingFirst));
  }),

  http.patch("/api/me/bookings/:id", async ({ params, request }) => {
    await delay();
    const { status } = (await request.json()) as { status: BookingStatus };
    requestStore = requestStore.map((b) =>
      b.id === params.id ? { ...b, status } : b
    );
    const updated = requestStore.find((b) => b.id === params.id);
    if (!updated) {
      return HttpResponse.json(
        { message: "Không tìm thấy yêu cầu đặt lịch" },
        { status: 404 }
      );
    }
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
