import Stack from "@lens/ui/components/effects/Stack";
import TiltedCard from "@lens/ui/components/effects/TiltedCard";
import { Star } from "lucide-react";
import { useFeaturedPhotographers } from "@/queries/usePhotographers";

export function StyleShowcase() {
  const { data } = useFeaturedPhotographers();

  if (!data || data.length === 0) {
    return <section className="px-5 py-20" aria-hidden />;
  }

  const spotlight = data[0];
  const stackCards = data.slice(0, 5).map((p) => (
    <img
      key={p.id}
      src={p.cover}
      alt={p.name}
      draggable={false}
      className="size-full object-cover"
    />
  ));

  return (
    <section className="bg-muted/30 px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Xem trước phong cách
          </h2>
          <p className="mt-2 text-muted-foreground">
            Nghiêng để cảm nhận, vuốt để khám phá. Mỗi nhiếp ảnh gia một dấu ấn riêng.
          </p>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Spotlight — tilt on hover */}
          <div className="flex justify-center">
            <TiltedCard
              imageSrc={spotlight.cover}
              altText={spotlight.name}
              containerHeight="420px"
              containerWidth="340px"
              imageHeight="420px"
              imageWidth="340px"
              rotateAmplitude={12}
              scaleOnHover={1.06}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div className="m-3 rounded-2xl bg-black/55 px-4 py-3 text-white backdrop-blur-sm">
                  <p className="text-base font-semibold leading-tight">{spotlight.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                    <Star className="size-3 fill-ember text-ember" />
                    {spotlight.rating.toFixed(1)} · {spotlight.styles.join(", ")}
                  </p>
                </div>
              }
            />
          </div>

          {/* Draggable stack */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-[360px] w-[290px]">
              <Stack
                randomRotation
                sensitivity={140}
                sendToBackOnClick
                cards={stackCards}
                animationConfig={{ stiffness: 260, damping: 20 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Kéo hoặc bấm để xem ảnh tiếp theo</p>
          </div>
        </div>
      </div>
    </section>
  );
}
