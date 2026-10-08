import { bookingPlanApi } from "@/services/backend";
import type { ApiBookingPlan, BookingPlanCreateDto } from "@/types/booking-plans";
import type { PhotographerPackage } from "@/types";

const text = (value: unknown) => typeof value === "string" ? value : "";

function fromApi(plan: ApiBookingPlan): PhotographerPackage {
  return {
    id: plan.id,
    name: plan.name,
    description: text(plan.description),
    price: plan.price,
    photoCount: plan.retouched_photo_count,
    durationHours: plan.duration_minutes / 60,
  };
}

function toApi(plan: PhotographerPackage): BookingPlanCreateDto {
  const photoCount = Math.max(0, Math.round(plan.photoCount));
  return {
    name: plan.name.trim(),
    description: plan.description.trim() || undefined,
    price: Math.round(plan.price),
    duration_minutes: Math.round(plan.durationHours * 60),
    photo_count: photoCount,
    retouched_photo_count: photoCount,
  };
}

export async function listMyBookingPlans(): Promise<PhotographerPackage[]> {
  const response = await bookingPlanApi.listMyBookingPlans();
  return response.items.map(fromApi);
}

/** Persist the photographer's complete plan list through the plan CRUD endpoints. */
export async function saveMyBookingPlans(plans: PhotographerPackage[]): Promise<PhotographerPackage[]> {
  const existing = await bookingPlanApi.listMyBookingPlans();
  const existingById = new Map(existing.items.map((plan) => [plan.id, plan]));
  const saved = await Promise.all(plans.map(async (plan) => {
    const body = toApi(plan);
    const prior = existingById.get(plan.id);
    return prior
      ? bookingPlanApi.updateBookingPlan(prior.id, body)
      : bookingPlanApi.createBookingPlan(body);
  }));
  const retained = new Set(existing.items.filter((plan) => plans.some((item) => item.id === plan.id)).map((plan) => plan.id));
  await Promise.all(existing.items.filter((plan) => !retained.has(plan.id)).map((plan) => bookingPlanApi.deleteBookingPlan(plan.id)));
  return saved.map(fromApi);
}
