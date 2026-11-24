import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  Ban,
  Check,
  CreditCard,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PageContainer,
  PageHeader,
  Skeleton,
  Switch,
  Textarea,
  formatPrice,
  toast,
} from "@lens/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import {
  useCreateSubscriptionPlan,
  useSubscriptionPlans,
  useUpdateSubscriptionPlan,
} from "@/queries/useSubscriptionPlans";
import type {
  AdminSubscriptionPlanData,
  SubscriptionPlanCreateDto,
  SubscriptionPlanFeatureValueDto,
} from "@/types/backend-api";

type PlanDraft = {
  code: string;
  name: string;
  description: string;
  price: string;
  billingCycle: string;
  isActive: boolean;
  isDefault: boolean;
  storageQuota: string;
  portfolioQuota: string;
  extraFeatures: string;
};

const emptyDraft = (): PlanDraft => ({
  code: "",
  name: "",
  description: "",
  price: "",
  billingCycle: "30",
  isActive: true,
  isDefault: false,
  storageQuota: "",
  portfolioQuota: "",
  extraFeatures: "",
});

const fold = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

function featureDraft(plan: AdminSubscriptionPlanData): PlanDraft {
  const draft = emptyDraft();
  draft.code = plan.code;
  draft.name = plan.name;
  draft.description = plan.description ?? "";
  draft.price = String(plan.price);
  draft.billingCycle = String(plan.billing_cycle);
  draft.isActive = plan.is_active;
  draft.isDefault = plan.is_default;

  const extra: string[] = [];
  for (const feature of plan.features ?? []) {
    if (typeof feature === "string") {
      const legacyQuota = feature.match(/^(storage_limit_bytes|portfolio_limit):(.+)$/i);
      if (legacyQuota?.[1].toLowerCase() === "storage_limit_bytes" && !draft.storageQuota) {
        draft.storageQuota = legacyQuota[2];
      } else if (legacyQuota?.[1].toLowerCase() === "portfolio_limit" && !draft.portfolioQuota) {
        draft.portfolioQuota = legacyQuota[2];
      } else {
        extra.push(feature);
      }
      continue;
    }

    if (feature.code === "storage_limit_bytes" && !draft.storageQuota) {
      draft.storageQuota = feature.value;
    } else if (feature.code === "portfolio_limit" && !draft.portfolioQuota) {
      draft.portfolioQuota = feature.value;
    } else {
      extra.push(JSON.stringify(feature));
    }
  }
  draft.extraFeatures = extra.join("\n");
  return draft;
}

function validStorageQuota(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return true;
  if (normalized.toLowerCase() === "unlimited") return true;
  const match = normalized.match(/^(\d+(?:\.\d+)?)(?:\s*(KB|MB|GB|TB))?$/i);
  if (!match) return false;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return false;
  if (!match[2]) return Number.isSafeInteger(amount);
  const power = ["KB", "MB", "GB", "TB"].indexOf(match[2].toUpperCase()) + 1;
  return Number.isSafeInteger(amount * 1024 ** power);
}

function extraFeatureValues(value: string): SubscriptionPlanFeatureValueDto[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("{")) {
        try {
          const parsed: unknown = JSON.parse(line);
          if (typeof parsed === "object" && parsed !== null && "code" in parsed) {
            return parsed as SubscriptionPlanFeatureValueDto;
          }
        } catch {
          // Treat non-JSON lines as display-only legacy benefits.
        }
      }
      return line;
    });
}

