import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileImage, ScanSearch } from "lucide-react";
import { Button, PageContainer, PageHeader, formatPrice } from "@lens/ui";
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
    <PageContainer>
      <PageHeader
        title="Duyệt nhiếp ảnh gia"
        description="Xem portfolio và quyết định hồ sơ mới — chỉ hồ sơ đã duyệt mới hiển thị công khai."
      />

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        onRowClick={open}
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
