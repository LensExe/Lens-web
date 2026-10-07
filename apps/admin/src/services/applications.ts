import { adminApi } from "@/services/backend";
import { allPages, record, text, number } from "@/services/normalize";
import type { ApplicationDecision, PhotographerApplication } from "@/types";

const mapStatus = (status: unknown): PhotographerApplication["status"] =>
  status === "verified" ? "approved" : status === "rejected" ? "rejected" : "pending";

export async function getApplications(): Promise<PhotographerApplication[]> {
  const [photographers, users] = await Promise.all([
    allPages((query) => adminApi.listPhotographers(query)),
    allPages((query) => adminApi.listUsers(query)),
  ]);
  const usersById = new Map(users.map((raw) => {
    const user = record(raw);
    return [text(user.id), user] as const;
  }));
  return Promise.all(photographers.map(async (raw) => {
    const row = record(raw);
    const id = text(row.id);
    const user = usersById.get(text(row.user_id)) ?? {};
    const [portfolios, plans] = await Promise.all([
      adminApi.listPhotographerPortfolios(id).catch(() => ({ items: [] })),
      adminApi.listPhotographerBookingPlans(id).catch(() => ({ items: [] })),
    ]);
    const portfolio = portfolios.items.flatMap((rawPortfolio) => {
      const items = record(rawPortfolio).items;
      return Array.isArray(items) ? items.map((item) => text(record(item).download_url)).filter(Boolean) : [];
    });
    const priceList = plans.items.map((plan) => number(record(plan).price)).filter((price) => price > 0);
    return {
      id,
      name: text(user.fullname, "Nhiếp ảnh gia"),
      avatar: text(user.avatar_url),
      email: text(user.email),
      city: text(row.location, "—"),
      styles: Array.isArray(row.styles) ? row.styles.filter((style): style is string => typeof style === "string") : [],
      experienceYears: typeof row.started_career_at === "number" ? Math.max(0, new Date().getFullYear() - row.started_career_at) : 0,
      pricePerSession: priceList.length ? Math.min(...priceList) : 0,
      portfolio,
      bio: text(row.description),
      submittedAt: text(row.created_at),
      status: mapStatus(row.verification_status),
      reviewNote: text(row.rejection_reason) || undefined,
      reviewedAt: text(row.reviewed_at) || undefined,
    };
  }));
}

export async function decideApplication(id: string, decision: ApplicationDecision): Promise<PhotographerApplication> {
  if (decision.status === "approved") await adminApi.approvePhotographer(id);
  else await adminApi.rejectPhotographer(id, { reason: decision.note?.trim() || "Hồ sơ chưa đáp ứng yêu cầu xét duyệt." });
  const rows = await getApplications();
  const updated = rows.find((row) => row.id === id);
  if (!updated) throw new Error("Đã xử lý hồ sơ nhưng backend không trả lại hồ sơ sau cập nhật.");
  return updated;
}
