import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SiteFooter } from "@/components/header/SiteFooter";
import { SiteHeader } from "@/components/header/SiteHeader";
import { PageFallback } from "@/components/workspace/PageFallback";

// The client's workspace uses the same header as the public pages (with the
// top navigation), so browsing and managing bookings feel like one site.
// Content is centred at the header's width; pages keep their <PageContainer>.
export function ClientShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="portal-client-main mx-auto w-full max-w-[1480px] flex-1">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
