import {
  Award,
  BadgeCheck,
  CalendarCheck,
  Lock,
  Percent,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  CountUp,
  PageContainer,
  PageHeader,
  Progress,
  Skeleton,
  StatCard,
  cn,
} from "@lens/ui";
import { RankLadderInfo } from "@/components/achievements/RankLadderInfo";
import { BADGES, RANKS, rankById, rankProgress } from "@/lib/achievements";
import { useMyAchievements } from "@/queries/useAchievements";

/** Cancellations above this share of bookings hurt ranking (shown in rose). */
const CANCEL_RATE_LIMIT = 5;

export function DashboardAchievements() {
  const { data, isLoading, isError } = useMyAchievements();

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-52 w-full rounded-3xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="py-16 text-center">
        <p className="text-muted-foreground">Không tải được thành tựu. Vui lòng thử lại.</p>
      </PageContainer>
    );
  }

  const sessions = data.stats.completedSessions;
  const tier = rankById(data.rank);
  const progress = rankProgress(sessions);
  const cancelHigh = data.stats.cancelRate > CANCEL_RATE_LIMIT;

  return (
    <PageContainer>
      <PageHeader title="Thành tựu" description="Cấp bậc, huy hiệu và quyền lợi của bạn trên Lens." />

      {/* Current rank + the ladder */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="grid gap-8 p-6 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
          <div className="flex items-center gap-4">
            <span className={cn("flex size-16 shrink-0 items-center justify-center rounded-2xl", tier.className)}>
              <Award className="size-8" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                Cấp bậc hiện tại
                <RankLadderInfo currentRank={data.rank} />
              </p>
              <p className="text-2xl font-semibold tracking-tight">{tier.name}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  <CountUp to={sessions} />
                </span>{" "}
                buổi chụp đã hoàn thành
              </p>
            </div>
          </div>

          <div>
            {progress.next ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="size-4" />
                    Còn <span className="font-semibold text-foreground">{progress.remaining} buổi</span>{" "}
                    để lên {progress.next.name}
                  </span>
                  <span className="font-medium tabular-nums">{progress.pct}%</span>
                </div>
                <Progress value={progress.pct} className="h-2.5" indicatorClassName="bg-ember" />
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-foreground" />
                Bạn đã đạt cấp bậc cao nhất. Tuyệt vời!
              </p>
            )}

            <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Các cấp bậc">
              {RANKS.map((r) => {
                const reached = sessions >= r.minSessions;
                return (
                  <li key={r.id} className="min-w-0" aria-current={r.id === tier.id ? "step" : undefined}>
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        r.id === tier.id ? "bg-ember" : reached ? "bg-foreground" : "bg-muted"
                      )}
                    />
                    <p
                      className={cn(
                        "mt-1.5 truncate text-[11px]",
                        r.id === tier.id ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {r.name}
                    </p>
                    <p className="text-[10px] tabular-nums text-muted-foreground">{r.minSessions}+ buổi</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} value={sessions} label="Buổi hoàn thành" />
        <StatCard icon={Star} value={`${data.stats.fiveStarPct}%`} label="Đánh giá 5 sao" />
        <StatCard icon={RefreshCw} value={data.stats.returningClients} label="Khách quay lại" />
        <StatCard
          icon={XCircle}
          value={`${String(data.stats.cancelRate).replace(".", ",")}%`}
          label="Tỷ lệ huỷ"
          hint={
            <span className={cn("text-xs", cancelHigh ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {cancelHigh ? `Vượt ngưỡng ${CANCEL_RATE_LIMIT}% — ảnh hưởng xếp hạng` : `Trong ngưỡng an toàn (≤ ${CANCEL_RATE_LIMIT}%)`}
            </span>
          }
        />
      </section>

      {/* Rank perks */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Quyền lợi cấp bậc</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Càng hoàn thành nhiều buổi chụp chất lượng, bạn càng lên cấp cao hơn — giảm phí hoa
          hồng, được ưu tiên hiển thị và tạo niềm tin với khách hàng.
        </p>
        <ul className="grid gap-3 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
              <Percent className="size-4" />
            </span>
            <span>
              Phí hoa hồng nền tảng:{" "}
              <span className="font-semibold">{Math.round(data.commissionRate * 100)}%</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
              <TrendingUp className="size-4" />
            </span>
            Ưu tiên hiển thị trong tìm kiếm &amp; gợi ý
          </li>
        </ul>
      </section>

      {/* Specialty badges */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">
          Huy hiệu chuyên môn{" "}
          <span className="font-normal text-muted-foreground">
            ({data.badges.length}/{BADGES.length})
          </span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BADGES.map((b) => {
            const earned = data.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4",
                  earned ? "border-border bg-card" : "border-dashed border-border bg-transparent opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    earned ? "bg-lagoon/10 text-lagoon dark:bg-lagoon/15" : "bg-muted text-muted-foreground"
                  )}
                >
                  {earned ? <BadgeCheck className="size-5" /> : <Lock className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}
