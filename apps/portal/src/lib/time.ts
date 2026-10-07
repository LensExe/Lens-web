// Lightweight VN time formatting for messaging (no date-fns dependency).
import { vietnamDateTimeParts } from "@/lib/vietnam-time";

/** "HH:mm" — the clock time of a message. */
export function formatClock(iso: string): string {
  const parts = vietnamDateTimeParts(iso);
  if (!parts) return "";
  return parts.time;
}

/** Compact relative label for a conversation list (e.g. "5 phút", "3 giờ", "2 ngày"). */
export function formatRelative(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày`;
  const date = vietnamDateTimeParts(iso)?.date;
  if (!date) return "";
  const [, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}`;
}
