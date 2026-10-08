import { Star } from "lucide-react";
import { cn } from "@lens/ui";

/** Five-star rating display (rounded to whole stars). */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating} sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(rating) ? "fill-ember text-ember" : "text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}
