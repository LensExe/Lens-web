import { useMemo, useState } from "react";
import { AlertTriangle, HardDrive, HardDriveDownload } from "lucide-react";
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
      <div className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-muted/55 via-card to-card p-5 shadow-sm sm:p-6">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                <HardDrive className="size-5" />
              </span>
              <span>Lưu trữ ảnh</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Theo dõi dung lượng, gói lưu trữ và cảnh báo quota của từng nhiếp ảnh gia trên nền tảng.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              Hệ thống đang theo dõi
            </span>
          }
        />
      </div>

      <div className="mb-7 grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1.3fr)]">
        <StatCard
          icon={HardDrive}
          value={overview ? formatBytes(overview.totalUsedBytes) : "…"}
          label="Tổng dung lượng nền tảng"
          hint={<span className="text-xs text-muted-foreground">Tổng dung lượng đang được sử dụng</span>}
          className="rounded-3xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={AlertTriangle}
          value={overview ? formatCount(overview.overQuotaCount) : "…"}
          label="Tài khoản vượt quota"
          hint={
            overview && overview.overQuotaCount > 0 ? (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Bộ sưu tập của họ đang bị khoá
              </span>
            ) : undefined
          }
          className={cn(
            "rounded-3xl border-border/70 shadow-sm",
            overview && overview.overQuotaCount > 0 && "border-rose-200/80 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5"
          )}
        />
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <HardDriveDownload className="size-4" />
                </span>
                Tỉ lệ gói lưu trữ
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Phân bổ số nhiếp ảnh gia theo từng gói dịch vụ.
              </p>
            </div>
            {overview && (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                {formatCount(PLANS.reduce((sum, plan) => sum + overview.planBreakdown[plan], 0))} thợ
              </span>
            )}
          </div>
          {overview ? (
            <SegmentedBar
              className="mt-5"
              segments={PLANS.map((p) => ({
                label: STORAGE_PLAN_META[p].label,
                value: overview.planBreakdown[p],
                color: STORAGE_PLAN_META[p].color,
              }))}
              format={(v) => `${v} thợ`}
            />
          ) : (
            <Skeleton className="mt-4 h-16" />
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Theo dõi theo nhiếp ảnh gia</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kiểm tra mức sử dụng và các tài khoản cần được xử lý.
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
