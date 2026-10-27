import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  expireBackendSession,
  refreshBackendAccessToken,
} from "@/lib/backend-api";
import { sessionUser, type SessionUser } from "@/lib/session";
import { parseChatRealtimeEvent, syncReadCursor } from "@/services/messages";
import { notificationSocketNamespace } from "@/services/notifications";
import { notificationKeys } from "@/queries/useNotifications";
import { bookingKeys } from "@/queries/useBookings";
import { dashboardKeys } from "@/queries/useDashboard";
import { walletKeys } from "@/queries/useWallet";
import { storageKeys } from "@/queries/useStorage";
import {
  applyChatMessageToCache,
  messageKeys,
  type ChatMessageChange,
} from "@/queries/useMessages";
import type { Conversation } from "@/types";

interface NotificationRealtimeEvent {
  id?: string;
  type?: string;
  data?: Record<string, unknown> | null;
}

interface BookingRealtimeEvent {
  event_id?: string;
  event_type?: string;
  data?: Record<string, unknown> | null;
}

const BOOKING_PAYMENT_EVENTS = new Set([
  "booking.deposit_paid",
  "booking.remaining_paid",
  "booking.payment_received",
]);

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<SessionUser | null>(() => sessionUser);
  const hasEverConnected = useRef(false);
  const failedInitialConnection = useRef(false);
  const subjectRef = useRef(sessionUser?.keycloakId ?? null);

  useEffect(() => {
    const updateSession = () => {
      const nextSession = sessionUser ? { ...sessionUser } : null;
      const nextSubject = nextSession?.keycloakId ?? null;
      const previousSubject = subjectRef.current;
      if (previousSubject && previousSubject !== nextSubject) {
        queryClient.removeQueries({ queryKey: messageKeys.user(previousSubject) });
      }
      subjectRef.current = nextSubject;
      setSession(nextSession);
    };
    const updateExpiry = (event: Event) => {
      const expiresAt = (event as CustomEvent<{ expiresAt?: unknown }>).detail?.expiresAt;
      if (typeof expiresAt !== "number") return;
      setSession((current) => current ? { ...current, accessTokenExpiresAt: expiresAt } : current);
    };
    const expireSession = () => setSession(null);
    window.addEventListener("lens:session-updated", updateSession);
    window.addEventListener("lens:backend-session-refreshed", updateExpiry);
    window.addEventListener("lens:auth-session-expired", expireSession);
    return () => {
      window.removeEventListener("lens:session-updated", updateSession);
      window.removeEventListener("lens:backend-session-refreshed", updateExpiry);
      window.removeEventListener("lens:auth-session-expired", expireSession);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!session) return;
    const expiresAt = session.accessTokenExpiresAt;
    const refreshTimer = expiresAt
      ? window.setTimeout(
          () => {
            void refreshBackendAccessToken()
              .then((nextExpiresAt) => {
                if (!nextExpiresAt) expireBackendSession();
              })
              .catch(() => undefined);
          },
          Math.max(0, expiresAt - Date.now() - 45_000),
        )
      : undefined;
    const socket = io(notificationSocketNamespace(), {
      path: "/api/v1/socket.io",
      withCredentials: true,
      transports: ["websocket"],
    });
    const seenEventIds = new Set<string>();
    const seenBookingEventIds = new Set<string>();
    const aggregateVersions = new Map<string, number>();

    const logSocketEvent = (name: string, metadata: Record<string, unknown> = {}) => {
      if (import.meta.env.DEV) {
        console.info("[Lens Socket.IO]", name, metadata);
      }
    };

    const refreshBookingSnapshots = (eventType: string, data: Record<string, unknown>) => {
      const bookingId = typeof data.booking_id === "string" ? data.booking_id : "";
      if (!bookingId) return;

      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.incoming });

      if (eventType === "booking.gallery_ready") {
        void queryClient.invalidateQueries({ queryKey: storageKeys.gallery(bookingId) });
        void queryClient.invalidateQueries({ queryKey: storageKeys.galleries });
      }

      if (BOOKING_PAYMENT_EVENTS.has(eventType)) {
        void queryClient.invalidateQueries({ queryKey: walletKeys.summary });
        void queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
      }
    };

    const applyBookingEvent = (
      eventType: string,
      data: Record<string, unknown> | null | undefined,
      eventId?: string,
    ) => {
      if (!eventType.startsWith("booking.") || !data?.booking_id) return;
      if (eventId) {
        if (seenBookingEventIds.has(eventId)) return;
        seenBookingEventIds.add(eventId);
        if (seenBookingEventIds.size > 1_000) {
          const oldest = seenBookingEventIds.values().next().value;
          if (oldest) seenBookingEventIds.delete(oldest);
        }
      }
      refreshBookingSnapshots(eventType, data);
    };

    socket.on("connect_error", (error) => {
      failedInitialConnection.current = true;
      if (import.meta.env.DEV) {
        console.warn("[Lens Socket.IO] connect_error", error.message);
      }
    });

    socket.on("connect", () => {
      logSocketEvent("connect", { socketId: socket.id, recovered: socket.recovered });
      const needsSync = hasEverConnected.current || failedInitialConnection.current;
      hasEverConnected.current = true;
      failedInitialConnection.current = false;
      if (!needsSync) return;
      if (socket.recovered) return;
      void queryClient.invalidateQueries({ queryKey: messageKeys.user() });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.incoming });
      void queryClient.invalidateQueries({ queryKey: walletKeys.summary });
      void queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: storageKeys.galleries });
      void queryClient.invalidateQueries({ queryKey: ["gallery"] });
    });
    socket.on("disconnect", (reason) => {
      logSocketEvent("disconnect", { reason });
    });

    socket.on("notification", (event: NotificationRealtimeEvent) => {
      logSocketEvent("notification", {
        notificationId: event?.id,
        notificationType: event?.type,
        eventType: event?.data?.event_type,
        bookingId: event?.data?.booking_id,
      });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      const data = event.data;
      if (event.type === "payment_success") {
        void queryClient.invalidateQueries({ queryKey: walletKeys.summary });
        void queryClient.invalidateQueries({ queryKey: walletKeys.transactions });
      }
      const eventType = typeof data?.event_type === "string" ? data.event_type : "";
      const eventId = typeof data?.event_id === "string" ? data.event_id : undefined;
      if (eventType.startsWith("booking.")) {
        applyBookingEvent(eventType, data, eventId);
      } else if (
        data?.booking_id &&
        (event.type === "payment_success" ||
          event.type === "booking_update" ||
          event.type === "order_placed" ||
          event.type === "order_cancelled")
      ) {
        // Keep booking data fresh if the notification arrives without its
        // companion booking.event packet.
        applyBookingEvent("booking.updated", data, eventId);
      }
    });
    socket.on("booking.event", (event: BookingRealtimeEvent) => {
      logSocketEvent("booking.event", {
        eventId: event?.event_id,
        eventType: event?.event_type,
        bookingId: event?.data?.booking_id,
        status: event?.data?.status,
      });
      if (typeof event.event_type !== "string") return;
      applyBookingEvent(event.event_type, event.data, event.event_id);
    });
    socket.on("chat.event", (rawEvent: unknown) => {
      const event = parseChatRealtimeEvent(rawEvent);
      logSocketEvent("chat.event", event
        ? {
            eventId: event.eventId,
            event: event.kind === "message" ? event.event : "READ_CURSOR",
            channelId: event.channelId,
          }
        : { parsed: false });
      if (!event) return;

      if (event.eventId) {
        if (seenEventIds.has(event.eventId)) return;
        seenEventIds.add(event.eventId);
        if (seenEventIds.size > 1_000) {
          const oldest = seenEventIds.values().next().value;
          if (oldest) seenEventIds.delete(oldest);
        }
      }

      if (event.aggregateVersion !== undefined) {
        const lastVersion = aggregateVersions.get(event.channelId) ?? 0;
        if (event.aggregateVersion <= lastVersion) return;
        aggregateVersions.set(event.channelId, event.aggregateVersion);
      }

      if (event.kind === "read-cursor") {
        if (event.userId === session?.keycloakId) {
          syncReadCursor(event.channelId, event.lastReadSequence);
          queryClient.setQueryData<Conversation[]>(messageKeys.conversations(), (current) =>
            current?.map((conversation) =>
              conversation.id === event.channelId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
          );
        }
        return;
      }

      const change: ChatMessageChange =
        event.event === "NEW_MESSAGE"
          ? "created"
          : event.event === "UPDATED_MESSAGE"
            ? "updated"
            : "recalled";
      const knownChannel = applyChatMessageToCache(
        queryClient,
        event.channelId,
        event.message,
        change,
      );
      if (!knownChannel) {
        void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      }
    });
    return () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      socket.disconnect();
    };
  }, [queryClient, session]);
}
