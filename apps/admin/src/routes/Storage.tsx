import { useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  HardDrive,
  PieChart,
  Search,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import {
  Button,
  Input,
  PageContainer,
  Progress,
  SegmentedBar,
  Skeleton,
  TONE_CHIP,
  TONE_FILL,
  cn,
  toast,
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
import { ACTIONS, NUM } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useStorageReport } from "@/queries/useStorageReport";
import { STORAGE_PLAN_META } from "@/lib/status";
import { formatBytes, formatCount } from "@/lib/format";
import type { AdminStorageRow, StoragePlanTier } from "@/types";

type Filter = "all" | "near" | "over";

const PLANS: StoragePlanTier[] = ["free", "pro", "studio"];
const PLAN_BAR_COLORS: Record<StoragePlanTier, string> = {
  free: "#cbd5e1",
  pro: "#64748b",
  studio: "#0f172a",
};

const usagePct = (row: AdminStorageRow) => (row.usedBytes / row.quotaBytes) * 100;
const usageTone = (pct: number): Tone => (pct > 100 ? "rose" : pct >= 70 ? "amber" : "neutral");

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

function fallbackEmail(name: string) {
  return `${fold(name).replace(/\s+/g, ".")}@lens.vn`;
}

function PlanBadge({ plan }: { plan: StoragePlanTier }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
      {STORAGE_PLAN_META[plan].label}
    </span>
  );
}

function UsageCell({ row }: { row: AdminStorageRow }) {
  const pct = usagePct(row);
  const tone = usageTone(pct);
  const valueClass =
    tone === "rose"
      ? "text-rose-500 dark:text-rose-400"
      : tone === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  const percentClass = tone === "neutral" ? "text-muted-foreground" : valueClass;

  return (
    <div className="min-w-56 max-w-72 space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-xs tabular-nums">
        <span className={cn("font-semibold", valueClass)}>{formatBytes(row.usedBytes)}</span>
        <span className={cn("whitespace-nowrap", percentClass)}>
          {formatBytes(row.quotaBytes)} · <strong className="font-semibold">{Math.round(pct)}%</strong>
        </span>
      </div>
      <Progress
        value={Math.min(100, pct)}
        className="h-1.5 bg-slate-100 dark:bg-slate-800"
        indicatorClassName={TONE_FILL[tone]}
      />
    </div>
  );
}

