import { ClientShell } from "@/components/workspace/ClientShell";
import { StudioShell } from "@/components/workspace/StudioShell";
import { currentUser } from "@/lib/session";

// The signed-in workspace. Photographers get the studio (grouped sidebar);
// clients get the site header with a top navigation. The role is fixed for the
// page load (lib/session.ts), so this never swaps shells mid-session.
export function PortalLayout() {
  return currentUser.role === "photographer" ? <StudioShell /> : <ClientShell />;
}
