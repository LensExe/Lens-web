import { useState } from "react";
import {
  Award,
  Check,
  ImageOff,
  Loader2,
  MapPin,
  Pencil,
  Plus,
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
} from "@lens/ui";
import {
  useMyPhotographerProfile,
  useUpdateMyPhotographerProfile,
} from "@/queries/useDashboard";
import { CITY_OPTIONS, STYLE_OPTIONS } from "@/lib/photographer-filters";
import { currentUser } from "@/lib/session";
import type { Photographer, PhotoStyle } from "@/types";

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
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Chỉnh sửa hồ sơ
          </h1>
          <p className="mt-1 text-muted-foreground">
            Cập nhật thông tin và tác phẩm khách hàng nhìn thấy.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={update.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button className="rounded-full" disabled={!valid || update.isPending} onClick={save}>
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Lưu
          </Button>
        </div>
      </header>

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
                          ? "border-foreground bg-foreground text-background"
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
                value={draft.bio}
                onChange={(e) => patch({ bio: e.target.value })}
                className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Tác phẩm
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {draft.portfolio.length} ảnh
          </span>
        </h2>
        <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
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
            className="flex aspect-[3/4] w-full break-inside-avoid flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Plus className="size-6" />
            <span className="text-sm font-medium">Thêm ảnh</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfileView({
  profile,
  onEdit,
}: {
  profile: Photographer;
  onEdit: () => void;
}) {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hồ sơ năng lực
          </h1>
          <p className="mt-1 text-muted-foreground">
            Thông tin và tác phẩm khách hàng nhìn thấy.
          </p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={onEdit}>
          <Pencil className="size-4" />
          Chỉnh sửa
        </Button>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20 shrink-0">
            <AvatarImage src={profile.avatar} alt={profile.name} />
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">{profile.rating.toFixed(1)}</span>
                ({profile.reviewCount} đánh giá)
              </span>
              <span className="flex items-center gap-1">
                <Award className="size-3.5" />
                {profile.experienceYears} năm kinh nghiệm
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.styles.map((style) => (
                <span
                  key={style}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {style}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-sm text-muted-foreground">Giá khởi điểm</p>
            <p className="text-lg font-semibold">{formatPrice(profile.pricePerSession)}</p>
          </div>
        </div>
        <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">
          Tác phẩm
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {profile.portfolio.length} ảnh
          </span>
        </h2>
        {profile.portfolio.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ImageOff className="size-6" />
            </span>
            <p className="font-medium">Chưa có tác phẩm nào</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Thêm ảnh vào hồ sơ để khách hàng thấy được phong cách của bạn.
            </p>
          </div>
        ) : (
          <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
            {profile.portfolio.map((src, i) => (
              <PortfolioImage
                key={`${src}-${i}`}
                src={src}
                alt={`Tác phẩm ${i + 1} của ${profile.name}`}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function DashboardPortfolio() {
  const { data: profile, isLoading } = useMyPhotographerProfile();
  const [editing, setEditing] = useState(false);

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="mt-6 columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {[200, 260, 180, 240, 200, 280].map((h, i) => (
            <Skeleton key={i} style={{ height: h }} className="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return editing ? (
    <ProfileEditor profile={profile} onClose={() => setEditing(false)} />
  ) : (
    <ProfileView profile={profile} onEdit={() => setEditing(true)} />
  );
}
