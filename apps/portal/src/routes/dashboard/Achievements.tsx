import type { LucideIcon } from "lucide-react";
import {
  Award,
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
import { CountUp, PageContainer, PageHeader, Progress, Skeleton, cn } from "@lens/ui";
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
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background", iconClassName)}>
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
  return (
    <ol className="relative grid grid-cols-5 gap-1.5" aria-label="Các cấp bậc">
      <span className="pointer-events-none absolute left-[10%] right-[10%] top-4 h-px bg-border/80" />
      {RANKS.map((rank, index) => {
        const reached = sessions >= rank.minSessions;
        const current = rank.id === currentRank;
        return (
          <li key={rank.id} className="relative z-10 min-w-0 text-center" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "mx-auto flex size-9 items-center justify-center rounded-full border-4 border-card text-[10px] font-semibold shadow-sm",
                current ? "bg-ember text-white" : reached ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <p className={cn("mt-2 truncate text-[10px] sm:text-[11px]", current ? "font-semibold" : "text-muted-foreground")}>
              {rank.name}
            </p>
            <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground">{rank.minSessions}+ buổi</p>
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
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="mt-5 h-80 rounded-3xl" />
        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-72 rounded-3xl" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="max-w-[1480px] py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
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
      <div className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-muted/55 via-card to-card p-4 shadow-sm sm:p-6">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                <Award className="size-5" />
              </span>
              <span>Thành tựu</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Theo dõi cấp bậc, huy hiệu và những quyền lợi bạn mở khóa trên Lens.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <Sparkles className="size-3.5 text-ember" />
              Hành trình của bạn
            </span>
          }
        />
      </div>

      <div className="w-full">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-muted/70 via-card to-card p-4 sm:p-6 lg:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 -z-10 size-64 rounded-full bg-lagoon/10 blur-3xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-10">
              <div className="flex items-center gap-4">
                <span className={cn("flex size-20 shrink-0 items-center justify-center rounded-3xl shadow-sm sm:size-24", tier.className)}>
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

              <div className="rounded-2xl border border-border/80 bg-background/70 p-4 shadow-xs backdrop-blur-sm sm:p-5">
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

          <div className="border-t border-border/70 bg-muted/[0.08] px-4 py-4 sm:px-6 sm:py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Lộ trình phát triển</p>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="size-3.5" /> Hoàn thành càng nhiều, cấp càng cao
              </span>
            </div>
            <RankLadder sessions={sessions} currentRank={data.rank} />
          </div>
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
          <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
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

          <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><Target className="size-4" /></span>
              <div>
                <h2 className="text-base font-semibold">Điểm cần duy trì</h2>
                <p className="mt-1 text-sm text-muted-foreground">Giữ các chỉ số này ổn định để bảo vệ thứ hạng.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-muted/45 p-3.5">
                <p className="text-xs text-muted-foreground">Tỷ lệ đánh giá 5 sao</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{data.stats.fiveStarPct}%</p>
              </div>
              <div className={cn("rounded-2xl p-3.5", cancelHigh ? "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300" : "bg-muted/45")}>
                <p className="text-xs opacity-75">Tỷ lệ huỷ lịch</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{String(data.stats.cancelRate).replace(".", ",")}%</p>
                <p className="mt-0.5 text-[11px] opacity-75">{cancelHigh ? "Cần cải thiện để không ảnh hưởng xếp hạng" : "Đang ở mức an toàn"}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
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
                    "flex min-w-0 items-start gap-3 rounded-2xl border p-3.5 transition-colors",
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
      </div>
    </PageContainer>
  );
}
