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
    <PageContainer>
      <PageHeader title="Hạng & AI" description="Phân bố hạng, hoa hồng theo hạng, tỷ lệ huỷ và trạng thái trợ lý AI." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Percent} value={overview ? formatPercent(overview.avgCommission) : "…"} label="Hoa hồng trung bình" />
        <StatCard icon={Award} value={overview ? formatCount(topRanks) : "…"} label="Thợ hạng Vàng trở lên" />
        <StatCard icon={Bot} value={overview ? formatCount(overview.aiEnabledCount) : "…"} label="Thợ đang bật trợ lý AI" />
        <StatCard
          icon={AlertTriangle}
          value={formatCount(flagged)}
          label={`Tỷ lệ huỷ vượt ${CANCEL_RATE_LIMIT}%`}
        />
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Phân bố hạng</h2>
        {overview ? (
          <SegmentedBar
            className="mt-4"
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

      <DataTable
        table={table}
        recordCount={rows.length}
        isLoading={isLoading}
        empty={<EmptyState bare icon={Award} title="Chưa có nhiếp ảnh gia nào để xếp hạng" />}
      />
    </PageContainer>
  );
}
