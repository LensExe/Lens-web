import type { PhotoStyle } from "@/types";

// Grouped, illustrated catalog of shooting styles. Client feedback (round 1):
// 51.9% struggled to pick a style, so styles are organised into clear categories,
// each style carries an illustration + short description, and the browse page
// exposes a visual picker that drives the same `styles` filter.
//
// The `keyword` maps to a genre photo folder in `@lens/ui` placeholderImg
// (portrait | family | event | food | product | street | architecture | travel,
// plus legacy wedding/fashion) so each tile shows a representative photo.
// `seed` keeps the image stable.

export interface StyleMeta {
  style: PhotoStyle;
  /** Image pool keyword for the illustration. */
  keyword: string;
  /** Stable seed so the tile image never changes. */
  seed: string;
  /** One-line hint shown under the label. */
  description: string;
}

export interface StyleCategory {
  id: string;
  label: string;
  styles: StyleMeta[];
}

export const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: "people",
    label: "Người & Chân dung",
    styles: [
      { style: "Chân dung", keyword: "portrait", seed: "st-chandung", description: "Ảnh cá nhân, thần thái tự nhiên" },
      { style: "Gia đình", keyword: "family", seed: "st-giadinh", description: "Khoảnh khắc gia đình ấm áp" },
    ],
  },
  {
    id: "wedding-event",
    label: "Cưới & Sự kiện",
    styles: [
      { style: "Cưới", keyword: "wedding", seed: "st-cuoi", description: "Phóng sự cưới, ảnh viện" },
      { style: "Sự kiện", keyword: "event", seed: "st-sukien", description: "Tiệc, hội nghị, sự kiện" },
    ],
  },
  {
    id: "commercial",
    label: "Thời trang & Thương mại",
    styles: [
      { style: "Thời trang", keyword: "fashion", seed: "st-thoitrang", description: "Lookbook, editorial, fashion" },
      { style: "Sản phẩm", keyword: "product", seed: "st-sanpham", description: "Ảnh sản phẩm, thương mại" },
      { style: "Ẩm thực", keyword: "food", seed: "st-amthuc", description: "Món ăn, đồ uống, quán" },
    ],
  },
  {
    id: "space-life",
    label: "Không gian & Đời sống",
    styles: [
      { style: "Du lịch", keyword: "travel", seed: "st-dulich", description: "Ảnh du lịch, phong cảnh" },
      { style: "Kiến trúc", keyword: "architecture", seed: "st-kientruc", description: "Không gian, nội thất, công trình" },
      { style: "Đường phố", keyword: "street", seed: "st-duongpho", description: "Street, đời thường" },
    ],
  },
];

/** Flat lookup of every style's metadata, keyed by the PhotoStyle value. */
export const STYLE_META: Record<string, StyleMeta> = Object.fromEntries(
  STYLE_CATEGORIES.flatMap((c) => c.styles).map((s) => [s.style, s])
);
