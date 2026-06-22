import { Award, ImageOff, MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Skeleton, formatPrice } from "@lens/ui";
import { useMyPhotographerProfile } from "@/queries/useDashboard";
import { currentUser } from "@/lib/session";

export function DashboardPortfolio() {
  const { data: profile, isLoading } = useMyPhotographerProfile();

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="mt-6 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {[200, 260, 180, 240, 200, 280].map((h, i) => (
            <Skeleton key={i} style={{ height: h }} className="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Hồ sơ năng lực
        </h1>
        <p className="mt-1 text-muted-foreground">
          Thông tin và tác phẩm khách hàng nhìn thấy.
        </p>
      </header>

      {/* Profile summary */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{profile.rating.toFixed(1)}</span>
                ({profile.reviewCount} đánh giá)
              </span>
              <span className="flex items-center gap-1">
                <Award className="size-3.5" />
                {profile.experienceYears} năm kinh nghiệm
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.styles.map((style) => (
                <span
                  key={style}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-sm text-muted-foreground">Giá khởi điểm</p>
            <p className="text-lg font-semibold">{formatPrice(profile.pricePerSession)}</p>
          </div>
        </div>
        <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      </section>

      {/* Portfolio grid */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Tác phẩm
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {profile.portfolio.length} ảnh
            </span>
          </h2>
        </div>
        {profile.portfolio.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ImageOff className="size-6" />
            </span>
            <p className="font-medium">Chưa có tác phẩm nào</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Thêm ảnh vào hồ sơ để khách hàng thấy được phong cách của bạn.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {profile.portfolio.map((src, i) => (
              <div
                key={i}
                className="group overflow-hidden rounded-2xl border border-border break-inside-avoid"
              >
                <img
                  src={src}
                  alt={`Tác phẩm ${i + 1} của ${profile.name}`}
                  loading="lazy"
                  style={{ aspectRatio: ["4 / 5", "1 / 1", "3 / 4", "5 / 7"][i % 4] }}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
