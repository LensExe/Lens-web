import { useMemo, useState } from "react";
import { Award, Bot, Percent } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DataGridColumnHeader,
  Skeleton,
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
import { StatCard } from "@/components/StatCard";
import { useQualityReport } from "@/queries/useQualityReport";
import { RANK_META } from "@/lib/status";
import { formatCount, formatPercent } from "@/lib/format";
import type { AdminQualityRow } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function Quality() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data, isLoading } = useQualityReport();
  const rows = data?.rows ?? [];
  const overview = data?.overview;
  const [sorting, setSorting] = useState<SortingState>([]);

  const topRanks = overview
    ? overview.rankBreakdown.gold + overview.rankBreakdown.diamond
    : 0;

  const columns = useMemo<ColumnDef<AdminQualityRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={r.avatar} alt={r.name} />
                <AvatarFallback>{initialsOf(r.name)}</AvatarFallback>
              </Avatar>
              <p className="font-medium leading-tight">{r.name}</p>
            </div>
          );
        },
        size: 240,
      },
      {
        accessorKey: "rank",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Hạng" />,
        cell: ({ row }) => {
          const meta = RANK_META[row.original.rank];
          return (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
              {meta.label}
            </span>
          );
        },
      },
      {
        accessorKey: "completedSessions",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Buổi hoàn thành" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatCount(row.original.completedSessions)}</span>
        ),
      },
      {
        accessorKey: "fiveStarPct",
        header: ({ column }) => <DataGridColumnHeader column={column} title="5★" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.fiveStarPct}%</span>
        ),
      },
      {
        accessorKey: "cancelRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tỷ lệ huỷ" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.cancelRate}%</span>
        ),
      },
      {
        accessorKey: "commissionRate",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Hoa hồng" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatPercent(row.original.commissionRate)}</span>
        ),
      },
      {
        accessorKey: "assistantEnabled",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trợ lý AI" />,
        cell: ({ row }) =>
          row.original.assistantEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Bot className="size-3" />
              Bật
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Tắt
            </span>
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
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Hạng & AI</h1>
        <p className="mt-1 text-muted-foreground">
          Phân bổ hạng, mức hoa hồng theo hạng và trạng thái trợ lý AI.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Percent} value={overview ? formatPercent(overview.avgCommission) : "…"} label="Hoa hồng trung bình" />
        <StatCard icon={Award} value={overview ? formatCount(topRanks) : "…"} label="Thợ hạng Vàng trở lên" />
        <StatCard icon={Bot} value={overview ? formatCount(overview.aiEnabledCount) : "…"} label="Thợ đang bật trợ lý AI" />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <DataTable table={table} recordCount={rows.length} />
      )}
    </div>
  );
}
