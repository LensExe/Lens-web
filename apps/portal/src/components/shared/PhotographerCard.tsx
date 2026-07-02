import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, formatPrice } from "@lens/ui";
import { CardRankChip } from "@/components/achievements/CardRankChip";
import type { Photographer } from "@/types";

interface PhotographerCardProps {
  photographer: Photographer;
}

// Portrait ratios for the masonry. A deterministic ratio per card keeps the
// varied-height look while reserving box height — so a slow/failed cover image
// can't collapse the card and overlap the absolutely-positioned overlay text.
const COVER_RATIOS = ["4 / 5", "3 / 4", "5 / 7", "2 / 3"];
const ratioFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COVER_RATIOS[h % COVER_RATIOS.length];
};

export function PhotographerCard({ photographer }: PhotographerCardProps) {
  const initials = photographer.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");

  return (
    <Link
      to={`/photographers/${photographer.id}`}
      className="focus-ring group relative block overflow-hidden rounded-3xl bg-muted shadow-sm ring-1 ring-border/60 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.35)] hover:ring-foreground/15"
    >
      <img
        src={photographer.cover}
        alt={`Ảnh bìa của ${photographer.name}`}
        loading="lazy"
        style={{ aspectRatio: ratioFor(photographer.id) }}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />

      {/* Scrim for legible overlay text */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {/* Top row: rating + open affordance */}
      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          <Star className="size-3 fill-ember text-ember" />
          {photographer.rating.toFixed(1)}
          <span className="text-white/70">({photographer.reviewCount})</span>
        </span>
        <span className="flex size-9 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {/* Bottom: identity + price */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          <CardRankChip rank={photographer.rank} />
          {photographer.styles.slice(0, 2).map((style) => (
            <span
              key={style}
              className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md"
            >
              {style}
            </span>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-9 shrink-0 ring-2 ring-white/40">
              <AvatarImage src={photographer.avatar} alt={photographer.name} />
              <AvatarFallback className="text-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{photographer.name}</h3>
              <p className="flex items-center gap-1 text-xs text-white/75">
                <MapPin className="size-3" />
                {photographer.city}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-white/60">Từ</p>
            <p className="text-sm font-semibold leading-tight">
              {formatPrice(photographer.pricePerSession)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
