import { backendDelete, backendGet, backendPost } from "@/lib/backend-api";
import type { ApiItems, ApiObject, ApiTimeRange } from "@/types/common";
import type {
  ApiCalendar,
  CalendarAvailabilityQueryDto,
  CalendarBlockDto,
  CalendarBlockPreviewQueryDto,
  CalendarMeQueryDto,
} from "@/types/calendar";

export const blockCalendarTime = (body: CalendarBlockDto) =>
  backendPost<ApiObject, CalendarBlockDto>("/calendar/blocked-times", body);

export const getMyCalendar = (query: CalendarMeQueryDto = {}) =>
  backendGet<ApiCalendar>("/calendar/me", query);

export const deleteBlockedTime = (offlineSlotId: string) =>
  backendDelete<{ deleted: boolean }>(`/calendar/blocked-times/${encodeURIComponent(offlineSlotId)}`);

export const getPhotographerAvailability = (photographerId: string, query: CalendarAvailabilityQueryDto = {}) =>
  backendGet<ApiItems<ApiTimeRange>>(`/photographers/${encodeURIComponent(photographerId)}/availability`, query);

export const previewAffectedBookingsForBlock = (query: CalendarBlockPreviewQueryDto) =>
  backendGet<ApiItems<ApiObject>>("/calendar/blocked-times/affected", query);
