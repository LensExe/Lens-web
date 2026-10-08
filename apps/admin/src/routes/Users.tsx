import { useMemo, useState } from "react";
import {
  Ban,
  Camera,
  Download,
  Plus,
  RotateCcw,
  Search,
  UserRound,
  UserX,
  Users as UsersIcon,
} from "lucide-react";
import { Button, Input, PageContainer, PageHeader, toast } from "@lens/ui";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { ACTIONS, NUM } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useSetUserStatus, useUsers } from "@/queries/useUsers";
import { ROLE_META, USER_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import type { AdminUser } from "@/types";

type Filter = "all" | "client" | "photographer" | "suspended";

const fold = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

type MetricTone = "green" | "neutral" | "rose";

const metricTones: Record<MetricTone, { icon: string; badge: string }> = {
  green: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  neutral: {
    icon: "bg-slate-50 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
    badge: "bg-slate-50 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
};

function MetricCard({
  icon: Icon,
  tone,
  badge,
  value,
  label,
}: {
  icon: typeof UsersIcon;
  tone: MetricTone;
  badge: string;
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${metricTones[tone].icon}`}>
          <Icon className="size-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${metricTones[tone].badge}`}>
          {badge}
        </span>
      </div>
      <p className="mt-6 text-4xl font-bold leading-none tracking-tight tabular-nums">{formatCount(value)}</p>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

export function Users() {
  // TanStack Table keeps mutable state on the table instance; the React
  // Compiler's memoization breaks its updates (sorting/pagination no-op).
  "use no memo";
  const { data: users = [], isLoading } = useUsers();
  const setStatus = useSetUserStatus();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [target, setTarget] = useState<AdminUser | null>(null);

  const count = {
    all: users.length,
    client: users.filter((user) => user.role === "client").length,
    photographer: users.filter((user) => user.role === "photographer").length,
    suspended: users.filter((user) => user.status === "suspended").length,
  };

  const cities = useMemo(
    () => [...new Set(users.map((user) => user.city))].sort((a, b) => a.localeCompare(b, "vi")),
    [users]
  );

  const data = useMemo(() => {
    const query = fold(search.trim());
    return users
      .filter((user) => {
        const inTab =
          filter === "all" ||
          (filter === "suspended" ? user.status === "suspended" : user.role === filter);
        const inCity = city === "all" || user.city === city;
        const searchable = fold(`${user.name} ${user.email} ${user.city}`);
        return inTab && inCity && (!query || searchable.includes(query));
      })
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  }, [users, filter, search, city]);

  const exportCsv = () => {
    const rows = [
      ["Người dùng", "Email", "Vai trò", "Khu vực", "Tham gia", "Lượt đặt", "Trạng thái"],
      ...data.map((user) => [
        user.name,
        user.email,
        ROLE_META[user.role].label,
        user.city,
        formatDate(user.joinedAt),
        user.bookingsCount ?? "—",
        USER_STATUS_META[user.status].label,
      ]),
    ];
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "danh-sach-nguoi-dung-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Người dùng" />,
        cell: ({ row }) => <UserCell name={row.original.name} avatar={row.original.avatar} sub={row.original.email} />,
        meta: { headerClassName: "min-w-64", cellClassName: "min-w-64" },
      },
      {
        accessorKey: "role",
        header: ({ column }) => <ColumnHeader column={column} title="Vai trò" />,
        cell: ({ row }) => {
          const photographer = row.original.role === "photographer";
          return (
            <StatusPill
              meta={ROLE_META[row.original.role]}
              dot={false}
              icon={photographer ? <Camera className="size-3 text-orange-500" /> : undefined}
              className={photographer
                ? "bg-slate-950 px-3 py-1.5 text-white ring-0 dark:bg-slate-100 dark:text-slate-950"
                : "bg-muted px-3 py-1.5 text-muted-foreground ring-0"}
            />
          );
        },
      },
      {
        accessorKey: "city",
        header: ({ column }) => <ColumnHeader column={column} title="Khu vực" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.city}</span>,
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Tham gia" />,
        cell: ({ row }) => <span className="text-sm whitespace-nowrap text-muted-foreground">{formatDate(row.original.joinedAt)}</span>,
      },
      {
        accessorKey: "bookingsCount",
        header: ({ column }) => <ColumnHeader column={column} title="Lượt đặt" align="right" />,
        cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.bookingsCount === undefined ? "—" : formatCount(row.original.bookingsCount)}</span>,
        meta: NUM,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={USER_STATUS_META[row.original.status]} className="border border-current/15 px-3 py-1.5 text-xs" />,
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const suspended = user.status === "suspended";
          const busy = setStatus.isPending && setStatus.variables?.id === user.id;
          return (
            <Button
              size="sm"
              variant="outline"
              className={suspended
                ? "h-10 rounded-xl border-emerald-200 px-4 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                : "h-10 rounded-xl px-4 hover:border-rose-300 hover:text-rose-700 dark:hover:text-rose-400"}
              disabled={busy}
              onClick={(event) => {
                event.stopPropagation();
                setTarget(user);
              }}
            >
              {suspended ? <RotateCcw className="size-3.5" /> : <Ban className="size-3.5" />}
              {suspended ? "Mở khoá" : "Tạm khoá"}
            </Button>
          );
        },
        meta: ACTIONS,
      },
    ],
    [setStatus.isPending, setStatus.variables]
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

  const unlocking = target?.status === "suspended";
  const confirm = () => {
    if (!target) return;
    const user = target;
    setStatus.mutate(
      { id: user.id, status: unlocking ? "active" : "suspended" },
      {
        onSuccess: () => {
          toast.success(unlocking ? `Đã mở khoá ${user.name}` : `Đã tạm khoá ${user.name}`);
          setTarget(null);
        },
        onError: () => toast.error("Không thể cập nhật người dùng, vui lòng thử lại"),
      }
    );
  };

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <PageHeader
        className="mb-8"
        title="Người dùng"
        description="Tài khoản khách hàng và nhiếp ảnh gia trên nền tảng Lens."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl" onClick={exportCsv} disabled={data.length === 0}>
              <Download className="size-4" />
              Xuất danh sách (CSV)
            </Button>
            <Button
              className="h-10 rounded-xl bg-orange-600 px-4 text-white shadow-sm hover:bg-orange-700"
              onClick={() => toast.info("Tính năng tạo tài khoản mới đang được hoàn thiện.")}
            >
              <Plus className="size-4" />
              Tạo tài khoản mới
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersIcon} tone="green" badge="+12% tháng này" value={count.all} label="Tổng tài khoản" />
        <MetricCard icon={UserRound} tone="neutral" badge={`${count.all ? ((count.client / count.all) * 100).toFixed(1) : "0.0"}% tổng số`} value={count.client} label="Khách hàng" />
        <MetricCard icon={Camera} tone="neutral" badge={`${count.all ? ((count.photographer / count.all) * 100).toFixed(1) : "0.0"}% tổng số`} value={count.photographer} label="Nhiếp ảnh gia" />
        <MetricCard icon={Ban} tone="rose" badge="Cần xử lý" value={count.suspended} label="Đang bị khoá" />
      </div>

      <div className="[&_[data-slot=status-tabs]]:rounded-xl [&_[data-slot=status-tabs]]:border-0 [&_[data-slot=status-tabs]]:bg-muted/70 [&_[data-slot=status-tabs]]:p-1 [&_[data-slot=status-tab-indicator]]:hidden [&_[role=tab]]:rounded-lg [&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab][data-selected=true]]:bg-slate-950 [&_[role=tab][data-selected=true]]:text-white [&_[role=tab][data-selected=true]]:dark:bg-slate-100 [&_[role=tab][data-selected=true]]:dark:text-slate-950 [&_[role=tab][data-selected=true]_span]:bg-orange-500 [&_[role=tab][data-selected=true]_span]:text-white">
        <DataTable
          table={table}
          recordCount={data.length}
          isLoading={isLoading}
          toolbarClassName="md:w-[34rem]"
          className="rounded-2xl border-border/70 shadow-sm [&>div:first-child]:bg-transparent [&>div:first-child]:px-6 [&>div:first-child]:pb-5 [&>div:first-child]:pt-5 [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-5"
          tabs={{
            value: filter,
            onChange: setFilter,
            items: [
              { value: "all", label: "Tất cả", count: count.all },
              { value: "client", label: "Khách hàng", count: count.client },
              { value: "photographer", label: "Nhiếp ảnh gia", count: count.photographer },
              { value: "suspended", label: "Bị khoá", count: count.suspended },
            ],
          }}
          toolbar={
            <div className="flex flex-wrap gap-2 md:justify-end">
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                aria-label="Lọc theo khu vực"
                className="h-10 min-w-36 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Tất cả khu vực</option>
                {cities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className="relative min-w-48 flex-1 md:min-w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  aria-label="Tìm người dùng"
                  className="h-10 rounded-lg bg-background pl-9"
                />
              </div>
            </div>
          }
          empty={<EmptyState bare icon={UserX} title="Không tìm thấy người dùng phù hợp" />}
        />
      </div>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title={unlocking ? `Mở khoá tài khoản ${target?.name}?` : `Tạm khoá tài khoản ${target?.name}?`}
        description={
          unlocking
            ? "Người dùng có thể đăng nhập và sử dụng Lens trở lại."
            : "Người dùng sẽ không thể đăng nhập, đặt lịch hay nhận lịch cho tới khi được mở khoá."
        }
        confirmLabel={unlocking ? "Mở khoá" : "Tạm khoá"}
        destructive={!unlocking}
        pending={setStatus.isPending}
        onConfirm={confirm}
      />
    </PageContainer>
  );
}
