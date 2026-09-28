import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock3, FileImage, ScanSearch, XCircle } from "lucide-react";
import { Button, PageContainer, PageHeader, StatCard, formatPrice } from "@lens/ui";
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
import { ACTIONS, NUM, chevronColumn } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { useApplications } from "@/queries/useApplications";
import { APPROVAL_STATUS_META } from "@/lib/status";
import { formatDate } from "@/lib/format";
import type { ApprovalStatus, PhotographerApplication } from "@/types";

type FilterValue = "all" | ApprovalStatus;

export function Photographers() {
  // TanStack Table keeps mutable state on the table instance; the React
  // Compiler's memoization breaks its updates (sorting/pagination no-op).
  "use no memo";
  const navigate = useNavigate();
  const { data: applications = [], isLoading } = useApplications();
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [sorting, setSorting] = useState<SortingState>([]);

  const countOf = (status: ApprovalStatus) => applications.filter((a) => a.status === status).length;
  const pendingCount = countOf("pending");
  const approvedCount = countOf("approved");
  const rejectedCount = countOf("rejected");
  const data = useMemo(
    () => (filter === "all" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter]
  );
  const open = (app: PhotographerApplication) => navigate(`/photographers/${app.id}`);

  const columns = useMemo<ColumnDef<PhotographerApplication>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <UserCell
              name={app.name}
              avatar={app.avatar}
              sub={`${app.styles.join(" · ")} · ${app.portfolio.length} ảnh`}
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
        accessorKey: "experienceYears",
        header: ({ column }) => <ColumnHeader column={column} title="Kinh nghiệm" align="right" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.experienceYears} năm</span>,
        meta: NUM,
      },
      {
        accessorKey: "pricePerSession",
        header: ({ column }) => <ColumnHeader column={column} title="Giá / buổi" align="right" />,
        cell: ({ row }) => <span className="text-sm font-medium">{formatPrice(row.original.pricePerSession)}</span>,
        meta: NUM,
      },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày gửi" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.submittedAt)}</span>,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={APPROVAL_STATUS_META[row.original.status]} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Hành động</span>,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <Button
              size="sm"
              className="rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                open(row.original);
              }}
            >
              <ScanSearch className="size-3.5" />
              Xem & duyệt
            </Button>
          ) : null,
        meta: ACTIONS,
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
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <div className="mb-6 rounded-3xl border border-border/70 bg-gradient-to-br from-muted/55 via-card to-card p-5 shadow-sm sm:p-6">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                <FileImage className="size-5" />
              </span>
              <span>Duyệt nhiếp ảnh gia</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Xem portfolio và quyết định hồ sơ mới. Chỉ hồ sơ đã duyệt mới được hiển thị công khai.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/70 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-xs dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <Clock3 className="size-3.5" />
              {pendingCount} hồ sơ cần xem
            </span>
          }
        />
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Clock3}
          value={pendingCount}
          label="Chờ duyệt"
          hint="Hồ sơ cần được kiểm tra"
          className="rounded-3xl border-amber-200/70 shadow-sm dark:border-amber-500/20"
        />
        <StatCard
          icon={CheckCircle2}
          value={approvedCount}
          label="Đã duyệt"
          hint="Đang hiển thị công khai"
          className="rounded-3xl border-emerald-200/70 shadow-sm dark:border-emerald-500/20"
        />
        <StatCard
          icon={XCircle}
          value={rejectedCount}
          label="Từ chối"
          hint="Hồ sơ chưa đạt yêu cầu"
          className="rounded-3xl border-border/70 shadow-sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Danh sách hồ sơ</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chọn một dòng để xem chi tiết portfolio và thông tin đăng ký.
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {data.length} hồ sơ
        </span>
      </div>

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        onRowClick={open}
        className="rounded-3xl border-border/70 shadow-sm"
        tabs={{
          value: filter,
          onChange: setFilter,
          items: [
            { value: "pending", label: "Chờ duyệt", count: countOf("pending") },
            { value: "approved", label: "Đã duyệt", count: countOf("approved") },
            { value: "rejected", label: "Từ chối", count: countOf("rejected") },
            { value: "all", label: "Tất cả", count: applications.length },
          ],
        }}
        empty={
          <EmptyState
            bare
            icon={FileImage}
            title={filter === "pending" ? "Không còn hồ sơ nào chờ duyệt" : "Không có hồ sơ ở trạng thái này"}
          />
        }
      />
    </PageContainer>
  );
}
