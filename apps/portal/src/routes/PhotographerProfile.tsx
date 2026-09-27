import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, MapPin } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Skeleton,
  cn,
  formatPrice,
  StatusTabs,
} from "@lens/ui";
import { usePhotographer } from "@/queries/usePhotographers";
import { useAchievements } from "@/queries/useAchievements";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { experienceLabel } from "@/lib/photographer-filters";
import { sessionUser } from "@/lib/session";
import { RankBadge } from "@/components/achievements/RankBadge";
import { RankLadderInfo } from "@/components/achievements/RankLadderInfo";
import { BookButton } from "@/components/profile/BookButton";
import { MessageButton } from "@/components/profile/MessageButton";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileBookingCard } from "@/components/profile/ProfileBookingCard";
import { PortfolioGallery } from "@/components/profile/PortfolioGallery";
import { AboutPanel } from "@/components/profile/AboutPanel";
import { ReviewsPanel } from "@/components/profile/ReviewsPanel";

type Tab = "works" | "about" | "reviews";
const TABS: Tab[] = ["works", "about", "reviews"];
const isTab = (v: string | null): v is Tab => TABS.includes(v as Tab);

const HEADER_H = 64; // PublicLayout's sticky header (h-16)

// Photographers don't browse — their way back is the studio.
const back =
  sessionUser?.role === "photographer"
    ? { to: "/dashboard", label: "Về Studio" }
    : { to: "/", label: "Nhiếp ảnh gia" };

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-6 md:px-8">
      <Skeleton className="h-56 w-full rounded-3xl md:h-72" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="h-36 w-full rounded-3xl" />
      </div>
    </div>
  );
}

// Public photographer profile. Layout: cover → identity + actions → trust
// panel → sticky tabs (Tác phẩm · Giới thiệu · Đánh giá). The portfolio gets
// the full width like a Pinterest wall; reviews live in their own tab so they
// stay one click away however long the gallery is. No fixed side card — a
// compact "Đặt lịch" appears in the tab bar once the header CTA scrolls away.
export function PhotographerProfile() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: photographer, isLoading, isError } = usePhotographer(id);
  const { data: achievements } = useAchievements(id);
  const scopeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const tabsAnchorRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  const tabParam = searchParams.get("tab");
  const tab: Tab = isTab(tabParam) ? tabParam : "works";
  const canBook = !sessionUser || sessionUser.role === "client";

  useScrollReveal(scopeRef, [photographer?.id]);

  // Show the compact tab-bar CTA only once the header CTA has scrolled away.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      rootMargin: `-${HEADER_H}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [photographer?.id]);

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "works") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true, preventScrollReset: true });
    // If the reader is deep in the gallery, bring the new tab's top into view.
    const anchor = tabsAnchorRef.current;
    if (anchor) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - HEADER_H;
      if (window.scrollY > top) window.scrollTo({ top });
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !photographer) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[1280px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy nhiếp ảnh gia</h1>
        <p className="mt-2 text-muted-foreground">
          Hồ sơ bạn tìm không tồn tại hoặc đã bị gỡ.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to={back.to}>
            <ArrowLeft className="size-4" />
            {sessionUser?.role === "photographer" ? "Về Studio" : "Về danh sách"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div ref={scopeRef} className="mx-auto max-w-[1280px] px-5 pb-28 pt-6 md:px-8 lg:pb-16">
      <Link
        to={back.to}
        className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {back.label}
      </Link>

      {/* Cover banner */}
      <div data-reveal className="overflow-hidden rounded-3xl bg-muted">
        <img
          src={photographer.cover}
          alt={`Ảnh bìa của ${photographer.name}`}
          className="h-44 w-full object-cover sm:h-60 md:h-72"
        />
      </div>

      {/* Identity + trust numbers (left) · booking card (right) */}
      <div
        data-reveal
        className="grid gap-8 px-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"
      >
        <div className="min-w-0">
          <Avatar className="-mt-14 size-28 rounded-full bg-background ring-4 ring-background md:-mt-16 md:size-32">
            <AvatarImage src={photographer.avatar} alt={photographer.name} />
            <AvatarFallback>{initialsOf(photographer.name)}</AvatarFallback>
          </Avatar>
          <h1 className="mt-4 flex flex-wrap items-center gap-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {photographer.name}
            {photographer.featured && (
              <span title="Đã được Lens xác minh" className="inline-flex">
                <BadgeCheck className="size-6 text-foreground" aria-label="Đã được Lens xác minh" />
              </span>
            )}
            {achievements && (
              <span className="inline-flex items-center gap-1">
                <RankBadge rank={achievements.rank} />
                <RankLadderInfo currentRank={achievements.rank} />
              </span>
            )}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {photographer.city}
            </span>
            <span>{experienceLabel(photographer.experienceYears)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {photographer.styles.map((style) => (
              <Badge key={style} variant="secondary" className="rounded-full px-3 py-1">
                {style}
              </Badge>
            ))}
          </div>

          {achievements && (
            <div className="mt-7 border-t border-border pt-6">
              <ProfileStats
                rating={photographer.rating}
                reviewCount={photographer.reviewCount}
                stats={achievements.stats}
              />
            </div>
          )}
        </div>

        {/* Booking card — phones use the bottom action bar instead */}
        <div ref={ctaRef} className="hidden md:block lg:pt-6">
          <ProfileBookingCard photographer={photographer} />
        </div>
      </div>

      {/* Sticky tabs */}
      <div ref={tabsAnchorRef} className="mt-8" />
      <div className="sticky top-16 z-30 -mx-5 bg-background/90 px-5 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex items-center gap-4">
          <StatusTabs
            className="flex-1"
            value={tab}
            onChange={selectTab}
            tabs={[
              { value: "works", label: "Tác phẩm", count: photographer.portfolio.length },
              { value: "about", label: "Giới thiệu" },
              { value: "reviews", label: "Đánh giá", count: photographer.reviewCount },
            ]}
          />
          {canBook && (
            <div
              aria-hidden={ctaVisible}
              className={cn(
                "hidden shrink-0 transition-opacity duration-200 lg:block",
                ctaVisible ? "pointer-events-none opacity-0" : "opacity-100"
              )}
            >
              <BookButton photographerId={photographer.id} size="default" className="h-9" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {tab === "works" && (
          <PortfolioGallery photos={photographer.portfolio} name={photographer.name} />
        )}
        {tab === "about" && (
          <AboutPanel photographer={photographer} badges={achievements?.badges ?? []} />
        )}
        {tab === "reviews" && <ReviewsPanel photographerId={photographer.id} />}
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2">
          <div className="mr-auto min-w-0">
            <p className="text-xs text-muted-foreground">Giá từ</p>
            <p className="truncate font-semibold">{formatPrice(photographer.pricePerSession)}</p>
          </div>
          <MessageButton
            participant={{
              id: photographer.id,
              name: photographer.name,
              avatar: photographer.avatar,
              role: "photographer",
            }}
            className="h-10 px-3"
          />
          <BookButton photographerId={photographer.id} size="default" className="h-10" />
        </div>
      </div>
    </div>
  );
}
