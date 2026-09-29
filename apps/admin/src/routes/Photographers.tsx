import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, CheckCircle2, Clock3, Download, Eye, FileText, Search, XCircle, type LucideIcon } from "lucide-react";
import { Button, Input, PageContainer, formatPrice } from "@lens/ui";
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
import { chevronColumn } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useApplications } from "@/queries/useApplications";
import { APPROVAL_STATUS_META } from "@/lib/status";
import { formatDate } from "@/lib/format";
import type { ApprovalStatus, PhotographerApplication } from "@/types";

type FilterValue = "all" | ApprovalStatus;
type Tone = "amber" | "emerald" | "rose" | "slate";

const tones: Record<Tone, { icon: string; badge: string }> = {
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
};

function SummaryCard({ icon: Icon, tone, badge, value, label, hint }: {
  icon: LucideIcon;
  tone: Tone;
  badge: string;
  value: number;
  label: string;
  hint: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <span className={'flex size-10 shrink-0 items-center justify-center rounded-xl ' + tones[tone].icon}>
          <Icon className="size-5" />
        </span>
        <span className={'rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap ' + tones[tone].badge}>{badge}</span>
      </div>
      <p className="mt-6 text-4xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

const fold = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function Photographers() {
  // TanStack Table mutates its instance; React Compiler memoization would freeze sorting/pagination.
  "use no memo";
  const navigate = useNavigate();
  const { data: applications = [], isLoading } = useApplications();
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const countOf = (status: ApprovalStatus) => applications.filter((app) => app.status === status).length;
  const pendingCount = countOf("pending");
  const approvedCount = countOf("approved");
  const rejectedCount = countOf("rejected");
  const reviewedCount = approvedCount + rejectedCount;
  const approvalRate = reviewedCount ? Math.round((approvedCount / reviewedCount) * 100) : 0;
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const year = new Date().getFullYear();
  const cities = useMemo(() => [...new Set(applications.map((app) => app.city))].sort((a, b) => a.localeCompare(b, "vi")), [applications]);
  const data = useMemo(() => {
    const query = fold(search.trim());
    return applications.filter((app) =>
      (filter === "all" || app.status === filter) &&
      (city === "all" || app.city === city) &&
      (!query || fold(app.name + " " + app.styles.join(" ") + " " + app.city).includes(query))
    );
  }, [applications, filter, search, city]);
  const open = (app: PhotographerApplication) => navigate("/photographers/" + app.id);

  const exportCsv = () => {
    const rows = [
      ["Nhiếp ảnh gia", "Email", "Khu vực", "Kỹ năng", "Kinh nghiệm (năm)", "Giá / buổi (VND)", "Ngày gửi", "Trạng thái"],
      ...data.map((app) => [app.name, app.email, app.city, app.styles.join("; "), app.experienceYears, app.pricePerSession, formatDate(app.submittedAt), APPROVAL_STATUS_META[app.status].label]),
    ];
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "ho-so-nhiep-anh-gia-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = useMemo<ColumnDef<PhotographerApplication>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const app = row.original;
          return <UserCell name={app.name} avatar={app.avatar} sub={app.styles.join(" · ") + " · " + app.portfolio.length + " ảnh"} />;
        },
        meta: { headerClassName: "min-w-64", cellClassName: "min-w-64" },
      },
      {
        accessorKey: "city",
        header: ({ column }) => <ColumnHeader column={column} title="Khu vực" />,
        cell: ({ row }) => <span className="text-sm">{row.original.city}</span>,
        meta: { headerClassName: "min-w-32", cellClassName: "min-w-32" },
      },
      {
        accessorKey: "experienceYears",
        header: ({ column }) => <ColumnHeader column={column} title="Kinh nghiệm" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.experienceYears} năm</span>,
      },
      {
        accessorKey: "pricePerSession",
        header: ({ column }) => <ColumnHeader column={column} title="Giá / buổi" />,
        cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{formatPrice(row.original.pricePerSession)}</span>,
      },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày gửi" />,
        cell: ({ row }) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(row.original.submittedAt)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={APPROVAL_STATUS_META[row.original.status]} className="border border-current/15 px-3 py-1.5 text-xs" />,
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            className="h-10 rounded-xl bg-slate-950 px-4 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            onClick={(event) => { event.stopPropagation(); open(row.original); }}
          >
            <Eye className="size-4" />
            {row.original.status === "pending" ? "Xem & duyệt" : "Xem hồ sơ"}
          </Button>
        ),
        meta: { headerClassName: "text-right min-w-36", cellClassName: "text-right min-w-36" },
      },
      chevronColumn<PhotographerApplication>(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is stable
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    getRowId: (row) => row.id,
  });

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <header className="mb-7 flex flex-col gap-5 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-start gap-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
            <FileText className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Duyệt nhiếp ảnh gia</h1>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Xem portfolio và quyết định hồ sơ mới. Chỉ hồ sơ đã duyệt mới được hiển thị công khai trên nền tảng tìm kiếm.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 sm:self-center">
          <Clock3 className="size-4" />
          {pendingCount} hồ sơ cần xem
        </span>
      </header>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Clock3} tone="amber" badge="ƯU TIÊN XỬ LÝ" value={pendingCount} label="Chờ duyệt" hint="Hồ sơ cần được kiểm tra" />
        <SummaryCard icon={CheckCircle2} tone="emerald" badge="Hoạt động tốt" value={approvedCount} label="Đã duyệt" hint="Đang hiển thị công khai" />
        <SummaryCard icon={XCircle} tone="rose" badge="Không đạt" value={rejectedCount} label="Từ chối" hint="Hồ sơ chưa đạt yêu cầu" />
        <SummaryCard icon={Archive} tone="slate" badge={"Tháng " + month + "/" + year} value={applications.length} label="Tổng hồ sơ tiếp nhận" hint={"Tỷ lệ phê duyệt đạt " + approvalRate + "%"} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-1 pt-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Danh sách hồ sơ</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">{data.length} hồ sơ</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Chọn một dòng để xem chi tiết portfolio và thông tin đăng ký.</p>
          </div>
          <Button variant="outline" size="sm" className="h-9 rounded-lg" onClick={exportCsv} disabled={data.length === 0}>
            <Download className="size-4" />
            Xuất file
          </Button>
        </div>

        <div className="[&_[data-slot=status-tabs]]:rounded-xl [&_[data-slot=status-tabs]]:border-0 [&_[data-slot=status-tabs]]:bg-muted/70 [&_[data-slot=status-tabs]]:p-1 [&_[data-slot=status-tab-indicator]]:hidden [&_[role=tab]]:rounded-lg [&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab][data-selected=true]]:bg-slate-950 [&_[role=tab][data-selected=true]]:text-white [&_[role=tab][data-selected=true]]:dark:bg-slate-100 [&_[role=tab][data-selected=true]]:dark:text-slate-950 [&_[role=tab][data-selected=true]_span]:bg-orange-500 [&_[role=tab][data-selected=true]_span]:text-white">
          <DataTable
            table={table}
            recordCount={data.length}
            isLoading={isLoading}
            onRowClick={open}
            className="rounded-none border-0 shadow-none [&>div:first-child]:bg-transparent [&>div:first-child]:px-6 [&>div:first-child]:pb-5 [&>div:first-child]:pt-5 [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-5"
            tabs={{
              value: filter,
              onChange: setFilter,
              items: [
                { value: "pending", label: "Chờ duyệt", count: pendingCount },
                { value: "approved", label: "Đã duyệt", count: approvedCount },
                { value: "rejected", label: "Từ chối", count: rejectedCount },
                { value: "all", label: "Tất cả", count: applications.length },
              ],
            }}
            toolbarClassName="md:w-[32rem]"
            toolbar={
              <div className="flex flex-wrap gap-2 md:justify-end">
                <div className="relative min-w-48 flex-1 md:min-w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm theo tên thợ, kỹ năng..."
                    aria-label="Tìm nhiếp ảnh gia theo tên, kỹ năng hoặc khu vực"
                    className="h-10 rounded-lg bg-background pl-9"
                  />
                </div>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  aria-label="Lọc theo khu vực"
                  className="h-10 min-w-36 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Tất cả khu vực</option>
                  {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            }
            empty={<EmptyState bare icon={FileText} title="Không tìm thấy hồ sơ phù hợp" />}
          />
        </div>
      </section>
    </PageContainer>
  );
}
