import { useMemo, useState } from "react";
import {
  AlertTriangle,
  HardDrive,
  HardDriveDownload,
  Images,
  ShieldAlert,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  Progress,
  SegmentedBar,
  Skeleton,
  StatCard,
  TONE_CHIP,
  TONE_FILL,
  cn,
  type Tone,
} from "@lens/ui";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { NUM } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useStorageReport } from "@/queries/useStorageReport";
import { STORAGE_PLAN_META } from "@/lib/status";
import { formatBytes, formatCount } from "@/lib/format";
import type { AdminStorageRow, StoragePlanTier } from "@/types";

type Filter = "all" | "near" | "over";

const usagePct = (r: AdminStorageRow) => (r.usedBytes / r.quotaBytes) * 100;
// Calm until close to the quota.
const usageTone = (pct: number): Tone => (pct > 100 ? "rose" : pct >= 70 ? "amber" : "neutral");
const PLANS: StoragePlanTier[] = ["free", "pro", "studio"];

export function Storage() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data, isLoading } = useStorageReport();
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const overview = data?.overview;
  const totalGalleries = rows.reduce((sum, row) => sum + row.galleryCount, 0);
  const totalQuotaBytes = rows.reduce((sum, row) => sum + row.quotaBytes, 0);
  const totalUsagePct = totalQuotaBytes
    ? Math.round(((overview?.totalUsedBytes ?? 0) / totalQuotaBytes) * 100)
    : 0;
  const [filter, setFilter] = useState<Filter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const near = rows.filter((r) => !r.overQuota && usagePct(r) >= 70);
  const visible = useMemo(
    () =>
      filter === "over"
        ? rows.filter((r) => r.overQuota)
        : filter === "near"
          ? rows.filter((r) => !r.overQuota && usagePct(r) >= 70)
          : rows,
    [rows, filter]
  );

  const columns = useMemo<ColumnDef<AdminStorageRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => <UserCell name={row.original.name} avatar={row.original.avatar} />,
      },
      {
        accessorKey: "plan",
        header: ({ column }) => <ColumnHeader column={column} title="Gói" />,
        cell: ({ row }) => <StatusPill meta={STORAGE_PLAN_META[row.original.plan]} dot={false} />,
      },
      {
        accessorKey: "usedBytes",
        header: ({ column }) => <ColumnHeader column={column} title="Dung lượng" />,
        cell: ({ row }) => {
          const r = row.original;
          const pct = usagePct(r);
          const tone = usageTone(pct);
          return (
            <div className="w-48">
              <div className="flex justify-between text-xs tabular-nums">
                <span className={cn("font-medium", tone === "rose" && "text-rose-600 dark:text-rose-400")}>
                  {formatBytes(r.usedBytes)}
                </span>
                <span className="text-muted-foreground">
                  {formatBytes(r.quotaBytes)} · {Math.round(pct)}%
                </span>
              </div>
              <Progress value={Math.min(100, pct)} className="mt-1.5 h-1.5" indicatorClassName={TONE_FILL[tone]} />
            </div>
          );
        },
      },
      {
        accessorKey: "galleryCount",
        header: ({ column }) => <ColumnHeader column={column} title="Bộ sưu tập" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="text-sm font-medium tabular-nums">{formatCount(row.original.galleryCount)}</span>,
      },
      {
        id: "health",
        header: ({ column }) => <ColumnHeader column={column} title="Tình trạng" />,
        accessorFn: (r) => usagePct(r),
        cell: ({ row }) => {
          const tone = usageTone(usagePct(row.original));
          const label = tone === "rose" ? "Vượt quota" : tone === "amber" ? "Gần đầy" : "Bình thường";
          return <StatusPill meta={{ label, className: TONE_CHIP[tone] }} />;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: visible,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    getRowId: (row) => row.photographerId,
  });

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <div className="mb-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
                <HardDrive className="size-[18px]" />
              </span>
              <span>Lưu trữ &amp; tài nguyên</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Theo dõi dung lượng ảnh, gói lưu trữ và tài khoản cần hỗ trợ trên toàn nền tảng.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              Giám sát tài nguyên
            </span>
          }
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HardDrive}
          value={overview ? formatBytes(overview.totalUsedBytes) : "…"}
          label="Dung lượng đang dùng"
          hint={<span className="text-xs text-muted-foreground">{isLoading ? "Đang tải tài khoản" : `${formatCount(rows.length)} tài khoản nhiếp ảnh`}</span>}
          className="rounded-2xl border-border/80 shadow-xs"
        />
        <StatCard
          icon={Images}
          value={formatCount(totalGalleries)}
          label="Bộ sưu tập"
          hint={<span className="text-xs text-muted-foreground">Tổng thư viện của nhiếp ảnh gia</span>}
          className="rounded-2xl border-border/80 shadow-xs"
        />
        <StatCard
          icon={HardDriveDownload}
          value={`${totalUsagePct}%`}
          label="Tỉ lệ dung lượng"
          hint={<span className="text-xs text-muted-foreground">Trên quota cộng dồn hiện tại</span>}
          className="rounded-2xl border-border/80 shadow-xs"
        />
        <StatCard
          icon={AlertTriangle}
          value={overview ? formatCount(overview.overQuotaCount) : "…"}
          label="Tài khoản vượt quota"
          hint={
            overview?.overQuotaCount ? (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Thư viện đang bị khoá</span>
            ) : (
              <span className="text-xs text-muted-foreground">Không có tài khoản vượt giới hạn</span>
            )
          }
          className={cn(
            "rounded-2xl border-border/80 shadow-xs",
            overview?.overQuotaCount && "border-rose-200/80 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/5"
          )}
        />
      </div>

      {overview?.overQuotaCount ? (
        <section className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 dark:border-rose-500/20 dark:bg-rose-500/[0.06]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            <ShieldAlert className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
              {formatCount(overview.overQuotaCount)} tài khoản đang vượt dung lượng cho phép
            </p>
            <p className="mt-1 text-xs leading-relaxed text-rose-800/80 dark:text-rose-200/70">
              Bộ sưu tập bị khóa theo giới hạn gói. Kiểm tra danh sách bên dưới để xem mức dùng và gói hiện tại.
            </p>
          </div>
        </section>
      ) : null}

      <section className="mb-6 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
              <HardDriveDownload className="size-4 text-ember" /> Phân bổ gói lưu trữ
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Tỉ lệ nhiếp ảnh gia đang sử dụng từng gói.</p>
          </div>
          {overview && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
              {formatCount(PLANS.reduce((sum, plan) => sum + overview.planBreakdown[plan], 0))} tài khoản
            </span>
          )}
        </div>
        {overview ? (
          <>
            <SegmentedBar
              className="mt-4"
              segments={PLANS.map((plan) => ({
                label: STORAGE_PLAN_META[plan].label,
                value: overview.planBreakdown[plan],
                color: STORAGE_PLAN_META[plan].color,
              }))}
              format={(value) => `${value} tài khoản`}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div key={plan} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/[0.12] px-3 py-2.5">
                  <StatusPill meta={STORAGE_PLAN_META[plan]} dot={false} />
                  <span className="text-sm font-semibold tabular-nums">{formatCount(overview.planBreakdown[plan])}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Skeleton className="mt-4 h-24 rounded-xl" />
        )}
      </section>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">Bộ sưu tập theo nhiếp ảnh gia</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kiểm tra mức sử dụng, quota và trạng thái từng tài khoản.
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {formatCount(visible.length)} kết quả
        </span>
      </div>

      <DataTable
        table={table}
        recordCount={visible.length}
        isLoading={isLoading}
        tabs={{ value: filter, onChange: setFilter, items: [
          { value: "all", label: "Tất cả", count: rows.length },
          { value: "over", label: "Vượt quota", count: rows.filter((r) => r.overQuota).length },
          { value: "near", label: "Gần đầy (≥ 70%)", count: near.length },
        ] }}
        empty={<EmptyState bare icon={HardDrive} title="Không có tài khoản nào ở mục này" />}
      />
    </PageContainer>
  );
}
