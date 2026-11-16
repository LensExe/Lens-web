import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { PageContainer } from "@lens/ui";
import { exchangeMobileCheckoutHandoff } from "@/services/mobile-checkout";

export function MobileCheckoutHandoff() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string>();
  const code = params.get("code") ?? "";

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!code) {
      setError("Liên kết thanh toán thiếu mã xác thực. Hãy quay lại ứng dụng Lens và thử lại.");
      return;
    }

    void exchangeMobileCheckoutHandoff(code)
      .then(() => navigate("/mobile-checkout", { replace: true }))
      .catch(() => {
        setError(
          "Mã chuyển thanh toán đã hết hạn hoặc đã được sử dụng. Hãy mở lại từ ứng dụng Lens.",
        );
      });
  }, [code, navigate]);

  return (
    <PageContainer className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      {error ? (
        <>
          <AlertCircle className="size-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Không mở được thanh toán</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        </>
      ) : (
        <>
          <LoaderCircle className="size-9 animate-spin text-ember" />
          <h1 className="mt-4 text-xl font-semibold">Đang xác thực thanh toán</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hệ thống đang xác nhận tài khoản và lịch đặt của bạn.
          </p>
        </>
      )}
    </PageContainer>
  );
}
