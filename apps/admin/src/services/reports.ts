import { adminApi } from "@/services/backend";
import { allPages, number, record, text } from "@/services/normalize";
import type {
  AdminReportData,
  AdminReportDetailData,
  AdminReportEvidenceData,
  AdminReportHistoryData,
  ModerationReportStatus,
  ModerationReportTargetType,
  ReportResolveDto,
} from "@/types/backend-api";

export interface AdminModerationReport {
  id: string;
  reporterId: string;
  targetType: ModerationReportTargetType;
  targetId: string;
  issueType?: string;
  reason: string;
  status: ModerationReportStatus;
  resolution?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminModerationReportEvidence {
  id: string;
  status: string;
  contentType: string;
  fileSize: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  expiresIn?: number;
}

export interface AdminModerationReportHistory {
  id: string;
  eventType: string;
  fromStatus?: ModerationReportStatus;
  toStatus: ModerationReportStatus;
  actorUserId?: string;
  actorRole: "user" | "admin" | "system";
  note?: string;
  createdAt: string;
}

export interface AdminModerationReportDetail extends AdminModerationReport {
  evidenceMediaIds: string[];
  evidence: AdminModerationReportEvidence[];
  history: AdminModerationReportHistory[];
}

export interface AdminReportContact {
  id: string;
  keycloakId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

const REPORT_TARGET_TYPES: ModerationReportTargetType[] = [
  "user",
  "booking",
  "photographer",
  "portfolio",
  "feedback",
];

const REPORT_STATUSES: ModerationReportStatus[] = ["open", "resolved", "rejected", "escalated"];

const asTargetType = (value: unknown): ModerationReportTargetType =>
  REPORT_TARGET_TYPES.includes(value as ModerationReportTargetType)
    ? (value as ModerationReportTargetType)
    : "user";

const asStatus = (value: unknown): ModerationReportStatus =>
  REPORT_STATUSES.includes(value as ModerationReportStatus)
    ? (value as ModerationReportStatus)
    : "open";

function normalizeReport(raw: unknown): AdminModerationReport {
  const row = record(raw) as Partial<AdminReportData>;
  return {
    id: text(row.id),
    reporterId: text(row.user_id),
    targetType: asTargetType(row.target_type),
    targetId: text(row.target_id),
    issueType: text(row.booking_issue_type) || undefined,
    reason: text(row.reason),
    status: asStatus(row.status),
    resolution: text(row.resolution) || undefined,
    resolvedBy: text(row.resolved_by) || undefined,
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function normalizeEvidence(raw: unknown): AdminModerationReportEvidence {
  const row = record(raw) as Partial<AdminReportEvidenceData>;
  return {
    id: text(row.id),
    status: text(row.status),
    contentType: text(row.content_type),
    fileSize: number(row.file_size),
    thumbnailUrl: text(row.thumbnail_url) || undefined,
    previewUrl: text(row.preview_url) || undefined,
    downloadUrl: text(row.download_url) || undefined,
    expiresIn: typeof row.expires_in === "number" ? row.expires_in : undefined,
  };
}

function normalizeHistory(raw: unknown): AdminModerationReportHistory {
  const row = record(raw) as Partial<AdminReportHistoryData>;
  return {
    id: text(row.id),
    eventType: text(row.event_type),
    fromStatus: row.from_status ? asStatus(row.from_status) : undefined,
    toStatus: asStatus(row.to_status),
    actorUserId: text(row.actor_user_id) || undefined,
    actorRole: row.actor_role === "admin" || row.actor_role === "system" ? row.actor_role : "user",
    note: text(row.note) || undefined,
    createdAt: text(row.created_at),
  };
}

export async function getReports(): Promise<AdminModerationReport[]> {
  const reports = await allPages((query) => adminApi.listReports(query));
  return reports.map(normalizeReport);
}

export async function getReport(id: string): Promise<AdminModerationReportDetail> {
  const raw = (await adminApi.getReport(id)) as unknown as AdminReportDetailData;
  const report = normalizeReport(raw);
  const row = record(raw);
  return {
    ...report,
    evidenceMediaIds: Array.isArray(row.evidence_media_ids)
      ? row.evidence_media_ids.filter((value): value is string => typeof value === "string")
      : [],
    evidence: Array.isArray(row.evidence) ? row.evidence.map(normalizeEvidence) : [],
    history: Array.isArray(row.history) ? row.history.map(normalizeHistory) : [],
  };
}

export async function resolveReport(id: string, body: ReportResolveDto) {
  return adminApi.resolveReport(id, body);
}

export async function getReportContact(userId: string): Promise<AdminReportContact> {
  const row = record(await adminApi.getUser(userId));
  return {
    id: text(row.id, userId),
    keycloakId: text(row.keycloak_id),
    name: text(row.fullname, "Người dùng Lens"),
    email: text(row.email),
    phone: text(row.phone_number) || undefined,
    avatar: text(row.avatar_url) || undefined,
  };
}

/** Uses the existing in-app notification channel for report follow-up messages. */
export async function sendReportMessage(input: {
  userId: string;
  reportId: string;
  title: string;
  message: string;
}) {
  return adminApi.sendNotification({
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: "report_update",
    data: { report_id: input.reportId },
  });
}
