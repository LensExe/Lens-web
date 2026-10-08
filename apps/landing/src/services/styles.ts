import { api } from "@/lib/api";
import type { StyleCategory } from "@/types";

// Layer 3 — Service / API.
export async function getStyles(): Promise<StyleCategory[]> {
  return (await api.get<StyleCategory[]>("/styles")).data;
}
