import { backendGet } from "@/lib/backend-api";
import type {
  ApiItems,
  ApiPage,
  ApiPhotographer,
  PhotographerSearchQueryDto,
} from "@/types/backend-api";

export const searchPhotographers = (query: PhotographerSearchQueryDto = {}) =>
  backendGet<ApiPage<ApiPhotographer>>("/photographers", query);

export const listTopRatedPhotographers = (limit = 8) =>
  backendGet<ApiPage<ApiPhotographer>>("/photographers/top-rated", { limit, offset: 0 });

export const getPhotographer = (id: string) =>
  backendGet<ApiPhotographer>(`/photographers/${encodeURIComponent(id)}`);

export const listRanks = () => backendGet<ApiItems<Record<string, unknown>>>("/ranks");

export const listBadges = () => backendGet<ApiItems<Record<string, unknown>>>("/badges");
