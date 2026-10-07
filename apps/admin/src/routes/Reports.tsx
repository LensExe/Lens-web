import { Flag } from "lucide-react";
import { PageContainer, PageHeader, Skeleton } from "@lens/ui";
import { useReports } from "@/queries/useReports";
import { formatDate } from "@/lib/format";

const statusLabel: Record<string, string> = {
  open: "Mới gửi",
  resolved: "Đã xử lý",
  rejected: "Không vi phạm",
  escalated: "Chuyển cấp xử lý",
};

export function Reports() {
  const { data = [], isLoading, isError } = useReports();

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader title="Báo cáo vi phạm" description="Danh sách báo cáo người dùng gửi lên Lens từ backend." />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
        Backend chưa có API thống kê doanh thu theo tháng, lượt đặt theo phong cách/khu vực hoặc hoạt động gần đây. Trang này hiển thị hàng đợi moderation `/admin/reports`.
      </div>
      {isError && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Không tải được báo cáo từ backend.</p>}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((key) => <Skeleton key={key} className="h-28 rounded-2xl" />)}</div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Backend không có báo cáo vi phạm nào.</div>
      ) : (
        <div className="space-y-3">
          {data.map((report) => (
            <article key={report.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted"><Flag className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{report.targetType || "Đối tượng"} · {report.targetId || "—"}</h2>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{statusLabel[report.status] ?? report.status}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report.reason || "Không có mô tả"}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDate(report.createdAt)} · Mã {report.id}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
