import { api } from "@/lib/api";
import type { Photographer } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend (src/msw) answers
// these in the UI phase. Swapping to a real backend needs no change here —
// just disable mocking and point VITE_API_URL at the server.

export async function getPhotographers(): Promise<Photographer[]> {
  return (await api.get<Photographer[]>("/photographers")).data;
}

export async function getFeaturedPhotographers(): Promise<Photographer[]> {
  return (
    await api.get<Photographer[]>("/photographers", {
      params: { featured: true },
    })
  ).data;
}

export async function getPhotographerById(
  id: string
): Promise<Photographer | null> {
  return (await api.get<Photographer>(`/photographers/${id}`)).data ?? null;
}
