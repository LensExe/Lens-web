import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Clock3, Images, Info, Package, Plus, Send, Trash2 } from "lucide-react";
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

  const validPackages = live.filter((p) => p?.name?.trim() || Number.isFinite(Number(p?.price)));
  const cheapest = live.length ? Math.min(...live.map((p) => Number(p?.price) || Infinity)) : NaN;
  const longest = live.length ? Math.max(...live.map((p) => Number(p?.durationHours) || 0)) : 0;

  return (
    <PageContainer className="max-w-[1280px]">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <Package className="size-5" />
            </span>
            <span>Gói dịch vụ</span>
          </span>
        }
        description="Các gói khách hàng chọn khi đặt lịch chụp với bạn."
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex items-start gap-3 rounded-3xl border border-border bg-muted/35 p-4 shadow-xs sm:p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-xs">
            <Info className="size-4" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Điều khoản hiển thị rõ cho khách hàng</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Số ảnh bàn giao là cam kết hoàn thành buổi chụp. Gói đã đặt sẽ giữ nguyên điều khoản
              dù bạn chỉnh sửa gói sau này.
            </p>
          </div>
        </div>

        <dl className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-sm text-muted-foreground">Gói đang thiết lập</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{validPackages.length}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-sm text-muted-foreground">Giá khởi điểm</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">
              {Number.isFinite(cheapest) ? formatPrice(cheapest) : "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <dt className="text-sm text-muted-foreground">Thời lượng cao nhất</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{longest || "—"}{longest ? " giờ" : ""}</dd>
          </div>
        </dl>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {fields.map((field, i) => {
            const err = errors.packages?.[i];
            const current = live[i];
            return (
              <section key={field.key} className="group flex min-w-0 flex-col rounded-3xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-foreground/15 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Package className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Gói {i + 1}
                      </p>
                      <p className="truncate text-sm font-medium">{current?.name || "Chưa đặt tên"}</p>
                    </div>
                  </div>
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
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Xem trước cho khách
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatPrice(current.price)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Images className="size-3.5" /> {current.photoCount} ảnh
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Clock3 className="size-3.5" /> {String(current.durationHours).replace(".", ",")} giờ
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Send className="size-3.5" /> Giao {current.deliveryDays} ngày
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {packageSummary(current)}
                    </p>
                  </div>
                )}
              </section>
            );
          })}

            <button
            type="button"
            onClick={() => append(blankPackage())}
              className="focus-ring flex min-h-64 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-muted/10 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/25 hover:text-foreground"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-card shadow-xs">
                <Plus className="size-5" />
              </span>
              <span className="font-medium">Thêm gói dịch vụ</span>
              <span className="text-xs">Tạo thêm lựa chọn cho khách</span>
            </button>
          </div>

          {errors.packages?.root?.message || errors.packages?.message ? (
            <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.packages?.root?.message ?? errors.packages?.message}
            </p>
          ) : null}

          {Number.isFinite(cheapest) && (
            <p className="mt-5 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xs">
              Gói rẻ nhất hiện tại:{" "}
              <span className="font-semibold text-foreground">{formatPrice(cheapest)}</span>
              <span className="hidden sm:inline"> — đây là mức “Giá từ” khách thấy trên hồ sơ.</span>
            </p>
          )}

          <SaveBar
            dirty={isDirty}
            saving={update.isPending}
            onReset={() => reset(initial)}
            saveLabel="Lưu gói dịch vụ"
          />
        </form>
      </div>
    </PageContainer>
  );
}

export function DashboardPackages() {
  const { data: profile, isLoading } = useMyPhotographerProfile();

  if (isLoading || !profile) {
    return (
      <PageContainer className="max-w-[1280px]">
        <Skeleton className="h-9 w-48" />
        <div className="mx-auto mt-7 grid w-full max-w-6xl gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return <PackagesEditor profile={profile} />;
}
