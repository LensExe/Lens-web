import { useState } from "react";
import { Expand, ImageOff } from "lucide-react";
import { PortfolioLightbox } from "./PortfolioLightbox";

// Varied, deterministic tile ratios keep the Pinterest-style rhythm while
// reserving each tile's height up front (no layout jump as photos load).
const RATIOS = ["4 / 5", "1 / 1", "3 / 4", "2 / 3", "4 / 3", "5 / 7"];

/** Full-width masonry of a photographer's work; click a tile to view it large. */
export function PortfolioGallery({ photos, name }: { photos: string[]; name: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
        <ImageOff className="mb-3 size-7" />
        Nhiếp ảnh gia chưa đăng tác phẩm nào.
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4 [&>*]:mb-3 sm:[&>*]:mb-4">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`Xem ảnh ${i + 1} của ${name}`}
            className="focus-ring group relative block w-full overflow-hidden rounded-2xl bg-muted break-inside-avoid"
          >
            <img
              src={src}
              alt={`Tác phẩm ${i + 1} của ${name}`}
              loading="lazy"
              decoding="async"
              style={{ aspectRatio: RATIOS[i % RATIOS.length] }}
              className="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
            <span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 text-obsidian opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Expand className="size-4" />
            </span>
          </button>
        ))}
      </div>

      <PortfolioLightbox
        photos={photos}
        index={openIndex}
        alt={`Tác phẩm của ${name}`}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
