import { LogoLoop } from "@lens/ui";

// Camera/editing brands the platform works with. Wordmark nodes (no fake
// raster logos). One marquee on the page (see KineticBand note).
const brands = [
  "Canon",
  "Nikon",
  "Sony",
  "Fujifilm",
  "Leica",
  "Panasonic",
  "Sigma",
  "Lightroom",
];

const logos = brands.map((name) => ({
  node: (
    <span className="text-lg font-semibold tracking-wide text-muted-foreground">
      {name}
    </span>
  ),
  title: name,
}));

export function BrandStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/20 py-8">
      <div className="mx-auto max-w-[1200px] px-5">
        <p className="mb-5 text-center text-sm text-muted-foreground">
          Tương thích với mọi thiết bị và quy trình chỉnh sửa
        </p>
        <LogoLoop
          logos={logos}
          speed={60}
          gap={64}
          logoHeight={28}
          pauseOnHover
          fadeOut
          fadeOutColor="var(--background)"
          ariaLabel="Thương hiệu thiết bị nhiếp ảnh"
        />
      </div>
    </section>
  );
}
