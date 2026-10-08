import { useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button, Skeleton } from "@lens/ui";
import { Stars } from "./Stars";
import { useReviewSummary, useReviews } from "@/queries/useReviews";

const PAGE = 5;

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** Reviews tab: rating overview (average + star breakdown) and the review list. */
export function ReviewsPanel({ photographerId }: { photographerId: string }) {
  const { data: summary } = useReviewSummary(photographerId);
  const { data: reviews = [], isLoading } = useReviews(photographerId);
  const [shown, setShown] = useState(PAGE);

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
      {/* Overview */}
      <aside className="lg:sticky lg:top-36 lg:self-start">
        {summary ? (
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-5xl font-semibold tracking-tight tabular-nums">
              {summary.average.toFixed(1)}
            </p>
            <Stars rating={summary.average} className="mt-2 [&>svg]:size-4" />
            <p className="mt-1 text-sm text-muted-foreground">{summary.total} đánh giá</p>
            <div className="mt-5 space-y-2">
              {summary.breakdown.map(({ stars, count }) => {
                const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-muted-foreground tabular-nums">{stars}</span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-ember"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Skeleton className="h-64 rounded-3xl" />
        )}
      </aside>

      {/* List */}
      <div className="min-w-0">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center text-muted-foreground">
            <MessageSquareQuote className="mb-3 size-7" />
            Chưa có đánh giá nào.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {reviews.slice(0, shown).map((review) => (
                <li key={review.id} className="flex gap-4 py-5 first:pt-0">
                  <Avatar className="size-11 shrink-0">
                    <AvatarImage src={review.authorAvatar} alt={review.authorName} />
                    <AvatarFallback>{initialsOf(review.authorName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{review.authorName}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
                    </div>
                    <Stars rating={review.rating} className="mt-1" />
                    <p className="mt-2 leading-relaxed text-foreground/85">{review.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
            {shown < reviews.length && (
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => setShown((n) => n + PAGE)}
              >
                Xem thêm đánh giá
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
