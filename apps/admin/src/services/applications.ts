import { adminApi } from "@/services/backend";
import { allPages, record, text, number } from "@/services/normalize";
import type { ApplicationDecision, PhotographerApplication } from "@/types";

const mapStatus = (status: unknown): PhotographerApplication["status"] =>
  status === "verified" ? "approved" : status === "rejected" ? "rejected" : "pending";

export async function getApplications(): Promise<PhotographerApplication[]> {
  const photographers = await allPages((query) => adminApi.listPhotographers(query));
  return photographers.map((raw) => {
    const row = record(raw);
    return {
      id: text(row.id),
      name: text(row.fullname, "Nhiếp ảnh gia"),
      avatar: text(row.avatar_url),
      email: text(row.email),
      city: text(row.location, "—"),
      styles: Array.isArray(row.styles) ? row.styles.filter((style): style is string => typeof style === "string") : [],
      experienceYears: typeof row.started_career_at === "number" ? Math.max(0, new Date().getFullYear() - row.started_career_at) : 0,
      pricePerSession: number(row.starting_price),
      portfolio: [],
      portfolioCount: number(row.portfolio_count),
      bio: text(row.description),
      submittedAt: text(row.created_at),
      status: mapStatus(row.verification_status),
      reviewNote: text(row.rejection_reason) || undefined,
      reviewedAt: text(row.reviewed_at) || undefined,
    };
  });
}

export async function getApplicationPortfolio(id: string): Promise<string[]> {
  const portfolios = await allPages((query) => adminApi.listPhotographerPortfolios(id, query));
  return portfolios.flatMap((rawPortfolio) => {
    const items = record(rawPortfolio).items;
    return Array.isArray(items)
      ? items.map((item) => text(record(item).download_url)).filter(Boolean)
      : [];
  });
}

export async function decideApplication(
  application: PhotographerApplication,
  decision: ApplicationDecision,
): Promise<PhotographerApplication> {
  const response = decision.status === "approved"
    ? await adminApi.approvePhotographer(application.id)
    : await adminApi.rejectPhotographer(application.id, {
        reason: decision.note?.trim() || "Hồ sơ chưa đáp ứng yêu cầu xét duyệt.",
      });
  const result = record(response);
  return {
    ...application,
    status: decision.status,
    reviewNote: text(result.rejection_reason) || (decision.status === "rejected" ? decision.note : undefined),
    reviewedAt: text(result.reviewed_at) || new Date().toISOString(),
  };
}
