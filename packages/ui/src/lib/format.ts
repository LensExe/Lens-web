// Format a VND amount as a compact Vietnamese currency string.
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Short VND for chart axes and tight spots: 3.120.000 → "3,1tr", 850.000 → "850k". */
export function formatPriceCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${trim(amount / 1_000_000_000)}tỷ`;
  if (abs >= 1_000_000) return `${trim(amount / 1_000_000)}tr`;
  if (abs >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "").replace(".", ",");
