import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBookingReport, getLatestBookingReport } from "@/services/booking-reports";
import type { BookingReportCategory } from "@/types/bookings";

export const bookingReportKeys = {
  latest: (bookingId: string) => ["booking-reports", bookingId, "latest"] as const,
};

export function useBookingReport(bookingId: string) {
  return useQuery({
    queryKey: bookingReportKeys.latest(bookingId),
    queryFn: () => getLatestBookingReport(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useCreateBookingReport(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      category: BookingReportCategory;
      reason: string;
      evidence: File[];
    }) => createBookingReport({ bookingId, ...input }),
    onSuccess: (receipt) => {
      queryClient.setQueryData(bookingReportKeys.latest(bookingId), receipt);
      queryClient.invalidateQueries({ queryKey: bookingReportKeys.latest(bookingId) });
    },
  });
}
