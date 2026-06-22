import { delay } from "@lens/ui";
import { mockPhotographers } from "@/mock/photographers";
import type { Photographer } from "@/types";
// import { api } from "@/lib/api"; // LATER: uncomment for the real backend

// Layer 3 — Service / API. The ONLY place mock data is touched.
// To go live, swap the mock return for the commented axios call below.

export async function getPhotographers(): Promise<Photographer[]> {
  await delay(); // fake latency so skeletons are visible
  return mockPhotographers; // CURRENT: mock
  // LATER: return (await api.get<Photographer[]>("/photographers")).data;
}

export async function getFeaturedPhotographers(): Promise<Photographer[]> {
  await delay();
  return mockPhotographers.filter((p) => p.featured); // CURRENT: mock
  // LATER: return (await api.get<Photographer[]>("/photographers", { params: { featured: true } })).data;
}

export async function getPhotographerById(
  id: string
): Promise<Photographer | null> {
  await delay();
  // Return null (not undefined) so TanStack Query treats "not found" as
  // valid empty data rather than an invalid query result.
  return mockPhotographers.find((p) => p.id === id) ?? null; // CURRENT: mock
  // LATER: return (await api.get<Photographer>(`/photographers/${id}`)).data ?? null;
}
