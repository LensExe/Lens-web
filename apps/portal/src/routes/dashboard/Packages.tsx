import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Info, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  PageContainer,
  PageHeader,
  SaveBar,
  Skeleton,
  Textarea,
  formatPrice,
  toast,
} from "@lens/ui";
import { FormField } from "@/components/FormField";
import {
  useMyPhotographerProfile,
  useUpdateMyPhotographerProfile,
} from "@/queries/useDashboard";
import {
  packageSummary,
  packagesFormSchema,
  resolvePackages,
  type PackagesFormValues,
} from "@/lib/booking";
import type { Photographer } from "@/types";

const INPUT = "h-10 rounded-xl px-3";

const blankPackage = (): PackagesFormValues["packages"][number] => ({
  id: `pkg-${Date.now()}`,
  name: "",
  description: "",
  price: 200_000,
  photoCount: 20,
  durationHours: 1,
  deliveryDays: 7,
});

// Mounts only once the profile is loaded, so the form starts from real data.
function PackagesEditor({ profile }: { profile: Photographer }) {
  const update = useUpdateMyPhotographerProfile();
  const initial: PackagesFormValues = { packages: resolvePackages(profile) };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PackagesFormValues>({
    resolver: standardSchemaResolver(packagesFormSchema),
    mode: "onTouched",
    defaultValues: initial,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "packages", keyName: "key" });
  const live = useWatch({ control, name: "packages" }) ?? [];

  const onSubmit = (values: PackagesFormValues) =>
    update.mutate(
      { packages: values.packages },
      {
        onSuccess: () => {
          reset(values);
          toast.success("Đã lưu gói dịch vụ");
        },
        onError: () => toast.error("Lưu thất bại, vui lòng thử lại"),
      }
    );

  const cheapest = live.length ? Math.min(...live.map((p) => Number(p?.price) || Infinity)) : NaN;

  return (
    <PageContainer>
      <PageHeader
        title="Gói dịch vụ"
        description="Các gói khách hàng chọn khi đặt lịch chụp với bạn."
      />

      <p className="mb-6 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Số ảnh bàn giao</span> là cam kết với khách: buổi
          chụp chỉ được xác nhận hoàn thành khi bạn giao đủ số ảnh này. Gói đã đặt giữ nguyên
          điều khoản dù bạn sửa gói sau đó.
        </span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {fields.map((field, i) => {
            const err = errors.packages?.[i];
            const current = live[i];
            return (
              <section key={field.key} className="flex flex-col rounded-3xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Gói {i + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Xoá gói ${i + 1}`}
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Tên gói" htmlFor={`name-${i}`} error={err?.name?.message} className="sm:col-span-2">
                    <Input id={`name-${i}`} placeholder="VD: Gói cơ bản" className={INPUT} {...register(`packages.${i}.name`)} />
                  </FormField>
                  <FormField
                    label="Mô tả"
                    htmlFor={`desc-${i}`}
                    error={err?.description?.message}
                    hint="Mô tả chung: bối cảnh, trang phục, phong cách…"
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id={`desc-${i}`}
                      rows={2}
                      placeholder="VD: 2 bộ trang phục, chụp ngoài trời, hỗ trợ tạo dáng"
                      className="resize-none rounded-xl"
                      {...register(`packages.${i}.description`)}
                    />
                  </FormField>
                  <FormField label="Giá (VND)" htmlFor={`price-${i}`} error={err?.price?.message}>
                    <Input
                      id={`price-${i}`}
                      type="number"
                      inputMode="numeric"
                      step={10_000}
                      className={INPUT}
                      {...register(`packages.${i}.price`, { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField
                    label="Số ảnh bàn giao"
                    htmlFor={`photos-${i}`}
                    error={err?.photoCount?.message}
                    hint="Bắt buộc · dùng để xác nhận hoàn thành"
                  >
                    <Input
                      id={`photos-${i}`}
                      type="number"
                      inputMode="numeric"
                      className={INPUT}
                      {...register(`packages.${i}.photoCount`, { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField label="Thời lượng chụp (giờ)" htmlFor={`hours-${i}`} error={err?.durationHours?.message}>
                    <Input
                      id={`hours-${i}`}
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      className={INPUT}
                      {...register(`packages.${i}.durationHours`, { valueAsNumber: true })}
                    />
                  </FormField>
                  <FormField label="Hạn giao ảnh (ngày)" htmlFor={`days-${i}`} error={err?.deliveryDays?.message}>
                    <Input
                      id={`days-${i}`}
                      type="number"
                      inputMode="numeric"
                      className={INPUT}
                      {...register(`packages.${i}.deliveryDays`, { valueAsNumber: true })}
                    />
                  </FormField>
                </div>

                {/* What the client will see */}
                {current && Number.isFinite(current.price) && (
                  <p className="mt-4 rounded-2xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Khách thấy:{" "}
                    <span className="font-medium text-foreground">
                      {formatPrice(current.price)} · {packageSummary(current)}
                    </span>
                  </p>
                )}
              </section>
            );
          })}

          <button
            type="button"
            onClick={() => append(blankPackage())}
            className="focus-ring flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Plus className="size-5" />
            Thêm gói
          </button>
        </div>

        {errors.packages?.root?.message || errors.packages?.message ? (
          <p className="mt-4 text-sm text-destructive">
            {errors.packages?.root?.message ?? errors.packages?.message}
          </p>
        ) : null}

        {Number.isFinite(cheapest) && (
          <p className="mt-6 text-xs text-muted-foreground">
            Gói rẻ nhất hiện tại:{" "}
            <span className="font-medium text-foreground">{formatPrice(cheapest)}</span> — đây là
            mức "Giá từ" khách thấy trên hồ sơ.
          </p>
        )}

        <SaveBar
          dirty={isDirty}
          saving={update.isPending}
          onReset={() => reset(initial)}
          saveLabel="Lưu gói dịch vụ"
        />
      </form>
    </PageContainer>
  );
}

export function DashboardPackages() {
  const { data: profile, isLoading } = useMyPhotographerProfile();

  if (isLoading || !profile) {
    return (
      <PageContainer>
        <Skeleton className="h-9 w-48" />
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return <PackagesEditor profile={profile} />;
}
