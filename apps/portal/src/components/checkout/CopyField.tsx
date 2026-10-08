import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Label + value with a one-click copy (bank transfer details). */
export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the value is still visible to copy by hand */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium tabular-nums">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Sao chép ${label.toLowerCase()}`}
        className="focus-ring flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}
