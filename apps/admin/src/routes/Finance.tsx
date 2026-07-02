import { useMemo, useState } from "react";
import { Check, Coins, Wallet, Clock, X } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DataGridColumnHeader,
  Skeleton,
  cn,
  formatPrice,
  toast,
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
import {
  useFinance,
  useSetWithdrawalStatus,
  useWithdrawals,
} from "@/queries/useFinance";
import { WITHDRAWAL_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import type { AdminWithdrawal } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function Finance() {
  // TanStack Table mutates in place; the React Compiler's memoization freezes it.
  "use no memo";
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const { data: finance } = useFinance();
  const { mutate, isPending } = useSetWithdrawalStatus();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<AdminWithdrawal>[]>(
    () => [
      {
        accessorKey: "photographerName",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const w = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={w.avatar} alt={w.photographerName} />
                <AvatarFallback>{initialsOf(w.photographerName)}</AvatarFallback>
              </Avatar>
              <p className="font-medium leading-tight">{w.photographerName}</p>
            </div>
          );
        },
        size: 260,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Số tiền" />,
        cell: ({ row }) => (
          <span className="font-medium">{formatPrice(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "requestedAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ngày yêu cầu" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.requestedAt)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => {
          const meta = WITHDRAWAL_STATUS_META[row.original.status];
          return (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", meta.className)}>
              {meta.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Hành động" />,
        enableSorting: false,
        cell: ({ row }) => {
          const w = row.original;
          if (w.status !== "pending")
            return <span className="text-xs text-muted-foreground">—</span>;
          const decide = (status: "approved" | "rejected") =>
            mutate(
              { id: w.id, status },
              {
                onSuccess: () =>
                  toast.success(
                    status === "approved"
                      ? `Đã duyệt rút ${formatPrice(w.amount)} cho ${w.photographerName}`
                      : `Đã từ chối yêu cầu của ${w.photographerName}`
                  ),
                onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
              }
            );
          return (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full" disabled={isPending} onClick={() => decide("rejected")}>
                <X className="size-3.5" />
                Từ chối
              </Button>
              <Button size="sm" className="rounded-full" disabled={isPending} onClick={() => decide("approved")}>
                <Check className="size-3.5" />
                Duyệt
              </Button>
            </div>
          );
        },
        size: 200,
      },
    ],
    [mutate, isPending]
  );

  const table = useReactTable({
    data: withdrawals,
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
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tài chính</h1>
        <p className="mt-1 text-muted-foreground">
          Duyệt yêu cầu rút tiền và theo dõi quỹ nền tảng.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} value={finance ? formatPrice(finance.walletReserve) : "…"} label="Quỹ ví đang giữ" />
        <StatCard icon={Coins} value={finance ? `${formatCount(finance.coinsOutstanding)} xu` : "…"} label="Lens Xu lưu hành" />
        <StatCard icon={Clock} value={finance ? formatPrice(finance.pendingWithdrawalTotal) : "…"} label={finance ? `${finance.pendingCount} yêu cầu chờ duyệt` : "Chờ duyệt"} />
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <DataTable table={table} recordCount={withdrawals.length} />
      )}
    </div>
  );
}
