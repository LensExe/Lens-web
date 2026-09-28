import { useMemo, useState } from "react";
import { AlertTriangle, Award, Bot, Medal, Percent } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SegmentedBar,
  Skeleton,
  StatCard,
  TONE_CHIP,
  cn,
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
import { EmptyState } from "@/components/EmptyState";
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { NUM } from "@/components/data-table/columns";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useQualityReport } from "@/queries/useQualityReport";
import { RANK_META } from "@/lib/status";
import { formatCount, formatPercent } from "@/lib/format";
import type { AdminQualityRow, RankId } from "@/types";

/** Cancellations above this share of bookings are flagged (hurts ranking). */
const CANCEL_RATE_LIMIT = 5;
const RANKS: RankId[] = ["newbie", "bronze", "silver", "gold", "diamond"];

export function Quality() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data, isLoading } = useQualityReport();
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const overview = data?.overview;
  const [sorting, setSorting] = useState<SortingState>([]);

  const topRanks = overview ? overview.rankBreakdown.gold + overview.rankBreakdown.diamond : 0;
  const flagged = rows.filter((r) => r.cancelRate > CANCEL_RATE_LIMIT).length;
  const rankedPhotographers = overview
    ? RANKS.reduce((total, rank) => total + overview.rankBreakdown[rank], 0)
    : 0;

  const columns = useMemo<ColumnDef<AdminQualityRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => <UserCell name={row.original.name} avatar={row.original.avatar} />,
      },
      {
        accessorKey: "rank",
        header: ({ column }) => <ColumnHeader column={column} title="Hạng" />,
        sortingFn: (a, b) => RANKS.indexOf(a.original.rank) - RANKS.indexOf(b.original.rank),
        cell: ({ row }) => <StatusPill meta={RANK_META[row.original.rank]} icon={<Medal className="size-3" />} />,
      },
      {
        accessorKey: "completedSessions",
        header: ({ column }) => <ColumnHeader column={column} title="Buổi hoàn thành" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="text-sm font-medium tabular-nums">{formatCount(row.original.completedSessions)}</span>,
      },
      {
        accessorKey: "fiveStarPct",
        header: ({ column }) => <ColumnHeader column={column} title="Đánh giá 5★" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.fiveStarPct}%</span>,
      },
      {
        accessorKey: "cancelRate",
        header: ({ column }) => <ColumnHeader column={column} title="Tỷ lệ huỷ" align="right" />,
        meta: NUM,
        cell: ({ row }) => {
          const high = row.original.cancelRate > CANCEL_RATE_LIMIT;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-sm tabular-nums",
                high ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              )}
              title={high ? `Vượt ngưỡng ${CANCEL_RATE_LIMIT}%` : undefined}
            >
              {high && <AlertTriangle className="size-3.5" />}
              {row.original.cancelRate}%
            </span>
          );
        },
      },
      {
        accessorKey: "commissionRate",
        header: ({ column }) => <ColumnHeader column={column} title="Hoa hồng" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="text-sm font-medium tabular-nums">{formatPercent(row.original.commissionRate)}</span>,
      },
      {
        accessorKey: "assistantEnabled",
        header: ({ column }) => <ColumnHeader column={column} title="Trợ lý AI" />,
        cell: ({ row }) =>
          row.original.assistantEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              <Bot className="size-3" />
              Đang bật
            </span>
          ) : (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TONE_CHIP.neutral)}>Tắt</span>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
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
                <Award className="size-5" />
              </span>
              <span>Hạng &amp; AI</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Theo dõi phân bố cấp bậc, hoa hồng, tỷ lệ huỷ và mức độ sử dụng trợ lý AI của nhiếp ảnh gia.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <Bot className="size-3.5 text-lagoon" />
              {overview ? `${formatCount(overview.aiEnabledCount)} thợ đang dùng AI` : "Đang cập nhật"}
            </span>
          }
        />
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Percent}
          value={overview ? formatPercent(overview.avgCommission) : "…"}
          label="Hoa hồng trung bình"
          hint="Mức áp dụng trên toàn nền tảng"
          className="rounded-3xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={Award}
          value={overview ? formatCount(topRanks) : "…"}
          label="Thợ hạng Vàng trở lên"
          hint="Nhóm có cấp bậc nổi bật"
          className="rounded-3xl border-amber-200/70 shadow-sm dark:border-amber-500/20"
        />
        <StatCard
          icon={Bot}
          value={overview ? formatCount(overview.aiEnabledCount) : "…"}
          label="Thợ đang bật trợ lý AI"
          hint="Đang sử dụng công cụ hỗ trợ"
          className="rounded-3xl border-sky-200/70 shadow-sm dark:border-sky-500/20"
        />
        <StatCard
          icon={AlertTriangle}
          value={formatCount(flagged)}
          label={`Tỷ lệ huỷ vượt ${CANCEL_RATE_LIMIT}%`}
          hint={flagged > 0 ? "Cần theo dõi để bảo vệ thứ hạng" : "Chưa có tài khoản vượt ngưỡng"}
          className={cn(
            "rounded-3xl border-border/70 shadow-sm",
            flagged > 0 && "border-rose-200/80 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-500/5"
          )}
        />
      </div>

      <section className="mb-7 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Phân bố hạng</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng quan cấp bậc hiện tại của {formatCount(rankedPhotographers)} nhiếp ảnh gia.
            </p>
          </div>
          {overview && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
              {formatCount(rankedPhotographers)} hồ sơ
            </span>
          )}
        </div>
        {overview ? (
          <SegmentedBar
            className="mt-5"
            segments={RANKS.map((r) => ({
              label: RANK_META[r].label,
              value: overview.rankBreakdown[r],
              color: `var(--ordinal-${RANKS.indexOf(r) + 1})`,
            }))}
            format={(v) => `${v} thợ`}
          />
        ) : (
          <Skeleton className="mt-4 h-14" />
        )}
      </section>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Chi tiết chất lượng</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Xem chỉ số từng nhiếp ảnh gia để theo dõi chất lượng và thứ hạng.
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {formatCount(rows.length)} hồ sơ
        </span>
      </div>

      <DataTable
        table={table}
        recordCount={rows.length}
        isLoading={isLoading}
        className="rounded-3xl border-border/70 shadow-sm"
        empty={<EmptyState bare icon={Award} title="Chưa có nhiếp ảnh gia nào để xếp hạng" />}
      />
    </PageContainer>
  );
}