function buildPayload(draft: PlanDraft): { payload?: SubscriptionPlanCreateDto; error?: string } {
  const code = draft.code.trim();
  const name = draft.name.trim();
  const price = Number(draft.price);
  const billingCycle = Number(draft.billingCycle);
  const storageQuota = draft.storageQuota.trim();
  const portfolioQuota = draft.portfolioQuota.trim();

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/.test(code)) {
    return { error: "Mã gói cần có 2–64 ký tự: chữ, số, dấu gạch ngang hoặc gạch dưới." };
  }
  if (!name || name.length > 100) return { error: "Tên gói cần có từ 1 đến 100 ký tự." };
  if (draft.description.length > 2000) return { error: "Mô tả không được vượt quá 2.000 ký tự." };
  if (!Number.isSafeInteger(price) || price < 0) return { error: "Giá gói phải là số nguyên VND hợp lệ." };
  if (!Number.isInteger(billingCycle) || billingCycle < 1 || billingCycle > 3650) {
    return { error: "Chu kỳ cần từ 1 đến 3.650 ngày." };
  }
  if (draft.isDefault && (price !== 0 || !draft.isActive)) {
    return { error: "Gói mặc định cần miễn phí và đang hoạt động." };
  }
  if (!validStorageQuota(storageQuota)) {
    return { error: "Dung lượng cần là số byte hoặc dạng 20 GB, 500 MB, unlimited." };
  }
  if (portfolioQuota && !/^(unlimited|\d+)$/i.test(portfolioQuota)) {
    return { error: "Số portfolio cần là số nguyên hoặc unlimited." };
  }
  if (portfolioQuota && portfolioQuota.toLowerCase() !== "unlimited" && !Number.isSafeInteger(Number(portfolioQuota))) {
    return { error: "Số portfolio vượt quá giới hạn cho phép." };
  }

  const features: SubscriptionPlanFeatureValueDto[] = [];
  if (storageQuota) {
    features.push({
      code: "storage_limit_bytes",
      name: "Dung lượng lưu trữ",
      kind: "quota",
      unit: "bytes",
      value: storageQuota.toLowerCase() === "unlimited" ? "unlimited" : storageQuota,
    });
  }
  if (portfolioQuota) {
    features.push({
      code: "portfolio_limit",
      name: "Số lượng portfolio",
      kind: "quota",
      unit: "portfolios",
      value: portfolioQuota.toLowerCase() === "unlimited" ? "unlimited" : portfolioQuota,
    });
  }
  features.push(...extraFeatureValues(draft.extraFeatures));
  if (features.length > 50) return { error: "Mỗi gói chỉ được có tối đa 50 quyền lợi." };

  return {
    payload: {
      code,
      name,
      description: draft.description.trim() || null,
      price,
      billing_cycle: billingCycle,
      features,
      is_active: draft.isActive,
      is_default: draft.isDefault,
    },
  };
}

function featureLabel(feature: SubscriptionPlanFeatureValueDto): string {
  if (typeof feature === "string") {
    const legacyQuota = feature.match(/^(storage_limit_bytes|portfolio_limit):(.+)$/i);
    if (legacyQuota?.[1].toLowerCase() === "storage_limit_bytes") return `Lưu trữ: ${legacyQuota[2]}`;
    if (legacyQuota?.[1].toLowerCase() === "portfolio_limit") return `Portfolio: ${legacyQuota[2]}`;
    return feature;
  }
  return `${feature.name}: ${feature.value}`;
}

