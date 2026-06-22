import { useMemo, useState } from "react";
import { Check, FileImage, X } from "lucide-react";
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
import { useApplications, useSetApplicationStatus } from "@/queries/useApplications";
import { APPROVAL_STATUS_META } from "@/lib/status";
import { formatDate } from "@/lib/format";
import type { ApprovalStatus, PhotographerApplication } from "@/types";

type FilterValue = "all" | ApprovalStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: APPROVAL_STATUS_META.pending.label },
  { value: "approved", label: APPROVAL_STATUS_META.approved.label },
  { value: "rejected", label: APPROVAL_STATUS_META.rejected.label },
];

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function Photographers() {
  // TanStack Table keeps mutable state on the table instance; the React
  // Compiler's memoization breaks its updates (sorting/pagination no-op).
  "use no memo";
  const { data: applications = [], isLoading } = useApplications();
  const { mutate, isPending } = useSetApplicationStatus();
  const [filter, setFilter] = useState<FilterValue>("pending");
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(
    () =>
      filter === "all" ? applications : applications.filter((a) => a.status === filter),
    [applications, filter]
  );
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  const columns = useMemo<ColumnDef<PhotographerApplication>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => {
          const app = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={app.avatar} alt={app.name} />
                <AvatarFallback>{initialsOf(app.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium leading-tight">{app.name}</p>
                <p className="text-xs text-muted-foreground">{app.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {app.styles.join(" · ")} · {app.portfolioCount} ảnh
                </p>
              </div>
            </div>
          );
        },
        size: 280,
      },
      {
        accessorKey: "city",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Khu vực" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.city}</span>
        ),
      },
      {
        accessorKey: "experienceYears",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Kinh nghiệm" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.experienceYears} năm
          </span>
        ),
      },
      {
        accessorKey: "pricePerSession",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Giá / buổi" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatPrice(row.original.pricePerSession)}</span>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Ngày gửi" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.submittedAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => {
          const status = APPROVAL_STATUS_META[row.original.status];
          return (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
              {status.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Hành động" />,
        enableSorting: false,
        cell: ({ row }) => {
          const app = row.original;
          if (app.status !== "pending") {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const decide = (status: "approved" | "rejected") =>
            mutate(
              { id: app.id, status },
              {
                onSuccess: () =>
                  toast.success(
                    status === "approved"
                      ? `Đã duyệt hồ sơ của ${app.name}`
                      : `Đã từ chối hồ sơ của ${app.name}`
                  ),
                onError: () => toast.error("Không thể cập nhật hồ sơ, vui lòng thử lại"),
              }
            );
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={isPending}
                onClick={() => decide("rejected")}
              >
                <X className="size-3.5" />
                Từ chối
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                disabled={isPending}
                onClick={() => decide("approved")}
              >
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
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Duyệt nhiếp ảnh gia
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Đang tải..."
            : pendingCount > 0
              ? `${pendingCount} hồ sơ đang chờ duyệt`
              : "Không có hồ sơ nào đang chờ"}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              filter === f.value
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
            <FileImage className="size-6" />
          </span>
          <p className="font-medium">Không có hồ sơ ở trạng thái này</p>
        </div>
      ) : (
        <DataTable table={table} recordCount={data.length} />
      )}
    </div>
  );
}
