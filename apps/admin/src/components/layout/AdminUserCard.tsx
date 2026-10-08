import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@lens/ui";
import { clearAdminSession, getAdminSession } from "@/lib/session";

/** Signed-in admin at the foot of the sidebar, with sign-out. */
export function AdminUserCard() {
  const navigate = useNavigate();
  const admin = getAdminSession();

  const signOut = () => {
    clearAdminSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <Avatar className="size-9 shrink-0">
        {admin?.avatar && <AvatarImage src={admin.avatar} alt={admin.name} />}
        <AvatarFallback>AD</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{admin?.name ?? "Quản trị viên"}</p>
        <p className="truncate text-xs text-muted-foreground">{admin?.email}</p>
      </div>
      <button
        type="button"
        onClick={signOut}
        aria-label="Đăng xuất"
        title="Đăng xuất"
        className="focus-ring flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