export function SubscriptionPlans() {
  const { data, isLoading, isError, refetch } = useSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminSubscriptionPlanData | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminSubscriptionPlanData | null>(null);

  const plans = data?.items ?? [];
  const query = fold(search.trim());
  const visiblePlans = plans.filter((plan) =>
    !query || fold(`${plan.name} ${plan.code} ${plan.description ?? ""}`).includes(query),
  );
  const isSaving = createPlan.isPending || updatePlan.isPending;

  function openCreate() {
    setEditingPlan(null);
    setEditorOpen(true);
  }

  function openEdit(plan: AdminSubscriptionPlanData) {
    setEditingPlan(plan);
    setEditorOpen(true);
  }

  function savePlan(payload: SubscriptionPlanCreateDto) {
    if (editingPlan) {
      updatePlan.mutate(
        { id: editingPlan.id, body: payload },
        {
          onSuccess: () => {
            toast.success(`Đã cập nhật gói ${payload.name}.`);
            setEditorOpen(false);
          },
          onError: () => toast.error("Không thể cập nhật gói. Hãy kiểm tra mã gói có bị trùng không."),
        },
      );
      return;
    }
    createPlan.mutate(payload, {
      onSuccess: () => {
        toast.success(`Đã tạo gói ${payload.name}.`);
        setEditorOpen(false);
      },
      onError: () => toast.error("Không thể tạo gói. Hãy kiểm tra mã gói có bị trùng không."),
    });
  }

  function setPlanActive(plan: AdminSubscriptionPlanData, isActive: boolean) {
    updatePlan.mutate(
      { id: plan.id, body: { is_active: isActive } },
      {
        onSuccess: () => {
          toast.success(isActive ? `Đã kích hoạt ${plan.name}.` : `Đã ngừng bán ${plan.name}.`);
          setRemoveTarget(null);
        },
        onError: () => toast.error("Không thể cập nhật trạng thái gói."),
      },
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Gói subscription"
        description="Quản lý giá bán, chu kỳ và quyền lợi cho các gói của nhiếp ảnh gia."
        actions={
          <Button className="h-10 rounded-xl px-4" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm gói
          </Button>
        }
      />

      {isError && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-destructive/30 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>Không tải được danh sách gói subscription từ backend.</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="size-3.5" /> Thử lại
          </Button>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Tổng số gói" value={plans.length} />
        <MetricCard label="Đang bán" value={plans.filter((plan) => plan.is_active).length} />
        <MetricCard label="Đã ngừng bán" value={plans.filter((plan) => !plan.is_active).length} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Danh sách gói</h2>
          <p className="text-sm text-muted-foreground">Thay đổi gói không làm sửa quyền lợi đã chốt trong giao dịch trước đó.</p>
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên hoặc mã gói"
          aria-label="Tìm gói subscription"
          className="h-10 rounded-xl sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((row) => <Skeleton key={row} className="h-16 rounded-xl" />)}
          </div>
        ) : visiblePlans.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Gói</th>
                  <th className="px-5 py-3 font-medium">Giá</th>
                  <th className="px-5 py-3 font-medium">Chu kỳ</th>
                  <th className="px-5 py-3 font-medium">Quyền lợi</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {visiblePlans.map((plan) => {
                  const features = (plan.features ?? []).map(featureLabel);
                  return (
                    <tr key={plan.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{plan.code}</p>
                        {plan.is_default && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                            <BadgeCheck className="size-3.5" /> Mặc định miễn phí
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums">{formatPrice(plan.price)}</td>
                      <td className="px-5 py-4 tabular-nums">{plan.billing_cycle} ngày</td>
                      <td className="max-w-sm px-5 py-4">
                        {features.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {features.slice(0, 2).map((feature, index) => (
                              <span key={`${plan.id}-feature-${index}`} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                {feature}
                              </span>
                            ))}
                            {features.length > 2 && <span className="self-center text-xs text-muted-foreground">+{features.length - 2}</span>}
                          </div>
                        ) : <span className="text-muted-foreground">Chưa cấu hình</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={plan.is_active
                          ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}>
                          {plan.is_active ? "Đang bán" : "Ngừng bán"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => openEdit(plan)}>
                            <Pencil className="size-3.5" /> Sửa
                          </Button>
                          {plan.is_active && !plan.is_default ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => setRemoveTarget(plan)}
                              disabled={updatePlan.isPending}
                            >
                              <Ban className="size-3.5" /> Ngừng bán
                            </Button>
                          ) : !plan.is_active ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => setPlanActive(plan, true)}
                              disabled={updatePlan.isPending}
                            >
                              <RotateCcw className="size-3.5" /> Kích hoạt
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : plans.length ? (
          <EmptyState icon={CreditCard} title="Không tìm thấy gói phù hợp" hint="Thử tìm bằng tên hoặc mã gói khác." bare />
        ) : (
          <EmptyState icon={CreditCard} title="Chưa có gói subscription" hint="Tạo gói đầu tiên để bắt đầu quản lý giá và quyền lợi." bare />
        )}
      </div>

      <PlanEditorDialog
        key={editingPlan?.id ?? "new-plan"}
        open={editorOpen}
        plan={editingPlan}
        pending={isSaving}
        onOpenChange={setEditorOpen}
        onSave={savePlan}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Ngừng bán gói này?"
        description={<>Gói <strong>{removeTarget?.name}</strong> sẽ không xuất hiện khi đăng ký mới. Các subscription, giao dịch và quyền lợi đã chốt vẫn được giữ nguyên.</>}
        confirmLabel="Ngừng bán gói"
        destructive
        pending={updatePlan.isPending}
        onConfirm={() => removeTarget && setPlanActive(removeTarget, false)}
      />
    </PageContainer>
  );
}

function PlanEditorDialog({
  open,
  plan,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  plan: AdminSubscriptionPlanData | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: SubscriptionPlanCreateDto) => void;
}) {
  const [draft, setDraft] = useState<PlanDraft>(() => plan ? featureDraft(plan) : emptyDraft());
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(plan ? featureDraft(plan) : emptyDraft());
    setFormError("");
  }, [open, plan]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = buildPayload(draft);
    if (!result.payload) {
      setFormError(result.error ?? "Thông tin gói chưa hợp lệ.");
      return;
    }
    setFormError("");
    onSave(result.payload);
  }

  function change<K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Sửa gói subscription" : "Thêm gói subscription"}</DialogTitle>
          <DialogDescription>
            Cập nhật giá và quyền lợi của gói. Giao dịch đã phát sinh tiếp tục dùng snapshot cũ.
          </DialogDescription>
        </DialogHeader>

        <form id="subscription-plan-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã gói" htmlFor="plan-code" hint="Duy nhất, ví dụ: PRO_MONTHLY">
              <Input id="plan-code" value={draft.code} onChange={(event) => change("code", event.target.value)} maxLength={64} required className="mt-1 h-10 rounded-xl uppercase" />
            </Field>
            <Field label="Tên gói" htmlFor="plan-name">
              <Input id="plan-name" value={draft.name} onChange={(event) => change("name", event.target.value)} maxLength={100} required className="mt-1 h-10 rounded-xl" />
            </Field>
            <Field label="Giá (VND)" htmlFor="plan-price" hint={draft.isDefault ? "Gói mặc định luôn miễn phí." : undefined}>
              <Input id="plan-price" type="number" min={0} step={1} value={draft.price} onChange={(event) => change("price", event.target.value)} disabled={draft.isDefault} required className="mt-1 h-10 rounded-xl" />
            </Field>
            <Field label="Chu kỳ (ngày)" htmlFor="plan-cycle">
              <Input id="plan-cycle" type="number" min={1} max={3650} step={1} value={draft.billingCycle} onChange={(event) => change("billingCycle", event.target.value)} required className="mt-1 h-10 rounded-xl" />
            </Field>
          </div>

          <Field label="Mô tả" htmlFor="plan-description">
            <Textarea id="plan-description" value={draft.description} onChange={(event) => change("description", event.target.value)} maxLength={2000} rows={3} className="mt-1" placeholder="Giới thiệu ngắn về gói subscription" />
          </Field>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <div>
              <h3 className="font-medium">Quyền lợi và hạn mức</h3>
              <p className="mt-1 text-xs text-muted-foreground">Để trống nếu không cấu hình hạn mức. Dùng “unlimited” cho không giới hạn.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dung lượng lưu trữ" htmlFor="plan-storage" hint="Ví dụ: 20 GB hoặc 500 MB">
                <Input id="plan-storage" value={draft.storageQuota} onChange={(event) => change("storageQuota", event.target.value)} className="mt-1 h-10 rounded-xl" placeholder="20 GB" />
              </Field>
              <Field label="Số portfolio" htmlFor="plan-portfolios" hint="Nhập số lượng hoặc unlimited">
                <Input id="plan-portfolios" value={draft.portfolioQuota} onChange={(event) => change("portfolioQuota", event.target.value)} className="mt-1 h-10 rounded-xl" placeholder="10" />
              </Field>
            </div>
            <Field label="Quyền lợi khác" htmlFor="plan-extra-features" hint="Mỗi dòng là một quyền lợi hiển thị; quyền lợi JSON đã có được giữ nguyên.">
              <Textarea id="plan-extra-features" value={draft.extraFeatures} onChange={(event) => change("extraFeatures", event.target.value)} rows={3} className="mt-1" placeholder={"Ưu tiên hỗ trợ\nTùy chỉnh portfolio"} />
            </Field>
          </section>

          <section className="space-y-3 rounded-2xl border border-border p-4">
            <ToggleRow
              title="Đang bán"
              description={draft.isDefault ? "Gói mặc định cần luôn hoạt động." : "Cho phép nhiếp ảnh gia đăng ký gói này."}
              checked={draft.isActive}
              disabled={draft.isDefault}
              onCheckedChange={(checked) => change("isActive", checked)}
            />
            <div className="border-t border-border" />
            <div className="flex items-start gap-3">
              <Checkbox
                id="plan-default"
                checked={draft.isDefault}
                disabled={Boolean(plan?.is_default)}
                onCheckedChange={(checked) => {
                  const isDefault = checked === true;
                  setDraft((current) => ({
                    ...current,
                    isDefault,
                    isActive: isDefault ? true : current.isActive,
                    price: isDefault ? "0" : current.price,
                  }));
                }}
              />
              <div className="space-y-1">
                <Label htmlFor="plan-default" className="cursor-pointer">Gói miễn phí mặc định</Label>
                <p className="text-xs text-muted-foreground">
                  Tự gán cho nhiếp ảnh gia chưa có gói trả phí. Chọn gói khác làm mặc định sẽ thay thế gói hiện tại.
                </p>
              </div>
            </div>
          </section>

          {formError && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={pending}>
            Huỷ
          </Button>
          <Button type="submit" form="subscription-plan-form" className="rounded-full" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            {plan ? "Lưu thay đổi" : "Tạo gói"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString("vi-VN")}</p>
    </div>
  );
}
