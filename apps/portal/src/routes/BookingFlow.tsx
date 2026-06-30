import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Calendar,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  cn,
  formatPrice,
} from "@lens/ui";
import { usePhotographer } from "@/queries/usePhotographers";
import { useCreateBooking } from "@/queries/useBookings";
import {
  TIME_SLOTS,
  bookingSchema,
  resolvePackages,
  type BookingFormValues,
} from "@/lib/booking";
import { CITY_OPTIONS } from "@/lib/photographer-filters";

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const formatDateVN = (s: string) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const STEPS = ["Buổi chụp", "Thông tin", "Xác nhận"];
const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function BookingFlow() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: photographer, isLoading } = usePhotographer(id);
  const createBooking = useCreateBooking();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: standardSchemaResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: {
      packageId: "",
      date: "",
      timeSlot: "",
      city: "",
      addressDetail: "",
      contactName: "",
      contactPhone: "",
      note: "",
    },
  });

  const values = watch();

  // Reset scroll on every step change / success BEFORE paint, so the swap never
  // shows the new screen at the old scroll position and then jump.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, createBooking.isSuccess]);

  // "Tiếp tục" and "Xác nhận đặt lịch" share the same button position, so React
  // reuses the DOM node. A fast double-click on "Tiếp tục" would land its 2nd
  // click on the morphed submit button and book instantly, skipping the review.
  // Arm the confirm button only after a short settle window on the review step.
  const [confirmArmed, setConfirmArmed] = useState(false);
  useEffect(() => {
    if (step !== 2) {
      setConfirmArmed(false);
      return;
    }
    const t = setTimeout(() => setConfirmArmed(true), 400);
    return () => clearTimeout(t);
  }, [step]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[900px] px-5 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[900px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy nhiếp ảnh gia</h1>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Về danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const packages = resolvePackages(photographer);
  const price = values.packageId
    ? (packages.find((p) => p.id === values.packageId)?.price ?? 0)
    : 0;
  const availableSet = new Set(photographer.availableDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = values.date ? fromISODate(values.date) : undefined;
  const locationLabel = [values.addressDetail?.trim(), values.city]
    .filter(Boolean)
    .join(", ");

  const back = () =>
    step === 0 ? navigate(`/photographers/${id}`) : setStep((s) => s - 1);

  const next = async () => {
    const fields: (keyof BookingFormValues)[] =
      step === 0
        ? ["packageId", "date", "timeSlot"]
        : ["city", "addressDetail", "contactName", "contactPhone", "note"];
    if (await trigger(fields)) setStep((s) => Math.min(s + 1, 2));
  };

  const onSubmit = (v: BookingFormValues) => {
    // Guard: only the final review step may actually create the booking. If the
    // form is submitted earlier (e.g. Enter in a field), advance instead of
    // skipping the review and jumping straight to the success screen.
    if (step < 2) {
      setStep((s) => Math.min(s + 1, 2));
      return;
    }
    createBooking.mutate({
      photographerId: photographer.id,
      photographerName: photographer.name,
      style: photographer.styles[0],
      packageId: v.packageId,
      date: v.date,
      timeSlot: v.timeSlot,
      location: [v.addressDetail?.trim(), v.city].filter(Boolean).join(", "),
      contactName: v.contactName,
      contactPhone: v.contactPhone,
      note: v.note,
      price,
    });
  };

  // Success screen
  if (createBooking.isSuccess) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-16 text-center duration-300 animate-in fade-in-0 slide-in-from-bottom-2">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ember/10 text-ember">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          Đã gửi yêu cầu đặt lịch!
        </h1>
        <p className="mt-2 text-muted-foreground">
          {photographer.name} sẽ xem và xác nhận buổi chụp của bạn trong thời gian
          sớm nhất.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left text-sm">
          <SummaryRow label="Nhiếp ảnh gia" value={photographer.name} />
          <SummaryRow label="Ngày" value={`${formatDateVN(values.date)} · ${values.timeSlot}`} />
          <SummaryRow label="Địa điểm" value={locationLabel} />
          <Separator className="my-3" />
          <div className="flex items-center justify-between font-semibold">
            <span>Tổng tạm tính</span>
            <span>{formatPrice(price)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-full">
            <Link to="/client/bookings">Xem lịch đặt của tôi</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Khám phá thêm</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8">
      <button
        type="button"
        onClick={back}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {step === 0 ? "Về hồ sơ" : "Quay lại"}
      </button>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3 last:flex-none">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                i <= step
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border max-sm:hidden" />
            )}
          </li>
        ))}
      </ol>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[1fr_300px]"
      >
        <div className="min-w-0 space-y-7">
          {/* Step 1 — session */}
          {step === 0 && (
            <>
              <div>
                <h2 className="mb-3 text-base font-semibold">Chọn gói chụp</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {packages.map((pkg) => {
                    const active = values.packageId === pkg.id;
                    return (
                      <button
                        type="button"
                        key={pkg.id}
                        onClick={() => setValue("packageId", pkg.id, { shouldValidate: true })}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <p className="font-medium">{pkg.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{pkg.duration}</p>
                        <p className="mt-2 font-semibold">{formatPrice(pkg.price)}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.packageId && (
                  <p className="mt-2 text-sm text-destructive">{errors.packageId.message}</p>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-base font-semibold">Chọn ngày trống</h2>
                <div className="inline-block rounded-2xl border border-border p-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate ?? fromISODate(photographer.availableDates[0] ?? toISODate(today))}
                    disabled={[{ before: today }, (d: Date) => !availableSet.has(toISODate(d))]}
                    onSelect={(d) =>
                      setValue("date", d ? toISODate(d) : "", { shouldValidate: true })
                    }
                  />
                </div>
                {errors.date && (
                  <p className="mt-2 text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div>
                <h2 className="mb-3 text-base font-semibold">Khung giờ</h2>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const active = values.timeSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setValue("timeSlot", slot, { shouldValidate: true })}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition-colors",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {errors.timeSlot && (
                  <p className="mt-2 text-sm text-destructive">{errors.timeSlot.message}</p>
                )}
              </div>
            </>
          )}

          {/* Step 2 — details */}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Tỉnh / Thành phố" error={errors.city?.message}>
                <Select
                  value={values.city || undefined}
                  onValueChange={(v) => setValue("city", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-10! w-full rounded-xl">
                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
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
              <Field label="Địa chỉ cụ thể (không bắt buộc)" error={errors.addressDetail?.message}>
                <Input placeholder="VD: Hồ Tây, studio ABC..." {...register("addressDetail")} />
              </Field>
              <Field label="Họ và tên" error={errors.contactName?.message}>
                <Input placeholder="Người liên hệ" {...register("contactName")} />
              </Field>
              <Field label="Số điện thoại" error={errors.contactPhone?.message}>
                <Input placeholder="VD: 0901234567" inputMode="tel" {...register("contactPhone")} />
              </Field>
              <Field label="Ghi chú (không bắt buộc)" error={errors.note?.message}>
                <textarea
                  rows={4}
                  placeholder="Mô tả ý tưởng, concept, số người chụp..."
                  className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("note")}
                />
              </Field>
            </div>
          )}

          {/* Step 3 — review */}
          {step === 2 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Xác nhận thông tin</h2>
              <div className="mt-4 space-y-0.5">
                <SummaryRow label="Gói chụp" value={packages.find((p) => p.id === values.packageId)?.name ?? "—"} />
                <SummaryRow label="Ngày & giờ" value={`${formatDateVN(values.date)} · ${values.timeSlot}`} />
                <SummaryRow label="Địa điểm" value={locationLabel} />
                <SummaryRow label="Liên hệ" value={`${values.contactName} · ${values.contactPhone}`} />
                {values.note && <SummaryRow label="Ghi chú" value={values.note} />}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Tổng tạm tính</span>
                <span>{formatPrice(price)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Đây là chi phí tạm tính. Nhiếp ảnh gia sẽ xác nhận lại trước khi chốt lịch.
              </p>
              {createBooking.isError && (
                <p className="mt-3 text-sm text-destructive">
                  Gửi yêu cầu thất bại. Vui lòng thử lại.
                </p>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={back}>
              {step === 0 ? "Huỷ" : "Quay lại"}
            </Button>
            {step < 2 ? (
              <Button type="button" className="rounded-full" onClick={next}>
                Tiếp tục
              </Button>
            ) : (
              <Button
                type="submit"
                className="rounded-full"
                disabled={createBooking.isPending || !confirmArmed}
              >
                {createBooking.isPending && <Loader2 className="size-4 animate-spin" />}
                Xác nhận đặt lịch
              </Button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage src={photographer.avatar} alt={photographer.name} />
                <AvatarFallback>{initialsOf(photographer.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold leading-tight">{photographer.name}</p>
                <p className="truncate text-xs text-muted-foreground">{photographer.city}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" />
                <span className="text-foreground">{formatDateVN(values.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                <span className="text-foreground">{values.timeSlot || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4" />
                <span className="truncate text-foreground">{locationLabel || "—"}</span>
              </div>
            </dl>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tạm tính</span>
              <span className="text-lg font-semibold">{formatPrice(price)}</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
