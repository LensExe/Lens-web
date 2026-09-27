import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  CalendarRange,
  HardDrive,
  LayoutDashboard,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { AdminQueue } from "@/types";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Queue count shown as a badge (things waiting on an admin). */
  badge?: Exclude<keyof AdminQueue, "pendingWithdrawalTotal">;
}

export interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

export const NAV_GROUPS: AdminNavGroup[] = [
  { items: [{ to: "/", label: "Tổng quan", icon: LayoutDashboard }] },
  {
    label: "Vận hành",
    items: [
      {
        to: "/photographers",
        label: "Duyệt nhiếp ảnh gia",
        icon: UserCheck,
        badge: "pendingApplications",
      },
      { to: "/users", label: "Người dùng", icon: Users },
      { to: "/bookings", label: "Đặt lịch & ghép thợ", icon: CalendarRange },
    ],
  },
  {
    label: "Tài chính",
    items: [
      {
        to: "/finance",
        label: "Rút tiền & quỹ",
        icon: Wallet,
        badge: "pendingWithdrawals",
      },
      {
        to: "/storage",
        label: "Lưu trữ ảnh",
        icon: HardDrive,
        badge: "overQuota",
      },
    ],
  },
  {
    label: "Chất lượng & báo cáo",
    items: [
      { to: "/quality", label: "Hạng & AI", icon: Award },
      { to: "/reports", label: "Báo cáo & thống kê", icon: BarChart3 },
    ],
  },
];

/** Header title for the current page (the section it belongs to). */
export function titleFor(pathname: string): string {
  for (const group of NAV_GROUPS)
    for (const item of group.items)
      if (item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`))
        return item.label;
  return "Quản trị";
}
