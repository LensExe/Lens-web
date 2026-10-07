import { api } from "@/lib/api";
import { avatar, photo } from "@lens/ui";
import { listTopRatedPhotographers } from "@/services/backend/photographers";
import type { ApiPhotographer, PhotographyStyle } from "@/types/backend-api";
import type { PhotoStyle, Photographer } from "@/types";

const STYLE_LABELS: Record<PhotographyStyle, PhotoStyle> = {
  portrait: "Chân dung",
  vintage: "Vintage",
  korean: "Hàn Quốc",
  wedding: "Cưới",
  concept: "Concept",
  "pre-wedding": "Pre-wedding",
  beach: "Biển",
  lifestyle: "Lifestyle",
  event: "Sự kiện",
  corporate: "Công ty",
  family: "Gia đình",
  outdoor: "Ngoài trời",
  kids: "Trẻ em",
  streetwear: "Streetwear",
  fashion: "Thời trang",
  film: "Film",
  maternity: "Bầu bí",
  commercial: "Thương mại",
};

function toPhotographer(profile: ApiPhotographer): Photographer {
  const fallbackAvatar = avatar(`photographer-${profile.id}-av`);
  const firstStyle = profile.styles[0];
  const cover =
    profile.avatar_url ??
    photo(`photographer-${profile.id}`, 800, 1000, firstStyle === "event" ? "event" : "portrait");

  return {
    id: profile.id,
    name: profile.fullname,
    avatar: profile.avatar_url ?? fallbackAvatar,
    cover,
    city: profile.location,
    styles: profile.styles.map((style) => STYLE_LABELS[style]),
    rating: profile.rating?.average_rating ?? 0,
    reviewCount: profile.rating?.total_feedbacks ?? 0,
    bio: profile.description,
    experienceYears: profile.started_career_at
      ? Math.max(0, new Date().getFullYear() - profile.started_career_at)
      : 0,
    featured: true,
    portfolio: [],
  };
}

// Layer 3 — Service / API. The homepage featured list uses the real backend;
// the remaining legacy landing queries still use the local UI-phase mock.

export async function getPhotographers(): Promise<Photographer[]> {
  return (await api.get<Photographer[]>("/photographers")).data;
}

export async function getFeaturedPhotographers(): Promise<Photographer[]> {
  const { items } = await listTopRatedPhotographers(6);
  return items.map(toPhotographer);
}

export async function getPhotographerById(id: string): Promise<Photographer | null> {
  return (await api.get<Photographer>(`/photographers/${id}`)).data ?? null;
}
