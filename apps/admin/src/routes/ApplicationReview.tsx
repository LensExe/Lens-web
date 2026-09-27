import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileSearch,
  MapPin,
  MessageSquareText,
  Wallet,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  PageContainer,
  Skeleton,
  Spinner,
  TONE_CHIP,
  Textarea,
  cn,
  formatPrice,
  toast,
} from "@lens/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { StatusPill } from "@/components/StatusPill";
import { useApplications, useDecideApplication } from "@/queries/useApplications";
import { APPROVAL_STATUS_META } from "@/lib/status";
import { formatDate, formatRelative } from "@/lib/format";
import type { PhotographerApplication } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

/** Recommended portfolio size — a hint for the reviewer, never a requirement. */
const RECOMMENDED_PORTFOLIO = 12;

// One-click starters for the rejection note — the admin can still edit it.
const QUICK_REASONS = [
  { label: "Portfolio ít ảnh", text: `Portfolio còn ít ảnh để đánh giá phong cách — nên có khoảng ${RECOMMENDED_PORTFOLIO} ảnh đã qua hậu kỳ.` },
  { label: "Ảnh chưa qua hậu kỳ", text: "Ảnh chưa qua hậu kỳ hoặc chất lượng chưa đồng đều." },
  { label: "Thiếu phần giới thiệu", text: "Phần giới thiệu còn sơ sài, vui lòng bổ sung kinh nghiệm và phong cách chụp." },
];

/**
 * Full-page review of one application: who they are and a decision panel on
 * the left (sticky), the whole portfolio large on the right. Deciding moves
 * straight on to the next application waiting in the queue.
 */
