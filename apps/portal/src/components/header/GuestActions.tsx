import { useLocation } from "react-router-dom";
import { Button } from "@lens/ui";
import { landingLogin, landingSignup } from "@/lib/links";

/** Header actions for a guest: sign in / sign up on the landing, then come back here. */
export function GuestActions() {
  const { pathname, search } = useLocation();
  const here = window.location.origin + pathname + search;

  return (
    <>
      <Button asChild variant="ghost" className="rounded-full">
        <a href={landingLogin(here)}>Đăng nhập</a>
      </Button>
      <Button asChild className="rounded-full">
        <a href={landingSignup(here)}>Đăng ký</a>
      </Button>
    </>
  );
}
