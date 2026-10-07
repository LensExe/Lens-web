import { backendGet, backendPost } from "@/lib/backend-api";
import type { ApiObject, ApiPage } from "@/types/common";
import type {
  ModerationMineQueryDto,
  ReportCreateDto,
} from "@/types/moderation";

export const createReport = (body: ReportCreateDto) =>
  backendPost<ApiObject, ReportCreateDto>("/reports", body);

export const listMyReports = (query: ModerationMineQueryDto = {}) =>
  backendGet<ApiPage<ApiObject>>("/reports/me", query);
