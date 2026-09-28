import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ArrowUpRight,
  Camera,
  Check,
  ExternalLink,
  ImageOff,
  Images,
  Lightbulb,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  cn,
  formatPrice,
  photo,
  toast,
  PageContainer,
  PageHeader,
} from "@lens/ui";
import {
  useMyPhotographerProfile,
  useUpdateMyPhotographerProfile,
} from "@/queries/useDashboard";
import { CITY_OPTIONS, STYLE_OPTIONS, experienceLabel } from "@/lib/photographer-filters";
import { currentUser } from "@/lib/session";
import { RankBadge } from "@/components/achievements/RankBadge";
import type { Photographer, PhotoStyle } from "@/types";

/** Longest "Giới thiệu" a photographer can write (no minimum). */
const BIO_MAX = 500;
/** Suggested number of portfolio shots — shown as advice, never enforced. */
const RECOMMENDED_PORTFOLIO = 12;

const ASPECTS = ["4 / 5", "1 / 1", "3 / 4", "5 / 7"];

function PortfolioImage({
  src,
  alt,
  index,
  onRemove,
}: {
  src: string;
  alt: string;
  index: number;
  onRemove?: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border break-inside-avoid">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ aspectRatio: ASPECTS[index % 4] }}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Xoá ảnh"
          className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-white"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

interface Draft {
  bio: string;
  city: string;
  pricePerSession: number;
  experienceYears: number;
  styles: PhotoStyle[];
  portfolio: string[];
}

// Editor mounts only while editing, so `draft` is always present here — no
// null-guards that the React Compiler could hoist into render.
function ProfileEditor({
  profile,
  onClose,
}: {
  profile: Photographer;
  onClose: () => void;
}) {
  const update = useUpdateMyPhotographerProfile();
  const [draft, setDraft] = useState<Draft>(() => ({
    bio: profile.bio,
    city: profile.city,
    pricePerSession: profile.pricePerSession,
    experienceYears: profile.experienceYears,
    styles: [...profile.styles],
    portfolio: [...profile.portfolio],
  }));

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const toggleStyle = (s: PhotoStyle) =>
    setDraft((d) => ({
      ...d,
      styles: d.styles.includes(s)
        ? d.styles.filter((x) => x !== s)
        : [...d.styles, s],
    }));
  const addPhoto = () =>
    setDraft((d) => ({
      ...d,
      portfolio: [...d.portfolio, photo(`me-${Date.now()}`, 600, 800)],
    }));
  const removePhoto = (i: number) =>
    setDraft((d) => ({ ...d, portfolio: d.portfolio.filter((_, idx) => idx !== i) }));

  const valid =
    draft.bio.trim().length > 0 &&
    draft.bio.length <= BIO_MAX &&
    draft.pricePerSession > 0 &&
    draft.styles.length > 0;

  const save = () => {
    if (!valid) return;
    update.mutate(
      { ...draft, bio: draft.bio.trim() },
      {
        onSuccess: () => {
          onClose();
          toast.success("Đã cập nhật hồ sơ");
        },
        onError: () => toast.error("Lưu hồ sơ thất bại, vui lòng thử lại"),
      }
    );
  };

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <Pencil className="size-[18px]" />
            </span>
            <span>Chỉnh sửa hồ sơ</span>
          </span>
        }
        description="Cập nhật thông tin và tác phẩm khách hàng nhìn thấy trên hồ sơ công khai."
        actions={
          <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={update.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button className="rounded-full bg-ember text-white hover:bg-ember/90" disabled={!valid || update.isPending} onClick={save}>
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Lưu
          </Button>
          </div>
        }
      />

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-4">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tỉnh / Thành phố">
                <Select value={draft.city} onValueChange={(v) => patch({ city: v })}>
                  <SelectTrigger className="h-10! w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Giá khởi điểm (VND)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10000}
                  value={draft.pricePerSession}
                  onChange={(e) => patch({ pricePerSession: Number(e.target.value) })}
                />
              </Field>
              <Field label="Số năm kinh nghiệm">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.experienceYears}
                  onChange={(e) => patch({ experienceYears: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Phong cách chụp">
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((s) => {
                  const active = draft.styles.includes(s);
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleStyle(s)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        active
                          ? "border-ember bg-ember text-white"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Giới thiệu">
              <textarea
                rows={4}
                maxLength={BIO_MAX}
                value={draft.bio}
                onChange={(e) => patch({ bio: e.target.value })}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ember"
              />
              <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
                {draft.bio.length}/{BIO_MAX} ký tự
              </p>
            </Field>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            Tác phẩm <span className="ml-1 text-xs font-normal text-muted-foreground">{draft.portfolio.length} ảnh</span>
          </h2>
          <span className="text-[10px] text-muted-foreground">Ảnh sẽ hiển thị trên hồ sơ công khai</span>
        </div>
        {/* Advice only — saving never depends on it. */}
        <p
          className={cn(
            "-mt-2 mb-4 flex items-start gap-2 text-sm",
            draft.portfolio.length >= RECOMMENDED_PORTFOLIO
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          {draft.portfolio.length >= RECOMMENDED_PORTFOLIO
            ? `Tuyệt vời! Hồ sơ đã có đủ ${RECOMMENDED_PORTFOLIO} ảnh khuyến nghị để khách hàng cảm nhận rõ phong cách của bạn.`
            : `Khuyến nghị nên tải lên khoảng ${RECOMMENDED_PORTFOLIO} ảnh đã hậu kỳ để khách hàng cảm nhận rõ phong cách của bạn (hiện có ${draft.portfolio.length}/${RECOMMENDED_PORTFOLIO}).`}
        </p>
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4">
          {draft.portfolio.map((src, i) => (
            <PortfolioImage
              key={`${src}-${i}`}
              src={src}
              alt={`Tác phẩm ${i + 1}`}
              index={i}
              onRemove={() => removePhoto(i)}
            />
          ))}
          <button
            type="button"
            onClick={addPhoto}
          className="flex aspect-[3/4] w-full break-inside-avoid flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-ember/40 hover:bg-ember/[0.035] hover:text-ember"
          >
            <Plus className="size-6" />
            <span className="text-sm font-medium">Thêm ảnh</span>
          </button>
        </div>
      </section>
    </PageContainer>
  );
}

function ProfileView({
  profile,
  onEdit,
}: {
  profile: Photographer;
  onEdit: () => void;
}) {
  const packageCount = profile.packages?.length ?? 0;

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <Camera className="size-[18px]" />
            </span>
            <span>Hồ sơ năng lực</span>
          </span>
        }
        description="Trang giới thiệu công khai và những tác phẩm tiêu biểu của bạn."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={`/photographers/${currentUser.id}`}>
                <ExternalLink className="size-4" />
                Xem hồ sơ công khai
              </Link>
            </Button>
            <Button className="rounded-full bg-ember text-white hover:bg-ember/90" onClick={onEdit}>
              <Pencil className="size-4" />
              Chỉnh sửa hồ sơ
            </Button>
          </>
        }
      />

      <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <Avatar className="size-[76px] shrink-0 ring-4 ring-muted/70">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{profile.name}</h2>
              {profile.rank && <RankBadge rank={profile.rank} />}
              {profile.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <Star className="size-3 fill-current" /> Nổi bật
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {profile.bio}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {profile.city}
              </span>
              <span aria-hidden="true" className="text-border">•</span>
              <span>{experienceLabel(profile.experienceYears)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.styles.map((style) => (
                <span key={style} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  {style}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Giá khởi điểm</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {formatPrice(profile.pricePerSession)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ buổi</span>
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Theo concept yêu cầu</p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Star, value: profile.rating.toFixed(1), suffix: "/ 5.0", label: "Đánh giá trung bình", hint: `${profile.reviewCount} lượt đánh giá`, tone: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10" },
          { icon: Images, value: profile.portfolio.length, suffix: " ảnh", label: "Tác phẩm công khai", hint: "Đang hiển thị trên hồ sơ", tone: "text-ember bg-ember/10" },
          { icon: Award, value: profile.experienceYears, suffix: " năm", label: "Kinh nghiệm", hint: "Đồng hành cùng khách hàng", tone: "text-lagoon bg-lagoon/10" },
          { icon: Camera, value: profile.styles.length, suffix: " phong cách", label: "Thế mạnh chụp ảnh", hint: `${packageCount} gói dịch vụ đang có`, tone: "text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/10" },
        ].map(({ icon: Icon, value, suffix, label, hint, tone }) => (
          <article key={label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex size-9 items-center justify-center rounded-xl", tone)}><Icon className="size-4" /></span>
              <p className="text-xl font-semibold tracking-tight tabular-nums">{value}<span className="ml-1 text-xs font-medium text-muted-foreground">{suffix}</span></p>
            </div>
            <p className="mt-3 text-xs font-semibold">{label}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Tác phẩm tiêu biểu</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {profile.portfolio.length} ảnh
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Những khoảnh khắc khách hàng có thể xem trên hồ sơ công khai.</p>
          </div>
          <Link to={`/photographers/${currentUser.id}`} className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-ember sm:self-auto">
            Xem tất cả trên hồ sơ <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        {profile.portfolio.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/15 p-10 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ImageOff className="size-5" />
            </span>
            <p className="text-sm font-semibold">Chưa có tác phẩm nào</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">Thêm ảnh để khách hàng dễ hình dung phong cách chụp của bạn.</p>
            <Button className="mt-4 rounded-full bg-ember text-white hover:bg-ember/90" onClick={onEdit}>
              <Plus className="size-4" /> Thêm tác phẩm
            </Button>
          </div>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
            {profile.portfolio.map((src, i) => (
              <PortfolioImage key={`${src}-${i}`} src={src} alt={`Tác phẩm ${i + 1} của ${profile.name}`} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Phong cách &amp; khu vực</h2>
            <span className="text-[10px] text-muted-foreground">{profile.city}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.styles.map((style) => <span key={style} className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium">{style}</span>)}
          </div>
        </article>
        <article className="rounded-2xl border border-lagoon/20 bg-lagoon/[0.035] p-4 shadow-xs sm:p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-lagoon/10 text-lagoon"><ShieldCheck className="size-4" /></span>
            <h2 className="text-sm font-semibold">Thanh toán an toàn qua Lens</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Khoản thanh toán được giữ an toàn và chỉ chuyển cho bạn sau khi khách xác nhận đã nhận ảnh.
          </p>
        </article>
      </section>
    </PageContainer>
  );
}

export function DashboardPortfolio() {
  const { data: profile, isLoading } = useMyPhotographerProfile();
  const [editing, setEditing] = useState(false);

  if (isLoading || !profile) {
    return (
      <PageContainer>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="mt-6 columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4">
          {[200, 260, 180, 240, 200, 280].map((h, i) => (
            <Skeleton key={i} style={{ height: h }} className="rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return editing ? (
    <ProfileEditor profile={profile} onClose={() => setEditing(false)} />
  ) : (
    <ProfileView profile={profile} onEdit={() => setEditing(true)} />
  );
}
