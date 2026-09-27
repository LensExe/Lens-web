import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@lens/ui";

/** Full-size viewer for a portfolio: arrows (buttons or keys) step through. */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  title,
}: {
  photos: string[];
  /** The open photo, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  title: string;
}) {
  const open = index !== null;
  const step = (delta: number) =>
    index !== null && onIndexChange((index + delta + photos.length) % photos.length);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <DialogContent
        className="max-w-[min(92vw,960px)] border-none bg-black/95 p-3 text-white sm:max-w-[min(92vw,960px)]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        <DialogTitle className="sr-only">
          {title} — ảnh {index !== null ? index + 1 : 0}/{photos.length}
        </DialogTitle>
        {index !== null && (
          <div className="relative">
            <img
              src={photos[index]}
              alt={`${title} — ảnh ${index + 1}`}
              className="mx-auto max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70"
            >
              <ChevronRight className="size-5" />
            </button>
            <p className="mt-2 text-center text-xs text-white/70 tabular-nums">
              {index + 1} / {photos.length}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
