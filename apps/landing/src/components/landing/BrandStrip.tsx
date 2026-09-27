// Camera/editing brands the platform works with. Wordmark nodes (no fake
// raster logos). The only marquee on the page.
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

// Pure-CSS marquee (the shared `animate-marquee` keyframe): the list is
// rendered twice and slid by -50%, so it loops seamlessly on the compositor —
// no per-frame JS. Each item carries its own right padding (instead of a flex
// gap) so both halves are exactly the same width. Paused on hover; frozen by
// the global prefers-reduced-motion rule.
export function BrandStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/20 py-8">
      <div className="mx-auto max-w-[1200px] px-5">
        <p className="mb-5 text-center text-sm text-muted-foreground">
          Tương thích với mọi thiết bị và quy trình chỉnh sửa
        </p>
        <div
          className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          role="region"
          aria-label="Thương hiệu thiết bị nhiếp ảnh"
        >
          <ul className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {[...brands, ...brands].map((name, i) => (
              <li
                key={`${name}-${i}`}
                aria-hidden={i >= brands.length}
                className="pr-16 text-lg font-semibold tracking-wide text-muted-foreground"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
