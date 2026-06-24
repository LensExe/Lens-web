import { http, HttpResponse } from "msw";
import { delay } from "@lens/ui";
import { mockUsers } from "@/mock/users";
import { mockApplications } from "@/mock/applications";
import { mockActivity, mockStats } from "@/mock/stats";
import { mockReports } from "@/mock/reports";
import type {
  AdminUser,
  ApprovalStatus,
  PhotographerApplication,
  UserStatus,
} from "@/types";

// Mock backend for admin. Handlers play the role of the server: read the mock
// data ("database seed") and own the in-memory state + logic that used to live
// in the services (sorting, status changes). State resets on a full reload.

let users: AdminUser[] = mockUsers.map((u) => ({ ...u }));
let applications: PhotographerApplication[] = mockApplications.map((a) => ({
  ...a,
}));

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
];
