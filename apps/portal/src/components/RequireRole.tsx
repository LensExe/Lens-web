import { Navigate, Outlet } from "react-router-dom";
import { currentUser, hasRole } from "@/lib/session";
import type { UserRole } from "@/types";

/**
 * Layout-route guard. Renders the nested routes only when the current user's
 * role is in `allow`; otherwise redirects to the client area.
 * UI phase: role comes from the hard-coded session in `lib/session.ts`.
 */
export function RequireRole({ allow }: { allow: UserRole[] }) {
  if (!hasRole(allow, currentUser.role)) {
    return <Navigate to="/client" replace />;
  }
  return <Outlet />;
}
