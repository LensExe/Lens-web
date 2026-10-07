import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIncomingBookings,
  getMyEarnings,
  getMyPhotographerProfile,
  completeShoot,
  updateBookingStatus,
  updateMyPhotographerProfile,
} from "@/services/dashboard";
import type { BookingStatus, Photographer } from "@/types";
import { saveMyBookingPlans } from "@/services/booking-plans";
import { addPortfolioImages } from "@/services/portfolio-media";

// Layer 2 — Query hooks for the photographer dashboard.
export const dashboardKeys = {
  profile: ["dashboard", "profile"] as const,
  incoming: ["dashboard", "incoming"] as const,
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

export function useSaveMyBookingPlans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveMyBookingPlans,
    onSuccess: (plans) => {
      qc.setQueryData(dashboardKeys.profile, (profile: Photographer | undefined) =>
        profile ? { ...profile, packages: plans, pricePerSession: plans.length ? Math.min(...plans.map((plan) => plan.price)) : 0 } : profile,
      );
      qc.invalidateQueries({ queryKey: ["photographers"] });
      qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
    },
  });
}

export function useUploadPortfolioImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ files }: { files: File[] }) => addPortfolioImages(files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.profile });
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

export function useCompleteShoot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeShoot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.incoming });
      qc.invalidateQueries({ queryKey: ["bookings", "mine"] });
    },
  });
}
