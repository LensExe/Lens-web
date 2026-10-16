import { photo } from "@lens/ui";
import { STYLE_LABELS } from "@/lib/photography-styles";
import { listFeaturedStyles } from "@/services/backend/photographers";
import { toPhotographer } from "@/services/photographers";
import type { StyleCategory } from "@/types";

// Layer 3 — Load styles and their best public photographer from the backend.
export async function getStyles(): Promise<StyleCategory[]> {
  const featuredStyles = await listFeaturedStyles();

  return featuredStyles.map(({ style, representative }) => ({
    id: style,
    label: STYLE_LABELS[style],
    image: photo(`cat-${style}`, 600, 600, style.replace(/-/g, " ")),
    large: style === "portrait" || style === "wedding",
    representative: representative ? toPhotographer(representative) : null,
  }));
}
