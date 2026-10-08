import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@lens/ui";
import { isSignedIn } from "@/lib/session";
import { portalLogin } from "@/lib/links";

/**
 * Layout-route guard for everything that needs an account (the signed-in app,
 * the booking flow). A guest is sent to the portal login and brought back to
 * this exact URL afterwards.
 */
export function RequireAuth() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!isSignedIn) {
      window.location.replace(portalLogin(window.location.origin + pathname + search));
    }
  }, [pathname, search]);

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-5" />
        Đang chuyển tới trang đăng nhập…
      </div>
    );
  }
  return <Outlet />;
}
