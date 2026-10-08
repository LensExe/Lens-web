import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAdminSession } from "@/lib/session";

/** Gate the whole console: no admin session → `/login`, then back here. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getAdminSession()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  return children;
}
