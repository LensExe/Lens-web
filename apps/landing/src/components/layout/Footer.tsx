import { Link } from "react-router-dom";
import { Aperture, AtSign, Globe, MessageCircle } from "lucide-react";
import { portalBrowse } from "@/lib/links";
import { useAuthModal } from "@/components/auth/auth-modal-context";

type FooterLink = { label: string; to?: string; href?: string; action?: "login" | "signup" };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Khám phá",
    links: [
      { label: "Tìm nhiếp ảnh gia", href: portalBrowse() },
      { label: "Phong cách chụp", to: "/#phong-cach" },
      { label: "Cách hoạt động", to: "/#cach-hoat-dong" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Trở thành nhiếp ảnh gia", action: "signup" },
      { label: "Đăng nhập", action: "login" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Điều khoản dịch vụ", to: "/" },
      { label: "Chính sách bảo mật", to: "/" },
    ],
  },
];

export function Footer() {
  const { openLogin, openSignup } = useAuthModal();
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-[1200px] px-5 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-foreground text-background">
                <Aperture className="size-5" />
              </span>
              <span className="text-xl font-semibold tracking-tight">Lens</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Nền tảng kết nối bạn với những nhiếp ảnh gia tài năng trên khắp Việt Nam.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { Icon: AtSign, label: "Liên hệ qua email" },
                { Icon: MessageCircle, label: "Nhắn tin cho Lens" },
                { Icon: Globe, label: "Trang web của Lens" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={i}>
                    {link.action ? (
                      <button
                        type="button"
                        onClick={link.action === "signup" ? openSignup : openLogin}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </button>
                    ) : link.href ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to!}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 Lens. Mọi quyền được bảo lưu.</p>
          <p>Thiết kế tại Việt Nam 🇻🇳</p>
        </div>
      </div>
    </footer>
  );
}
