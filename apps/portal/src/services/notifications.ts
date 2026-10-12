import { backendApi, backendBaseURL } from "@/lib/backend-api";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationRecord {
  id: string;
  title: string;
  content?: string;
  message?: string;
  type: string;
  is_read?: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
}

function notificationBaseURL(): string {
  const configured = import.meta.env.VITE_NOTIFICATION_API_URL?.trim().replace(/\/+$/, "");
  if (!configured) return backendBaseURL;
  if (configured.endsWith("/api/v1/notifications")) {
    return configured.slice(0, -"/notifications".length);
  }
  if (configured.endsWith("/api/v1")) return configured;
  if (configured.endsWith("/api")) return `${configured}/v1`;
  return `${configured}/api/v1`;
}

function unwrap<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    const envelope = value as { data: T; success?: unknown };
    if ("success" in value || Object.keys(value).length === 1) return envelope.data;
  }
  return value as T;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const response = await backendApi.get<unknown>("/notifications", {
    baseURL: notificationBaseURL(),
    params: { skip: 0, limit: 100 },
  });
  const rows = unwrap<NotificationRecord[]>(response.data);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.content ?? row.message ?? "",
    type: row.type,
    isRead: row.is_read === true,
    data: row.data ?? null,
    createdAt: row.created_at,
  }));
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await backendApi.post<unknown>(
    "/notifications/mark-read",
    undefined,
    { baseURL: notificationBaseURL() },
  );
  return Number(unwrap(response.data) ?? 0);
}

export function notificationSocketNamespace(): string {
  const configured =
    import.meta.env.VITE_NOTIFICATION_SOCKET_URL?.trim() ||
    import.meta.env.VITE_NOTIFICATION_API_URL?.trim() ||
    import.meta.env.VITE_BACKEND_API_URL?.trim() ||
    window.location.origin;
  try {
    return `${new URL(configured, window.location.origin).origin}/notification`;
  } catch {
    return `${window.location.origin}/notification`;
  }
}
