import { useRef } from "react";
import { portalBrowse } from "@/lib/links";
import { Skeleton as BoneSkeleton } from "boneyard-js/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@lens/ui";
import { PhotographerCard } from "@/components/shared/PhotographerCard";
import { PhotographerCardSkeleton } from "@/components/shared/PhotographerCardSkeleton";
import { ScrollFloat } from "@lens/ui";
import { useFeaturedPhotographers } from "@/queries/usePhotographers";
import { useReveal } from "@lens/ui";

// Varied cover heights for the loading skeletons to mimic the masonry rhythm.
const SKELETON_HEIGHTS = [260, 200, 300, 240, 220, 280];

export function FeaturedPhotographers() {
  const { data, isLoading, isError } = useFeaturedPhotographers();
  const scope = useRef<HTMLElement>(null);

  // Stagger the cards in once the query resolves and they're in the DOM.
  useReveal(scope, [data]);

  return (
    <section ref={scope} className="px-5 py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <ScrollFloat
              containerClassName="!my-0"
              textClassName="font-semibold tracking-tight"
            >
              Nhiếp ảnh gia nổi bật
            </ScrollFloat>
            <p className="mt-2 max-w-md text-muted-foreground">
              Những gương mặt được yêu thích nhất trên Lens, tuyển chọn theo đánh giá và chất lượng.
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
          <div className="mt-10 [column-gap:1.25rem] columns-1 sm:columns-2 lg:columns-3">
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
              : data?.map((photographer) => (
                  <div
                    key={photographer.id}
                    data-reveal
                    className="mb-5 break-inside-avoid"
                  >
                    <PhotographerCard photographer={photographer} />
                  </div>
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
