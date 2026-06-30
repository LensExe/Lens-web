import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIncomingBookings,
  getMyAvailability,
  getMyPhotographerProfile,
  toggleAvailability,
  updateBookingStatus,
  updateMyPhotographerProfile,
} from "@/services/dashboard";
import type { BookingStatus, Photographer } from "@/types";

// Layer 2 — Query hooks for the photographer dashboard.
export const dashboardKeys = {
  profile: ["dashboard", "profile"] as const,
  incoming: ["dashboard", "incoming"] as const,
  availability: ["dashboard", "availability"] as const,
};

export function useMyPhotographerProfile() {
  return useQuery({
    queryKey: dashboardKeys.profile,
    queryFn: getMyPhotographerProfile,
  });
}

export function useUpdateMyPhotographerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Photographer>) =>
      updateMyPhotographerProfile(patch),
    onSuccess: (updated) => {
      qc.setQueryData(dashboardKeys.profile, updated);
      // The public roster/profile show this photographer too — refresh them.
      qc.invalidateQueries({ queryKey: ["photographers"] });
    },
  });
}

export function useIncomingBookings() {
  return useQuery({
    queryKey: dashboardKeys.incoming,
    queryFn: getIncomingBookings,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.incoming });
    },
  });
}

export function useMyAvailability() {
  return useQuery({
    queryKey: dashboardKeys.availability,
    queryFn: getMyAvailability,
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => toggleAvailability(date),
    onSuccess: (dates) => {
      qc.setQueryData(dashboardKeys.availability, dates);
    },
  });
}
