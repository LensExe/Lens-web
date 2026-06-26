import type { Photographer, PhotoStyle } from "@/types";

export const STYLE_OPTIONS: PhotoStyle[] = [
  "Chân dung",
  "Cưới",
  "Sự kiện",
  "Thời trang",
  "Sản phẩm",
  "Gia đình",
  "Du lịch",
  "Ẩm thực",
  "Kiến trúc",
  "Đường phố",
];

export const CITY_OPTIONS = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Đà Lạt",
  "Cần Thơ",
  "Hải Phòng",
];

// Price range (VND) for the slider filter — student-friendly tier (150k–800k/buổi).
export const PRICE_MIN = 100_000;
export const PRICE_MAX = 1_000_000;
export const PRICE_STEP = 50_000;

export const RATING_OPTIONS = [
  { value: "4.5", label: "4.5★ trở lên" },
  { value: "4.8", label: "4.8★ trở lên" },
] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Nổi bật" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-asc", label: "Giá: thấp → cao" },
  { value: "price-desc", label: "Giá: cao → thấp" },
] as const;

export interface Filters {
  q: string;
  styles: PhotoStyle[];
  city: string;
  priceMin: number;
  priceMax: number;
  /** Selected available date as ISO `yyyy-MM-dd`, empty = any day. */
  date: string;
  rating: string;
  sort: string;
}

export function parseFilters(sp: URLSearchParams): Filters {
  const priceMin = Number(sp.get("priceMin"));
  const priceMax = Number(sp.get("priceMax"));
  return {
    q: sp.get("q") ?? "",
    styles: ((sp.get("styles") ?? "").split(",").filter(Boolean) as PhotoStyle[]),
    city: sp.get("city") ?? "",
    priceMin: priceMin >= PRICE_MIN ? priceMin : PRICE_MIN,
    priceMax: priceMax > 0 && priceMax <= PRICE_MAX ? priceMax : PRICE_MAX,
    date: sp.get("date") ?? "",
    rating: sp.get("rating") ?? "",
    sort: sp.get("sort") ?? "featured",
  };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.styles.length) sp.set("styles", f.styles.join(","));
  if (f.city) sp.set("city", f.city);
  if (f.priceMin > PRICE_MIN) sp.set("priceMin", String(f.priceMin));
  if (f.priceMax < PRICE_MAX) sp.set("priceMax", String(f.priceMax));
  if (f.date) sp.set("date", f.date);
  if (f.rating) sp.set("rating", f.rating);
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  return sp;
}

/** Whether the price range is narrowed from the full [MIN, MAX] span. */
export function isPriceActive(f: Filters): boolean {
  return f.priceMin > PRICE_MIN || f.priceMax < PRICE_MAX;
}

/** Number of active filters (excludes the free-text search). */
export function countActiveFilters(f: Filters): number {
  return (
    (f.styles.length ? 1 : 0) +
    (f.city ? 1 : 0) +
    (isPriceActive(f) ? 1 : 0) +
    (f.date ? 1 : 0) +
    (f.rating ? 1 : 0)
  );
}

export function applyFilters(list: Photographer[], f: Filters): Photographer[] {
  const q = f.q.trim().toLowerCase();
  const minRating = f.rating ? Number(f.rating) : 0;

  const filtered = list.filter((p) => {
    if (q) {
      const hay = `${p.name} ${p.city} ${p.styles.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.styles.length && !f.styles.some((s) => p.styles.includes(s))) return false;
    if (f.city && p.city !== f.city) return false;
    if (p.pricePerSession < f.priceMin || p.pricePerSession > f.priceMax) return false;
    if (f.date && !p.availableDates.includes(f.date)) return false;
    if (minRating && p.rating < minRating) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (f.sort) {
      case "price-asc":
        return a.pricePerSession - b.pricePerSession;
      case "price-desc":
        return b.pricePerSession - a.pricePerSession;
      case "rating":
        return b.rating - a.rating;
      default:
        return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    }
  });
}
