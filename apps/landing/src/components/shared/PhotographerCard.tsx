import { MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@lens/ui";
import { formatPrice } from "@lens/ui";
import { portalProfile } from "@/lib/links";
import type { Photographer } from "@/types";

interface PhotographerCardProps {
  photographer: Photographer;
}

// Portrait ratios for the masonry showcase. A deterministic ratio per card keeps
// the varied-height look while reserving box height — so a slow/failed cover
// image can't collapse the card.
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
    <a
      href={portalProfile(photographer.id)}
      className="focus-ring group block overflow-hidden rounded-[28px] border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]"
    >
      {/* Cover */}
      <div className="relative overflow-hidden">
        <img
          src={photographer.cover}
          alt={`Ảnh bìa của ${photographer.name}`}
          loading="lazy"
          style={{ aspectRatio: ratioFor(photographer.id) }}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <Star className="size-3 fill-ember text-ember" />
          {photographer.rating.toFixed(1)}
          <span className="text-white/70">({photographer.reviewCount})</span>
        </div>
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {photographer.styles.map((style) => (
            <span
              key={style}
              className="rounded-xl border border-white/40 bg-black/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
            >
              {style}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 ring-2 ring-background">
            <AvatarImage src={photographer.avatar} alt={photographer.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{photographer.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {photographer.city}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-border/60 pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Từ</p>
            <p className="font-semibold">{formatPrice(photographer.pricePerSession)}</p>
          </div>
          <span className="text-xs text-muted-foreground">/ buổi</span>
        </div>
      </div>
    </a>
  );
}
