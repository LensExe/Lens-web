import { useQuery } from "@tanstack/react-query";
import {
  getAvailability,
  getFeaturedPhotographers,
  getPhotographerById,
  getPhotographers,
} from "@/services/photographers";

// Layer 2 — Query hooks. The ONLY layer the View talks to.
export const photographerKeys = {
  all: ["photographers"] as const,
  featured: ["photographers", "featured"] as const,
  detail: (id: string) => ["photographers", id] as const,
  availability: (id: string) => ["photographers", id, "availability"] as const,
};

export function usePhotographers() {
  return useQuery({
    queryKey: photographerKeys.all,
    queryFn: getPhotographers,
  });
}

export function useFeaturedPhotographers() {
  return useQuery({
    queryKey: photographerKeys.featured,
    queryFn: getFeaturedPhotographers,
  });
}

export function usePhotographer(id: string) {
  return useQuery({
    queryKey: photographerKeys.detail(id),
    queryFn: () => getPhotographerById(id),
    enabled: !!id,
  });
}

/** Day-by-day free / busy / booked slots — always fresh (slots get taken). */
export function useAvailability(id: string) {
  return useQuery({
    queryKey: photographerKeys.availability(id),
    queryFn: () => getAvailability(id),
    enabled: !!id,
    staleTime: 0,
  });
}
