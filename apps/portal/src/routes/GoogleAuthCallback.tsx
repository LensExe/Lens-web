import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Spinner } from "@lens/ui";
import { FormError } from "@/components/auth/FormError";
import { portalHomeFor } from "@/lib/links";
import { saveSession } from "@/lib/session";
import { GOOGLE_REDIRECT_STORAGE_KEY, loginWithGoogleCode } from "@/services/auth";

/** Completes the one-time handoff created by the backend Google callback. */
export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const callbackError = searchParams.get("error_description") ?? searchParams.get("error");
  const started = useRef(false);
  const [error, setError] = useState<string | null>(
    callbackError ?? (!code ? "Không nhận được mã đăng nhập Google từ backend." : null),
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (callbackError) return;
    if (!code) return;

    void loginWithGoogleCode(code)
      .then((result) => {
        let redirect: string | null = null;
        try {
          redirect = sessionStorage.getItem(GOOGLE_REDIRECT_STORAGE_KEY);
          sessionStorage.removeItem(GOOGLE_REDIRECT_STORAGE_KEY);
        } catch {
          /* Use the role home when session storage is unavailable. */
        }
        saveSession(result.user, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
        window.location.replace(portalHomeFor(result.user.role, redirect));
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Đăng nhập Google thất bại.");
      });
  }, [callbackError, code]);

  return (
    <div className="text-center">
      {error ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">Không thể đăng nhập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Phiên đăng nhập Google có thể đã hết hạn hoặc backend chưa được cấu hình.
          </p>
          <div className="mt-6 text-left">
            <FormError message={error} />
          </div>
          <Button asChild size="lg" className="mt-6 h-11 w-full rounded-full">
            <Link to="/login">Quay lại đăng nhập</Link>
          </Button>
        </>
      ) : (
        <>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Spinner />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Đang hoàn tất đăng nhập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Lens đang xác nhận tài khoản Google của bạn.
          </p>
        </>
      )}
    </div>
  );
}
