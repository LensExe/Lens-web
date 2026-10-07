import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, ArrowRight, BadgeCheck, Info, ShieldCheck } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  formatPrice,
  toast,
} from "@lens/ui";
import { FormField } from "@/components/FormField";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { StepSection } from "@/components/booking/StepSection";
import { PackagePicker } from "@/components/booking/PackagePicker";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import { useAvailability, usePhotographer } from "@/queries/usePhotographers";
import { useCreateBooking } from "@/queries/useBookings";
import { useMyProfile, useUpdateProfile } from "@/queries/useProfile";
import {
  DEPOSIT_RATE,
  bookingSchema,
  packageSummary,
  depositAmount,
  resolvePackages,
  type BookingFormValues,
} from "@/lib/booking";
import { CITY_OPTIONS } from "@/lib/photographer-filters";
import { apiErrorMessage, isConflict } from "@/lib/errors";
import { addMinutesToTime } from "@/lib/schedule";

const INPUT = "h-10 rounded-xl px-3";
const LAST_STEP = 2;

const formatDateVN = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

/** One review line with an "edit" jump back to its step. */
function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 font-medium">{value}</span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="focus-ring shrink-0 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Sửa
        </button>
      )}
    </div>
  );
}

export function BookingFlow() {
  const { photographer_id = "" } = useParams();
  const navigate = useNavigate();
  const { data: photographer, isLoading } = usePhotographer(photographer_id);
  const availability = useAvailability(photographer_id);
  const { data: profile } = useMyProfile();
  const createBooking = useCreateBooking();
  const updateProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    control,
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
    },
  });
  const values = useWatch({ control });

  // Start with the first package selected, matching the booking reference and
  // giving the customer an immediate price/time context.
  useEffect(() => {
    if (!photographer || getValues("packageId")) return;
    const firstPackage = resolvePackages(photographer)[0];
    if (firstPackage) setValue("packageId", firstPackage.id, { shouldValidate: false });
  }, [photographer, getValues, setValue]);

  // Fill the saved city without overwriting the user's edits.
  useEffect(() => {
    // Once a photographer is known, their city is the source of truth for the
    // booking location. A saved customer city must not override it.
    if (!profile || photographer?.city) return;
    const fill = (name: keyof BookingFormValues, value: string) => {
      if (value && !getValues(name)) setValue(name, value);
    };
    fill("city", profile.city);
  }, [profile, photographer?.city, getValues, setValue]);

  // A photographer only accepts shoots in their own city. Keep the city in
  // sync even when the customer profile was prefilled with another city.
  useEffect(() => {
    const city = photographer?.city?.trim();
    if (city && getValues("city") !== city) {
      setValue("city", city, { shouldValidate: true });
    }
  }, [photographer?.city, getValues, setValue]);

  // Reset scroll on every step change BEFORE paint, so the swap never shows the
  // new screen at the old scroll position and then jumps.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // "Tiếp tục" and "Tiếp tục thanh toán cọc" share the same button position, so a
  // fast double-click on "Tiếp tục" could land its 2nd click on the confirm
  // button and book instantly. Arm it only after a short settle window.
  const [confirmArmed, setConfirmArmed] = useState(false);
  useEffect(() => {
    if (step !== LAST_STEP) return;
    const t = setTimeout(() => setConfirmArmed(true), 400);
    return () => clearTimeout(t);
  }, [step]);

  // Every step change disarms the confirm button (re-armed by the effect above).
  const goTo = (target: number) => {
    setConfirmArmed(false);
    setStep(target);
  };

  if (isLoading) {
    return (
      <div className="portal-frame-container py-8">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-[28rem] rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="portal-frame-container flex min-h-[60vh] flex-col items-center justify-center text-center">
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
  const selectedPackage = packages.find((p) => p.id === values.packageId);
  const price = selectedPackage?.price ?? 0;
  const deposit = depositAmount(price);
  const depositPct = Math.round(DEPOSIT_RATE * 100);
  const photographerCity = photographer.city.trim();
  const locationLabel = [values.addressDetail?.trim(), values.city].filter(Boolean).join(", ");
  const cityMatchesPhotographer = !!photographerCity && values.city === photographerCity;
  const prefilled = !!profile?.city && values.city === profile.city && !photographerCity;

  const back = () => (step === 0 ? navigate(`/photographers/${photographer_id}`) : goTo(step - 1));

  const next = async () => {
    const fields: (keyof BookingFormValues)[] =
      step === 0 ? ["packageId", "date", "timeSlot"] : ["city", "addressDetail"];
    if (step === 1 && photographerCity && values.city !== photographerCity) {
      setValue("city", photographerCity, { shouldValidate: true });
      toast.error(`Địa điểm cần cùng thành phố với photographer: ${photographerCity}.`);
      return;
    }
    if (await trigger(fields)) goTo(Math.min(step + 1, LAST_STEP));
  };

  const onSubmit = (v: BookingFormValues) => {
    // Only the final review step may create the booking. An earlier submit (e.g.
    // Enter in a field) advances instead of skipping the review.
    if (step < LAST_STEP) {
      void next();
      return;
    }
    if (!agreed) return;
    if (photographerCity && v.city !== photographerCity) {
      toast.error(`Địa điểm cần cùng thành phố với photographer: ${photographerCity}.`);
      goTo(1);
      return;
    }
    createBooking.mutate(
      {
        photographerId: photographer.id,
        photographerName: photographer.name,
        style: photographer.styles[0],
        packageId: v.packageId,
        date: v.date,
        timeSlot: v.timeSlot,
        location: [v.addressDetail?.trim(), v.city].filter(Boolean).join(", "),
        price,
      },
      {
        onSuccess: (booking) => {
          if (saveAsDefault) {
            updateProfile.mutate({
              city: v.city,
            });
          }
          navigate(`/client/bookings/${booking.id}/deposit`);
        },
        onError: (err) => {
          // Someone else just took the slot: refresh the calendar and let them re-pick.
          if (!isConflict(err)) return;
          toast.error(apiErrorMessage(err, "Khung giờ này không còn trống"));
          setValue("timeSlot", "");
          void availability.refetch();
          goTo(0);
        },
      },
    );
  };

  const cta =
    step < LAST_STEP ? (
      <Button
        type="button"
        size="lg"
        className="h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90"
        onClick={next}
      >
        Tiếp tục bước 2
        <ArrowRight className="size-4" />
      </Button>
    ) : (
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90"
        disabled={createBooking.isPending || !confirmArmed || !agreed}
      >
        {createBooking.isPending && <Spinner />}
        Tiếp tục thanh toán cọc
      </Button>
    );

  return (
    <div className="min-h-dvh bg-[#fbfcfe] pb-32 pt-6 lg:pb-14">
      <div className="portal-frame-container">
        <button
          type="button"
          onClick={back}
          className="group mb-3 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-800 lg:hidden"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          {step === 0 ? "Về hồ sơ" : "Quay lại"}
        </button>

        <header className="flex flex-col gap-5 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-[27px]">
              Đặt lịch với {photographer.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Hoàn tất 3 bước đơn giản để giữ lịch chụp trực tiếp với nhiếp ảnh gia
            </p>
          </div>
          <BookingStepper step={step} />
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_306px] lg:items-start xl:gap-7"
        >
          <div className="min-w-0 space-y-6">
            {/* Step 1 — package, date & time */}
            {step === 0 && (
              <>
                <StepSection
                  index={1}
                  title="Chọn gói chụp"
                  aside={
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] text-slate-400">
                      {packages.length} gói khả dụng
                    </span>
                  }
                >
                  <PackagePicker
                    packages={packages}
                    value={values.packageId ?? ""}
                    onChange={(pkgId) => {
                      setValue("packageId", pkgId, { shouldValidate: true });
                      setValue("timeSlot", "", { shouldValidate: false });
                    }}
                  />
                  {errors.packageId && (
                    <p className="mt-3 text-sm text-destructive">{errors.packageId.message}</p>
                  )}
                </StepSection>

                <StepSection index={2} title="Chọn ngày & giờ">
                  <DateTimePicker
                    days={availability.data ?? []}
                    loading={availability.isLoading}
                    error={availability.isError}
                    date={values.date ?? ""}
                    timeSlot={values.timeSlot ?? ""}
                    durationHours={selectedPackage?.durationHours ?? 1}
                    onDateChange={(date) => {
                      setValue("date", date, { shouldValidate: true });
                      // Free slots differ per day — make them re-pick.
                      setValue("timeSlot", "", { shouldValidate: false });
                    }}
                    onTimeChange={(slot) => setValue("timeSlot", slot, { shouldValidate: true })}
                    dateError={errors.date?.message}
                    timeError={errors.timeSlot?.message}
                  />
                </StepSection>
              </>
            )}

            {/* Step 2 — location */}
            {step === 1 && (
              <StepSection
                title="Địa điểm chụp"
                aside={
                  (cityMatchesPhotographer || prefilled) && (
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      <BadgeCheck className="size-3.5" />
                      {cityMatchesPhotographer
                        ? "Cùng thành phố với photographer"
                        : "Tỉnh/thành phố từ hồ sơ"}
                    </span>
                  )
                }
              >
                <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <FormField label="Tỉnh / Thành phố" error={errors.city?.message}>
                    <Select
                      value={photographerCity || values.city || undefined}
                      disabled={!!photographerCity}
                      onValueChange={(v) => v && setValue("city", v, { shouldValidate: true })}
                    >
                      <SelectTrigger className="h-10! w-full rounded-xl">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {(photographerCity ? [photographerCity] : CITY_OPTIONS).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {photographerCity && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Địa điểm chụp cần cùng thành phố với photographer ({photographerCity}).
                      </p>
                    )}
                  </FormField>
                  <FormField
                    label="Địa chỉ cụ thể (không bắt buộc)"
                    htmlFor="addressDetail"
                    error={errors.addressDetail?.message}
                  >
                    <Input
                      id="addressDetail"
                      placeholder="VD: Hồ Tây, studio ABC..."
                      className={INPUT}
                      {...register("addressDetail")}
                    />
                  </FormField>
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={saveAsDefault}
                    onCheckedChange={(c) => setSaveAsDefault(c === true)}
                  />
                  Lưu tỉnh/thành phố này làm mặc định cho lần sau
                </label>
              </StepSection>
            )}

            {/* Step 3 — review, policy, agree */}
            {step === LAST_STEP && (
              <>
                <StepSection title="Kiểm tra lại thông tin">
                  <div className="divide-y divide-border">
                    <ReviewRow
                      label="Gói chụp"
                      value={
                        selectedPackage
                          ? `${selectedPackage.name} · ${packageSummary(selectedPackage)}`
                          : "—"
                      }
                      onEdit={() => goTo(0)}
                    />
                    <ReviewRow
                      label="Ngày & giờ"
                      value={
                        values.date
                          ? `${formatDateVN(values.date)} · ${
                              values.timeSlot
                                ? `${values.timeSlot} – ${addMinutesToTime(values.timeSlot, (selectedPackage?.durationHours ?? 1) * 60)}`
                                : "Chưa chọn giờ"
                            }`
                          : "—"
                      }
                      onEdit={() => goTo(0)}
                    />
                    <ReviewRow
                      label="Địa điểm"
                      value={locationLabel || "—"}
                      onEdit={() => goTo(1)}
                    />
                  </div>
                </StepSection>

                <div className="rounded-3xl border border-border bg-muted/40 p-5 text-sm">
                  <p className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="size-4" />
                    Quy trình đặt lịch
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>
                      Thanh toán trước tiền cọc {depositPct}% (
                      <span className="font-medium">{formatPrice(deposit)}</span>) để gửi yêu cầu
                      xác nhận tới nhiếp ảnh gia.
                    </li>
                    <li>
                      Backend chưa có API xem trước hoàn tiền. Nếu huỷ sau khi đã thanh toán, yêu
                      cầu hoàn tiền cần được quản trị viên xử lý.
                    </li>
                    <li>
                      Phần còn lại (
                      <span className="font-medium">{formatPrice(price - deposit)}</span>) thanh
                      toán sau khi đặt cọc và trước buổi chụp.
                    </li>
                  </ul>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(c === true)}
                  />
                  <span>
                    Tôi đồng ý thanh toán tiền cọc trước để gửi yêu cầu và thanh toán theo trạng
                    thái do backend xác nhận.
                  </span>
                </label>

                {createBooking.isError && !isConflict(createBooking.error) && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <Info className="size-4" />
                    {apiErrorMessage(
                      createBooking.error,
                      "Gửi yêu cầu thất bại. Vui lòng thử lại.",
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Summary + CTA (desktop) */}
          <aside className="hidden lg:sticky lg:top-7 lg:block">
            <BookingSummaryCard
              photographer={photographer}
              packageName={selectedPackage?.name}
              packageInfo={selectedPackage && packageSummary(selectedPackage)}
              date={values.date ?? ""}
              timeSlot={values.timeSlot ?? ""}
              durationHours={selectedPackage?.durationHours}
              location={locationLabel}
              price={price}
            >
              {cta}
              <Button
                type="button"
                variant="ghost"
                className="mt-2 h-8 w-full rounded-full text-xs text-slate-400 hover:text-slate-700"
                onClick={back}
              >
                {step === 0 ? "Huỷ đặt lịch" : "Quay lại"}
              </Button>
            </BookingSummaryCard>
          </aside>

          {/* Mobile action bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">
                  {price > 0 ? `Đặt cọc ${depositPct}%` : "Chưa chọn gói"}
                </p>
                <p className="truncate font-semibold text-slate-800">
                  {price > 0 ? formatPrice(deposit) : "—"}
                </p>
              </div>
              <div className="w-44 shrink-0">{cta}</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
