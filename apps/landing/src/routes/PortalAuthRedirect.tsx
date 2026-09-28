import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Spinner } from "@lens/ui";

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL ?? "http://localhost:5174";

/** Keeps legacy landing auth URLs working without rendering auth in landing. */
export function PortalAuthRedirect({ path }: { path: "login" | "signup" }) {
  const { search } = useLocation();

  useEffect(() => {
    const target = new URL(`/${path}`, PORTAL_URL);
    target.search = search;
    window.location.replace(target.toString());
  }, [path, search]);

  return (
    <div className="flex min-h-dvh items-center justify-center gap-3 text-sm text-muted-foreground">
      <Spinner className="size-5" />
      Đang chuyển tới Lens Portal…
    </div>
  );
}
