import { ScrollVelocity } from "@lens/ui/components/effects/ScrollVelocity";

// Velocity-reactive kinetic text band — a typographic divider between
// sections. (This is the page's second marquee alongside BrandStrip; kept
// far apart and visually distinct.)
export function KineticBand() {
  return (
    <section className="overflow-hidden border-y border-border/60 py-10">
      <ScrollVelocity
        texts={[
          "Chân dung • Cưới • Sự kiện • Du lịch • ",
          "Thời trang • Ẩm thực • Gia đình • Kiến trúc • ",
        ]}
        velocity={60}
        className="text-3xl font-bold tracking-tight text-foreground/85 md:text-5xl"
      />
    </section>
  );
}
