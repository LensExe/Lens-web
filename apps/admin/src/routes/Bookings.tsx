import { useMemo, useState } from "react";
import { CalendarX } from "lucide-react";
import {
  DataGridColumnHeader,
  Skeleton,
  cn,
  formatPrice,
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
import { useAdminBookings } from "@/queries/useAdminBookings";
import { ESCROW_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import type { AdminBooking, EscrowStatus } from "@/types";

type StatusFilter = "all" | EscrowStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "held", label: "Đang giữ tiền" },
  { value: "released", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
];

export function Bookings() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data: bookings = [], isLoading } = useAdminBookings();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(
    () => (status === "all" ? bookings : bookings.filter((b) => b.status === status)),
    [bookings, status]
  );

  const columns = useMemo<ColumnDef<AdminBooking>[]>(
    () => [
      {
        accessorKey: "photographerName",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium leading-tight">{b.photographerName}</p>
              {b.collaborators && b.collaborators.length > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  + {b.collaborators.map((c) => `${c.name} (${c.sharePct}%)`).join(", ")}
                </p>
              )}
            </div>
          );
        },
        size: 300,
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Khách hàng" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.clientName}</span>
        ),
      },
      {
        accessorKey: "style",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Thể loại" />,
        cell: ({ row }) => <span className="text-sm">{row.original.style}</span>,
      },
      {
        accessorKey: "date",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ngày chụp" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.date)}</span>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Giá trị" />,
        cell: ({ row }) => <span className="font-medium">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => {
          const meta = ESCROW_STATUS_META[row.original.status];
          return (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
              {meta.label}
            </span>
          );
        },
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
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Đặt lịch & ghép thợ</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "Đang tải..." : `${formatCount(bookings.length)} buổi chụp · theo dõi escrow và chia payout`}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatus(f.value)}
            aria-pressed={status === f.value}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              status === f.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX className="size-6" />
          </span>
          <p className="font-medium">Không có buổi chụp phù hợp</p>
        </div>
      ) : (
        <DataTable table={table} recordCount={data.length} />
      )}
    </div>
  );
}
