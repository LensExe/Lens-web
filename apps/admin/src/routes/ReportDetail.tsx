import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Flag,
  History,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  PageContainer,
  PageHeader,
  Skeleton,
  TONE_CHIP,
  toast,
} from "@lens/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import {
  useReport,
  useReportContact,
  useResolveReport,
  useSendReportMessage,
} from "@/queries/useReports";
import { formatDate } from "@/lib/format";
import type { ModerationReportStatus } from "@/types/backend-api";

const STATUS_META: Record<ModerationReportStatus, { label: string; className: string }> = {
  open: { label: "Mới gửi", className: TONE_CHIP.amber },
  resolved: { label: "Đã xử lý", className: TONE_CHIP.emerald },
  rejected: { label: "Không vi phạm", className: TONE_CHIP.rose },
  escalated: { label: "Chuyển cấp", className: TONE_CHIP.sky },
};

const TARGET_LABEL: Record<string, string> = {
  user: "Người dùng",
  booking: "Booking",
  photographer: "Nhiếp ảnh gia",
  portfolio: "Portfolio",
  feedback: "Đánh giá",
};

const ISSUE_LABEL: Record<string, string> = {
  photo_quality: "Chất lượng ảnh",
  missing_deliverables: "Thiếu sản phẩm bàn giao",
  late_delivery: "Giao ảnh trễ",
  photographer_conduct: "Thái độ nhiếp ảnh gia",
  booking_mismatch: "Không đúng booking",
  payment_refund: "Thanh toán / hoàn tiền",
  other: "Khác",
};

const ACTOR_LABEL: Record<string, string> = {
  user: "Người dùng",
  admin: "Admin",
  system: "Hệ thống",
};

const EVENT_LABEL: Record<string, string> = {
  created: "Tạo báo cáo",
  status_changed: "Cập nhật trạng thái",
  imported: "Đồng bộ báo cáo",
};

function dateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("");
}

