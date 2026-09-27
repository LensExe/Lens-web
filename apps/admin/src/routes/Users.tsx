import { useMemo, useState } from "react";
import { Ban, Camera, RotateCcw, Search, UserRound, UserX, Users as UsersIcon } from "lucide-react";
import { Button, Input, PageContainer, PageHeader, StatCard, toast } from "@lens/ui";
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
import { useSetUserStatus, useUsers } from "@/queries/useUsers";
import { ROLE_META, USER_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import type { AdminUser } from "@/types";

type Filter = "all" | "client" | "photographer" | "suspended";

// Accent-insensitive search ("thuy an" finds "Thuý An").
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

export function Users() {
  // TanStack Table keeps mutable state on the table instance; the React
  // Compiler's memoization breaks its updates (sorting/pagination no-op).
  "use no memo";
  const { data: users = [], isLoading } = useUsers();
  const setStatus = useSetUserStatus();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [target, setTarget] = useState<AdminUser | null>(null);

  const count = {
    all: users.length,
    client: users.filter((u) => u.role === "client").length,
    photographer: users.filter((u) => u.role === "photographer").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const data = useMemo(() => {
    const q = fold(search.trim());
    return users.filter((u) => {
      const inTab =
        filter === "all" ||
        (filter === "suspended" ? u.status === "suspended" : u.role === filter);
      return inTab && (!q || fold(`${u.name} ${u.email}`).includes(q));
    });
  }, [users, filter, search]);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <ColumnHeader column={column} title="Người dùng" />,
        cell: ({ row }) => <UserCell name={row.original.name} avatar={row.original.avatar} sub={row.original.email} />,
      },
      {
        accessorKey: "role",
        header: ({ column }) => <ColumnHeader column={column} title="Vai trò" />,
        cell: ({ row }) => <StatusPill meta={ROLE_META[row.original.role]} dot={false} />,
      },
      {
        accessorKey: "city",
        header: ({ column }) => <ColumnHeader column={column} title="Khu vực" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.city}</span>,
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => <ColumnHeader column={column} title="Tham gia" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.joinedAt)}</span>,
      },
      {
        accessorKey: "bookingsCount",
        header: ({ column }) => <ColumnHeader column={column} title="Lượt đặt" align="right" />,
        cell: ({ row }) => <span className="text-sm font-medium">{formatCount(row.original.bookingsCount)}</span>,
        meta: NUM,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => <StatusPill meta={USER_STATUS_META[row.original.status]} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Hành động</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          const suspended = u.status === "suspended";
          const busy = setStatus.isPending && setStatus.variables?.id === u.id;
          return (
            <Button
              size="sm"
              variant="outline"
              className={
                suspended
                  ? "rounded-full"
                  : "rounded-full hover:border-rose-300 hover:text-rose-700 dark:hover:text-rose-400"
              }
              disabled={busy}
              onClick={() => setTarget(u)}
            >
              {suspended ? <RotateCcw className="size-3.5" /> : <Ban className="size-3.5" />}
              {suspended ? "Mở khoá" : "Tạm khoá"}
            </Button>
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

  const unlocking = target?.status === "suspended";
  const confirm = () => {
    if (!target) return;
    const u = target;
    setStatus.mutate(
      { id: u.id, status: unlocking ? "active" : "suspended" },
      {
        onSuccess: () => {
          toast.success(unlocking ? `Đã mở khoá ${u.name}` : `Đã tạm khoá ${u.name}`);
          setTarget(null);
        },
        onError: () => toast.error("Không thể cập nhật người dùng, vui lòng thử lại"),
      }
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Người dùng" description="Tài khoản khách hàng và nhiếp ảnh gia trên nền tảng." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UsersIcon} value={formatCount(count.all)} label="Tổng tài khoản" />
        <StatCard icon={UserRound} value={formatCount(count.client)} label="Khách hàng" />
        <StatCard icon={Camera} value={formatCount(count.photographer)} label="Nhiếp ảnh gia" />
        <StatCard icon={Ban} value={formatCount(count.suspended)} label="Đang bị khoá" />
      </div>

      <DataTable
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        tabs={{
          value: filter,
          onChange: setFilter,
          items: [
            { value: "all", label: "Tất cả", count: count.all },
            { value: "client", label: "Khách hàng", count: count.client },
            { value: "photographer", label: "Nhiếp ảnh gia", count: count.photographer },
            { value: "suspended", label: "Bị khoá", count: count.suspended },
          ],
        }}
        toolbar={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="h-9 rounded-full pl-9"
              aria-label="Tìm người dùng"
            />
          </div>
        }
        empty={<EmptyState bare icon={UserX} title="Không tìm thấy người dùng phù hợp" />}
      />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title={unlocking ? `Mở khoá tài khoản ${target?.name}?` : `Tạm khoá tài khoản ${target?.name}?`}
        description={
          unlocking
            ? "Người dùng có thể đăng nhập và sử dụng Lens trở lại."
            : "Người dùng sẽ không thể đăng nhập, đặt lịch hay nhận lịch cho tới khi được mở khoá."
        }
        confirmLabel={unlocking ? "Mở khoá" : "Tạm khoá"}
        destructive={!unlocking}
        pending={setStatus.isPending}
        onConfirm={confirm}
      />
    </PageContainer>
  );
}
