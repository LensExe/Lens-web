import { useQuery } from "@tanstack/react-query";
import {
  getFeaturedPhotographers,
  getPhotographerById,
  getPhotographers,
} from "@/services/photographers";

// Layer 2 — Query hooks. The ONLY layer the View talks to.
export const photographerKeys = {
  all: ["photographers"] as const,
  featured: ["photographers", "featured"] as const,
  detail: (id: string) => ["photographers", id] as const,
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
