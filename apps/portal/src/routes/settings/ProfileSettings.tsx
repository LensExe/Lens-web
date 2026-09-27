import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { BadgeCheck, ImageIcon, Info } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
  SaveBar,
} from "@lens/ui";
import { FormField } from "@/components/FormField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useMyProfile, useUpdateProfile } from "@/queries/useProfile";
import { CITY_OPTIONS } from "@/lib/photographer-filters";
import {
  GENDER_OPTIONS,
  profileSchema,
  toProfileFormValues,
  type ProfileFormValues,
} from "@/lib/profile";
import { currentUser } from "@/lib/session";

const EMPTY: ProfileFormValues = {
  name: "",
  phone: "",
  birthday: "",
  gender: "",
  city: "",
  addressDetail: "",
};

const INPUT = "h-10 rounded-xl px-3";

// Manual resets must drop edits: react-hook-form merges the form-level
// `resetOptions` (keepDirtyValues, meant for background refetches) into them.
// keepFieldsRef writes the values straight into the mounted inputs (the React
// Compiler memoizes the register() refs, so re-registration wouldn't).
const DISCARD_EDITS = { keepDirtyValues: false, keepFieldsRef: true };

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ProfileSettings() {
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateProfile();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileSchema),
    mode: "onTouched",
    defaultValues: EMPTY,
    // Fill from the server once loaded; never clobber what the user is typing.
    values: profile ? toProfileFormValues(profile) : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  if (isLoading || !profile) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  const onSubmit = (values: ProfileFormValues) =>
    update.mutate(values, {
      onSuccess: (saved) => {
        reset(toProfileFormValues(saved), DISCARD_EDITS);
        toast.success("Đã lưu thông tin cá nhân");
      },
      onError: () => toast.error("Không thể lưu, vui lòng thử lại"),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6">
        <Avatar className="size-16">
          <AvatarImage src={profile.avatar} alt={profile.name} />
          <AvatarFallback>{currentUser.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile.name}</p>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            {profile.email}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <BadgeCheck className="size-3" />
              Đã xác minh
            </span>
          </p>
        </div>
      </div>

      {currentUser.role === "photographer" && (
        <p className="flex items-start gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Ảnh, giới thiệu và giá hiển thị cho khách được quản lý ở{" "}
            <Link
              to="/dashboard/portfolio"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <ImageIcon className="size-3.5" />
              Hồ sơ năng lực
            </Link>
            .
          </span>
        </p>
      )}

      <SettingsSection
        title="Thông tin cá nhân"
        description="Thông tin này dùng cho tài khoản và để liên hệ với bạn."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Họ và tên" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" className={INPUT} aria-invalid={!!errors.name} {...register("name")} />
          </FormField>
          <FormField
            label="Số điện thoại"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="Tự điền khi bạn đặt lịch."
          >
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="VD: 0901234567"
              className={INPUT}
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
          </FormField>
          <FormField label="Ngày sinh" htmlFor="birthday">
            <Input id="birthday" type="date" max={todayISO()} className={INPUT} {...register("birthday")} />
          </FormField>
          <FormField label="Giới tính">
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex h-10 items-center gap-6"
                  aria-label="Giới tính"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <label key={g.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <RadioGroupItem value={g.value} />
                      {g.label}
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
          </FormField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Địa chỉ mặc định"
        description="Được điền sẵn khi bạn đặt lịch chụp — bạn vẫn có thể sửa mỗi lần đặt."
      >
        <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
          <FormField label="Tỉnh / Thành phố">
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  // Radix Select emits "" while the form (re)loads its values —
                  // ignore it so the saved city isn't wiped (and the form stays clean).
                  onValueChange={(v) => v && field.onChange(v)}
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
              )}
            />
          </FormField>
          <FormField label="Địa chỉ cụ thể" htmlFor="addressDetail" error={errors.addressDetail?.message}>
            <Input
              id="addressDetail"
              autoComplete="street-address"
              placeholder="Số nhà, đường, phường/xã..."
              className={INPUT}
              aria-invalid={!!errors.addressDetail}
              {...register("addressDetail")}
            />
          </FormField>
        </div>
      </SettingsSection>

      <SaveBar
        dirty={isDirty}
        saving={update.isPending}
        onReset={() => reset(toProfileFormValues(profile), DISCARD_EDITS)}
      />
    </form>
  );
}
