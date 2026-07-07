import { BadgeCheck, Lock, Percent, Sparkles, TrendingUp } from "lucide-react";
import { CountUp, Progress, Skeleton, cn } from "@lens/ui";
import { RankBadge } from "@/components/achievements/RankBadge";
import { RankLadderInfo } from "@/components/achievements/RankLadderInfo";
import { BADGES, rankProgress } from "@/lib/achievements";
import { useMyAchievements } from "@/queries/useAchievements";

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardAchievements() {
  const { data, isLoading, isError } = useMyAchievements();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-44 w-full rounded-3xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-16 text-center">
        <p className="text-muted-foreground">
          Không tải được thành tựu. Vui lòng thử lại.
        </p>
      </div>
    );
  }

  const progress = rankProgress(data.stats.completedSessions);

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Thành tựu
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cấp bậc, huy hiệu và quyền lợi của bạn trên Lens.
        </p>
      </header>

      {/* Current rank + progress to next */}
      <section className="mt-7 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <RankBadge rank={data.rank} />
          <RankLadderInfo currentRank={data.rank} />
          <span className="text-sm text-muted-foreground">
            <CountUp to={data.stats.completedSessions} /> buổi chụp đã hoàn thành
          </span>
        </div>

        {progress.next ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="size-4" />
                Còn{" "}
                <span className="font-semibold text-foreground">
                  {progress.remaining} buổi
                </span>{" "}
                để lên {progress.next.name}
              </span>
              <span className="text-muted-foreground">{progress.pct}%</span>
            </div>
            <Progress value={progress.pct} />
          </div>
        ) : (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-ember" />
            Bạn đã đạt cấp bậc cao nhất. Tuyệt vời!
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard value={`${data.stats.completedSessions}`} label="Buổi hoàn thành" />
        <StatCard value={`${data.stats.fiveStarPct}%`} label="Đánh giá 5 sao" />
        <StatCard value={`${data.stats.returningClients}`} label="Khách quay lại" />
        <StatCard value={`${data.stats.cancelRate}%`} label="Tỷ lệ huỷ" />
      </section>

      {/* Rank perks */}
      <section className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
        <h2 className="text-base font-semibold">Quyền lợi cấp bậc</h2>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          Càng hoàn thành nhiều buổi chụp chất lượng, bạn càng lên cấp cao hơn —
          giảm phí hoa hồng, được ưu tiên hiển thị và tạo niềm tin với khách hàng.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Percent className="size-4 text-muted-foreground" />
            Phí hoa hồng nền tảng:{" "}
            <span className="font-semibold">
              {Math.round(data.commissionRate * 100)}%
            </span>
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            Ưu tiên hiển thị trong tìm kiếm &amp; gợi ý
          </li>
        </ul>
      </section>

      {/* Specialty badges */}
      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold">Huy hiệu chuyên môn</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {BADGES.map((b) => {
            const earned = data.badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4",
                  earned
                    ? "border-border bg-card"
                    : "border-dashed border-border bg-transparent opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    earned
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {earned ? (
                    <BadgeCheck className="size-5" />
                  ) : (
                    <Lock className="size-4" />
                  )}
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
    </div>
  );
}
