import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, LayoutDashboard, LogOut, Settings, Wallet } from "lucide-react";
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
import { clearSession, currentUser } from "@/lib/session";
import { COIN_LABEL, formatXu } from "@/lib/wallet";
import { useCoinSummary, useWalletSummary } from "@/queries/useWallet";
import { useMyProfile } from "@/queries/useProfile";

const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

type MenuItem = { to: string; label: string; icon: typeof LayoutDashboard };

// Account things only. Clients reach their pages from the top navigation and
// messages from the header icon; photographers get a way back into the studio
// (and to their public profile) from anywhere.
const ACCOUNT_ITEMS: MenuItem[] = [
  { to: "/wallet", label: "Ví của tôi", icon: Wallet },
  { to: "/settings", label: "Cài đặt", icon: Settings },
];
const menuFor = (): MenuItem[] =>
  currentUser.role === "photographer"
    ? [
        { to: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
        { to: `/photographers/${currentUser.id}`, label: "Xem hồ sơ công khai", icon: Eye },
        ...ACCOUNT_ITEMS,
      ]
    : ACCOUNT_ITEMS;

const itemClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground";

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

  const { data: profile } = useMyProfile();
  const name = profile?.name ?? currentUser.name;
  const avatarSrc = profile?.avatar ?? currentUser.avatar;
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
            <AvatarImage src={avatarSrc} alt={name} />
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
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>

        {/* Balances — one block linking to the wallet; full values, never cut */}
        <Link
          to="/wallet"
          onClick={() => setOpen(false)}
          className="block border-b border-border px-4 py-3 transition-colors hover:bg-muted/60"
        >
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Ví tiền</dt>
              <dd className="font-semibold tabular-nums">{wallet ? formatPrice(wallet.balance) : "…"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{COIN_LABEL}</dt>
              <dd className="font-semibold tabular-nums">{coins ? formatXu(coins.balance) : "…"}</dd>
            </div>
          </dl>
          {coins && coins.expiringSoon > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {formatXu(coins.expiringSoon)} sắp hết hạn
            </p>
          )}
        </Link>

        {/* Navigation */}
        <div className="p-1.5">
          {menuFor().map((m) => (
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
