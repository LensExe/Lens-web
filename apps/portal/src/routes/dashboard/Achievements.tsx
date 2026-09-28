import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Award,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Crown,
  Lock,
  Percent,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button, CountUp, PageContainer, PageHeader, Progress, Skeleton, cn } from "@lens/ui";
import { RankLadderInfo } from "@/components/achievements/RankLadderInfo";
import { BADGES, RANKS, rankById, rankProgress } from "@/lib/achievements";
import { useMyAchievements } from "@/queries/useAchievements";

/** Cancellations above this share of bookings hurt ranking (shown in rose). */
const CANCEL_RATE_LIMIT = 5;

function AchievementMetric({
  icon: Icon,
  value,
  label,
  hint,
  iconClassName,
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  hint?: string;
  iconClassName?: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-foreground transition-colors", iconClassName)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      </div>
      <div className="mt-4 min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">{label}</p>
        {hint && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function RankLadder({ sessions, currentRank }: { sessions: number; currentRank: string }) {
  const rankState = rankProgress(sessions);
  const nextRankId = rankState.next?.id;

  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-label="Các cấp bậc">
      {RANKS.map((rank, index) => {
        const reached = sessions >= rank.minSessions;
        const current = rank.id === currentRank;
        const next = rank.id === nextRankId;
        const commissionPct = Math.round(rank.commissionRate * 100);
        const remaining = Math.max(0, rank.minSessions - sessions);

        return (
          <li
            key={rank.id}
            aria-current={current ? "step" : undefined}
            className={cn(
              "min-w-0 rounded-2xl border p-3.5 transition-colors",
              current
                ? "border-orange-400 bg-orange-50/70 ring-1 ring-orange-200 dark:border-orange-800 dark:bg-orange-950/25 dark:ring-orange-950"
                : next
                  ? "border-dashed border-orange-300 bg-orange-50/30 dark:border-orange-900 dark:bg-orange-950/10"
                  : reached
                    ? "border-border bg-card"
                    : "border-border/70 bg-muted/20"
            )}
          >
            <div className="mb-2 flex h-5 items-center justify-center">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  current
                    ? "bg-orange-600 text-white"
                    : next
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200"
                      : reached
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                )}
              >
                {current
                  ? "Bạn đang ở đây"
                  : next
                    ? `Sắp đạt · còn ${remaining} buổi`
                    : reached
                      ? "Đã mở khóa"
                      : "Khóa"}
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-xl",
                  current
                    ? "bg-orange-500 text-white"
                    : next
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                      : reached
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : rank.className,
                  !reached && !next && "opacity-60"
                )}
              >
                {current || next ? (
                  <Award className="size-5" />
                ) : reached ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Lock className="size-4" />
                )}
                <span className="absolute -bottom-1.5 rounded-full border border-card bg-foreground px-1.5 py-0.5 text-[8px] font-bold leading-none text-background">
                  TIER {index + 1}
                </span>
              </span>
              <p className={cn("mt-3 truncate text-sm font-semibold", current && "text-orange-700 dark:text-orange-300")}>
                {rank.name}
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {rank.minSessions === 0 ? "0 buổi chụp" : `${rank.minSessions}+ buổi chụp`}
              </p>
              <p className={cn("mt-0.5 text-[10px] tabular-nums", current || next ? "font-medium text-orange-700 dark:text-orange-300" : "text-muted-foreground")}>
                {current
                  ? `Đã hoàn thành ${sessions} buổi`
                  : next
                    ? `Còn ${remaining} buổi để đạt mốc`
                    : reached
                      ? `Đã đạt mốc ${rank.minSessions} buổi`
                      : `Cần ${rank.minSessions} buổi để mở`}
              </p>
            </div>

            {next && (
              <Progress
                value={rankState.pct}
                className="mt-3 h-1.5"
                indicatorClassName="bg-orange-500"
              />
            )}

            <ul className="mt-3 space-y-2 border-t border-border/70 pt-3 text-[10px] leading-snug">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className={cn("mt-px size-3 shrink-0", reached || next ? "text-emerald-600" : "text-muted-foreground")} />
                <span>Hoa hồng nền tảng {commissionPct}%</span>
              </li>
              <li className="flex items-start gap-1.5 text-muted-foreground">
                <TrendingUp className="mt-px size-3 shrink-0 text-orange-600 dark:text-orange-400" />
                <span>Ưu tiên hiển thị theo cấp bậc</span>
              </li>
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

export function DashboardAchievements() {
  const { data, isLoading, isError } = useMyAchievements();

  if (isLoading) {
    return (
      <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="mt-5 h-80 rounded-2xl" />
        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-72 rounded-2xl" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="max-w-[1480px] py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Award className="size-6" />
          </span>
          <p className="mt-4 font-medium">Không tải được thành tựu</p>
          <p className="mt-1 text-sm text-muted-foreground">Vui lòng thử lại sau ít phút.</p>
        </div>
      </PageContainer>
    );
  }

  const sessions = data.stats.completedSessions;
  const tier = rankById(data.rank);
  const progress = rankProgress(sessions);
  const cancelHigh = data.stats.cancelRate > CANCEL_RATE_LIMIT;

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <Award className="size-[18px]" />
            </span>
            <span>Thành tựu &amp; cấp bậc nhiếp ảnh</span>
          </span>
        }
        description="Theo dõi hành trình phát triển, các quyền lợi và huy hiệu bạn đã mở khóa trên Lens."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <a href="#rank-ladder">
                <Target className="size-4" />
                Hành trình thăng hạng
              </a>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/dashboard/portfolio">
                <Sparkles className="size-4" />
                Hoàn thiện hồ sơ
              </Link>
            </Button>
          </>
        }
      />

      <div className="w-full">
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-ember/[0.06] via-card to-card p-4 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 -z-10 size-64 rounded-full bg-ember/[0.06] blur-3xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-10">
              <div className="flex items-center gap-4">
                <span className={cn("flex size-20 shrink-0 items-center justify-center rounded-2xl shadow-xs sm:size-24", tier.className)}>
                  <Crown className="size-9" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Cấp bậc hiện tại
                    <RankLadderInfo currentRank={data.rank} />
                  </p>
                  <p className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">{tier.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground"><CountUp to={sessions} /></span> buổi chụp đã hoàn thành
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/80 p-4 shadow-xs backdrop-blur-sm sm:p-5">
                {progress.next ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <TrendingUp className="size-4 text-ember" />
                          Mục tiêu tiếp theo
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Còn <span className="font-semibold text-foreground">{progress.remaining} buổi</span> để lên {progress.next.name}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold tabular-nums">{progress.pct}%</span>
                    </div>
                    <Progress value={progress.pct} className="mt-4 h-2.5" indicatorClassName="bg-ember" />
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-ember" />
                    Bạn đã đạt cấp bậc cao nhất. Tuyệt vời!
                  </p>
                )}
              </div>
            </div>
          </div>

        </section>

        <section id="rank-ladder" className="mt-5 scroll-mt-6 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-ember" />
                <h2 className="text-base font-semibold">Lộ trình phát triển 5 cấp bậc</h2>
                <RankLadderInfo currentRank={data.rank} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Hoàn thành buổi chụp để mở khóa cấp bậc và mức hoa hồng tương ứng.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              <TrendingUp className="size-3.5" />
              {progress.next
                ? `Tiến độ: Cấp ${RANKS.findIndex((rank) => rank.id === data.rank) + 1} / 5`
                : "Đã đạt cấp tối đa"}
            </span>
          </div>
          <RankLadder sessions={sessions} currentRank={data.rank} />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          <AchievementMetric icon={CalendarCheck} value={sessions} label="Buổi hoàn thành" hint="Tổng số buổi đã giao" />
          <AchievementMetric icon={Star} value={`${data.stats.fiveStarPct}%`} label="Đánh giá 5 sao" hint="Chất lượng trải nghiệm" iconClassName="text-amber-600 dark:text-amber-400" />
          <AchievementMetric icon={RefreshCw} value={data.stats.returningClients} label="Khách quay lại" hint="Khách đặt lịch lần nữa" iconClassName="text-lagoon" />
          <AchievementMetric
            icon={XCircle}
            value={`${String(data.stats.cancelRate).replace(".", ",")}%`}
            label="Tỷ lệ huỷ"
            hint={cancelHigh ? `Vượt ngưỡng ${CANCEL_RATE_LIMIT}%` : `Trong ngưỡng an toàn (≤ ${CANCEL_RATE_LIMIT}%)`}
            iconClassName={cancelHigh ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}
          />
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Quyền lợi đang mở khóa</h2>
                <p className="mt-1 text-sm text-muted-foreground">Các lợi ích áp dụng theo cấp bậc {tier.name}.</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lagoon/10 text-lagoon dark:bg-lagoon/15">
                <CheckCircle2 className="size-5" />
              </span>
            </div>
            <ul className="mt-4 divide-y divide-border/70 rounded-2xl border border-border/70 bg-muted/[0.08]">
              <li className="flex items-center gap-3 p-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><Percent className="size-4" /></span>
                <span className="min-w-0 text-sm">Phí hoa hồng nền tảng</span>
                <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums">{Math.round(data.commissionRate * 100)}%</span>
              </li>
              <li className="flex items-center gap-3 p-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><TrendingUp className="size-4" /></span>
                <span className="min-w-0 text-sm">Ưu tiên hiển thị trong tìm kiếm &amp; gợi ý</span>
                <CheckCircle2 className="ml-auto size-4 shrink-0 text-lagoon" />
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><Target className="size-4" /></span>
              <div>
                <h2 className="text-base font-semibold">Chỉ số đang theo dõi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tỷ lệ hủy nên duy trì trong ngưỡng an toàn ≤ {CANCEL_RATE_LIMIT}%.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-muted/45 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Tỷ lệ đánh giá 5 sao</p>
                  <p className="text-sm font-semibold tabular-nums">{data.stats.fiveStarPct}%</p>
                </div>
                <Progress
                  value={data.stats.fiveStarPct}
                  className="mt-2.5 h-1.5"
                  indicatorClassName="bg-emerald-500"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">Tỷ trọng đánh giá 5 sao từ khách hàng</p>
              </div>
              <div className={cn("rounded-xl p-3.5", cancelHigh ? "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300" : "bg-muted/45")}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Tỷ lệ hủy lịch</p>
                  <p className="text-sm font-semibold tabular-nums">{String(data.stats.cancelRate).replace(".", ",")}%</p>
                </div>
                <Progress
                  value={Math.min((data.stats.cancelRate / CANCEL_RATE_LIMIT) * 100, 100)}
                  className="mt-2.5 h-1.5"
                  indicatorClassName={cancelHigh ? "bg-rose-500" : "bg-emerald-500"}
                />
                <p className="mt-1.5 text-[11px] opacity-75">
                  {cancelHigh ? "Cần cải thiện để bảo vệ thứ hạng" : `Trong ngưỡng an toàn (≤ ${CANCEL_RATE_LIMIT}%)`}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Huy hiệu chuyên môn</h2>
              <p className="mt-1 text-sm text-muted-foreground">Những dấu mốc giúp khách hàng hiểu thế mạnh của bạn.</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
              {data.badges.length}/{BADGES.length} đã mở khóa
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((badge) => {
              const earned = data.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "flex min-w-0 items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    earned ? "border-lagoon/25 bg-lagoon/[0.04]" : "border-dashed border-border bg-muted/20 opacity-70"
                  )}
                >
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", earned ? "bg-lagoon/10 text-lagoon dark:bg-lagoon/15" : "bg-muted text-muted-foreground")}>
                    {earned ? <BadgeCheck className="size-5" /> : <Lock className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{badge.name}</p>
                      {earned && <span className="size-1.5 shrink-0 rounded-full bg-lagoon" />}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-4 rounded-2xl bg-foreground p-4 text-background shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/10 text-background">
              <Award className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Tiếp tục phát triển trên Lens</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-background/70">
                Cập nhật tác phẩm và gói dịch vụ để khách hiểu rõ phong cách chụp của bạn.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" className="shrink-0 rounded-full">
            <Link to="/dashboard/portfolio">
              Cập nhật hồ sơ <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </section>
      </div>
    </PageContainer>
  );
}
