import { useMemo, useState } from "react";
import { Ban, RotateCcw, Search, UserX } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DataGridColumnHeader,
  Input,
  Skeleton,
  cn,
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
import { useUsers, useSetUserStatus } from "@/queries/useUsers";
import { ROLE_LABEL, USER_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import type { AdminUser, UserRole } from "@/types";

type RoleFilter = "all" | UserRole;

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "client", label: "Khách hàng" },
  { value: "photographer", label: "Nhiếp ảnh gia" },
];

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

export function Users() {
  // TanStack Table keeps mutable state on the table instance; the React
  // Compiler's memoization breaks its updates (sorting/pagination no-op).
  "use no memo";
  const { data: users = [], isLoading } = useUsers();
  const { mutate, isPending } = useSetUserStatus();
  const [role, setRole] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = role === "all" || u.role === role;
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, role, search]);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Người dùng" />,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={u.avatar} alt={u.name} />
                <AvatarFallback>{initialsOf(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium leading-tight">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
          );
        },
        size: 260,
      },
      {
        accessorKey: "role",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Vai trò" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{ROLE_LABEL[row.original.role]}</span>
        ),
      },
      {
        accessorKey: "city",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Khu vực" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.city}</span>
        ),
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tham gia" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.joinedAt)}</span>
        ),
      },
      {
        accessorKey: "bookingsCount",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Lượt đặt" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatCount(row.original.bookingsCount)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => {
          const status = USER_STATUS_META[row.original.status];
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
          const u = row.original;
          const suspended = u.status === "suspended";
          const toggle = () =>
            mutate(
              { id: u.id, status: suspended ? "active" : "suspended" },
              {
                onSuccess: () =>
                  toast.success(
                    suspended ? `Đã mở khoá ${u.name}` : `Đã tạm khoá ${u.name}`
                  ),
                onError: () => toast.error("Không thể cập nhật người dùng, vui lòng thử lại"),
              }
            );
          return (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={isPending}
              onClick={toggle}
            >
              {suspended ? (
                <>
                  <RotateCcw className="size-3.5" />
                  Mở khoá
                </>
              ) : (
                <>
                  <Ban className="size-3.5" />
                  Tạm khoá
                </>
              )}
            </Button>
          );
        },
        size: 150,
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
          Quản lý người dùng
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "Đang tải..." : `${formatCount(users.length)} tài khoản`}
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setRole(f.value)}
              aria-pressed={role === f.value}
              className={cn(
                "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                role === f.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="pl-9"
            aria-label="Tìm người dùng"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserX className="size-6" />
          </span>
          <p className="font-medium">Không tìm thấy người dùng phù hợp</p>
        </div>
      ) : (
        <DataTable table={table} recordCount={data.length} />
      )}
    </div>
  );
}
