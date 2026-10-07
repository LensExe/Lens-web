import { backendDelete, backendGet, backendPatch, backendPost } from "@/lib/backend-api";
import type { ApiItems } from "@/types/common";
import type {
  ApiBookingPlan,
  BookingPlanCreateDto,
  BookingPlanUpdateDto,
} from "@/types/booking-plans";

export const createBookingPlan = (body: BookingPlanCreateDto) =>
  backendPost<ApiBookingPlan, BookingPlanCreateDto>("/photographers/me/booking-plans", body);

export const listMyBookingPlans = () =>
  backendGet<ApiItems<ApiBookingPlan>>("/photographers/me/booking-plans");

export const updateBookingPlan = (bookingPlanId: string, body: BookingPlanUpdateDto) =>
  backendPatch<ApiBookingPlan, BookingPlanUpdateDto>(`/booking-plans/${encodeURIComponent(bookingPlanId)}`, body);

export const deleteBookingPlan = (bookingPlanId: string) =>
  backendDelete<{ deleted: boolean }>(`/booking-plans/${encodeURIComponent(bookingPlanId)}`);

export const listPhotographerBookingPlans = (photographerId: string) =>
  backendGet<ApiItems<ApiBookingPlan>>(`/photographers/${encodeURIComponent(photographerId)}/booking-plans`);
