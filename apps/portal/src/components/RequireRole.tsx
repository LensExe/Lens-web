import { Navigate, Outlet } from "react-router-dom";
import { currentUser, hasRole } from "@/lib/session";
import { homeFor } from "@/components/workspace/nav";
import type { UserRole } from "@/types";

/**
 * Layout-route guard (inside `RequireAuth`). Renders the nested routes only
 * when the current user's role is in `allow`; otherwise sends them to their
 * own workspace home — clients and photographers each have a separate area.
 * UI phase: role comes from the demo session in `lib/session.ts`.
 */
export function RequireRole({ allow }: { allow: UserRole[] }) {
  if (!hasRole(allow, currentUser.role)) {
    return <Navigate to={homeFor(currentUser.role)} replace />;
  }
  return <Outlet />;
}
