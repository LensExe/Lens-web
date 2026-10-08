import { useRef } from "react";
import { portalBrowse } from "@/lib/links";
import { Skeleton as BoneSkeleton } from "boneyard-js/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@lens/ui";
import { PhotographerCard } from "@/components/shared/PhotographerCard";
import { PhotographerCardSkeleton } from "@/components/shared/PhotographerCardSkeleton";
import { useFeaturedPhotographers } from "@/queries/usePhotographers";
import { useReveal } from "@lens/ui";

// Varied cover heights for the loading skeletons to mimic the masonry rhythm.
const SKELETON_HEIGHTS = [260, 200, 300, 240, 220, 280];
const MAX_FEATURED = 6;

export function FeaturedPhotographers() {
  const { data, isLoading, isError } = useFeaturedPhotographers();
  const scope = useRef<HTMLElement>(null);

  // Stagger the cards in once the query resolves and they're in the DOM.
  useReveal(scope, [data]);

  return (
    <section ref={scope} id="nhiep-anh-gia" className="scroll-mt-20 px-5 py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-300">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Nhiếp ảnh gia nổi bật
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Những gương mặt nổi bật, được chọn theo phong cách, đánh giá và chất lượng portfolio.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <a href={portalBrowse()}>
              Xem tất cả
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>

        {isError ? (
          <p className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 text-center text-muted-foreground">
            Không thể tải danh sách nhiếp ảnh gia. Vui lòng thử lại sau.
          </p>
        ) : (
          <div className="mt-8 gap-x-4 columns-1 sm:columns-2 lg:columns-3 lg:gap-x-5">
            {isLoading
              ? SKELETON_HEIGHTS.map((h, i) => (
                  <div key={i} className="mb-5 break-inside-avoid">
                    <BoneSkeleton
                      loading
                      name="photographer-card"
                      fallback={<PhotographerCardSkeleton coverHeight={h} />}
                    >
                      {null}
                    </BoneSkeleton>
                  </div>
                ))
              : data?.slice(0, MAX_FEATURED).map((photographer) => (
                  <div key={photographer.id} data-reveal className="mb-5 break-inside-avoid">
                    <PhotographerCard photographer={photographer} />
                  </div>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