export function ReportDetail() {
  const { id = "" } = useParams();
  const reportQuery = useReport(id);
  const report = reportQuery.data;
  const contactQuery = useReportContact(report?.reporterId ?? "");
  const resolve = useResolveReport();
  const sendMessage = useSendReportMessage();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [nextStatus, setNextStatus] = useState<"resolved" | "rejected" | "escalated">("resolved");
  const [resolution, setResolution] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (reportQuery.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="mb-5 h-10 w-40" />
        <Skeleton className="h-12 w-96" />
        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-[32rem] rounded-2xl" />
          <Skeleton className="h-[32rem] rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (reportQuery.isError || !report) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">Không tải được báo cáo</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Báo cáo có thể đã bị xoá hoặc backend đang tạm thời không khả dụng.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/reports">
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </PageContainer>
    );
  }

  const canResolve = report.status === "open" || report.status === "escalated";
  const contact = contactQuery.data;
  const contactReady = Boolean(contact?.keycloakId);

  const submitMessage = () => {
    if (!contact?.keycloakId || !title.trim() || !message.trim()) return;
    sendMessage.mutate(
      {
        userId: contact.keycloakId,
        reportId: report.id,
        title: title.trim(),
        message: message.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Đã gửi thông báo cho người gửi báo cáo.");
          setMessage("");
        },
        onError: () => toast.error("Không gửi được thông báo. Hãy kiểm tra Notification Service."),
      },
    );
  };

  const submitResolution = () => {
    if (!resolution.trim()) return;
    resolve.mutate(
      { id: report.id, body: { status: nextStatus, resolution: resolution.trim() } },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.success("Đã cập nhật kết quả xử lý báo cáo.");
        },
        onError: () => toast.error("Không thể cập nhật báo cáo. Vui lòng thử lại."),
      },
    );
  };

  return (
    <PageContainer className="max-w-none bg-slate-50/70 py-7 md:py-10 dark:bg-background">
      <Button asChild variant="ghost" className="mb-4 -ml-3 rounded-xl text-muted-foreground">
        <Link to="/reports">
          <ArrowLeft className="size-4" />
          Quay lại danh sách báo cáo
        </Link>
      </Button>

      <PageHeader
        className="mb-7"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Flag className="size-5" />
            </span>
            <span>Báo cáo #{report.id.slice(0, 8)}</span>
          </span>
        }
        description={`Tạo ngày ${formatDate(report.createdAt)} · ${TARGET_LABEL[report.targetType]} · ${report.targetId}`}
        actions={<StatusPill meta={STATUS_META[report.status]} className="px-3 py-1.5" />}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3 border-b border-border/70 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold">Nội dung báo cáo</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thông tin gốc do người dùng gửi lên.
                </p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Đối tượng</dt>
                <dd className="mt-1 text-sm font-semibold">{TARGET_LABEL[report.targetType]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Mã đối tượng</dt>
                <dd className="mt-1 break-all text-sm font-semibold">{report.targetId}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Phân loại</dt>
                <dd className="mt-1 text-sm font-semibold">
                  {ISSUE_LABEL[report.issueType ?? ""] ?? "Chưa phân loại"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 rounded-xl bg-muted/45 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6">
                {report.reason || "Không có mô tả."}
              </p>
            </div>
            {report.targetType === "booking" && (
              <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
                <Link to={`/bookings/${report.targetId}`}>
                  <ExternalLink className="size-4" />
                  Mở booking liên quan
                </Link>
              </Button>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3 border-b border-border/70 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ImageIcon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Bằng chứng đính kèm</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ảnh và file được cấp URL tạm thời để admin kiểm tra.
                </p>
              </div>
            </div>
            {report.evidence.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Báo cáo không có bằng chứng đính kèm.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.evidence.map((item) => {
                  const url = item.previewUrl || item.thumbnailUrl || item.downloadUrl;
                  return (
                    <a
                      key={item.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-xl border border-border bg-muted/30"
                    >
                      {url && item.contentType.startsWith("image/") ? (
                        <img
                          src={url}
                          alt="Bằng chứng báo cáo"
                          className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
                          Mở file bằng chứng
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                        <span className="truncate">{item.contentType || "Tệp đính kèm"}</span>
                        <ExternalLink className="size-3.5 shrink-0" />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3 border-b border-border/70 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <History className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Lịch sử xử lý</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Audit trail của báo cáo, không thể sửa ngược.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {report.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có lịch sử xử lý.</p>
              ) : (
                report.history.map((event, index) => (
                  <div key={event.id} className="relative flex gap-3">
                    {index < report.history.length - 1 && (
                      <span className="absolute left-2 top-5 h-full w-px bg-border" />
                    )}
                    <span className="z-10 mt-0.5 flex size-4 shrink-0 rounded-full border-2 border-background bg-foreground" />
                    <div className="min-w-0 pb-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span>{EVENT_LABEL[event.eventType] ?? event.eventType}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{STATUS_META[event.toStatus].label}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ACTOR_LABEL[event.actorRole] ?? event.actorRole} ·{" "}
                        {dateTime(event.createdAt)}
                      </p>
                      {event.note && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <MessageCircle className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Liên hệ người gửi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gửi yêu cầu bổ sung thông tin hoặc cập nhật tiến độ xử lý.
                </p>
              </div>
            </div>
            {contactQuery.isLoading ? (
              <Skeleton className="mt-5 h-16 rounded-xl" />
            ) : contact ? (
              <div className="mt-5 rounded-xl border border-border/70 bg-muted/25 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {contact.avatar && <AvatarImage src={contact.avatar} alt={contact.name} />}
                    <AvatarFallback>{initials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{contact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {contact.email || "Chưa có email"}
                    </p>
                  </div>
                </div>
                {contact.phone && (
                  <p className="mt-3 text-xs text-muted-foreground">SĐT: {contact.phone}</p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                Không tìm thấy thông tin người gửi.
              </p>
            )}

            <div className="mt-5 space-y-4 border-t border-border/70 pt-5">
              <label className="grid gap-2 text-sm font-medium">
                Tiêu đề thông báo
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  placeholder="Ví dụ: Cần bổ sung bằng chứng cho báo cáo"
                  className="h-10 rounded-xl"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Nội dung gửi đến người dùng
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder="Nhập câu hỏi hoặc hướng dẫn tiếp theo…"
                  className="resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <Button
                className="w-full rounded-xl"
                disabled={
                  !contactReady || !title.trim() || !message.trim() || sendMessage.isPending
                }
                onClick={submitMessage}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Gửi thông báo in-app
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                Thông báo sẽ xuất hiện trong hộp thư của người gửi và được phát realtime nếu họ đang
                online.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Bước xử lý cuối</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ghi nhận kết luận để đồng bộ trạng thái và audit history.
                </p>
              </div>
            </div>
            {canResolve ? (
              <div className="mt-5 space-y-4">
                <label className="grid gap-2 text-sm font-medium">
                  Kết quả
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as typeof nextStatus)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="resolved">Xác nhận vi phạm / đã xử lý</option>
                    <option value="rejected">Không đủ cơ sở / không vi phạm</option>
                    <option value="escalated">Chuyển cấp xử lý</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Ghi chú xử lý
                  <textarea
                    value={resolution}
                    onChange={(event) => setResolution(event.target.value)}
                    maxLength={10000}
                    rows={5}
                    placeholder="Ghi rõ kết luận, hành động đã thực hiện hoặc lý do chuyển cấp…"
                    className="resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <Button
                  className="w-full rounded-xl"
                  disabled={!resolution.trim() || resolve.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Check className="size-4" />
                  Lưu kết quả xử lý
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <p className="text-sm font-medium">Báo cáo đã có kết quả cuối cùng.</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {report.resolution || "Chưa có ghi chú xử lý."}
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xác nhận xử lý báo cáo"
        description="Thao tác này sẽ cập nhật trạng thái báo cáo và ghi thêm một sự kiện vào lịch sử xử lý."
        confirmLabel="Xác nhận cập nhật"
        pending={resolve.isPending}
        confirmDisabled={!resolution.trim()}
        onConfirm={submitResolution}
      />
    </PageContainer>
  );
}
