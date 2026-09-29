import { useMemo, useState } from "react";
import { CalendarClock, CalendarX, Download, Eye, Plus, Search, ShieldCheck, UsersRound } from "lucide-react";
import { Button, Input, PageContainer, PageHeader, StatCard, formatPrice, toast } from "@lens/ui";
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
import { CollaboratorStack } from "@/components/CollaboratorStack";
import { useAdminBookings } from "@/queries/useAdminBookings";
import { ESCROW_STATUS_META } from "@/lib/status";
import { formatCount, formatDate, relativeDay } from "@/lib/format";
import type { AdminBooking, EscrowStatus } from "@/types";

type Filter = "all" | EscrowStatus;

const STATUS_ORDER: EscrowStatus[] = [
  "awaiting_deposit",
  "pending",
  "confirmed",
  "held",
  "released",
  "cancelled",
];

const fold = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function Bookings() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data: report, isLoading } = useAdminBookings();
  const bookings = useMemo(() => report?.rows ?? [], [report]);
  const summary = report?.summary;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(() => {
    const query = fold(search.trim());
    return bookings.filter((booking) => {
      const inTab = filter === "all" || booking.status === filter;
      const searchable = fold(
        `${booking.id} ${booking.style} ${booking.photographerName} ${booking.clientName}`
      );
      return inTab && (!query || searchable.includes(query));
    });
  }, [bookings, filter, search]);

  const exportCsv = () => {
    const rows = [
      ["Mã booking", "Buổi chụp", "Nhiếp ảnh gia", "Khách hàng", "Ngày chụp", "Giá trị (VND)", "Trạng thái"],
      ...data.map((booking) => [
        `#${booking.id.toUpperCase()}`,
        booking.style,
        booking.photographerName,
        booking.clientName,
        formatDate(booking.date),
        booking.price,
        ESCROW_STATUS_META[booking.status].label,
      ]),
    ];
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "danh-sach-dat-lich-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = useMemo<ColumnDef<AdminBooking>[]>(
    () => [
      {
        accessorKey: "style",
        header: ({ column }) => <ColumnHeader column={column} title="Buổi chụp" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{row.original.style}</p>
            <p className="text-xs uppercase tabular-nums text-muted-foreground">#{row.original.id}</p>
          </div>
        ),
        meta: { headerClassName: "min-w-28", cellClassName: "min-w-28" },
      },
      {
        accessorKey: "photographerName",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const booking = row.original;
          return (
            <UserCell
              name={booking.photographerName}
              avatar={booking.photographerAvatar}
              sub={booking.collaborators?.length ? <CollaboratorStack collaborators={booking.collaborators} /> : undefined}
            />
          );
        },
        meta: { headerClassName: "min-w-52", cellClassName: "min-w-52" },
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => <ColumnHeader column={column} title="Khách hàng" />,
        cell: ({ row }) => <UserCell name={row.original.clientName} avatar={row.original.clientAvatar} />,
        meta: { headerClassName: "min-w-48", cellClassName: "min-w-48" },
      },
      {
        accessorKey: "date",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày chụp" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm tabular-nums">{formatDate(row.original.date)}</p>
            <p className="text-xs text-muted-foreground">{relativeDay(row.original.date)}</p>
          </div>
        ),
        meta: { headerClassName: "min-w-32", cellClassName: "min-w-32" },
      },
      {
        accessorKey: "price",
        header: ({ column }) => <ColumnHeader column={column} title="Giá trị" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={ESCROW_STATUS_META[row.original.status]} className="border border-current/15 px-3 py-1.5 text-xs" />,
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => toast.info(`Chi tiết ${row.original.id.toUpperCase()} sẽ được mở trong phiên bản tiếp theo.`)}
          >
            <Eye className="size-4" />
            Chi tiết
          </Button>
        ),
        meta: ACTIONS,
      },
    ],
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
      <PageHeader
        className="mb-8"
        title="Đặt lịch & ghép thợ"
        description="Theo dõi tiền sàn đang giữ, trạng thái từng buổi chụp và các nhóm thợ ghép."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl" onClick={exportCsv} disabled={data.length === 0}>
              <Download className="size-4" />
              Xuất dữ liệu (CSV)
            </Button>
            <Button
              className="h-10 rounded-xl bg-orange-600 px-4 text-white shadow-sm hover:bg-orange-700"
              onClick={() => toast.info("Tính năng tạo lịch hẹn mới đang được hoàn thiện.")}
            >
              <Plus className="size-4" />
              Tạo lịch hẹn mới
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          value={summary ? formatPrice(summary.escrowHeld) : "…"}
          label="Sàn đang giữ"
          hint={<span className="text-sm text-muted-foreground">Tiền cọc + tiền đã thanh toán, chưa giải ngân</span>}
          className="rounded-2xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={CalendarClock}
          value={summary ? formatCount(summary.activeCount) : "…"}
          label="Buổi chụp đang diễn ra"
          hint={<span className="text-sm text-muted-foreground">Đang trong tiến trình thực hiện hoặc chờ ảnh</span>}
          className="rounded-2xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={UsersRound}
          value={summary ? formatCount(summary.collabCount) : "…"}
          label="Buổi có ghép thợ"
          hint={<span className="text-sm text-muted-foreground">Đã ghép thêm thợ phụ/hỗ trợ</span>}
          className="rounded-2xl border-border/70 shadow-sm"
        />
      </div>

      <div className="[&_[data-slot=status-tabs]]:rounded-xl [&_[data-slot=status-tabs]]:border-0 [&_[data-slot=status-tabs]]:bg-transparent [&_[data-slot=status-tabs]]:p-1 [&_[data-slot=status-tab-indicator]]:hidden [&_[role=tab]]:rounded-lg [&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab][data-selected=true]]:bg-slate-950 [&_[role=tab][data-selected=true]]:text-white [&_[role=tab][data-selected=true]]:dark:bg-slate-100 [&_[role=tab][data-selected=true]]:dark:text-slate-950 [&_[role=tab][data-selected=true]_span]:bg-orange-500 [&_[role=tab][data-selected=true]_span]:text-white">
        <DataTable
          table={table}
          recordCount={data.length}
          isLoading={isLoading}
          toolbarBelow
          toolbarClassName="md:w-full"
          className="rounded-2xl border-border/70 shadow-sm [&>div:first-child]:bg-transparent [&>div:first-child]:px-6 [&>div:first-child]:pb-2 [&>div:first-child]:pt-5 [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-5"
          tabs={{
            value: filter,
            onChange: setFilter,
            items: [
              { value: "all", label: "Tất cả", count: bookings.length },
              ...STATUS_ORDER.map((status) => ({
                value: status,
                label: ESCROW_STATUS_META[status].label,
                count: bookings.filter((booking) => booking.status === status).length,
              })),
            ],
          }}
          toolbar={
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã BK, tên thợ, khách hàng..."
                aria-label="Tìm booking theo mã, tên thợ hoặc khách hàng"
                className="h-10 rounded-lg bg-background pl-9"
              />
            </div>
          }
          empty={<EmptyState bare icon={CalendarX} title="Không có buổi chụp ở trạng thái này" />}
        />
      </div>
    </PageContainer>
  );
}
