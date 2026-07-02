import { useMemo, useState } from "react";
import { AlertTriangle, HardDrive, Layers } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DataGridColumnHeader,
  Progress,
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
import { useStorageReport } from "@/queries/useStorageReport";
import { STORAGE_PLAN_META } from "@/lib/status";
import { formatBytes, formatCount } from "@/lib/format";
import type { AdminStorageRow } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function Storage() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data, isLoading } = useStorageReport();
  const rows = data?.rows ?? [];
  const overview = data?.overview;
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<AdminStorageRow>[]>(
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
        accessorKey: "plan",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Gói" />,
        cell: ({ row }) => {
          const meta = STORAGE_PLAN_META[row.original.plan];
          return (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
              {meta.label}
            </span>
          );
        },
      },
      {
        accessorKey: "usedBytes",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Dung lượng" />,
        cell: ({ row }) => {
          const r = row.original;
          const pct = Math.min(100, Math.round((r.usedBytes / r.quotaBytes) * 100));
          return (
            <div className="w-44">
              <div className="flex justify-between text-xs">
                <span className={cn(r.overQuota && "font-medium text-rose-600 dark:text-rose-400")}>
                  {formatBytes(r.usedBytes)}
                </span>
                <span className="text-muted-foreground">{formatBytes(r.quotaBytes)}</span>
              </div>
              <Progress value={pct} className="mt-1.5 h-1.5" />
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "galleryCount",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Số gallery" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatCount(row.original.galleryCount)}</span>
        ),
      },
      {
        accessorKey: "overQuota",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tình trạng" />,
        cell: ({ row }) =>
          row.original.overQuota ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-400">
              <AlertTriangle className="size-3" />
              Vượt quota
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Bình thường</span>
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
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Lưu trữ ảnh</h1>
        <p className="mt-1 text-muted-foreground">
          Dung lượng, gói dịch vụ và cảnh báo vượt quota theo nhiếp ảnh gia.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={HardDrive} value={overview ? formatBytes(overview.totalUsedBytes) : "…"} label="Tổng dung lượng nền tảng" />
        <StatCard icon={AlertTriangle} value={overview ? formatCount(overview.overQuotaCount) : "…"} label="Gallery vượt quota" />
        <StatCard
          icon={Layers}
          value={overview ? `${overview.planBreakdown.free}·${overview.planBreakdown.pro}·${overview.planBreakdown.studio}` : "…"}
          label="Gói Free · Pro · Studio"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <DataTable table={table} recordCount={rows.length} />
      )}
    </div>
  );
}
