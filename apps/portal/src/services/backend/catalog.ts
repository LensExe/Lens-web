import { backendGet } from "@/lib/backend-api";
import type { ApiItems, ApiObject } from "@/types/common";

export const listPhotographerRanks = () => backendGet<ApiItems<ApiObject>>("/ranks");

export const listPhotographerBadges = () => backendGet<ApiItems<ApiObject>>("/badges");
