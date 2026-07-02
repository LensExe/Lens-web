import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockUsers } from "@/mock/users";
import { mockApplications } from "@/mock/applications";
import { mockActivity, mockStats } from "@/mock/stats";
import { mockReports } from "@/mock/reports";
import { mockFinance, mockWithdrawals } from "@/mock/finance";
import { mockBookings } from "@/mock/bookings";
import { mockStorageRows } from "@/mock/storage";
import { mockQualityRows } from "@/mock/quality";
import type {
  AdminUser,
  AdminWithdrawal,
  ApprovalStatus,
  PhotographerApplication,
  QualityOverview,
  RankId,
  StorageOverview,
  StoragePlanTier,
  UserStatus,
  WithdrawalStatus,
} from "@/types";

// Mock backend for admin. Handlers play the role of the server: read the mock
// data ("database seed") and own the in-memory state + logic that used to live
// in the services (sorting, status changes). State resets on a full reload.

let users: AdminUser[] = mockUsers.map((u) => ({ ...u }));
let applications: PhotographerApplication[] = mockApplications.map((a) => ({
  ...a,
}));
let withdrawals: AdminWithdrawal[] = mockWithdrawals.map((w) => ({ ...w }));

const financeSummary = () => {
  const pending = withdrawals.filter((w) => w.status === "pending");
  return {
    ...mockFinance,
    pendingWithdrawalTotal: pending.reduce((s, w) => s + w.amount, 0),
    pendingCount: pending.length,
  };
};

const storageOverview = (): StorageOverview => {
  const planBreakdown = { free: 0, pro: 0, studio: 0 } as Record<
    StoragePlanTier,
    number
  >;
  for (const r of mockStorageRows) planBreakdown[r.plan] += 1;
  return {
    totalUsedBytes: mockStorageRows.reduce((s, r) => s + r.usedBytes, 0),
    overQuotaCount: mockStorageRows.filter((r) => r.overQuota).length,
    planBreakdown,
  };
};

const qualityOverview = (): QualityOverview => {
  const rankBreakdown = {
    newbie: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  } as Record<RankId, number>;
  for (const r of mockQualityRows) rankBreakdown[r.rank] += 1;
  return {
    rankBreakdown,
    avgCommission:
      mockQualityRows.reduce((s, r) => s + r.commissionRate, 0) /
      (mockQualityRows.length || 1),
    aiEnabledCount: mockQualityRows.filter((r) => r.assistantEnabled).length,
  };
};

export const handlers = [
  // ── Users ─────────────────────────────────────────────────────────────────
  http.get("/api/admin/users", async () => {
    await delay();
    return HttpResponse.json(
      [...users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
    );
  }),

  http.patch("/api/admin/users/:id", async ({ params, request }) => {
    await delay();
    const { status } = (await request.json()) as { status: UserStatus };
    users = users.map((u) => (u.id === params.id ? { ...u, status } : u));
    const updated = users.find((u) => u.id === params.id);
    if (!updated) {
      return HttpResponse.json(
        { message: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }
    return HttpResponse.json(updated);
  }),

  // ── Photographer applications ─────────────────────────────────────────────
  http.get("/api/admin/applications", async () => {
    await delay();
    // Pending first (these need action), then by most recent submission.
    return HttpResponse.json(
      [...applications].sort((a, b) => {
        const ap = a.status === "pending";
        const bp = b.status === "pending";
        if (ap !== bp) return ap ? -1 : 1;
        return b.submittedAt.localeCompare(a.submittedAt);
      })
    );
  }),

  http.patch("/api/admin/applications/:id", async ({ params, request }) => {
    await delay();
    const { status } = (await request.json()) as { status: ApprovalStatus };
    applications = applications.map((a) =>
      a.id === params.id ? { ...a, status } : a
    );
    const updated = applications.find((a) => a.id === params.id);
    if (!updated) {
      return HttpResponse.json(
        { message: "Không tìm thấy hồ sơ" },
        { status: 404 }
      );
    }
    return HttpResponse.json(updated);
  }),

  // ── Stats & reports (read-only) ───────────────────────────────────────────
  http.get("/api/admin/stats", async () => {
    await delay();
    return HttpResponse.json(mockStats);
  }),

  http.get("/api/admin/activity", async () => {
    await delay();
    return HttpResponse.json(mockActivity);
  }),

  http.get("/api/admin/reports", async () => {
    await delay();
    return HttpResponse.json(mockReports);
  }),

  // ── Finance & withdrawals ─────────────────────────────────────────────────
  http.get("/api/admin/withdrawals", async () => {
    await delay();
    // Pending first (these need action), then most recent request.
    return HttpResponse.json(
      [...withdrawals].sort((a, b) => {
        const ap = a.status === "pending";
        const bp = b.status === "pending";
        if (ap !== bp) return ap ? -1 : 1;
        return b.requestedAt.localeCompare(a.requestedAt);
      })
    );
  }),

  http.patch("/api/admin/withdrawals/:id", async ({ params, request }) => {
    await delay();
    const { status } = (await request.json()) as { status: WithdrawalStatus };
    withdrawals = withdrawals.map((w) =>
      w.id === params.id ? { ...w, status } : w
    );
    const updated = withdrawals.find((w) => w.id === params.id);
    if (!updated) {
      return HttpResponse.json(
        { message: "Không tìm thấy yêu cầu rút tiền" },
        { status: 404 }
      );
    }
    return HttpResponse.json(updated);
  }),

  http.get("/api/admin/finance", async () => {
    await delay();
    return HttpResponse.json(financeSummary());
  }),

  // ── Bookings & collaboration (read-only monitor) ──────────────────────────
  http.get("/api/admin/bookings", async () => {
    await delay();
    return HttpResponse.json(
      [...mockBookings].sort((a, b) => b.date.localeCompare(a.date))
    );
  }),

  // ── Storage & plans ───────────────────────────────────────────────────────
  http.get("/api/admin/storage", async () => {
    await delay();
    return HttpResponse.json({
      overview: storageOverview(),
      rows: [...mockStorageRows],
    });
  }),

  // ── Ranks, commission & AI assistant ──────────────────────────────────────
  http.get("/api/admin/quality", async () => {
    await delay();
    return HttpResponse.json({
      overview: qualityOverview(),
      rows: [...mockQualityRows],
    });
  }),
];
