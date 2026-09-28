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
  Textarea,
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
  FREE_CANCEL_DAYS,
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
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: photographer, isLoading } = usePhotographer(id);
  const availability = useAvailability(id);
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
      contactName: "",
      contactPhone: "",
      note: "",
    },
  });
  const values = useWatch({ control });

  // Shopee-style autofill: contact + default address from the user's profile
  // (Cài đặt). Only fills empty fields — never overwrites what they typed.
  useEffect(() => {
    if (!profile) return;
    const fill = (name: keyof BookingFormValues, value: string) => {
      if (value && !getValues(name)) setValue(name, value);
    };
    fill("contactName", profile.name);
    fill("contactPhone", profile.phone);
    fill("city", profile.city);
    fill("addressDetail", profile.addressDetail);
  }, [profile, getValues, setValue]);

  // Reset scroll on every step change BEFORE paint, so the swap never shows the
  // new screen at the old scroll position and then jumps.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // "Tiếp tục" and "Xác nhận & đặt cọc" share the same button position, so a
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
  const locationLabel = [values.addressDetail?.trim(), values.city].filter(Boolean).join(", ");
  // "Đã điền từ hồ sơ" while the contact still matches the saved profile.
  const prefilled =
    !!profile &&
    ((!!profile.phone && values.contactPhone === profile.phone) ||
      (!!profile.name && values.contactName === profile.name));

  const back = () => (step === 0 ? navigate(`/photographers/${id}`) : goTo(step - 1));

  const next = async () => {
    const fields: (keyof BookingFormValues)[] =
      step === 0
        ? ["packageId", "date", "timeSlot"]
        : ["city", "addressDetail", "contactName", "contactPhone", "note"];
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
    createBooking.mutate(
      {
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
      },
      {
        onSuccess: (booking) => {
          if (saveAsDefault) {
            updateProfile.mutate({
              phone: v.contactPhone,
              city: v.city,
              addressDetail: v.addressDetail ?? "",
            });
          }
          // Next: pay the deposit to hold the slot.
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
      }
    );
  };

  const cta =
    step < LAST_STEP ? (
      <Button type="button" size="lg" className="h-11 w-full rounded-full bg-ember text-white hover:bg-ember/90" onClick={next}>
        Tiếp tục
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
        Xác nhận & đặt cọc
      </Button>
    );

  return (
    <div className="portal-frame-container pb-32 pt-6 lg:pb-14">
      <button
        type="button"
        onClick={back}
        className="group mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {step === 0 ? "Về hồ sơ" : "Quay lại"}
      </button>

      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Đặt lịch với {photographer.name}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
      >
        <div className="min-w-0 space-y-5">
          <BookingStepper step={step} />

          {/* Step 1 — package, date & time */}
          {step === 0 && (
            <>
              <StepSection index={1} title="Chọn gói chụp">
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

          {/* Step 2 — contact & location, pre-filled from the profile */}
          {step === 1 && (
            <>
              <StepSection
                title="Thông tin liên hệ"
                aside={
                  prefilled && (
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      <BadgeCheck className="size-3.5" />
                      Đã điền từ hồ sơ của bạn
                    </span>
                  )
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Họ và tên" htmlFor="contactName" error={errors.contactName?.message}>
                    <Input id="contactName" placeholder="Người liên hệ" className={INPUT} {...register("contactName")} />
                  </FormField>
                  <FormField label="Số điện thoại" htmlFor="contactPhone" error={errors.contactPhone?.message}>
                    <Input
                      id="contactPhone"
                      placeholder="VD: 0901234567"
                      inputMode="tel"
                      className={INPUT}
                      {...register("contactPhone")}
                    />
                  </FormField>
                </div>
              </StepSection>

              <StepSection title="Địa điểm chụp">
                <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                  <FormField label="Tỉnh / Thành phố" error={errors.city?.message}>
                    <Select
                      value={values.city || undefined}
                      onValueChange={(v) => v && setValue("city", v, { shouldValidate: true })}
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
                  Lưu số điện thoại & địa chỉ này làm mặc định cho lần sau
                </label>
              </StepSection>

              <StepSection title="Ghi chú cho nhiếp ảnh gia">
                <FormField label="Ý tưởng, concept, số người chụp… (không bắt buộc)" htmlFor="note" error={errors.note?.message}>
                  <Textarea
                    id="note"
                    rows={4}
                    placeholder="VD: Chụp gia đình 4 người, tông màu ấm, có em bé 2 tuổi..."
                    className="resize-none rounded-xl"
                    {...register("note")}
                  />
                </FormField>
              </StepSection>
            </>
          )}

          {/* Step 3 — review, policy, agree */}
          {step === LAST_STEP && (
            <>
              <StepSection title="Kiểm tra lại thông tin">
                <div className="divide-y divide-border">
                  <ReviewRow label="Gói chụp" value={selectedPackage ? `${selectedPackage.name} · ${packageSummary(selectedPackage)}` : "—"} onEdit={() => goTo(0)} />
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
                  <ReviewRow label="Địa điểm" value={locationLabel || "—"} onEdit={() => goTo(1)} />
                  <ReviewRow
                    label="Liên hệ"
                    value={`${values.contactName} · ${values.contactPhone}`}
                    onEdit={() => goTo(1)}
                  />
                  {values.note && <ReviewRow label="Ghi chú" value={values.note} onEdit={() => goTo(1)} />}
                </div>
              </StepSection>

              <div className="rounded-3xl border border-border bg-muted/40 p-5 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4" />
                  Chính sách đặt cọc
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    Đặt cọc {depositPct}% (<span className="font-medium">{formatPrice(deposit)}</span>) ngay
                    sau bước này để giữ lịch và gửi yêu cầu tới nhiếp ảnh gia.
                  </li>
                  <li>
                    Huỷ trước khi nhiếp ảnh gia xác nhận, hoặc trước buổi chụp từ {FREE_CANCEL_DAYS} ngày
                    trở lên: hoàn 100%. Huỷ muộn hơn: mất tiền cọc. Nhiếp ảnh gia từ chối: luôn hoàn 100%.
                  </li>
                  <li>
                    Phần còn lại (<span className="font-medium">{formatPrice(price - deposit)}</span>) thanh
                    toán sau khi nhiếp ảnh gia xác nhận, trước buổi chụp.
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
                  Tôi đồng ý với điều khoản đặt lịch và chính sách đặt cọc của Lens.
                </span>
              </label>

              {createBooking.isError && !isConflict(createBooking.error) && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <Info className="size-4" />
                  {apiErrorMessage(createBooking.error, "Gửi yêu cầu thất bại. Vui lòng thử lại.")}
                </p>
              )}
            </>
          )}
        </div>

        {/* Summary + CTA (desktop) */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">
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
              className="mt-2 w-full rounded-full"
              onClick={back}
            >
              {step === 0 ? "Huỷ" : "Quay lại"}
            </Button>
          </BookingSummaryCard>
        </aside>

        {/* Mobile action bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {price > 0 ? `Đặt cọc ${depositPct}%` : "Chưa chọn gói"}
              </p>
              <p className="truncate font-semibold">{price > 0 ? formatPrice(deposit) : "—"}</p>
            </div>
            <div className="w-44 shrink-0">{cta}</div>
          </div>
        </div>
      </form>
    </div>
  );
}
