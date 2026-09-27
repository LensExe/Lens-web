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
import { mockAdminAccounts } from "@/mock/admins";
import type {
  AdminBooking,
  AdminBookingsReport,
  AdminDemoAccount,
  AdminQueue,
  ApplicationDecision,
  OverviewStats,
  AdminLoginInput,
  AdminSession,
  AdminUser,
  AdminWithdrawal,
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
const avatarOf = (name: string) => users.find((u) => u.name === name)?.avatar;
let applications: PhotographerApplication[] = mockApplications.map((a) => ({
  ...a,
}));
let withdrawals: AdminWithdrawal[] = mockWithdrawals.map((w) => ({ ...w }));

// % change, one decimal (e.g. 9.3).
const changePct = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : 0;

// Deposit share clients pay upfront (mirrors the portal's booking rule).
const DEPOSIT_RATE = 0.3;
// What the platform is holding for a booking right now.
const escrowOf = (b: AdminBooking) =>
  b.status === "held"
    ? b.price
    : b.status === "pending" || b.status === "confirmed"
      ? Math.round((b.price * DEPOSIT_RATE) / 1_000) * 1_000
      : 0;

const queue = (): AdminQueue => {
  const pendingW = withdrawals.filter((w) => w.status === "pending");
  return {
    pendingApplications: applications.filter((a) => a.status === "pending").length,
    pendingWithdrawals: pendingW.length,
    pendingWithdrawalTotal: pendingW.reduce((sum, w) => sum + w.amount, 0),
    overQuota: storageOverview().overQuotaCount,
    suspendedUsers: users.filter((u) => u.status === "suspended").length,
  };
};

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

  // Approve, or reject with a reason (required — the applicant sees it).
  http.patch("/api/admin/applications/:id", async ({ params, request }) => {
    await delay();
    const { status, note } = (await request.json()) as ApplicationDecision;
    const app = applications.find((a) => a.id === params.id);
    if (!app) {
      return HttpResponse.json({ message: "Không tìm thấy hồ sơ" }, { status: 404 });
    }
    if (app.status !== "pending") {
      return HttpResponse.json({ message: "Hồ sơ này đã được xử lý" }, { status: 409 });
    }
    const reason = note?.trim();
    if (status === "rejected" && !reason) {
      return HttpResponse.json({ message: "Vui lòng nhập lý do từ chối" }, { status: 400 });
    }
    const updated: PhotographerApplication = {
      ...app,
      status,
      reviewNote: reason || undefined,
      reviewedAt: new Date().toISOString(),
    };
    applications = applications.map((a) => (a.id === app.id ? updated : a));
    return HttpResponse.json(updated);
  }),

  // ── Stats & reports (read-only) ───────────────────────────────────────────
  http.get("/api/admin/stats", async () => {
    await delay();
    const { lastMonth } = mockStats;
    const months = mockReports.monthly;
    const revenue = months[months.length - 1].revenue;
    const prevRevenue = months[months.length - 2].revenue;
    const stats: OverviewStats = {
      totalUsers: mockStats.totalUsers,
      totalPhotographers: mockStats.totalPhotographers,
      totalBookings: mockStats.totalBookings,
      monthlyRevenue: revenue,
      change: {
        users: changePct(mockStats.totalUsers, lastMonth.totalUsers),
        photographers: changePct(mockStats.totalPhotographers, lastMonth.totalPhotographers),
        bookings: changePct(mockStats.totalBookings, lastMonth.totalBookings),
        revenue: changePct(revenue, prevRevenue),
      },
    };
    return HttpResponse.json(stats);
  }),

  // Everything waiting on an admin, in one call (overview + sidebar badges).
  http.get("/api/admin/queue", async () => {
    await delay();
    return HttpResponse.json(queue());
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
    const report: AdminBookingsReport = {
      summary: {
        escrowHeld: mockBookings.reduce((sum, b) => sum + escrowOf(b), 0),
        activeCount: mockBookings.filter((b) => b.status !== "released" && b.status !== "cancelled").length,
        collabCount: mockBookings.filter((b) => (b.collaborators ?? []).length > 0).length,
      },
      // Join the people's avatars, like a backend joining the users table.
      rows: mockBookings
        .map((b) => ({
          ...b,
          photographerAvatar: avatarOf(b.photographerName),
          clientAvatar: avatarOf(b.clientName),
          collaborators: b.collaborators?.map((c) => ({ ...c, avatar: avatarOf(c.name) })),
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    };
    return HttpResponse.json(report);
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

  // ── Auth (UI phase — no tokens; the session is kept client-side) ─────────
  http.post("/api/auth/login", async ({ request }) => {
    await delay();
    const { email, password } = (await request.json()) as AdminLoginInput;
    const key = email.trim().toLowerCase();
    const account = mockAdminAccounts.find((a) => a.email.toLowerCase() === key);
    if (!account || account.password !== password) {
      return HttpResponse.json(
        { message: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }
    const session: AdminSession = {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    };
    return HttpResponse.json(session);
  }),

  http.get("/api/auth/demo-accounts", async () => {
    await delay();
    const demo: AdminDemoAccount[] = mockAdminAccounts
      .filter((a) => a.demo)
      .map(({ email, password }) => ({ email, password }));
    return HttpResponse.json(demo);
  }),
];
