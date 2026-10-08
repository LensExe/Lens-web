import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  BadgeCheck,
  Clock3,
  Images,
  Package,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  useSaveMyBookingPlans,
} from "@/queries/useDashboard";
import {
  packageSummary,
  packagesFormSchema,
  resolvePackages,
  type PackagesFormValues,
} from "@/lib/booking";
import type { Photographer } from "@/types";

const INPUT = "h-10 rounded-xl border-border bg-background px-3 focus-visible:ring-ember";

const blankPackage = (): PackagesFormValues["packages"][number] => ({
  id: `pkg-${Date.now()}`,
  name: "",
  description: "",
  price: 200_000,
  photoCount: 20,
  durationHours: 1,
});

// Mounts only once the profile is loaded, so the form starts from real data.
function PackagesEditor({ profile }: { profile: Photographer }) {
  const update = useSaveMyBookingPlans();
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
      values.packages,
      {
        onSuccess: (packages) => {
          reset({ packages });
          toast.success("Đã lưu gói dịch vụ");
        },
        onError: () => toast.error("Lưu thất bại, vui lòng thử lại"),
      }
    );

  const validPackages = live.filter(
    (p) => p?.name?.trim() && Number.isFinite(Number(p?.price)) && Number(p.price) > 0,
  );
  const prices = live.map((p) => Number(p?.price)).filter((price) => Number.isFinite(price) && price > 0);
  const cheapest = prices.length ? Math.min(...prices) : NaN;
  const longest = live.reduce((max, p) => Math.max(max, Number(p?.durationHours) || 0), 0);
  const mostPhotos = live.reduce((max, p) => Math.max(max, Number(p?.photoCount) || 0), 0);

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <Package className="size-[18px]" />
            </span>
            <span>Gói dịch vụ</span>
          </span>
        }
        description="Thiết lập và quản lý các gói chụp khách hàng có thể chọn khi đặt lịch với bạn."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
            <BadgeCheck className="size-3.5 text-lagoon" /> Điều khoản rõ ràng cho khách
          </span>
        }
      />

      <div className="w-full">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-ember/20 bg-ember/[0.045] p-4 sm:p-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Điều khoản gói dịch vụ</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Backend lưu giá, thời lượng và số ảnh đã chỉnh sửa. Hạn giao ảnh chưa có trường dữ liệu trong API.
            </p>
          </div>
        </div>

        <dl className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Package, label: "Gói đang thiết lập", value: `${validPackages.length} gói`, hint: "Đang hiển thị cho khách", tone: "bg-muted text-foreground" },
            { icon: Sparkles, label: "Giá khởi điểm", value: Number.isFinite(cheapest) ? formatPrice(cheapest) : "—", hint: "Mức giá thấp nhất hiện tại", tone: "bg-ember/10 text-ember" },
            { icon: Images, label: "Bàn giao nhiều nhất", value: mostPhotos ? `${mostPhotos} ảnh` : "—", hint: "Theo gói hiện có", tone: "bg-lagoon/10 text-lagoon" },
            { icon: Clock3, label: "Thời lượng tối đa", value: longest ? `${String(longest).replace(".", ",")} giờ` : "—", hint: "Cho một buổi chụp", tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
          ].map(({ icon: Icon, label, value, hint, tone }) => (
            <div key={label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}><Icon className="size-4" /></span>
                <dd className="text-right text-lg font-semibold tracking-tight tabular-nums">{value}</dd>
              </div>
              <dt className="mt-3 text-xs font-semibold">{label}</dt>
              <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
            </div>
          ))}
        </dl>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {fields.map((field, i) => {
            const err = errors.packages?.[i];
            const current = live[i];
            const isCheapest = Number.isFinite(cheapest) && Number(current?.price) === cheapest;
            return (
              <section key={field.key} className={`group flex min-w-0 flex-col rounded-2xl border bg-card p-4 shadow-xs transition-colors sm:p-5 ${isCheapest ? "border-ember/50 ring-1 ring-ember/10" : "border-border/80 hover:border-foreground/20"}`}>
                <div className="-mx-4 -mt-4 mb-5 flex items-center justify-between gap-3 rounded-t-2xl border-b border-border/70 bg-muted/20 px-4 py-3 sm:-mx-5 sm:-mt-5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isCheapest ? "bg-ember/10 text-ember" : "bg-muted text-muted-foreground"}`}>
                      {isCheapest ? <Sparkles className="size-4" /> : <Package className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Gói {i + 1}
                        {isCheapest && <span className="rounded-full bg-ember/10 px-2 py-0.5 text-[9px] tracking-normal text-ember">Giá thấp nhất</span>}
                      </p>
                      <p className="truncate text-sm font-semibold">{current?.name || "Chưa đặt tên"}</p>
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
                      className="resize-none rounded-xl border-border bg-background focus-visible:ring-ember"
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
                </div>

                {/* What the client will see */}
                {current && Number.isFinite(current.price) && (
                  <div className="mt-5 rounded-xl border border-border/70 bg-muted/15 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Xem trước trên hồ sơ
                    </p>
                    <p className="mt-1.5 text-lg font-semibold tracking-tight text-ember">
                      {formatPrice(current.price)}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1">
                        <Images className="size-3.5" /> {current.photoCount} ảnh
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1">
                        <Clock3 className="size-3.5" /> {String(current.durationHours).replace(".", ",")} giờ
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-1">
                        <Send className="size-3.5" /> Backend chưa lưu hạn giao
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
              className="focus-ring flex min-h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/10 text-sm text-muted-foreground transition-colors hover:border-ember/40 hover:bg-ember/[0.03] hover:text-foreground"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-ember/10 text-ember">
                <Plus className="size-5" />
              </span>
              <span className="font-semibold">Thêm gói dịch vụ mới</span>
              <span className="text-xs">Tạo thêm lựa chọn phù hợp với khách</span>
            </button>
          </div>

          {errors.packages?.root?.message || errors.packages?.message ? (
            <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errors.packages?.root?.message ?? errors.packages?.message}
            </p>
          ) : null}

          {Number.isFinite(cheapest) && (
            <p className="mt-5 rounded-2xl border border-border/80 bg-card px-4 py-3 text-xs text-muted-foreground shadow-xs">
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

export function PhotographerPackages() {
  const { data: profile, isLoading } = useMyPhotographerProfile();

  if (isLoading || !profile) {
    return (
      <PageContainer className="max-w-[1280px]">
        <Skeleton className="h-9 w-48" />
        <div className="mt-5 grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-[30rem] rounded-2xl" />
      </PageContainer>
    );
  }

  return <PackagesEditor profile={profile} />;
}
