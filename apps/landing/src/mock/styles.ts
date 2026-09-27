import { photo } from "@lens/ui";
import type { StyleCategory } from "@/types";

const img = (seed: string, keyword: string) => photo(seed, 600, 600, keyword);

// Every photo style offered on Lens (DB seed). Imported ONLY by
// src/msw/handlers.ts — the handler adds `photographerCount`. Order = bento
// order: two `large` tiles + eight small ones fill a 4×3 (or 2×6) grid exactly.
export const mockStyles: Omit<StyleCategory, "photographerCount">[] = [
  { id: "portrait", label: "Chân dung", image: img("cat-portrait", "portrait"), large: true },
  { id: "wedding", label: "Cưới", image: img("cat-wedding", "wedding") },
  { id: "event", label: "Sự kiện", image: img("cat-event", "event") },
  { id: "fashion", label: "Thời trang", image: img("cat-fashion", "fashion") },
  { id: "family", label: "Gia đình", image: img("cat-family-2", "family") },
  { id: "travel", label: "Du lịch", image: img("cat-travel", "travel"), large: true },
  { id: "architecture", label: "Kiến trúc", image: img("cat-architecture", "architecture") },
  { id: "food", label: "Ẩm thực", image: img("cat-food", "food") },
  { id: "product", label: "Sản phẩm", image: img("cat-product", "product") },
  { id: "street", label: "Đường phố", image: img("cat-street", "street") },
];
