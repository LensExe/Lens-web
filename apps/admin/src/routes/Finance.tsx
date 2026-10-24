import { useMemo, useState } from "react";
import {
  BanknoteArrowDown,
  Check,
  Clock,
  Coins,
  Download,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button, Input, PageContainer, PageHeader, formatPrice, toast } from "@lens/ui";
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
import { useFinance, useProcessWithdrawalPayout, useSetWithdrawalStatus, useWithdrawals } from "@/queries/useFinance";
import { WITHDRAWAL_STATUS_META } from "@/lib/status";
import { formatCount, formatDate, formatRelative } from "@/lib/format";
import type { AdminWithdrawal, WithdrawalStatus } from "@/types";

type Filter = "all" | WithdrawalStatus;
type Decision = { withdrawal: AdminWithdrawal; status: "approved" | "rejected" };
type MetricTone = "green" | "orange" | "amber";

const fold = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

const metricTones: Record<MetricTone, { icon: string; badge: string }> = {
  green: {
    icon: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  orange: {
    icon: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

function FinanceMetricCard({
  icon: Icon,
  tone,
  badge,
  value,
  label,
  hint,
}: {
  icon: LucideIcon;
  tone: MetricTone;
  badge: string;
  value: string;
  label: string;
  hint: string;
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
      <p className="mt-6 text-3xl font-bold leading-none tracking-tight tabular-nums sm:text-4xl">{value}</p>
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function Finance() {
  // TanStack Table mutates in place; the React Compiler's memoization freezes it.
  "use no memo";
  const { data: serverWithdrawals, isLoading } = useWithdrawals();
  const { data: serverFinance } = useFinance();
  const setStatus = useSetWithdrawalStatus();
  const processPayout = useProcessWithdrawalPayout();
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<AdminWithdrawal | null>(null);

  const withdrawals = useMemo(() => serverWithdrawals ?? [], [serverWithdrawals]);
  const pendingList = useMemo(() => withdrawals.filter((withdrawal) => withdrawal.status === "pending"), [withdrawals]);
  const pendingTotal = useMemo(() => pendingList.reduce((sum, withdrawal) => sum + withdrawal.amount, 0), [pendingList]);
  const finance = serverFinance;
  const banks = useMemo(
    () => [...new Set(withdrawals.map((withdrawal) => withdrawal.bankName).filter(Boolean) as string[])].sort(),
    [withdrawals]
  );

  const countOf = (status: WithdrawalStatus) => withdrawals.filter((withdrawal) => withdrawal.status === status).length;
  const data = useMemo(() => {
    const query = fold(search.trim());
    return withdrawals.filter((withdrawal) => {
      const inTab = filter === "all" || withdrawal.status === filter;
      const inBank = bank === "all" || withdrawal.bankName === bank;
      const searchable = fold(
        `${withdrawal.photographerName} ${withdrawal.bankName ?? ""} ${withdrawal.bankAccount ?? ""} ${withdrawal.referenceCode ?? ""}`
      );
      return inTab && inBank && (!query || searchable.includes(query));
    });
  }, [withdrawals, filter, search, bank]);

  const exportCsv = () => {
    const rows = [
      ["Nhiếp ảnh gia", "Ngân hàng", "Số tài khoản", "Số tiền (VND)", "Mã giao dịch", "Ngày yêu cầu", "Trạng thái"],
      ...data.map((withdrawal) => [
        withdrawal.photographerName,
        withdrawal.bankName ?? "",
        withdrawal.bankAccount ?? "",
        withdrawal.amount,
        withdrawal.referenceCode ?? "",
        formatDate(withdrawal.requestedAt),
        WITHDRAWAL_STATUS_META[withdrawal.status].label,
      ]),
    ];
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bao-cao-rut-tien-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = useMemo<ColumnDef<AdminWithdrawal>[]>(
    () => [
      {
        accessorKey: "photographerName",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => (
          <UserCell
            name={row.original.photographerName}
            avatar={row.original.avatar}
            sub={row.original.bankName ? `${row.original.bankName} • STK: ${row.original.bankAccount}` : undefined}
          />
        ),
        meta: { headerClassName: "min-w-64", cellClassName: "min-w-64" },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <ColumnHeader column={column} title="Số tiền" align="right" />,
        meta: NUM,
        cell: ({ row }) => (
          <div className="text-right">
            <span className="font-semibold tabular-nums">{formatPrice(row.original.amount)}</span>
            {row.original.referenceCode && <p className="text-xs text-muted-foreground">{row.original.referenceCode}</p>}
          </div>
        ),
      },
      {
        accessorKey: "requestedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày yêu cầu" />,
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            <p className="tabular-nums">{formatDate(row.original.requestedAt)}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(row.original.requestedAt)} trước</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={WITHDRAWAL_STATUS_META[row.original.status]} className="border border-current/15 px-3 py-1.5 text-xs" />,
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const withdrawal = row.original;
          const busy =
            (setStatus.isPending && setStatus.variables?.id === withdrawal.id) ||
            (processPayout.isPending && processPayout.variables?.id === withdrawal.id);
          const payoutStatus = withdrawal.payoutProviderStatus?.toUpperCase();
          if (withdrawal.status === "processing" || withdrawal.status === "approved") {
            if (payoutStatus === "REVERSED") {
              return <span className="text-xs font-medium text-rose-700">Cần đối soát PayOS</span>;
            }
            const canRetry = ["FAILED", "REJECTED", "CANCELLED"].includes(payoutStatus ?? "");
            return (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="h-10 rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                  disabled={busy}
                  onClick={() => setPayoutTarget(withdrawal)}
                >
                  <BanknoteArrowDown className="size-3.5" />
                  {withdrawal.status === "processing" ? "Kiểm tra PayOS" : canRetry ? "Thử lại PayOS" : "Chuyển qua PayOS"}
                </Button>
              </div>
            );
          }
          if (withdrawal.status !== "pending") return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-xl px-3 hover:border-rose-300 hover:text-rose-700 dark:hover:text-rose-400"
                disabled={busy}
                onClick={() => setDecision({ withdrawal, status: "rejected" })}
              >
                <X className="size-3.5" />
                Từ chối
              </Button>
              <Button
                size="sm"
                className="h-10 rounded-xl bg-slate-950 px-4 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                disabled={busy}
                onClick={() => setDecision({ withdrawal, status: "approved" })}
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
    const { withdrawal, status } = decision;
    setStatus.mutate(
      { id: withdrawal.id, status },
      {
        onSuccess: () => {
          toast.success(status === "approved" ? `Đã duyệt rút ${formatPrice(withdrawal.amount)} cho ${withdrawal.photographerName}` : `Đã từ chối yêu cầu của ${withdrawal.photographerName}`);
          setDecision(null);
        },
        onError: () => toast.error("Không thể xử lý yêu cầu trên backend."),
      }
    );
  };

  const confirmPayout = () => {
    if (!payoutTarget) return;
    const withdrawal = payoutTarget;
    processPayout.mutate(
      { id: withdrawal.id },
      {
        onSuccess: (updated) => {
          if (updated.status === "completed") {
            toast.success(`PayOS đã chuyển ${formatPrice(withdrawal.amount)} cho ${withdrawal.photographerName}`);
          } else if (["FAILED", "REJECTED", "CANCELLED"].includes(updated.payoutProviderStatus?.toUpperCase() ?? "")) {
            toast.error("PayOS báo lệnh chi thất bại. Tiền vẫn được giữ trong frozen; có thể thử lại.");
          } else {
            toast.info("PayOS đang xử lý lệnh chi. Tiền vẫn được giữ trong frozen cho đến khi xác nhận thành công.");
          }
          setPayoutTarget(null);
        },
        onError: () => toast.error("Không thể gửi hoặc kiểm tra lệnh chi PayOS."),
      }
    );
  };

  const checkingPayout = payoutTarget?.status === "processing";
  const retryingPayout = ["FAILED", "REJECTED", "CANCELLED"].includes(payoutTarget?.payoutProviderStatus?.toUpperCase() ?? "");

  const footer = filter === "pending" && !search && bank === "all" ? (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Hiển thị <strong className="font-semibold text-foreground">{data.length}</strong> kết quả chờ duyệt
        <span className="mx-2">•</span>
        Tổng giải ngân dự kiến: <strong className="font-semibold text-foreground">{formatPrice(pendingTotal)}</strong>
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-lg px-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-500/10"
        onClick={() => toast.info("Duyệt hàng loạt sẽ được bổ sung trong phiên bản tiếp theo.")}
      >
        <Check className="size-4" />
        Duyệt hàng loạt ({data.length} lệnh)
      </Button>
    </div>
  ) : undefined;

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <PageHeader
        className="mb-8"
        title="Rút tiền & quỹ"
        description="Duyệt yêu cầu rút tiền của nhiếp ảnh gia và theo dõi quỹ nền tảng."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-10 rounded-xl" onClick={exportCsv} disabled={data.length === 0}>
              <Download className="size-4" />
              Xuất báo cáo (CSV)
            </Button>
            <Button variant="outline" className="h-10 rounded-xl" onClick={() => toast.info("Cài đặt hạn mức và phí đang được hoàn thiện.")}>
              <SlidersHorizontal className="size-4" />
              Cài đặt hạn mức & phí
            </Button>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <FinanceMetricCard
          icon={Wallet}
          tone="green"
          badge="Ví hoạt động"
          value={finance?.walletReserve === undefined ? "Chưa có API" : formatPrice(finance.walletReserve)}
          label="Quỹ ví nhiếp ảnh gia"
          hint="Tổng số dư khả dụng và đang giữ trong ví người dùng"
        />
        <FinanceMetricCard
          icon={Coins}
          tone="orange"
          badge="Tỉ lệ 1:1 VNĐ"
          value={finance?.coinsOutstanding === undefined ? "Chưa có API" : `${formatCount(finance.coinsOutstanding)} xu`}
          label="Lens Xu đang lưu hành"
          hint="Backend chưa có ledger Lens Xu"
        />
        <FinanceMetricCard
          icon={Clock}
          tone="amber"
          badge={`${finance?.pendingCount ?? pendingList.length} yêu cầu cần xử lý`}
          value={finance?.pendingWithdrawalTotal === undefined ? formatPrice(pendingTotal) : formatPrice(finance.pendingWithdrawalTotal)}
          label="Đang chờ duyệt rút"
          hint={pendingList.length ? `Yêu cầu cũ nhất: ${formatRelative(pendingList[pendingList.length - 1].requestedAt)} trước` : "Không có yêu cầu đang chờ"}
        />
      </div>

      <div className="[&_[data-slot=status-tabs]]:rounded-xl [&_[data-slot=status-tabs]]:border-0 [&_[data-slot=status-tabs]]:bg-muted/70 [&_[data-slot=status-tabs]]:p-1 [&_[data-slot=status-tab-indicator]]:hidden [&_[role=tab]]:rounded-lg [&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab][data-selected=true]]:bg-slate-950 [&_[role=tab][data-selected=true]]:text-white [&_[role=tab][data-selected=true]]:dark:bg-slate-100 [&_[role=tab][data-selected=true]]:dark:text-slate-950 [&_[role=tab][data-selected=true]_span]:bg-orange-500 [&_[role=tab][data-selected=true]_span]:text-white">
        <DataTable
          table={table}
          recordCount={data.length}
          isLoading={isLoading && withdrawals.length === 0}
          toolbarClassName="md:w-[34rem]"
          footer={footer}
          className="rounded-2xl border-border/70 shadow-sm [&>div:first-child]:bg-transparent [&>div:first-child]:px-6 [&>div:first-child]:pb-5 [&>div:first-child]:pt-5 [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-5"
          tabs={{
            value: filter,
            onChange: setFilter,
            items: [
              { value: "pending", label: "Chờ duyệt", count: countOf("pending") },
              { value: "approved", label: "Đã duyệt", count: countOf("approved") },
              { value: "processing", label: "Đang chuyển", count: countOf("processing") },
              { value: "rejected", label: "Từ chối", count: countOf("rejected") },
              { value: "all", label: "Tất cả", count: withdrawals.length },
            ],
          }}
          toolbar={
            <div className="flex flex-wrap gap-2 md:justify-end">
              <div className="relative min-w-48 flex-1 md:min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên thợ, STK, mã GD..."
                  aria-label="Tìm yêu cầu rút tiền"
                  className="h-10 rounded-lg bg-background pl-9"
                />
              </div>
              <select
                value={bank}
                onChange={(event) => setBank(event.target.value)}
                aria-label="Lọc ngân hàng"
                className="h-10 min-w-36 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Lọc ngân hàng</option>
                {banks.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          }
          empty={<EmptyState bare icon={BanknoteArrowDown} title={filter === "pending" ? "Không có yêu cầu rút tiền nào chờ duyệt" : "Không có yêu cầu ở trạng thái này"} />}
        />
      </div>

      <ConfirmDialog
        open={!!decision}
        onOpenChange={(open) => !open && setDecision(null)}
        title={approving ? `Duyệt rút ${decision ? formatPrice(decision.withdrawal.amount) : ""}?` : "Từ chối yêu cầu rút tiền?"}
        description={
          approving
            ? `Yêu cầu sẽ được duyệt để chuyển về tài khoản ${decision?.withdrawal.bankName ? `${decision.withdrawal.bankName} (STK: ${decision.withdrawal.bankAccount})` : "ngân hàng"} của ${decision?.withdrawal.photographerName}. Tiền vẫn nằm trong frozen; admin sẽ tạo lệnh PayOS ở bước tiếp theo.`
            : `Yêu cầu bị từ chối; khoản tiền đang giữ sẽ được trả lại số dư khả dụng của ${decision?.withdrawal.photographerName}.`
        }
        confirmLabel={approving ? "Duyệt rút tiền" : "Từ chối"}
        destructive={!approving}
        pending={setStatus.isPending}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={!!payoutTarget}
        onOpenChange={(open) => {
          if (!open) setPayoutTarget(null);
        }}
        title={checkingPayout ? "Kiểm tra lệnh chi PayOS?" : retryingPayout ? "Thử lại lệnh chi PayOS?" : "Chuyển tiền qua PayOS?"}
        description={
          checkingPayout
            ? `Kiểm tra trạng thái lệnh chi ${formatPrice(payoutTarget?.amount ?? 0)} của ${payoutTarget?.photographerName ?? "nhiếp ảnh gia"}. Thao tác này không tạo lệnh chi mới.`
            : `PayOS sẽ chuyển ${formatPrice(payoutTarget?.amount ?? 0)} đến tài khoản ${payoutTarget?.bankName ?? "ngân hàng"} · ${payoutTarget?.bankAccount ?? ""} của ${payoutTarget?.photographerName ?? "nhiếp ảnh gia"}. Tiền chỉ rời frozen khi PayOS xác nhận thành công.`
        }
        confirmLabel={checkingPayout ? "Kiểm tra PayOS" : retryingPayout ? "Thử lại qua PayOS" : "Tạo lệnh chi"}
        pending={processPayout.isPending}
        onConfirm={confirmPayout}
      />
    </PageContainer>
  );
}
