import { Navigate, Outlet } from "react-router-dom";
import { sessionUser } from "@/lib/session";

/**
 * The browse page is for clients and guests. A signed-in photographer landing
 * on it goes to their studio instead. (Uses `sessionUser`, never `currentUser`:
 * guests pass through here.)
 */
export function BrowseGate() {
  if (sessionUser?.role === "photographer") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
