// Lightweight VN formatting helpers for the admin console (no date-fns).

/** "DD/MM/YYYY" from an ISO date string. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

/** Grouped count, e.g. 1284 → "1.284". */
export function formatCount(n: number): string {
  return n.toLocaleString("vi-VN");
}

/** Human byte size, e.g. 1_610_612_736 → "1,5 GB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${units[i]}`;
}

/** Percent label, e.g. 0.08 → "8%". */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Compact relative label from an ISO datetime (e.g. "5 phút", "3 giờ", "2 ngày"). */
export function formatRelative(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} ngày`;
}

/** Days from today to an ISO date: "Hôm nay", "Còn 5 ngày", "3 ngày trước". */
export function relativeDay(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  if (days === -1) return "Hôm qua";
  return days > 0 ? `Còn ${days} ngày` : `${-days} ngày trước`;
}
