import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIncomingBookings,
  getMyEarnings,
  getMyPhotographerProfile,
  getMySchedule,
  saveMySchedule,
  updateBookingStatus,
  updateMyPhotographerProfile,
} from "@/services/dashboard";
import type { BookingStatus, Photographer, WorkSchedule } from "@/types";

// Layer 2 — Query hooks for the photographer dashboard.
export const dashboardKeys = {
  profile: ["dashboard", "profile"] as const,
  incoming: ["dashboard", "incoming"] as const,
  schedule: ["dashboard", "schedule"] as const,
  earnings: ["dashboard", "earnings"] as const,
};

export function useMyEarnings() {
  return useQuery({
    queryKey: dashboardKeys.earnings,
    queryFn: getMyEarnings,
  });
}

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

export function useMySchedule() {
  return useQuery({
    queryKey: dashboardKeys.schedule,
    queryFn: getMySchedule,
  });
}

export function useSaveMySchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schedule: WorkSchedule) => saveMySchedule(schedule),
    onSuccess: (saved) => {
      qc.setQueryData(dashboardKeys.schedule, saved);
      // Public free dates / slots derive from the schedule.
      qc.invalidateQueries({ queryKey: ["photographers"] });
    },
  });
}
