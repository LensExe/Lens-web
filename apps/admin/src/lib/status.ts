import type { ApprovalStatus, UserRole, UserStatus } from "@/types";

/** VN label + subtle tinted pill per application status. */
export const APPROVAL_STATUS_META: Record<
  ApprovalStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  rejected: {
    label: "Từ chối",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  },
};

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Hoạt động",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  suspended: {
    label: "Tạm khoá",
    className: "bg-muted text-muted-foreground",
  },
};

export const ROLE_LABEL: Record<UserRole, string> = {
  client: "Khách hàng",
  photographer: "Nhiếp ảnh gia",
};
