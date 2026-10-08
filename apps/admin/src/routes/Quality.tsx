import { Award, Bot } from "lucide-react";
import { PageContainer, PageHeader, Skeleton } from "@lens/ui";
import { useQualityReport } from "@/queries/useQualityReport";

export function Quality() {
  const { data, isLoading, isError } = useQualityReport();

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader
        title="Hạng & huy hiệu"
        description="Danh mục cấu hình cấp bậc và huy hiệu hiện có trên backend."
      />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        Backend hiện cung cấp cấu hình hạng và huy hiệu; chưa có báo cáo số liệu hủy, hoa hồng thực tế theo nhiếp ảnh gia hoặc cấu hình trợ lý AI.
      </div>
      {isError && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Không tải được danh mục từ backend.</p>}
      {isLoading ? (
        <div className="space-y-5"><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted"><Award className="size-5" /></span>
              <div><h2 className="font-semibold">Cấp bậc</h2><p className="text-sm text-muted-foreground">Ngưỡng số buổi hoàn thành và tỷ lệ hoa hồng cấu hình.</p></div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Tên hạng</th><th className="px-5 py-3 text-right">Buổi hoàn thành</th><th className="px-5 py-3 text-right">Hoa hồng</th></tr></thead>
                <tbody className="divide-y divide-border">{(data?.ranks ?? []).map((rank) => <tr key={rank.id}><td className="px-5 py-4 font-mono text-xs">{rank.code}</td><td className="px-5 py-4 font-medium">{rank.name}</td><td className="px-5 py-4 text-right tabular-nums">{rank.minCompleted}</td><td className="px-5 py-4 text-right tabular-nums">{rank.commissionPercent}%</td></tr>)}</tbody>
              </table>
            </div>
          </section>
          <section className="overflow-hidden rounded-3xl border border-border bg-card">
            <header className="flex items-center gap-3 border-b border-border p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-muted"><Bot className="size-5" /></span>
              <div><h2 className="font-semibold">Huy hiệu</h2><p className="text-sm text-muted-foreground">Điều kiện và trạng thái kích hoạt.</p></div>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Huy hiệu</th><th className="px-5 py-3">Chỉ số</th><th className="px-5 py-3 text-right">Ngưỡng</th><th className="px-5 py-3 text-right">Đánh giá tối thiểu</th><th className="px-5 py-3">Trạng thái</th></tr></thead>
                <tbody className="divide-y divide-border">{(data?.badges ?? []).map((badge) => <tr key={badge.id}><td className="px-5 py-4"><p className="font-medium">{badge.name}</p><p className="font-mono text-xs text-muted-foreground">{badge.code}</p><p className="mt-1 text-xs text-muted-foreground">{badge.description}</p></td><td className="px-5 py-4">{badge.metric}</td><td className="px-5 py-4 text-right tabular-nums">{badge.minimumValue}</td><td className="px-5 py-4 text-right tabular-nums">{badge.minimumReviews}</td><td className="px-5 py-4">{badge.active ? "Đang bật" : "Đã tắt"}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
