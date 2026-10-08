import { backendGet, backendPatch, backendPost } from "@/lib/backend-api";
import type { ApiObject, ApiPage, PageQueryDto } from "@/types/common";
import type {
  ApiPhotographer,
  PhotographerCreateDto,
  PhotographerLocationDto,
  PhotographerSearchQueryDto,
  PhotographerStatusDto,
  PhotographerUpdateDto,
} from "@/types/photographers";

export const searchPhotographers = (query: PhotographerSearchQueryDto = {}) =>
  backendGet<ApiPage<ApiPhotographer>>("/photographers", query);
export const listTopRatedPhotographers = (query: PageQueryDto = {}) =>
  backendGet<ApiPage<ApiPhotographer>>("/photographers/top-rated", query);
export const getPhotographer = (photographerId: string) =>
  backendGet<ApiPhotographer>(`/photographers/${encodeURIComponent(photographerId)}`);
export const getMyPhotographerProfile = () =>
  backendGet<ApiObject>("/photographers/me");
export const createPhotographerProfile = (body: PhotographerCreateDto) =>
  backendPost<ApiObject, PhotographerCreateDto>("/photographers/profile", body);
export const updateMyPhotographerProfile = (body: PhotographerUpdateDto) =>
  backendPatch<ApiObject, PhotographerUpdateDto>("/photographers/me", body);
export const updateMyPhotographerLocation = (body: PhotographerLocationDto) =>
  backendPatch<ApiObject, PhotographerLocationDto>("/photographers/me/location", body);
export const updateMyPhotographerAvailability = (body: PhotographerStatusDto) =>
  backendPatch<ApiObject, PhotographerStatusDto>("/photographers/me/status", body);
