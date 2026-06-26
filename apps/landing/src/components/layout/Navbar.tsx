import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button, Logo } from "@lens/ui";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@lens/ui";
import { ThemeToggle } from "@lens/ui";
import { portalBrowse } from "@/lib/links";
import { useAuthModal } from "@/components/auth/auth-modal-context";

const navLinks = [
  { label: "Nhiếp ảnh gia", href: portalBrowse(), external: true },
  { label: "Cách hoạt động", to: "/#cach-hoat-dong" },
  { label: "Phong cách chụp", to: "/#phong-cach" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { openLogin, openSignup } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5">
        <Link to="/" className="flex items-center" aria-label="Lens">
          <Logo className="h-7" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to!}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" className="rounded-full" onClick={openLogin}>
            Đăng nhập
          </Button>
          <Button className="rounded-full" onClick={openSignup}>
            Đăng ký
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" aria-label="Mở menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="p-5">
                <span className="text-lg font-semibold">Menu</span>
              </div>
              <SheetTitle className="sr-only">Điều hướng</SheetTitle>
              <nav className="flex flex-col gap-1 px-3">
                {navLinks.map((link) =>
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.to!}
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )
                )}
              </nav>
              <div className="mt-4 flex flex-col gap-2 px-3">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setOpen(false);
                    openLogin();
                  }}
                >
                  Đăng nhập
                </Button>
                <Button
                  className="rounded-full"
                  onClick={() => {
                    setOpen(false);
                    openSignup();
                  }}
                >
                  Đăng ký
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
