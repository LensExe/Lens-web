import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, cn } from "@lens/ui";
import { ShowcaseCard } from "@/components/landing/ShowcaseCard";
import { useDriftMode, useDriftRail } from "@/hooks/useDriftRail";
import { useFeaturedPhotographers } from "@/queries/usePhotographers";
import { portalBrowse } from "@/lib/links";

const MAX_CARDS = 8;
const pad = (n: number) => String(n).padStart(2, "0");

// "Xem trước phong cách" — never hijacks the page scroll. On desktop the rail
// drifts slowly and loops (useDriftRail): hover pauses it, the wheel over it
// scrolls it sideways, drag and ‹ › move it. On touch / narrow screens it's a
// plain native swipe rail with scroll-snap — no JS animation at all.
export function StyleShowcase() {
  const { data } = useFeaturedPhotographers();
  const drift = useDriftMode();
  const items = data?.slice(0, MAX_CARDS) ?? [];
  const total = items.length;
  const { viewport, track, counter, bar, step } = useDriftRail({ enabled: drift, total });

  // This section mounts lazily and changes the page height: re-measure the
  // scroll-triggered reveals further down.
  useEffect(() => {
    if (total > 0) ScrollTrigger.refresh();
  }, [total]);

  if (total === 0) {
    return <section className="px-5 py-20" aria-hidden />;
  }

  return (
    <section className="overflow-hidden bg-muted/30 py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-5 lg:grid-cols-[380px_1fr] lg:items-center">
        {/* Left: title, position + controls */}
        <div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Xem trước phong cách
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Lướt qua tác phẩm của những nhiếp ảnh gia nổi bật — mỗi người một dấu
            ấn riêng.
          </p>

          {drift && (
            <div className="mt-8 flex items-center gap-4">
              <span className="font-medium tabular-nums" aria-hidden>
                <span ref={counter}>01</span>
                <span className="text-muted-foreground"> / {pad(total)}</span>
              </span>
              <span className="relative h-px flex-1 overflow-hidden bg-border" aria-hidden>
                <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-foreground" />
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Ảnh trước" onClick={() => step(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Ảnh tiếp theo" onClick={() => step(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <a
            href={portalBrowse()}
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium"
          >
            Xem tất cả nhiếp ảnh gia
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Right: the rail */}
        <div
          ref={viewport}
          className={cn(
            drift
              ? "cursor-grab overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_5%,black_85%,transparent)] active:cursor-grabbing"
              : "-mx-5 snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]"
          )}
        >
          <ul ref={track} className={cn("flex w-max gap-5", drift && "will-change-transform")}>
            {items.map((p) => (
              <ShowcaseCard key={p.id} photographer={p} />
            ))}
            {drift && items.map((p) => <ShowcaseCard key={`${p.id}-loop`} photographer={p} clone />)}
          </ul>
        </div>
      </div>
    </section>
  );
}
