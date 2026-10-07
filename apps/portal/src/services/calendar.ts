import { calendarApi } from "@/services/backend";
import type { ApiCalendar, CalendarBlockDto, CalendarMeQueryDto } from "@/types/calendar";

export const getMyCalendar = (query: CalendarMeQueryDto = {}) => calendarApi.getMyCalendar(query);
export const createCalendarBlock = (body: CalendarBlockDto) => calendarApi.blockCalendarTime(body);
export const removeCalendarBlock = (offlineSlotId: string) => calendarApi.deleteBlockedTime(offlineSlotId);
export type MyCalendar = ApiCalendar;
