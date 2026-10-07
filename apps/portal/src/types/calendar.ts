import type { ApiObject, ISODateTime } from "./common";
import type { ApiBooking } from "./bookings";

/** Calendar blocks, availability, and calendar query DTOs. */
type CalendarBlockRangeDto =
  | { date: string; from?: never; to?: never }
  | { date?: never; from: ISODateTime; to: ISODateTime };

export type CalendarBlockDto = CalendarBlockRangeDto & {
  reason?: string;
  decline_pending?: boolean;
};

export type CalendarBlockPreviewQueryDto = CalendarBlockRangeDto;

export interface CalendarAvailabilityQueryDto { from?: ISODateTime; to?: ISODateTime }
export interface CalendarMeQueryDto { from?: ISODateTime; to?: ISODateTime }

export interface ApiCalendar {
  blocked: ApiObject[];
  bookings: ApiBooking[];
}
