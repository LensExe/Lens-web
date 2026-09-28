const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? "http://localhost:5173";

/** Footer shared by the public pages and the client workspace. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/70">
      <div className="mx-auto flex max-w-[1480px] flex-col items-center justify-between gap-3 px-4 py-7 text-xs text-muted-foreground sm:flex-row sm:px-5 md:px-8">
        <p>© 2026 Lens. Mọi quyền được bảo lưu.</p>
        <a href={LANDING_URL} className="transition-colors hover:text-foreground">
          Về trang chủ
        </a>
      </div>
    </footer>
  );
}
