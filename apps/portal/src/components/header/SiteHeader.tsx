import { Link } from "react-router-dom";
import { Logo } from "@lens/ui";
import { ClientNav } from "@/components/header/ClientNav";
import { HeaderActions } from "@/components/header/HeaderActions";
import { logoHref } from "@/components/workspace/nav";
import { sessionUser } from "@/lib/session";

/**
 * The header shared by the public pages and the client workspace. A signed-in
 * client also gets the top navigation (inline on md+, a pill row under the
 * header on phones — kept outside the sticky bar so the header stays 64px tall
 * for pages that offset sticky content by it).
 */
export function SiteHeader() {
  // sessionUser, not currentUser: this header also renders for guests.
  const isClient = sessionUser?.role === "client";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-stretch gap-6 px-5 md:px-8">
          <Link to={logoHref(sessionUser?.role)} className="flex shrink-0 items-center" aria-label="Lens — trang chủ">
            <Logo className="h-7" />
          </Link>
          {isClient && <ClientNav variant="inline" />}
          <div className="ml-auto flex items-center">
            <HeaderActions />
          </div>
        </div>
      </header>
      {isClient && <ClientNav variant="pills" />}
    </>
  );
}
