import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Flag, Search } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  Input,
  PageContainer,
  PageHeader,
  StatCard,
  TONE_CHIP,
  type StatusTab,
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
import { ACTIONS } from "@/components/data-table/columns";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { useReports } from "@/queries/useReports";
import { formatDate, formatRelative } from "@/lib/format";
import type { ModerationReportStatus } from "@/types/backend-api";
import type { AdminModerationReport } from "@/services/reports";

type Filter = "all" | ModerationReportStatus;

const STATUS_META: Record<ModerationReportStatus, { label: string; className: string }> = {
  open: { label: "Mới gửi", className: TONE_CHIP.amber },
  resolved: { label: "Đã xử lý", className: TONE_CHIP.emerald },
  rejected: { label: "Không vi phạm", className: TONE_CHIP.rose },
  escalated: { label: "Chuyển cấp", className: TONE_CHIP.sky },
};

const TARGET_LABEL: Record<AdminModerationReport["targetType"], string> = {
  user: "Người dùng",
  booking: "Booking",
  photographer: "Nhiếp ảnh gia",
  portfolio: "Portfolio",
  feedback: "Đánh giá",
};

const STATUS_ORDER: ModerationReportStatus[] = ["open", "escalated", "resolved", "rejected"];

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

export function Reports() {
  "use no memo";
  const navigate = useNavigate();
  const { data: reports = [], isLoading, isError } = useReports();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const counts = useMemo(
    () => ({
      all: reports.length,
      ...Object.fromEntries(
        STATUS_ORDER.map((status) => [status, reports.filter((r) => r.status === status).length]),
      ),
    }),
    [reports],
  ) as Record<Filter, number>;

  const data = useMemo(() => {
    const query = fold(search.trim());
    return reports.filter((report) => {
      const inTab = filter === "all" || report.status === filter;
      const searchable = fold(
        `${report.id} ${report.targetType} ${report.targetId} ${report.reason} ${report.issueType ?? ""}`,
      );
      return inTab && (!query || searchable.includes(query));
    });
  }, [filter, reports, search]);

  const columns = useMemo<ColumnDef<AdminModerationReport>[]>(
    () => [
      {
        accessorKey: "targetType",
        header: ({ column }) => <ColumnHeader column={column} title="Đối tượng" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold">{TARGET_LABEL[row.original.targetType]}</p>
            <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
              {row.original.targetId}
            </p>
          </div>
        ),
        meta: { headerClassName: "min-w-44", cellClassName: "min-w-44" },
      },
      {
        accessorKey: "reason",
        header: ({ column }) => <ColumnHeader column={column} title="Nội dung báo cáo" />,
        cell: ({ row }) => (
          <div className="max-w-[30rem] min-w-64">
            <p className="truncate text-sm font-medium">
              {row.original.reason || "Không có mô tả"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.original.issueType ? `Phân loại: ${row.original.issueType}` : "Chưa phân loại"}
            </p>
          </div>
        ),
        meta: { headerClassName: "min-w-72", cellClassName: "min-w-72" },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <ColumnHeader column={column} title="Ngày gửi" />,
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            <p className="text-sm">
              {row.original.createdAt ? formatDate(row.original.createdAt) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.original.createdAt ? formatRelative(row.original.createdAt) : "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => (
          <StatusPill
            meta={STATUS_META[row.original.status]}
            className="border border-current/15 px-3 py-1.5"
          />
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Thao tác
          </span>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Link to={`/reports/${row.original.id}`} onClick={(event) => event.stopPropagation()}>
              <Eye className="size-4" />
              Xem chi tiết
            </Link>
          </Button>
        ),
        meta: ACTIONS,
      },
    ],
    [],
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

  const tabs: StatusTab<Filter>[] = [
    { value: "all", label: "Tất cả", count: counts.all },
    ...STATUS_ORDER.map((status) => ({
      value: status,
      label: STATUS_META[status].label,
      count: counts[status],
    })),
  ];

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <PageHeader
        className="mb-8"
        title="Báo cáo & thống kê"
        description="Tiếp nhận, kiểm tra bằng chứng, liên hệ người gửi và xử lý các báo cáo trên Lens."
      />

      {isError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Không tải được danh sách báo cáo từ backend.
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Flag}
          value={counts.all}
          label="Tổng báo cáo"
          className="rounded-2xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={Clock3}
          value={counts.open}
          label="Đang chờ xử lý"
          className="rounded-2xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={AlertTriangle}
          value={counts.escalated}
          label="Đang escalated"
          className="rounded-2xl border-border/70 shadow-sm"
        />
        <StatCard
          icon={CheckCircle2}
          value={counts.resolved}
          label="Đã xử lý"
          className="rounded-2xl border-border/70 shadow-sm"
        />
      </div>

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        onRowClick={(report) => navigate(`/reports/${report.id}`)}
        tabs={{ value: filter, onChange: setFilter, items: tabs }}
        toolbar={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã, đối tượng hoặc nội dung…"
              className="h-10 rounded-xl pl-9"
            />
          </div>
        }
        empty={
          <EmptyState
            icon={Flag}
            title="Chưa có báo cáo phù hợp"
            hint={
              search || filter !== "all"
                ? "Thử đổi bộ lọc hoặc từ khoá tìm kiếm."
                : "Backend chưa ghi nhận báo cáo nào."
            }
            bare
          />
        }
      />
    </PageContainer>
  );
}
