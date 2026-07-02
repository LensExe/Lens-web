import type {
  ApprovalStatus,
  EscrowStatus,
  RankId,
  StoragePlanTier,
  UserRole,
  UserStatus,
  WithdrawalStatus,
} from "@/types";

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

const TINT = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  muted: "bg-muted text-muted-foreground",
} as const;

export const WITHDRAWAL_STATUS_META: Record<
  WithdrawalStatus,
  { label: string; className: string }
> = {
  pending: { label: "Chờ duyệt", className: TINT.amber },
  approved: { label: "Đã duyệt", className: TINT.emerald },
  rejected: { label: "Từ chối", className: TINT.rose },
};

export const ESCROW_STATUS_META: Record<
  EscrowStatus,
  { label: string; className: string }
> = {
  pending: { label: "Chờ xác nhận", className: TINT.amber },
  confirmed: { label: "Đã xác nhận", className: TINT.blue },
  held: { label: "Đang giữ tiền", className: TINT.violet },
  released: { label: "Hoàn thành", className: TINT.emerald },
  cancelled: { label: "Đã huỷ", className: TINT.muted },
};

export const STORAGE_PLAN_META: Record<
  StoragePlanTier,
  { label: string; className: string }
> = {
  free: { label: "Free", className: TINT.muted },
  pro: { label: "Pro", className: TINT.blue },
  studio: { label: "Studio", className: TINT.violet },
};

export const RANK_META: Record<RankId, { label: string; className: string }> = {
  newbie: { label: "Tân binh", className: TINT.muted },
  bronze: { label: "Đồng", className: TINT.amber },
  silver: { label: "Bạc", className: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" },
  gold: { label: "Vàng", className: TINT.amber },
  diamond: { label: "Kim Cương", className: TINT.blue },
};
