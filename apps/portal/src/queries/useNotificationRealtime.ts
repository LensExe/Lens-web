import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  getBackendAccessToken,
  getBackendAccessTokenExpiry,
  getBackendSubject,
  expireBackendSession,
  refreshBackendAccessToken,
} from "@/lib/backend-api";
import { syncReadCursor } from "@/services/messages";
import { notificationSocketNamespace } from "@/services/notifications";
import { notificationKeys } from "@/queries/useNotifications";
import { bookingKeys } from "@/queries/useBookings";
import { dashboardKeys } from "@/queries/useDashboard";
import { messageKeys } from "@/queries/useMessages";

interface ChatRealtimeEvent {
  event?: string;
  payload?: { channel_id?: string; user_id?: string; last_read_seq?: number };
}

interface NotificationRealtimeEvent {
  type?: string;
  data?: Record<string, unknown> | null;
}

export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(getBackendAccessToken);

  useEffect(() => {
    const updateToken = () => setToken(getBackendAccessToken());
    window.addEventListener("lens:access-token-changed", updateToken);
    return () => window.removeEventListener("lens:access-token-changed", updateToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    const expiresAt = getBackendAccessTokenExpiry(token);
    const refreshTimer = expiresAt
      ? window.setTimeout(
          () => {
            void refreshBackendAccessToken()
              .then((nextToken) => { if (!nextToken) expireBackendSession(); })
              .catch(() => undefined);
          },
          Math.max(0, expiresAt - Date.now() - 45_000),
        )
      : undefined;
    const socket = io(notificationSocketNamespace(), {
      path: "/api/v1/socket.io",
      auth: { token },
    });
    let conversationsRefreshTimer: number | undefined;
    const threadRefreshTimers = new Map<string, number>();
    socket.on("notification", (event: NotificationRealtimeEvent) => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
      if (event.type === "payment_success" && typeof event.data?.booking_id === "string") {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.mine });
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.incoming });
      }
    });
    socket.on("chat.event", (event: ChatRealtimeEvent) => {
      if (conversationsRefreshTimer !== undefined) {
        window.clearTimeout(conversationsRefreshTimer);
      }
      conversationsRefreshTimer = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: messageKeys.conversations });
        conversationsRefreshTimer = undefined;
      }, 750);
      const channelId = event.payload?.channel_id;
      if (channelId) {
        const previousTimer = threadRefreshTimers.get(channelId);
        if (previousTimer !== undefined) window.clearTimeout(previousTimer);
        threadRefreshTimers.set(channelId, window.setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: messageKeys.thread(channelId) });
          threadRefreshTimers.delete(channelId);
        }, 300));
      }
      if (
        event.event === "READ_CURSOR" &&
        channelId &&
        event.payload?.user_id === getBackendSubject() &&
        typeof event.payload.last_read_seq === "number"
      ) {
        syncReadCursor(channelId, event.payload.last_read_seq);
      }
    });
    return () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      if (conversationsRefreshTimer !== undefined) window.clearTimeout(conversationsRefreshTimer);
      for (const timer of threadRefreshTimers.values()) window.clearTimeout(timer);
      socket.disconnect();
    };
  }, [queryClient, token]);
}
