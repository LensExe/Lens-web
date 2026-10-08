import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@lens/ui";
import * as QRCode from "qrcode";

function isImageSource(value: string): boolean {
  return /^(https?:\/\/|data:image\/)/i.test(value);
}

/** Displays the provider QR after a gateway payment intent is created. */
export function PaymentQrPanel({
  qrCode,
  checkoutUrl,
  loading = false,
}: {
  qrCode?: string;
  checkoutUrl?: string;
  loading?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [generatedQr, setGeneratedQr] = useState<{ source: string; dataUrl: string }>();

  useEffect(() => {
    let active = true;
    if (!qrCode || isImageSource(qrCode)) return undefined;

    QRCode.toDataURL(qrCode, { width: 224, margin: 1, errorCorrectionLevel: "M" })
      .then((dataUrl) => {
        if (active) setGeneratedQr({ source: qrCode, dataUrl });
      })
      .catch(() => {
        // Keep the raw value visible as a fallback if a provider format is unsupported.
      });
    return () => {
      active = false;
    };
  }, [qrCode]);

  const imageQr =
    qrCode && failedSource !== qrCode
      ? isImageSource(qrCode)
        ? qrCode
        : generatedQr?.source === qrCode
          ? generatedQr.dataUrl
          : undefined
      : undefined;

  const copyQr = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The value remains visible below when clipboard access is unavailable.
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
          <QrCode className="size-5" />
        </span>
        <div>
          <h2 className="font-semibold">Quét mã QR để thanh toán</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mở ứng dụng ngân hàng, quét mã và giữ nguyên nội dung chuyển khoản để hệ thống tự đối
            soát.
          </p>
        </div>
      </div>

      {loading && !imageQr && !qrCode && !checkoutUrl ? (
        <p className="mt-5 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          Đang lấy mã QR từ cổng thanh toán...
        </p>
      ) : imageQr ? (
        <div className="mt-5 flex justify-center rounded-2xl border border-border bg-white p-4">
          <img
            src={imageQr}
            alt="Mã QR thanh toán"
            className="size-56 max-w-full object-contain"
            onError={() => setFailedSource(qrCode)}
          />
        </div>
      ) : qrCode ? (
        <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">Mã QR dạng dữ liệu</p>
          <code className="mt-2 block max-h-32 overflow-auto break-all rounded-xl bg-background p-3 text-xs leading-relaxed">
            {qrCode}
          </code>
          <button
            type="button"
            onClick={copyQr}
            className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Đã chép mã" : "Sao chép mã"}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
          QR đang được khởi tạo. Bạn có thể mở trang thanh toán bên dưới.
        </p>
      )}

      {checkoutUrl && (
        <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
          <a href={checkoutUrl} target="_blank" rel="noreferrer">
            Mở trang thanh toán <ExternalLink className="size-4" />
          </a>
        </Button>
      )}
    </section>
  );
}
