import type { PhotographyStyle } from "@/types/backend-api";
import type { PhotoStyle } from "@/types";

export const STYLE_LABELS: Record<PhotographyStyle, PhotoStyle> = {
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

export const API_STYLE_CODES = Object.keys(STYLE_LABELS) as PhotographyStyle[];

export function photographyStyleForLabel(label: PhotoStyle): PhotographyStyle | undefined {
  return API_STYLE_CODES.find((style) => STYLE_LABELS[style] === label);
}
