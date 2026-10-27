import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  PageContainer,
  PageHeader,
  Skeleton,
  TONE_CHIP,
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
import { Link, useParams } from "react-router-dom";
import { ColumnHeader } from "@/components/data-table/ColumnHeader";
import { ACTIONS, NUM } from "@/components/data-table/columns";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { UserCell } from "@/components/UserCell";
import { APPROVAL_STATUS_META, ROLE_META, USER_STATUS_META } from "@/lib/status";
import { formatCount, formatDate } from "@/lib/format";
import {
  useAdminCustomerProfile,
  useAdminUserAccount,
  useAdminUserBookings,
  useUsers,
} from "@/queries/useUsers";
import type { AdminUserBooking } from "@/types";

const BOOKING_STATUS_META: Record<AdminUserBooking["status"], { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: TONE_CHIP.amber },
  accepted: { label: "Đã xác nhận", className: TONE_CHIP.sky },
  rejected: { label: "Đã từ chối", className: TONE_CHIP.rose },
  cancelled: { label: "Đã huỷ", className: TONE_CHIP.neutral },
  expired: { label: "Hết hạn", className: TONE_CHIP.neutral },
  in_progress: { label: "Đang thực hiện", className: TONE_CHIP.violet },
  shot: { label: "Đã chụp", className: TONE_CHIP.violet },
  completed: { label: "Hoàn thành", className: TONE_CHIP.emerald },
};

const PHOTOGRAPHER_STATUS_META = {
  unverified: APPROVAL_STATUS_META.unverified,
  pending: APPROVAL_STATUS_META.pending,
  verified: APPROVAL_STATUS_META.approved,
  rejected: APPROVAL_STATUS_META.rejected,
};

const GENDER_LABEL: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };
const STYLE_LABEL: Record<string, string> = {
  portrait: "Chân dung",
  vintage: "Vintage",
  korean: "Phong cách Hàn Quốc",
  wedding: "Cưới",
  concept: "Concept",
  "pre-wedding": "Ảnh cưới trước lễ",
  beach: "Biển",
  lifestyle: "Đời thường",
  event: "Sự kiện",
  corporate: "Doanh nghiệp",
  family: "Gia đình",
  outdoor: "Ngoại cảnh",
  kids: "Trẻ em",
  streetwear: "Thời trang đường phố",
  fashion: "Thời trang",
  film: "Ảnh film",
  maternity: "Ảnh bầu",
  commercial: "Thương mại",
};

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{children || "—"}</div>
    </div>
  );
}

function StyleTags({ values }: { values: string[] }) {
  return values.length ? (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-xl bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {STYLE_LABEL[value] ?? value}
        </span>
      ))}
    </div>
  ) : "—";
}

