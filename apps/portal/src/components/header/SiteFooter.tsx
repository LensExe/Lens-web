const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

/** Footer shared by the public pages and the client workspace. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row md:px-8">
        <p>© 2026 Lens. Mọi quyền được bảo lưu.</p>
        <a href={LANDING_URL} className="transition-colors hover:text-foreground">
          Về trang chủ
        </a>
      </div>
    </footer>
  );
}
