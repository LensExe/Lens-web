import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@lens/ui";
import { clearSession, currentUser } from "@/lib/session";
import { LANDING_URL } from "@/lib/links";
import { useMyProfile } from "@/queries/useProfile";

/** Signed-in user at the foot of the sidebar, with sign-out. */
export function SidebarUserCard() {
  // Profile edits (Cài đặt) show here right away; session is the fallback.
  const { data: profile } = useMyProfile();
  const name = profile?.name ?? currentUser.name;
  const avatarSrc = profile?.avatar ?? currentUser.avatar;

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <Avatar className="size-9">
          <AvatarImage src={avatarSrc} alt={name} />
          <AvatarFallback>{currentUser.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{currentUser.email}</p>
        </div>
        <a
          href={LANDING_URL}
          onClick={clearSession}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        >
          <LogOut className="size-4" />
        </a>
      </div>
    </div>
  );
}