export function UserDetail() {
  "use no memo";
  const { id = "" } = useParams();
  const usersQuery = useUsers();
  const accountQuery = useAdminUserAccount(id);
  const bookingsQuery = useAdminUserBookings(id);
  const user = usersQuery.data?.find((item) => item.id === id);
  const customerId = user?.customerProfile?.id ?? "";
  const customerQuery = useAdminCustomerProfile(customerId);
  const [sorting, setSorting] = useState<SortingState>([]);

  const bookings = bookingsQuery.data ?? [];
  const completedCount = bookings.filter((booking) => booking.status === "completed").length;
  const activeCount = bookings.filter((booking) =>
    ["pending", "accepted", "in_progress", "shot"].includes(booking.status),
  ).length;
  const paidTotal = bookings.reduce((sum, booking) => sum + booking.paidAmount, 0);

  const columns = useMemo<ColumnDef<AdminUserBooking>[]>(
    () => [
      {
        accessorKey: "style",
        header: ({ column }) => <ColumnHeader column={column} title="Buổi chụp" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{row.original.style}</p>
            <p className="mt-1 text-xs uppercase tabular-nums text-muted-foreground">#{row.original.id}</p>
          </div>
        ),
        meta: { headerClassName: "min-w-40", cellClassName: "min-w-40" },
      },
      {
        accessorKey: "customerName",
        header: ({ column }) => <ColumnHeader column={column} title="Khách hàng" />,
        cell: ({ row }) => <UserCell name={row.original.customerName} avatar={row.original.customerAvatar} />,
        meta: { headerClassName: "min-w-48", cellClassName: "min-w-48" },
      },
      {
        accessorKey: "photographerName",
        header: ({ column }) => <ColumnHeader column={column} title="Nhiếp ảnh gia" />,
        cell: ({ row }) => <UserCell name={row.original.photographerName} avatar={row.original.photographerAvatar} />,
        meta: { headerClassName: "min-w-48", cellClassName: "min-w-48" },
      },
      {
        accessorKey: "date",
        header: ({ column }) => <ColumnHeader column={column} title="Lịch chụp" />,
        cell: ({ row }) => (
          <div>
            <p className="text-sm tabular-nums">{row.original.date ? formatDate(row.original.date) : "—"}</p>
            <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground">{row.original.location}</p>
          </div>
        ),
        meta: { headerClassName: "min-w-32", cellClassName: "min-w-32" },
      },
      {
        accessorKey: "price",
        header: ({ column }) => <ColumnHeader column={column} title="Giá trị" align="right" />,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatPrice(row.original.price)}</span>,
        meta: NUM,
      },
      {
        accessorKey: "status",
        header: ({ column }) => <ColumnHeader column={column} title="Trạng thái" />,
        cell: ({ row }) => (
          <StatusPill
            meta={BOOKING_STATUS_META[row.original.status]}
            className="border border-current/15 px-3 py-1.5 text-xs"
          />
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Thao tác</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="sm" className="h-10 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Link to={`/bookings/${row.original.id}`}>
              <Eye className="size-4" />
              Chi tiết
            </Link>
          </Button>
        ),
        meta: ACTIONS,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    getRowId: (row) => row.id,
  });

  if (usersQuery.isLoading && !user) {
    return (
      <PageContainer>
        <Skeleton className="mb-5 h-5 w-40" />
        <Skeleton className="h-12 w-72" />
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="mt-7 h-80 rounded-2xl" />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">{usersQuery.isError ? "Không tải được thông tin người dùng" : "Không tìm thấy người dùng"}</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {usersQuery.isError ? "Vui lòng thử tải lại danh sách người dùng." : "Tài khoản có thể đã bị xoá hoặc không còn trong danh sách."}
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/users"><ArrowLeft className="size-4" />Quay lại danh sách</Link>
        </Button>
      </PageContainer>
    );
  }

  const customerProfile = customerQuery.data ?? user.customerProfile;
  const photographerProfile = user.photographerProfile;

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <Button asChild variant="ghost" className="mb-4 -ml-3 rounded-xl text-muted-foreground">
        <Link to="/users"><ArrowLeft className="size-4" />Quay lại danh sách người dùng</Link>
      </Button>

      <PageHeader
        className="mb-7"
        title={
          <span className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback>{user.name.split(" ").slice(-2).map((word) => word[0]).join("")}</AvatarFallback>
            </Avatar>
            <span className="truncate">{user.name}</span>
          </span>
        }
        description={user.email || "Tài khoản Lens"}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusPill meta={ROLE_META[user.role]} dot={false} className="px-3 py-1.5" />
            <StatusPill meta={USER_STATUS_META[user.status]} className="px-3 py-1.5" />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={CalendarDays} label="Tổng booking" value={formatCount(bookings.length)} />
        <SummaryMetric icon={CheckCircle2} label="Đã hoàn thành" value={formatCount(completedCount)} />
        <SummaryMetric icon={Clock3} label="Đang xử lý" value={formatCount(activeCount)} />
        <SummaryMetric icon={WalletCards} label="Đã thanh toán" value={formatPrice(paidTotal)} />
      </div>

      <div className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {photographerProfile ? <Camera className="size-5" /> : <UserRound className="size-5" />}
            </span>
            <div>
              <h2 className="font-semibold">Hồ sơ</h2>
              <p className="text-sm text-muted-foreground">Thông tin vai trò trên Lens</p>
            </div>
          </div>

          <div className="space-y-5">
            {customerProfile && (
              <div className="space-y-4">
                {photographerProfile && <p className="text-xs font-semibold uppercase text-muted-foreground">Hồ sơ khách hàng</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Khu vực"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" />{customerProfile.location}</span></DetailItem>
                  <DetailItem label="Phong cách quan tâm"><StyleTags values={customerProfile.preferredStyles} /></DetailItem>
                </div>
                {customerProfile.description && <DetailItem label="Giới thiệu / nhu cầu">{customerProfile.description}</DetailItem>}
              </div>
            )}

            {photographerProfile && (
              <div className="space-y-4">
                {customerProfile && <div className="border-t border-border/70 pt-5"><p className="text-xs font-semibold uppercase text-muted-foreground">Hồ sơ nhiếp ảnh gia</p></div>}
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Khu vực"><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" />{photographerProfile.location}</span></DetailItem>
                  <DetailItem label="Trạng thái hồ sơ">
                    <StatusPill
                      meta={PHOTOGRAPHER_STATUS_META[photographerProfile.verificationStatus as keyof typeof PHOTOGRAPHER_STATUS_META] ?? APPROVAL_STATUS_META.unverified}
                      className="px-2.5 py-1"
                    />
                  </DetailItem>
                  <DetailItem label="Giá khởi điểm">{photographerProfile.startingPrice ? formatPrice(photographerProfile.startingPrice) : "Chưa có gói chụp"}</DetailItem>
                  <DetailItem label="Ảnh trong portfolio">{formatCount(photographerProfile.portfolioCount)}</DetailItem>
                  <DetailItem label="Bắt đầu hoạt động">{photographerProfile.careerStartYear ?? "—"}</DetailItem>
                  <DetailItem label="Nhận booking">
                    <StatusPill
                      meta={photographerProfile.isAvailable
                        ? { label: "Đang nhận lịch", className: TONE_CHIP.emerald }
                        : { label: "Tạm ngưng", className: TONE_CHIP.neutral }}
                      className="px-2.5 py-1"
                    />
                  </DetailItem>
                  <div className="sm:col-span-2"><DetailItem label="Phong cách"><StyleTags values={photographerProfile.styles} /></DetailItem></div>
                </div>
                {photographerProfile.description && <DetailItem label="Giới thiệu">{photographerProfile.description}</DetailItem>}
              </div>
            )}

            {!customerProfile && !photographerProfile && (
              <EmptyState bare icon={UserRound} title="Chưa có hồ sơ vai trò" hint="Tài khoản chưa có hồ sơ khách hàng hoặc nhiếp ảnh gia." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Phone className="size-5" /></span>
            <div>
              <h2 className="font-semibold">Thông tin tài khoản</h2>
              <p className="text-sm text-muted-foreground">Chi tiết tài khoản người dùng</p>
            </div>
          </div>
          {accountQuery.isError && <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">Không tải được một số thông tin tài khoản.</p>}
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="Email">{user.email}</DetailItem>
            <DetailItem label="Số điện thoại">{accountQuery.data?.phoneNumber ?? "—"}</DetailItem>
            <DetailItem label="Ngày sinh">{accountQuery.data?.dob ? formatDate(accountQuery.data.dob) : "—"}</DetailItem>
            <DetailItem label="Giới tính">
              {accountQuery.data?.gender ? GENDER_LABEL[accountQuery.data.gender] ?? accountQuery.data.gender : "—"}
            </DetailItem>
            <DetailItem label="Ngày tham gia">{user.joinedAt ? formatDate(user.joinedAt) : "—"}</DetailItem>
            <DetailItem label="Mã người dùng"><span className="font-mono text-xs">{user.id}</span></DetailItem>
          </div>
        </section>
      </div>

      <section>
        <PageHeader
          className="mb-4"
          title="Lịch sử booking"
          description={user.role === "photographer" ? "Các lịch khách hàng đã đặt với nhiếp ảnh gia này." : "Các lịch người dùng đã đặt với nhiếp ảnh gia."}
        />
        {bookingsQuery.isError && <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Không tải được lịch sử booking. Hãy thử tải lại trang.</p>}
        <DataTable
          table={table}
          recordCount={bookings.length}
          isLoading={bookingsQuery.isLoading}
          className="rounded-2xl border-border/70 shadow-sm [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-4"
          empty={<EmptyState bare icon={CalendarDays} title="Chưa có booking" hint="Lịch sử đặt lịch của người dùng sẽ xuất hiện tại đây." />}
        />
      </section>
    </PageContainer>
  );
}
