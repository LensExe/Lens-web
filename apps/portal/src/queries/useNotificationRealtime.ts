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
import { messageKeys } from "@/queries/useMessages";

interface ChatRealtimeEvent {
  event?: string;
  payload?: { channel_id?: string; user_id?: string; last_read_seq?: number };
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
    socket.on("notification", () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.inbox });
    });
    socket.on("chat.event", (event: ChatRealtimeEvent) => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations });
      const channelId = event.payload?.channel_id;
      if (channelId) void queryClient.invalidateQueries({ queryKey: messageKeys.thread(channelId) });
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
      socket.disconnect();
    };
  }, [queryClient, token]);
}
