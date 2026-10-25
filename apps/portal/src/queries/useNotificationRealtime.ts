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
import {
  applyChatMessageToCache,
  messageKeys,
  type ChatMessageChange,
} from "@/queries/useMessages";
import type { Conversation } from "@/types";

interface NotificationRealtimeEvent {
  type?: string;
  data?: Record<string, unknown> | null;
}

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
    const aggregateVersions = new Map<string, number>();

    socket.on("connect_error", () => {
      failedInitialConnection.current = true;
    });

    socket.on("connect", () => {
      const needsSync = hasEverConnected.current || failedInitialConnection.current;
      hasEverConnected.current = true;
      failedInitialConnection.current = false;
      if (!needsSync) return;
      if (socket.recovered) return;
      void queryClient.invalidateQueries({ queryKey: messageKeys.user() });
    });

    socket.on("notification", (event: NotificationRealtimeEvent) => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      if (event.type === "payment_success" && typeof event.data?.booking_id === "string") {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.incoming });
      }
    });
    socket.on("chat.event", (rawEvent: unknown) => {
      const event = parseChatRealtimeEvent(rawEvent);
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
