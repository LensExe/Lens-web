import { useMemo, useState } from "react";
import { CalendarClock, CalendarX, ShieldCheck, UsersRound } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  StatCard,
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
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { NUM } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { CollaboratorStack } from "@/components/CollaboratorStack";
import { useAdminBookings } from "@/queries/useAdminBookings";
import { ESCROW_STATUS_META } from "@/lib/status";
import { formatCount, formatDate, relativeDay } from "@/lib/format";
import type { AdminBooking, EscrowStatus } from "@/types";

type Filter = "all" | EscrowStatus;

// The order a booking travels in.
const STATUS_ORDER: EscrowStatus[] = [
  "awaiting_deposit",
  "pending",
  "confirmed",
  "held",
  "released",
  "cancelled",
];

export function Bookings() {
  // TanStack Table mutates in place; opt out of the React Compiler here.
  "use no memo";
  const { data: report, isLoading } = useAdminBookings();
  const bookings = useMemo(() => report?.rows ?? [], [report]);
  const summary = report?.summary;
  const [filter, setFilter] = useState<Filter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  const columns = useMemo<ColumnDef<AdminBooking>[]>(
    () => [
      {
        accessorKey: "style",
        header: ({ column }) => <ColumnHeader column={column} title="Buổi chụp" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium leading-tight">{row.original.style}</p>
            <p className="text-xs uppercase tabular-nums text-muted-foreground">#{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "photographerName",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <UserCell
              name={b.photographerName}
              avatar={b.photographerAvatar}
              sub={b.collaborators?.length ? <CollaboratorStack collaborators={b.collaborators} /> : undefined}
            />
          );
        },
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => <ColumnHeader column={column} title="Khách hàng" />,
        cell: ({ row }) => <UserCell name={row.original.clientName} avatar={row.original.clientAvatar} />,
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
      },
      {
        accessorKey: "price",
        header: ({ column }) => <ColumnHeader column={column} title="Giá trị" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatPrice(row.original.price)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={ESCROW_STATUS_META[row.original.status]} />,
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
    <PageContainer>
      <PageHeader
        title="Đặt lịch & ghép thợ"
        description="Theo dõi tiền sàn đang giữ, trạng thái từng buổi chụp và các nhóm thợ ghép."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ShieldCheck}
          value={summary ? formatPrice(summary.escrowHeld) : "…"}
          label="Sàn đang giữ"
          hint={<span className="text-xs text-muted-foreground">Tiền cọc + tiền đã thanh toán, chưa giải ngân</span>}
        />
        <StatCard
          icon={CalendarClock}
          value={summary ? formatCount(summary.activeCount) : "…"}
          label="Buổi chụp đang diễn ra"
        />
        <StatCard
          icon={UsersRound}
          value={summary ? formatCount(summary.collabCount) : "…"}
          label="Buổi có ghép thợ"
        />
      </div>

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        tabs={{ value: filter, onChange: setFilter, items: [
          { value: "all", label: "Tất cả", count: bookings.length },
          ...STATUS_ORDER.map((s) => ({
            value: s,
            label: ESCROW_STATUS_META[s].label,
            count: bookings.filter((b) => b.status === s).length,
          })),
        ] }}
        empty={<EmptyState bare icon={CalendarX} title="Không có buổi chụp ở trạng thái này" />}
      />
    </PageContainer>
  );
}
