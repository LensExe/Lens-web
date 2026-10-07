import type { ApiPage } from "@/types/backend-api";

export async function allPages<T>(fetchPage: (query: { limit: number; offset: number }) => Promise<ApiPage<T>>) {
  const limit = 100;
  const first = await fetchPage({ limit, offset: 0 });
  const rest = await Promise.all(
    Array.from({ length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) }, (_, index) =>
      fetchPage({ limit, offset: first.items.length + index * limit }),
    ),
  );
  return [first.items, ...rest.map((page) => page.items)].flat();
}

export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};
export const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
export const number = (value: unknown, fallback = 0) => typeof value === "number" ? value : fallback;
