import type { ReactNode } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { Logo } from "../brand/Logo";

/**
 * Full-page "something went wrong" screen for an app's error boundary.
 * Router-agnostic on purpose: "Tải lại trang" does a full reload (the only
 * thing that also restarts a dead mock worker) and "Về trang chủ" is a plain
 * link, so this screen can't fail even when the router state is broken.
 */
export function ErrorScreen({
  title = "Đã có lỗi xảy ra",
  description = "Trang gặp sự cố ngoài ý muốn. Bạn thử tải lại trang, hoặc quay về trang chủ.",
  details,
  homeHref = "/",
}: {
  title?: string;
  description?: ReactNode;
  /** Technical details — pass only in development. */
  details?: string;
  homeHref?: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-16 text-center">
      <Logo className="h-7" />
      <span className="mt-12 flex size-14 items-center justify-center rounded-full bg-muted text-foreground">
        <TriangleAlert className="size-7" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button className="rounded-full" onClick={() => window.location.reload()}>
          <RotateCw className="size-4" />
          Tải lại trang
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={homeHref}>Về trang chủ</a>
        </Button>
      </div>
      {details && (
        <pre className="mt-10 max-h-60 w-full max-w-2xl overflow-auto rounded-2xl bg-muted p-4 text-left text-xs text-muted-foreground">
          {details}
        </pre>
      )}
    </main>
  );
}
