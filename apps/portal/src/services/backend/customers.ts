import { backendGet, backendPatch } from "@/lib/backend-api";
import type { ApiPage, PageQueryDto } from "@/types/common";
import type { ApiPhotographer } from "@/types/photographers";
import type {
  ApiCustomer,
  CustomerBookingSummary,
  CustomerUpdateDto,
} from "@/types/customers";

export const getMyCustomerProfile = () => backendGet<ApiCustomer>("/customers/me");

export const updateMyCustomerProfile = (body: CustomerUpdateDto) =>
  backendPatch<ApiCustomer, CustomerUpdateDto>("/customers/me", body);

export const getMyCustomerSummary = () =>
  backendGet<CustomerBookingSummary>("/customers/me/summary");

export const getRecommendedPhotographers = (query: PageQueryDto = {}) =>
  backendGet<ApiPage<ApiPhotographer>>("/customers/me/recommendations", query);