export function ApplicationReview() {
  const { id = "" } = useParams();
  const { data: applications = [], isLoading } = useApplications();

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-56" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
          <Skeleton className="h-[32rem] rounded-3xl" />
          <Skeleton className="h-[32rem] rounded-3xl" />
        </div>
      </PageContainer>
    );
  }

  const app = applications.find((a) => a.id === id);
  if (!app) {
    return (
      <PageContainer>
        <EmptyState icon={FileSearch} title="Không tìm thấy hồ sơ" hint="Hồ sơ không tồn tại hoặc đường dẫn đã thay đổi." />
        <div className="mt-5 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/photographers">
              <ArrowLeft className="size-4" />
              Về danh sách
            </Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Keyed by id: the decision state starts fresh for every application.
  return <Review key={app.id} app={app} applications={applications} />;
}

function Review({
  app,
  applications,
}: {
  app: PhotographerApplication;
  applications: PhotographerApplication[];
}) {
  const navigate = useNavigate();
  const decide = useDecideApplication();
  const [viewing, setViewing] = useState<number | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  // Step through the pending queue while reviewing; decided ones through all.
  const pending = applications.filter((a) => a.status === "pending");
  const siblings = app.status === "pending" ? pending : applications;
  const index = siblings.findIndex((a) => a.id === app.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const go = (target?: PhotographerApplication) => target && navigate(`/photographers/${target.id}`);

  // After a decision: the next one still waiting, else back to the list.
  const afterDecision = () => {
    const rest = pending.filter((a) => a.id !== app.id);
    const upNext = rest[Math.min(Math.max(index, 0), rest.length - 1)];
    navigate(upNext ? `/photographers/${upNext.id}` : "/photographers");
  };

  const approve = () =>
    decide.mutate(
      { id: app.id, decision: { status: "approved" } },
      {
        onSuccess: () => {
          toast.success(`Đã duyệt hồ sơ của ${app.name}`);
          setConfirmApprove(false);
          afterDecision();
        },
        onError: () => toast.error("Không thể duyệt hồ sơ, vui lòng thử lại"),
      }
    );
  const reject = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    decide.mutate(
      { id: app.id, decision: { status: "rejected", note: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(`Đã từ chối hồ sơ của ${app.name}`);
          afterDecision();
        },
        onError: () => toast.error("Không thể từ chối hồ sơ, vui lòng thử lại"),
      }
    );
  };

  const facts = [
    { icon: MapPin, label: "Khu vực", value: app.city },
    { icon: Briefcase, label: "Kinh nghiệm", value: `${app.experienceYears} năm` },
    { icon: Wallet, label: "Giá / buổi", value: formatPrice(app.pricePerSession) },
    { icon: CalendarDays, label: "Ngày gửi", value: formatDate(app.submittedAt) },
  ];
  const checks = [
    {
      ok: app.portfolio.length >= RECOMMENDED_PORTFOLIO,
      label: `Portfolio đạt mức đề nghị (${RECOMMENDED_PORTFOLIO} ảnh)`,
      detail: `${app.portfolio.length} ảnh`,
    },
    { ok: app.styles.length > 0, label: "Đã chọn phong cách chụp", detail: app.styles.join(", ") },
  ];

  return (
    <PageContainer>
      {/* Queue navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/photographers"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Duyệt nhiếp ảnh gia
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Hồ sơ <span className="font-medium text-foreground tabular-nums">{index + 1}/{siblings.length}</span>
            {app.status === "pending" ? " đang chờ" : ""}
          </span>
          <Button variant="outline" size="sm" className="rounded-full" disabled={!prev} onClick={() => go(prev)}>
            <ChevronLeft className="size-4" />
            Trước
          </Button>
          <Button variant="outline" size="sm" className="rounded-full" disabled={!next} onClick={() => go(next)}>
            Tiếp theo
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
        {/* Who + decision */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-2">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 shrink-0">
                <AvatarImage src={app.avatar} alt={app.name} />
                <AvatarFallback>{initialsOf(app.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight">{app.name}</h1>
                <p className="truncate text-sm text-muted-foreground">{app.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill meta={APPROVAL_STATUS_META[app.status]} />
                  <span className="text-xs text-muted-foreground">Gửi {formatRelative(app.submittedAt)} trước</span>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="size-3.5" />
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-1.5">
              {app.styles.map((s) => (
                <span key={s} className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-foreground/85">{app.bio}</p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold">Gợi ý kiểm tra</h2>
            <ul className="mt-3 space-y-2.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2.5 text-sm">
                  {c.ok ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>
                    {c.label}
                    {c.detail && <span className="text-muted-foreground"> · {c.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {app.status === "pending" ? (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold">Quyết định</h2>
              {rejecting ? (
                <div className="mt-3 space-y-3">
                  <label htmlFor="reject-reason" className="text-sm">
                    Lý do từ chối <span className="text-destructive">*</span>
                    <span className="block text-xs text-muted-foreground">Nhiếp ảnh gia sẽ nhận được lý do này.</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map((r) => (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => {
                          setReason((cur) => (cur.includes(r.text) ? cur : cur.trim() ? `${cur.trim()} ${r.text}` : r.text));
                          setReasonError(false);
                        }}
                        className="focus-ring rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        + {r.label}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    id="reject-reason"
                    autoFocus
                    rows={4}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (e.target.value.trim()) setReasonError(false);
                    }}
                    placeholder="Nhập lý do hoặc chọn gợi ý ở trên…"
                    aria-invalid={reasonError}
                    className="resize-none rounded-xl"
                  />
                  {reasonError && <p className="text-sm text-destructive">Vui lòng nhập lý do từ chối.</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={() => setRejecting(false)}>
                      Quay lại
                    </Button>
                    <Button variant="destructive" className="flex-1 rounded-full" disabled={decide.isPending} onClick={reject}>
                      {decide.isPending && <Spinner />}
                      Xác nhận từ chối
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="lg" className="flex-1 rounded-full" onClick={() => setRejecting(true)}>
                    <X className="size-4" />
                    Từ chối
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-full"
                    onClick={() => setConfirmApprove(true)}
                  >
                    <Check className="size-4" />
                    Duyệt hồ sơ
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <section
              className={cn("rounded-3xl p-6 text-sm", app.status === "rejected" ? TONE_CHIP.rose : TONE_CHIP.emerald)}
            >
              <p className="flex items-center gap-1.5 font-semibold">
                <MessageSquareText className="size-4" />
                {app.status === "rejected" ? "Đã từ chối" : "Đã duyệt"}
                {app.reviewedAt && <span className="font-normal opacity-80">· {formatDate(app.reviewedAt)}</span>}
              </p>
              <p className="mt-1.5 leading-relaxed">{app.reviewNote ?? "Không có ghi chú."}</p>
            </section>
          )}
        </aside>

        {/* Portfolio */}
        <section className="min-w-0">
          <h2 className="mb-4 text-lg font-semibold">
            Portfolio <span className="font-normal text-muted-foreground">· {app.portfolio.length} ảnh</span>
          </h2>
          <div className="columns-2 gap-4 xl:columns-3 [&>*]:mb-4">
            {app.portfolio.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setViewing(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                className="focus-ring group block w-full break-inside-avoid overflow-hidden rounded-2xl bg-muted"
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>
            ))}
          </div>
        </section>
      </div>

      <PhotoLightbox photos={app.portfolio} index={viewing} onIndexChange={setViewing} title={app.name} />
      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={setConfirmApprove}
        title={`Duyệt hồ sơ của ${app.name}?`}
        description="Hồ sơ sẽ hiển thị công khai và khách hàng có thể đặt lịch với nhiếp ảnh gia này ngay."
        confirmLabel="Duyệt hồ sơ"
        pending={decide.isPending}
        onConfirm={approve}
      />
    </PageContainer>
  );
}
