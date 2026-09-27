import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/components/header/SiteFooter";
import { SiteHeader } from "@/components/header/SiteHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
