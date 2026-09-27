import type { LucideIcon } from "lucide-react";
import {
  Bot,
  CalendarCheck,
  CalendarDays,
  Compass,
  HardDrive,
  ImageIcon,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Star,
  Trophy,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Omitted for the first, unlabeled group. */
  label?: string;
  items: NavItem[];
}

export interface ClientLink extends NavItem {
  /** Whether this link owns the current page (drives the active state). */
  match: (pathname: string) => boolean;
}

// Clients have only a few destinations, so they get a top navigation shared
// with the public pages (browsing ↔ their bookings feels like one site).
// Wallet and settings live in the avatar menu; messages in the header icon.
export const CLIENT_LINKS: ClientLink[] = [
  {
    to: "/",
    label: "Khám phá",
    icon: Compass,
    match: (p) => p === "/" || p.startsWith("/photographers"),
  },
  { to: "/client", label: "Tổng quan", icon: LayoutDashboard, match: (p) => p === "/client" },
  {
    to: "/client/bookings",
    label: "Lịch đặt",
    icon: CalendarCheck,
    match: (p) => p.startsWith("/client/bookings"),
  },
  { to: "/client/reviews", label: "Đánh giá", icon: Star, match: (p) => p.startsWith("/client/reviews") },
];

// Photographers run a studio with many tools — a grouped sidebar.
export const STUDIO_NAV: NavGroup[] = [
  {
    items: [{ to: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard }],
  },
  {
    label: "Công việc",
    items: [
      { to: "/dashboard/bookings", label: "Quản lý đặt lịch", icon: Inbox },
      { to: "/dashboard/availability", label: "Lịch làm việc", icon: CalendarDays },
      { to: "/messages", label: "Tin nhắn", icon: MessageSquare },
    ],
  },
  {
    label: "Hồ sơ & dịch vụ",
    items: [
      { to: "/dashboard/portfolio", label: "Hồ sơ năng lực", icon: ImageIcon },
      { to: "/dashboard/packages", label: "Gói dịch vụ", icon: Package },
      { to: "/dashboard/storage", label: "Lưu trữ ảnh", icon: HardDrive },
    ],
  },
  {
    label: "Phát triển",
    items: [
      { to: "/dashboard/achievements", label: "Thành tựu", icon: Trophy },
      { to: "/dashboard/assistant", label: "Trợ lý AI", icon: Bot },
    ],
  },
  {
    label: "Tài khoản",
    items: [
      { to: "/wallet", label: "Ví của tôi", icon: Wallet },
      { to: "/settings", label: "Cài đặt", icon: Settings },
    ],
  },
];

/** Where the Lens logo leads: photographers to their studio (the browse page is
 *  for clients and guests), everyone else to browsing. */
export function logoHref(role: UserRole | undefined): string {
  return role === "photographer" ? "/dashboard" : "/";
}

/** Each role's workspace home (where the wrong-area guard sends them). */
export function homeFor(role: UserRole): string {
  return role === "photographer" ? "/dashboard" : "/client";
}

/** Studio header title: the sidebar item owning `pathname` (longest prefix). */
export function studioTitleFor(pathname: string): string | undefined {
  let best: NavItem | undefined;
  for (const item of STUDIO_NAV.flatMap((g) => g.items)) {
    const owns = pathname === item.to || pathname.startsWith(`${item.to}/`);
    if (owns && (!best || item.to.length > best.to.length)) best = item;
  }
  return best?.label;
}
