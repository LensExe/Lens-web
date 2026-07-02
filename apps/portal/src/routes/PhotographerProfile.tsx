import { useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Separator,
  Skeleton,
  cn,
  formatPrice,
  toast,
} from "@lens/ui";
import { usePhotographer } from "@/queries/usePhotographers";
import { useReviews } from "@/queries/useReviews";
import { useAchievements } from "@/queries/useAchievements";
import { useStartConversation } from "@/queries/useMessages";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { badgeById } from "@/lib/achievements";
import { RankBadge } from "@/components/achievements/RankBadge";
import type { Review } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const formatDayMonth = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

function Stars({ rating, className }: { rating: number; className?: string }) {
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

function ReviewItem({ review }: { review: Review }) {
  return (
    <div data-reveal className="flex gap-3 border-b border-border/60 py-4 last:border-0">
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={review.authorAvatar} alt={review.authorName} />
        <AvatarFallback>{initialsOf(review.authorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-medium">{review.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
        </div>
        <Stars rating={review.rating} className="mt-1" />
        <p className="mt-1.5 text-sm text-foreground/80">{review.comment}</p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-8">
      <Skeleton className="h-72 w-full rounded-3xl md:h-96" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function PhotographerProfile() {
  const { id = "" } = useParams();
  const { data: photographer, isLoading, isError } = usePhotographer(id);
  const { data: reviews = [] } = useReviews(id);
  const { data: achievements } = useAchievements(id);
  const scopeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const startChat = useStartConversation();

  useScrollReveal(scopeRef, [photographer?.id, reviews.length]);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !photographer) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1100px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy nhiếp ảnh gia</h1>
        <p className="mt-2 text-muted-foreground">
          Hồ sơ bạn tìm không tồn tại hoặc đã bị gỡ.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Về danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const upcomingDates = photographer.availableDates.slice(0, 6);

  return (
    <div ref={scopeRef} className="mx-auto max-w-[1100px] px-5 py-6">
      <Link
        to="/"
        className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Nhiếp ảnh gia
      </Link>

      {/* Cover banner — no text overlay */}
      <div data-reveal className="overflow-hidden rounded-3xl">
        <img
          src={photographer.cover}
          alt={`Ảnh bìa của ${photographer.name}`}
          className="h-40 w-full object-cover sm:h-52 md:h-60"
        />
      </div>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_330px]">
        {/* Main column */}
        <div className="min-w-0">
          {/* Identity — only the avatar overlaps the cover; text sits below it */}
          <div data-reveal className="px-1">
            <Avatar className="-mt-14 size-28 rounded-full bg-background ring-4 ring-background md:-mt-16 md:size-32">
              <AvatarImage src={photographer.avatar} alt={photographer.name} />
              <AvatarFallback>{initialsOf(photographer.name)}</AvatarFallback>
            </Avatar>
            <h1 className="mt-4 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {photographer.name}
              {photographer.featured && (
                <BadgeCheck className="size-6 text-ember" aria-label="Nổi bật" />
              )}
              {achievements && <RankBadge rank={achievements.rank} />}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {photographer.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-ember text-ember" />
                <span className="font-medium text-foreground">{photographer.rating.toFixed(1)}</span>
                ({photographer.reviewCount} đánh giá)
              </span>
              <span>{photographer.experienceYears} năm kinh nghiệm</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {photographer.styles.map((style) => (
                <Badge key={style} variant="secondary" className="rounded-full px-3 py-1">
                  {style}
                </Badge>
              ))}
            </div>

            {achievements && achievements.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {achievements.badges.map((bid) => {
                  const badge = badgeById(bid);
                  if (!badge) return null;
                  return (
                    <span
                      key={bid}
                      title={badge.description}
                      className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    >
                      <BadgeCheck className="size-3.5" />
                      {badge.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <section data-reveal className="mt-8">
            <h2 className="text-lg font-semibold">Giới thiệu</h2>
            <p className="mt-2 leading-relaxed text-foreground/80">{photographer.bio}</p>
          </section>

          <section data-reveal className="mt-9">
            <h2 className="text-lg font-semibold">Tác phẩm</h2>
            <div className="mt-4 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
              {photographer.portfolio.map((src, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-2xl border border-border break-inside-avoid"
                >
                  <img
                    src={src}
                    alt={`Tác phẩm ${i + 1} của ${photographer.name}`}
                    loading="lazy"
                    style={{ aspectRatio: ["4 / 5", "1 / 1", "3 / 4", "5 / 7"][i % 4] }}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                </div>
              ))}
            </div>
          </section>

          <section data-reveal className="mt-9">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Đánh giá</h2>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
            <div className="mt-2">
              {reviews.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">Chưa có đánh giá nào.</p>
              ) : (
                reviews.map((review) => <ReviewItem key={review.id} review={review} />)
              )}
            </div>
          </section>
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24 lg:mt-12 lg:self-start">
          <div
            data-reveal
            className="rounded-3xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">Giá từ</p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatPrice(photographer.pricePerSession)}
            </p>
            <p className="text-xs text-muted-foreground">/ buổi chụp</p>

            <Separator className="my-4" />

            <div className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              Lịch trống sắp tới
            </div>
            {upcomingDates.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Hiện chưa có lịch trống.</p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {upcomingDates.map((d) => (
                  <span
                    key={d}
                    className="rounded-lg border border-border px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-muted"
                  >
                    {formatDayMonth(d)}
                  </span>
                ))}
              </div>
            )}

            <Button asChild className="mt-5 w-full rounded-full">
              <Link to={`/photographers/${photographer.id}/book`}>Đặt lịch</Link>
            </Button>
            <Button
              variant="outline"
              className="mt-2 w-full rounded-full"
              disabled={startChat.isPending}
              onClick={() =>
                startChat.mutate(
                  {
                    id: photographer.id,
                    name: photographer.name,
                    avatar: photographer.avatar,
                    role: "photographer",
                  },
                  {
                    onSuccess: (conv) => navigate(`/messages?c=${conv.id}`),
                    onError: () =>
                      toast.error("Không thể mở tin nhắn, vui lòng thử lại"),
                  }
                )
              }
            >
              {startChat.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquare className="size-4" />
              )}
              Nhắn tin
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
