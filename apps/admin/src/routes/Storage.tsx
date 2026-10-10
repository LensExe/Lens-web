import { HardDrive } from "lucide-react";
import { PageContainer, PageHeader, Skeleton } from "@lens/ui";
import { useStorageReport } from "@/queries/useStorage";
import { formatBytes, formatCount } from "@/lib/format";

export function Storage() {
  const { data, isLoading, isError } = useStorageReport();

  return (
    <PageContainer>
      <PageHeader title="Dung lượng lưu trữ" description="Dung lượng media và quota hiện tại của nhiếp ảnh gia." />
      {isError && (
        <p role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
          Không tải được báo cáo dung lượng từ backend.
        </p>
      )}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Đã sử dụng" value={formatBytes(data.overview.totalUsedBytes)} />
            <Metric label="Vượt quota" value={formatCount(data.overview.overQuotaCount)} />
            <Metric label="Nhiếp ảnh gia" value={formatCount(data.total)} />
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            {data.rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Nhiếp ảnh gia</th>
                      <th className="px-5 py-3 font-medium">Gói</th>
                      <th className="px-5 py-3 font-medium">Đã dùng</th>
                      <th className="px-5 py-3 font-medium">Quota</th>
                      <th className="px-5 py-3 font-medium">Portfolio</th>
                      <th className="px-5 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {data.rows.map((row) => (
                      <tr key={row.photographerId}>
                        <td className="px-5 py-4">
                          <p className="font-medium">{row.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.email}</p>
                        </td>
                        <td className="px-5 py-4 capitalize">{row.planCode}</td>
                        <td className="px-5 py-4 tabular-nums">{formatBytes(row.usedBytes)}</td>
                        <td className="px-5 py-4 tabular-nums">{row.quotaBytes === null ? "Không giới hạn" : formatBytes(row.quotaBytes)}</td>
                        <td className="px-5 py-4 tabular-nums">{formatCount(row.galleryCount)}</td>
                        <td className="px-5 py-4">
                          <span className={row.overQuota
                            ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            : "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"}>
                            {row.overQuota ? "Vượt quota" : "Trong quota"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <HardDrive className="size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Chưa có dữ liệu lưu trữ</p>
                <p className="mt-1 text-sm text-muted-foreground">Báo cáo sẽ xuất hiện khi có tài khoản nhiếp ảnh gia.</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
