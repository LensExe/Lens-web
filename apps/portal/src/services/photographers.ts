import { avatar } from "@lens/ui";
import { bookingPlanApi, calendarApi, identityApi, photographerApi, portfolioApi } from "@/services/backend";
import {
  HALF_HOUR_MS,
  nextVietnamHalfHour,
  vietnamDateTimeParts,
  vietnamDayRange,
} from "@/lib/vietnam-time";
import type { ApiPhotographer } from "@/types/photographers";
import type { ApiBookingPlan } from "@/types/booking-plans";
import type { ApiTimeRange, PhotographyStyle } from "@/types/common";
import type { DayAvailability, Photographer, PhotographerPackage, PhotoStyle } from "@/types";

const STYLE_LABELS: Record<string, PhotoStyle> = {
  portrait: "Chân dung", vintage: "Đường phố", korean: "Chân dung", wedding: "Cưới",
  concept: "Thời trang", "pre-wedding": "Cưới", beach: "Du lịch", lifestyle: "Gia đình",
  event: "Sự kiện", corporate: "Sản phẩm", family: "Gia đình", outdoor: "Du lịch",
  kids: "Gia đình", streetwear: "Đường phố", fashion: "Thời trang", film: "Đường phố",
  maternity: "Gia đình", commercial: "Sản phẩm",
};
const STYLE_CODES: Partial<Record<PhotoStyle, PhotographyStyle>> = {
  "Chân dung": "portrait", "Cưới": "wedding", "Sự kiện": "event", "Thời trang": "fashion",
  "Sản phẩm": "commercial", "Gia đình": "family", "Du lịch": "outdoor",
  "Đường phố": "streetwear",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const number = (value: unknown, fallback = 0) => typeof value === "number" ? value : fallback;

function mapPlan(plan: ApiBookingPlan): PhotographerPackage {
  return {
    id: plan.id,
    name: plan.name,
    description: text(plan.description),
    price: plan.price,
    photoCount: plan.retouched_photo_count,
    durationHours: plan.duration_minutes / 60,
  };
}

async function loadPlans(photographerId: string): Promise<PhotographerPackage[]> {
  const response = await bookingPlanApi.listPhotographerBookingPlans(photographerId);
  return response.items.map(mapPlan);
}

type PortfolioResponse = Awaited<ReturnType<typeof portfolioApi.listPhotographerPortfolios>>;
type PortfolioLoader = (photographerId: string) => Promise<PortfolioResponse>;

async function mapPhotographer(
  apiPhotographer: ApiPhotographer,
  featured = false,
  loadPortfolios: PortfolioLoader = (photographerId) =>
    portfolioApi.listPhotographerPortfolios(photographerId),
): Promise<Photographer> {
  const [packages, portfolios] = await Promise.all([
    loadPlans(apiPhotographer.id),
    loadPortfolios(apiPhotographer.id),
  ]);
  const albums = await Promise.all(portfolios.items.map((album) => portfolioApi.getPortfolio(text(asRecord(album).id))));
  const portfolio = albums.flatMap((album) => {
    const items = Array.isArray(asRecord(album).items) ? asRecord(album).items as unknown[] : [];
    return items.map((portfolioItem) => text(asRecord(portfolioItem).download_url)).filter(Boolean);
  });
  const rating = apiPhotographer.rating;
  return {
    id: apiPhotographer.id,
    name: apiPhotographer.fullname || "Nhiếp ảnh gia",
    avatar: apiPhotographer.avatar_url || avatar(apiPhotographer.id),
    cover: portfolio[0] || apiPhotographer.avatar_url || avatar(apiPhotographer.id),
    city: apiPhotographer.location,
    styles: [...new Set(apiPhotographer.styles.map((style) => STYLE_LABELS[style]).filter((style): style is PhotoStyle => !!style))],
    pricePerSession: packages.length ? Math.min(...packages.map((pkg) => pkg.price)) : 0,
    rating: number(rating?.average_rating),
    reviewCount: number(rating?.total_feedbacks),
    bio: apiPhotographer.description,
    experienceYears: apiPhotographer.started_career_at
      ? Math.max(0, new Date().getFullYear() - apiPhotographer.started_career_at)
      : 0,
    featured,
    portfolio,
    availableDates: [],
    packages,
    rank: apiPhotographer.rank?.code as Photographer["rank"],
  };
}

export async function getMyPhotographerProfile(): Promise<Photographer> {
  const [user, profile] = await Promise.all([
    identityApi.getMe(),
    photographerApi.getMyPhotographerProfile(),
  ]);
  return mapPhotographer(
    { ...profile, fullname: user.fullname, avatar_url: user.avatar_url } as ApiPhotographer,
    false,
    () => portfolioApi.listMyPhotographerPortfolios(),
  );
}

export async function updateMyPhotographerProfile(patch: Partial<Photographer>): Promise<Photographer> {
  const profilePatch = {
    ...(patch.bio !== undefined && { description: patch.bio }),
    ...(patch.experienceYears !== undefined && {
      started_career_at: new Date().getFullYear() - Math.max(0, Math.round(patch.experienceYears)),
    }),
    ...(patch.styles !== undefined && { styles: patch.styles.map((style) => STYLE_CODES[style]).filter((style): style is PhotographyStyle => !!style) }),
  };
  if (Object.keys(profilePatch).length) await photographerApi.updateMyPhotographerProfile(profilePatch);
  if (patch.city !== undefined) await photographerApi.updateMyPhotographerLocation({ location: patch.city });
  return getMyPhotographerProfile();
}

async function allPhotographers(fetchPage: (offset: number) => Promise<{ items: ApiPhotographer[]; total: number }>) {
  const limit = 100;
  const first = await fetchPage(0);
  const pages = await Promise.all(
    Array.from({ length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) }, (_, index) =>
      fetchPage(first.items.length + index * limit),
    ),
  );
  return [...first.items, ...pages.flatMap((page) => page.items)];
}

