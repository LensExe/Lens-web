import Masonry from "@lens/ui/components/effects/Masonry";
import { usePhotographers } from "@/queries/usePhotographers";
import { portalBrowse } from "@/lib/links";

const HEIGHTS = [560, 720, 480, 640, 520, 700, 460, 600, 540];

export function GalleryMasonry() {
  const { data } = usePhotographers();

  const images = (data ?? [])
    .flatMap((p) => [p.cover, ...p.portfolio])
    .slice(0, 9);

  const items = images.map((img, i) => ({
    id: String(i),
    img,
    url: portalBrowse(),
    height: HEIGHTS[i % HEIGHTS.length],
  }));

  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Khoảnh khắc trên Lens
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Hàng nghìn bộ ảnh thực tế từ cộng đồng nhiếp ảnh gia.
        </p>

        {items.length > 0 && (
          <>
            {/* Desktop: animated masonry */}
            <div className="relative mt-10 hidden h-[900px] md:block lg:h-[700px] xl:h-[580px]">
              <Masonry items={items} animateFrom="bottom" scaleOnHover hoverScale={0.96} blurToFocus />
            </div>

            {/* Mobile: simple 2-col gallery */}
            <div className="mt-8 grid grid-cols-2 gap-3 md:hidden">
              {images.slice(0, 6).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Ảnh ${i + 1} từ cộng đồng Lens`}
                  loading="lazy"
                  className="aspect-[3/4] w-full rounded-[20px] object-cover"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
