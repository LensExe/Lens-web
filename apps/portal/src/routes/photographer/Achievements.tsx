import { Award, BadgeCheck } from "lucide-react";
import { PageContainer, PageHeader, Skeleton } from "@lens/ui";
import { RankBadge } from "@/components/achievements/RankBadge";
import { useMyAchievements } from "@/queries/useAchievements";

export function PhotographerAchievements() {
  const { data, isLoading, isError } = useMyAchievements();
  if (isLoading) return <PageContainer><Skeleton className="h-24 rounded-2xl" /><Skeleton className="mt-5 h-56 rounded-2xl" /></PageContainer>;
  if (isError || !data) return <PageContainer className="py-12"><p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Không tải được cấp bậc và danh hiệu từ backend.</p></PageContainer>;

  const earned = new Set(data.badges);
  const badges = data.badgeCatalog ?? [];
  return (
    <PageContainer className="max-w-[1100px] py-6 md:py-8">
      <PageHeader title={<span className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember"><Award className="size-[18px]" /></span>Thành tựu & cấp bậc</span>} description="Cấp bậc và danh hiệu được tải từ lens-backend." />
      <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-7">
        <h2 className="text-sm font-semibold text-muted-foreground">Cấp bậc hiện tại</h2>
        <div className="mt-3 flex items-center gap-3"><RankBadge rank={data.rank} /><p className="text-lg font-semibold">{data.rankName || data.rank}</p></div>
        <p className="mt-3 text-sm text-muted-foreground">Hoa hồng hiện tại: {Math.round(data.commissionRate * 100)}%.</p>
        <p className="mt-2 text-xs text-muted-foreground">Backend chưa cung cấp số booking hoàn thành, tỷ lệ hủy và tiến độ lên cấp.</p>
      </section>
      <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-7">
        <h2 className="text-lg font-semibold">Danh hiệu</h2>
        {badges.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Backend chưa có danh mục danh hiệu.</p> : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => <li key={badge.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2"><BadgeCheck className={earned.has(badge.id) ? "size-4 text-lagoon" : "size-4 text-muted-foreground"} /><p className="font-medium">{badge.name}</p></div>
              <p className="mt-2 text-sm text-muted-foreground">{badge.description || ""}</p>
              <p className="mt-2 text-xs font-medium">{earned.has(badge.id) ? "Đã đạt" : "Chưa đạt"}</p>
            </li>)}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
