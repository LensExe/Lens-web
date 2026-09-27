import { useMemo, useState } from "react";
import { BanknoteArrowDown, Check, Clock, Coins, Wallet, X } from "lucide-react";
import {
  Button,
  PageContainer,
  PageHeader,
  StatCard,
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { ACTIONS, NUM } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useFinance, useSetWithdrawalStatus, useWithdrawals } from "@/queries/useFinance";
import { WITHDRAWAL_STATUS_META } from "@/lib/status";
import { formatCount, formatDate, formatRelative } from "@/lib/format";
import type { AdminWithdrawal, WithdrawalStatus } from "@/types";

type Filter = "all" | WithdrawalStatus;
type Decision = { withdrawal: AdminWithdrawal; status: "approved" | "rejected" };

export function Finance() {
  // TanStack Table mutates in place; the React Compiler's memoization freezes it.
  "use no memo";
  const { data: withdrawals = [], isLoading } = useWithdrawals();
  const { data: finance } = useFinance();
  const setStatus = useSetWithdrawalStatus();
  const [filter, setFilter] = useState<Filter>("pending");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [decision, setDecision] = useState<Decision | null>(null);

  const countOf = (s: WithdrawalStatus) => withdrawals.filter((w) => w.status === s).length;
  const data = useMemo(
    () => (filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter)),
    [withdrawals, filter]
  );

  const columns = useMemo<ColumnDef<AdminWithdrawal>[]>(
    () => [
      {
        accessorKey: "photographerName",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => <UserCell name={row.original.photographerName} avatar={row.original.avatar} />,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <ColumnHeader column={column} title="Số tiền" align="right" />,
        meta: NUM,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatPrice(row.original.amount)}</span>,
      },
      {
        accessorKey: "requestedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày yêu cầu" />,
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDate(row.original.requestedAt)}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(row.original.requestedAt)} trước</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={WITHDRAWAL_STATUS_META[row.original.status]} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Hành động</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const w = row.original;
          if (w.status !== "pending") return <span className="text-xs text-muted-foreground">—</span>;
          const busy = setStatus.isPending && setStatus.variables?.id === w.id;
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={busy}
                onClick={() => setDecision({ withdrawal: w, status: "rejected" })}
              >
                <X className="size-3.5" />
                Từ chối
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={busy}
                onClick={() => setDecision({ withdrawal: w, status: "approved" })}
              >
                <Check className="size-3.5" />
                Duyệt
              </Button>
            </div>
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

  const approving = decision?.status === "approved";
  const confirm = () => {
    if (!decision) return;
    const { withdrawal: w, status } = decision;
    setStatus.mutate(
      { id: w.id, status },
      {
        onSuccess: () => {
          toast.success(
            status === "approved"
              ? `Đã duyệt rút ${formatPrice(w.amount)} cho ${w.photographerName}`
              : `Đã từ chối yêu cầu của ${w.photographerName}`
          );
          setDecision(null);
        },
        onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
      }
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Rút tiền & quỹ" description="Duyệt yêu cầu rút tiền của nhiếp ảnh gia và theo dõi quỹ nền tảng." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          value={finance ? formatPrice(finance.walletReserve) : "…"}
          label="Quỹ ví nhiếp ảnh gia"
          hint={<span className="text-xs text-muted-foreground">Tiền thật đang nằm trong ví thợ</span>}
        />
        <StatCard
          icon={Coins}
          value={finance ? `${formatCount(finance.coinsOutstanding)} xu` : "…"}
          label="Lens Xu đang lưu hành"
        />
        <StatCard
          icon={Clock}
          value={finance ? formatPrice(finance.pendingWithdrawalTotal) : "…"}
          label="Đang chờ duyệt rút"
          hint={
            finance && finance.pendingCount > 0 ? (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {finance.pendingCount} yêu cầu cần xử lý
              </span>
            ) : undefined
          }
        />
      </div>

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        tabs={{
          value: filter,
          onChange: setFilter,
          items: [
          { value: "pending", label: "Chờ duyệt", count: countOf("pending") },
          { value: "approved", label: "Đã duyệt", count: countOf("approved") },
          { value: "rejected", label: "Từ chối", count: countOf("rejected") },
          { value: "all", label: "Tất cả", count: withdrawals.length },
        ],
        }}
        empty={
          <EmptyState
            bare
            icon={BanknoteArrowDown}
            title={filter === "pending" ? "Không có yêu cầu rút tiền nào chờ duyệt" : "Không có yêu cầu ở trạng thái này"}
          />
        }
      />

      <ConfirmDialog
        open={!!decision}
        onOpenChange={(open) => !open && setDecision(null)}
        title={
          approving
            ? `Duyệt rút ${decision ? formatPrice(decision.withdrawal.amount) : ""}?`
            : "Từ chối yêu cầu rút tiền?"
        }
        description={
          approving
            ? `Tiền sẽ được chuyển về tài khoản ngân hàng của ${decision?.withdrawal.photographerName} trong 1–2 ngày làm việc.`
            : `Số tiền được giữ lại trong ví của ${decision?.withdrawal.photographerName}.`
        }
        confirmLabel={approving ? "Duyệt rút tiền" : "Từ chối"}
        destructive={!approving}
        pending={setStatus.isPending}
        onConfirm={confirm}
      />
    </PageContainer>
  );
}
