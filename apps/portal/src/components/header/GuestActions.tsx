import { useLocation } from "react-router-dom";
import { Button } from "@lens/ui";
import { portalLogin, portalSignup } from "@/lib/links";

/** Header actions for a guest: sign in / sign up in the portal. */
export function GuestActions() {
  const { pathname, search } = useLocation();
  const here = window.location.origin + pathname + search;

  return (
    <>
      <Button asChild variant="ghost" className="rounded-full">
        <a href={portalLogin(here)}>Đăng nhập</a>
      </Button>
      <Button asChild className="rounded-full">
        <a href={portalSignup(here)}>Đăng ký</a>
      </Button>
    </>
  );
}
