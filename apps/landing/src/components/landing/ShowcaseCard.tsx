import { ArrowUpRight, Star } from "lucide-react";
import { portalProfile } from "@/lib/links";
import type { Photographer } from "@/types";

/**
 * One "Xem trước phong cách" card. A `clone` (the looping rail's second set)
 * is hidden from assistive tech and the tab order.
 */
export function ShowcaseCard({ photographer: p, clone }: { photographer: Photographer; clone?: boolean }) {
  return (
    <li
      className="w-[260px] shrink-0 snap-start sm:w-[300px] lg:w-[340px]"
      aria-hidden={clone || undefined}
      inert={clone}
    >
      <a
        href={portalProfile(p.id)}
        draggable={false}
        className="focus-ring group relative block aspect-[3/4] overflow-hidden rounded-[28px] bg-muted"
      >
        <img
          src={p.cover}
          alt={`Tác phẩm của ${p.name}`}
          loading="lazy"
          draggable={false}
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-obsidian opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <p className="text-lg font-semibold leading-tight">{p.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
            <Star className="size-3 fill-ember text-ember" />
            {p.rating.toFixed(1)} · {p.styles.join(", ")}
          </p>
        </div>
      </a>
    </li>
  );
}
