import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Camera,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Star,
  Wallet,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  formatPrice,
} from "@lens/ui";
import { clearSession, currentUser, hasRole } from "@/lib/session";
import { formatCoins } from "@/lib/wallet";
import { useCoinSummary, useWalletSummary } from "@/queries/useWallet";
import type { UserRole } from "@/types";

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

type MenuItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Roles allowed to see this menu item. */
  allow: UserRole[];
};

// Photographer's own area sits first (their primary workspace); the shared
// client-side items follow. Clients never see the photographer entry.
const menu: MenuItem[] = [
  { to: "/dashboard", label: "Khu vực nhiếp ảnh gia", icon: Camera, allow: ["photographer"] },
  { to: "/client", label: "Khu vực khách hàng", icon: LayoutDashboard, allow: ["client", "photographer"] },
  { to: "/client/bookings", label: "Lịch đặt của tôi", icon: CalendarCheck, allow: ["client", "photographer"] },
  { to: "/client/reviews", label: "Đánh giá của tôi", icon: Star, allow: ["client", "photographer"] },
  { to: "/messages", label: "Tin nhắn", icon: MessageSquare, allow: ["client", "photographer"] },
  { to: "/wallet", label: "Ví của tôi", icon: Wallet, allow: ["client", "photographer"] },
];

const itemClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";

/** One balance tile in the dropdown header — links to the wallet. */
function BalanceTile({
  label,
  value,
  hint,
  onNavigate,
}: {
  label: string;
  value: string;
  hint?: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      to="/wallet"
      onClick={onNavigate}
      className="flex flex-col gap-0.5 rounded-xl border border-border bg-background px-3 py-2 transition-colors hover:bg-muted"
    >
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-semibold">{value}</span>
      {hint && <span className="truncate text-[11px] text-amber-600 dark:text-amber-400">{hint}</span>}
    </Link>
  );
}

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hover-open on desktop while still supporting click/tap (pure HoverCard
  // would leave the menu unreachable on touch, and this is the only way into
  // the signed-in app from the public header).
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const openNow = () => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const { data: wallet } = useWalletSummary();
  const { data: coins } = useCoinSummary();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Tài khoản"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          className="rounded-full outline-none ring-offset-2 ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        className="w-72 overflow-hidden rounded-2xl p-0"
      >
        {/* User header */}
        <div className="flex items-center gap-3 bg-muted/50 p-4">
          <Avatar className="size-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>

        {/* Balances — wallet + Lens Xu, both link to /wallet */}
        <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
          <BalanceTile
            label="Số dư ví"
            value={wallet ? formatPrice(wallet.balance) : "…"}
            onNavigate={() => setOpen(false)}
          />
          <BalanceTile
            label="Lens Xu"
            value={coins ? formatCoins(coins.balance) : "…"}
            hint={coins && coins.expiringSoon > 0 ? `Sắp hết hạn ${formatCoins(coins.expiringSoon)}` : undefined}
            onNavigate={() => setOpen(false)}
          />
        </div>

        {/* Navigation */}
        <div className="p-1.5">
          {menu
            .filter((m) => hasRole(m.allow, currentUser.role))
            .map((m) => (
              <Link key={m.to} to={m.to} onClick={() => setOpen(false)} className={itemClass}>
                <m.icon className="size-4 text-muted-foreground" />
                {m.label}
              </Link>
            ))}
        </div>

        {/* Logout */}
        <div className="border-t border-border p-1.5">
          <a
            href={LANDING_URL}
            onClick={clearSession}
            className={cn(itemClass, "text-destructive hover:text-destructive")}
          >
            <LogOut className="size-4" />
            Đăng xuất
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
