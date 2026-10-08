import { TONE_CHIP } from "@lens/ui";
import type {
  AdminCollaborator,
  ApprovalStatus,
  EscrowStatus,
  RankId,
  StoragePlanTier,
  UserRole,
  UserStatus,
  WithdrawalStatus,
} from "@/types";

/** A status as shown in the console: VN label + tinted pill classes. */
export interface StatusMeta {
  label: string;
  className: string;
}

export const APPROVAL_STATUS_META: Record<ApprovalStatus, StatusMeta> = {
  pending: { label: "Chờ duyệt", className: TONE_CHIP.amber },
  approved: { label: "Đã duyệt", className: TONE_CHIP.emerald },
  rejected: { label: "Từ chối", className: TONE_CHIP.rose },
};

export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  active: { label: "Hoạt động", className: TONE_CHIP.emerald },
  suspended: { label: "Tạm khoá", className: TONE_CHIP.rose },
};

export const ROLE_META: Record<UserRole, StatusMeta> = {
  client: { label: "Khách hàng", className: TONE_CHIP.neutral },
  photographer: { label: "Nhiếp ảnh gia", className: "text-foreground ring-1 ring-inset ring-foreground/25" },
};

export const WITHDRAWAL_STATUS_META: Record<WithdrawalStatus, StatusMeta> = {
  pending: { label: "Chờ duyệt", className: TONE_CHIP.amber },
  approved: { label: "Đã duyệt", className: TONE_CHIP.emerald },
  rejected: { label: "Từ chối", className: TONE_CHIP.rose },
  completed: { label: "Đã chuyển tiền", className: TONE_CHIP.emerald },
};

// Same hues as the portal's booking statuses.
export const ESCROW_STATUS_META: Record<EscrowStatus, StatusMeta> = {
  awaiting_deposit: { label: "Chờ đặt cọc", className: TONE_CHIP.ember },
  pending: { label: "Chờ xác nhận", className: TONE_CHIP.amber },
  confirmed: { label: "Chờ thanh toán", className: TONE_CHIP.sky },
  held: { label: "Sàn đang giữ tiền", className: TONE_CHIP.violet },
  released: { label: "Hoàn thành", className: TONE_CHIP.emerald },
  cancelled: { label: "Đã huỷ", className: TONE_CHIP.neutral },
};

export const COLLAB_STATUS_META: Record<AdminCollaborator["status"], StatusMeta> = {
  invited: { label: "Đã mời", className: TONE_CHIP.amber },
  accepted: { label: "Đã nhận", className: TONE_CHIP.emerald },
  declined: { label: "Từ chối", className: TONE_CHIP.rose },
};

// Plans are ordered (Free < Pro < Studio): light → dark on the ordinal ramp.
export const STORAGE_PLAN_META: Record<StoragePlanTier, StatusMeta & { color: string }> = {
  free: { label: "Free", className: TONE_CHIP.neutral, color: "var(--ordinal-1)" },
  pro: { label: "Pro", className: "bg-muted text-foreground", color: "var(--ordinal-3)" },
  studio: { label: "Studio", className: "text-foreground ring-1 ring-inset ring-foreground/25", color: "var(--ordinal-5)" },
};

// Matches the portal's rank colours: copper bronze, clearly apart from gold.
export const RANK_META: Record<RankId, StatusMeta & { color: string }> = {
  newbie: { label: "Tân binh", className: TONE_CHIP.neutral, color: "#a1a1aa" },
  bronze: {
    label: "Thợ Đồng",
    className: "bg-[#f4e4d8] text-[#7c4420] dark:bg-[#b0703f]/20 dark:text-[#e3a978]",
    color: "#b0703f",
  },
  silver: {
    label: "Thợ Bạc",
    className: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    color: "#94a3b8",
  },
  gold: {
    label: "Thợ Vàng",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
    color: "#eab308",
  },
  diamond: { label: "Thợ Kim Cương", className: TONE_CHIP.sky, color: "#6366f1" },
};
