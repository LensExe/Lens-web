import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@lens/ui";

/** Full-size photo viewer with prev/next (buttons + ← → keys). */
export function PortfolioLightbox({
  photos,
  index,
  alt,
  onIndexChange,
  onClose,
}: {
  photos: string[];
  /** Open photo, or null when closed. */
  index: number | null;
  alt: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const open = index !== null;
  const current = index ?? 0;
  const go = (delta: number) =>
    onIndexChange((current + delta + photos.length) % photos.length);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl [&>[data-slot=dialog-close]]:bg-black/50 [&>[data-slot=dialog-close]]:text-white"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Ảnh {current + 1} / {photos.length}. Dùng phím mũi tên để chuyển ảnh.
        </DialogDescription>
        {open && (
          <div className="relative flex items-center justify-center">
            <img
              src={photos[current]}
              alt={`${alt} — ảnh ${current + 1}`}
              className="max-h-[85dvh] w-auto max-w-full rounded-2xl object-contain"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Ảnh trước"
                  className="focus-ring absolute left-3 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Ảnh tiếp theo"
                  className="focus-ring absolute right-3 flex size-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="size-5" />
                </button>
                <span className="absolute bottom-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white tabular-nums backdrop-blur-sm">
                  {current + 1} / {photos.length}
                </span>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