export function Storage() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data, isLoading } = useStorageReport();
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const overview = data?.overview;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const overCount = rows.filter((row) => row.overQuota).length;
  const nearCount = rows.filter((row) => !row.overQuota && usagePct(row) >= 70).length;

  const visible = useMemo(() => {
    const query = fold(search.trim());
    return rows.filter((row) => {
      const inFilter =
        filter === "all" || (filter === "over" && row.overQuota) || (filter === "near" && !row.overQuota && usagePct(row) >= 70);
      const searchable = fold(`${row.name} ${row.email ?? fallbackEmail(row.name)} ${STORAGE_PLAN_META[row.plan].label}`);
      return inFilter && (!query || searchable.includes(query));
    });
  }, [filter, rows, search]);

  const columns = useMemo<ColumnDef<AdminStorageRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => (
          <UserCell
            name={row.original.name}
            avatar={row.original.avatar}
            sub={row.original.email ?? fallbackEmail(row.original.name)}
          />
        ),
        meta: { headerClassName: "min-w-64", cellClassName: "min-w-64" },
      },
      {
        accessorKey: "plan",
        header: ({ column }) => <ColumnHeader column={column} title="Gói" />,
        cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
      },
      {
        accessorKey: "usedBytes",
        header: ({ column }) => <ColumnHeader column={column} title="Dung lượng" />,
        cell: ({ row }) => <UsageCell row={row.original} />,
        meta: { cellClassName: "min-w-64" },
      },
      {
        accessorKey: "galleryCount",
        header: ({ column }) => <ColumnHeader column={column} title="Bộ sưu tập" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatCount(row.original.galleryCount)}</span>,
      },
      {
        id: "health",
        header: ({ column }) => <ColumnHeader column={column} title="Tình trạng" />,
        accessorFn: (row) => usagePct(row),
        cell: ({ row }) => {
          const pct = usagePct(row.original);
          const tone = usageTone(pct);
          const label = tone === "rose" ? "Vượt quota" : tone === "amber" ? "Gần đầy" : "Bình thường";
          return <StatusPill meta={{ label, className: TONE_CHIP[tone] }} />;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const account = row.original;
          const pct = usagePct(account);
          const over = pct > 100;
          const near = !over && pct >= 70;
          return (
            <div className="flex justify-end gap-2 whitespace-nowrap">
              {over && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-rose-200 px-3 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  onClick={() => toast.info(`Đã gửi yêu cầu mở khoá tạm cho ${account.name}.`)}
                >
                  <Unlock className="size-3.5" />
                  Mở khoá tạm
                </Button>
              )}
              {near && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-lg border-amber-200 px-3 text-amber-700 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  onClick={() => toast.info(`Đã gửi nhắc nâng gói cho ${account.name}.`)}
                >
                  <Bell className="size-3.5" />
                  Nhắc nâng gói
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-border px-3 text-muted-foreground hover:text-foreground"
                onClick={() => toast.info(`Đang mở chi tiết lưu trữ của ${account.name}.`)}
              >
                <Eye className="size-3.5" />
                Chi tiết
              </Button>
            </div>
          );
        },
        meta: ACTIONS,
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

  const page = table.getState().pagination.pageIndex + 1;
  const pageCount = Math.max(table.getPageCount(), 1);
  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Hiển thị <strong className="font-semibold text-foreground">{formatCount(visible.length)}</strong> trên tổng số{" "}
        <strong className="font-semibold text-foreground">{formatCount(rows.length)}</strong> kết quả
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-lg px-3 text-muted-foreground"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeft className="size-4" />
          Trang trước
        </Button>
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
          {page}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-lg px-3 text-muted-foreground"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Trang sau
          <ChevronRight className="size-4" />
        </Button>
        {pageCount > 1 && <span className="sr-only">Trang {page} trên {pageCount}</span>}
      </div>
    </div>
  );

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-6 md:py-8 lg:py-10 dark:bg-background">
      {overCount > 0 && (
        <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-4 dark:border-rose-500/25 dark:bg-rose-500/[0.08]">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            <ShieldAlert className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-rose-700 dark:text-rose-300">
            Bộ sưu tập bị khoá theo giới hạn gói. Kiểm tra danh sách bên dưới để xem mức dùng và gói hiện tại.
          </p>
          <Button
            size="sm"
            className="h-9 rounded-lg bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
            onClick={() => setFilter("over")}
          >
            Xử lý ngay
          </Button>
        </section>
      )}

      <section className="mb-6 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-400">
                <PieChart className="size-4.5" />
              </span>
              Phân bổ gói lưu trữ
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Tỉ lệ nhiếp ảnh gia đang sử dụng từng gói.</p>
          </div>
          {overview ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {formatCount(rows.length)} tài khoản
            </span>
          ) : (
            <Skeleton className="h-7 w-24 rounded-full" />
          )}
        </div>
        {overview ? (
          <>
            <SegmentedBar
              className="mt-5"
              segments={PLANS.map((plan) => ({
                label: STORAGE_PLAN_META[plan].label,
                value: overview.planBreakdown[plan],
                color: PLAN_BAR_COLORS[plan],
              }))}
              format={(value) => `${formatCount(value)} tài khoản`}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-2.5"
                >
                  <PlanBadge plan={plan} />
                  <span className="text-sm text-muted-foreground">
                    <strong className="font-semibold text-foreground">{formatCount(overview.planBreakdown[plan])}</strong> tài khoản
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Skeleton className="mt-5 h-24 rounded-xl" />
        )}
      </section>

      <div className="[&_[data-slot=status-tabs]]:rounded-xl [&_[data-slot=status-tabs]]:border-0 [&_[data-slot=status-tabs]]:bg-muted/70 [&_[data-slot=status-tabs]]:p-1 [&_[data-slot=status-tab-indicator]]:hidden [&_[role=tab]]:rounded-lg [&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab][data-selected=true]]:bg-slate-950 [&_[role=tab][data-selected=true]]:text-white [&_[role=tab][data-selected=true]]:dark:bg-slate-100 [&_[role=tab][data-selected=true]]:dark:text-slate-950 [&_[role=tab][data-selected=true]_span]:bg-orange-500 [&_[role=tab][data-selected=true]_span]:text-white">
        <DataTable
          table={table}
          recordCount={visible.length}
          isLoading={isLoading}
          header={
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Bộ sưu tập theo nhiếp ảnh gia</h2>
                <p className="mt-1 text-sm text-muted-foreground">Kiểm tra mức sử dụng, quota và trạng thái từng tài khoản.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {formatCount(visible.length)} kết quả
              </span>
            </div>
          }
          toolbarClassName="md:w-[23rem]"
          footer={footer}
          className="rounded-2xl border-border/70 shadow-sm [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-4"
          tabs={{
            value: filter,
            onChange: setFilter,
            items: [
              { value: "all", label: "Tất cả", count: rows.length },
              { value: "over", label: "Vượt quota", count: overCount },
              { value: "near", label: "Gần đầy (≥ 70%)", count: nearCount },
            ],
          }}
          toolbar={
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Tìm theo tên nhiếp ảnh gia"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên nhiếp ảnh gia..."
                className="h-10 rounded-xl border-border/70 bg-background ps-9"
              />
            </div>
          }
          empty={<EmptyState bare icon={HardDrive} title="Không có tài khoản nào ở mục này" />}
        />
      </div>

    </PageContainer>
  );
}
