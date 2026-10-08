import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCalendarBlock, getMyCalendar, removeCalendarBlock } from "@/services/calendar";
import type { CalendarBlockDto, CalendarMeQueryDto } from "@/types/calendar";

export const calendarKeys = { mine: (range: CalendarMeQueryDto) => ["calendar", "mine", range] as const };

export function useMyCalendar(range: CalendarMeQueryDto) {
  return useQuery({ queryKey: calendarKeys.mine(range), queryFn: () => getMyCalendar(range) });
}

export function useCreateCalendarBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CalendarBlockDto) => createCalendarBlock(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar", "mine"] }),
  });
}

export function useRemoveCalendarBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeCalendarBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar", "mine"] }),
  });
}