export async function getPhotographers(): Promise<Photographer[]> {
  const rows = await allPhotographers((offset) => photographerApi.searchPhotographers({ limit: 100, offset }));
  return Promise.all(rows.map((row) => mapPhotographer(row)));
}

export async function getFeaturedPhotographers(): Promise<Photographer[]> {
  const rows = await allPhotographers((offset) => photographerApi.listTopRatedPhotographers({ limit: 100, offset }));
  return Promise.all(rows.map((row) => mapPhotographer(row, true)));
}

export async function getAvailability(photographerId: string): Promise<DayAvailability[]> {
  const { from, to } = vietnamDayRange(31);
  const response = await calendarApi.getPhotographerAvailability(photographerId, {
    from,
    to,
  });
  const days = new Map<string, Set<string>>();
  for (const range of response.items as ApiTimeRange[]) {
    const start = Date.parse(range.from);
    const end = Date.parse(range.to);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) continue;

    // Availability is returned as continuous UTC ranges. Convert each range
    // into half-hour starts, keeping only cells fully inside the free range.
    // This also handles a range crossing midnight without leaking slots into
    // the previous/next calendar day.
    for (
      let cursor = nextVietnamHalfHour(start);
      cursor + HALF_HOUR_MS <= end;
      cursor += HALF_HOUR_MS
    ) {
      const parts = vietnamDateTimeParts(cursor);
      if (!parts) continue;
      const { date, time } = parts;
      const slots = days.get(date) ?? new Set<string>();
      slots.add(time);
      days.set(date, slots);
    }
  }
  return [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, slots]) => ({
      date,
      slots: [...slots]
        .sort()
        .map((time) => ({ time, status: "free" as const })),
    }));
}

export async function getPhotographerById(photographerId: string): Promise<Photographer | null> {
  const row = await photographerApi.getPhotographer(photographerId);
  return row ? mapPhotographer(row) : null;
}
