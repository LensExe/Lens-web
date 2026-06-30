import { useState } from "react";
import { Check, Loader2, Package, Plus, X } from "lucide-react";
import { Button, Input, Skeleton, formatPrice, toast } from "@lens/ui";
import {
  useMyPhotographerProfile,
  useUpdateMyPhotographerProfile,
} from "@/queries/useDashboard";
import { resolvePackages } from "@/lib/booking";
import type { Photographer, PhotographerPackage } from "@/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

// Mounts only once the profile is loaded, so `draft` is always present.
function PackagesEditor({ profile }: { profile: Photographer }) {
  const update = useUpdateMyPhotographerProfile();
  const [draft, setDraft] = useState<PhotographerPackage[]>(() =>
    resolvePackages(profile).map((p) => ({ ...p }))
  );
  const [dirty, setDirty] = useState(false);

  const edit = (next: PhotographerPackage[]) => {
    setDraft(next);
    setDirty(true);
  };
  const updatePkg = (i: number, p: Partial<PhotographerPackage>) =>
    edit(draft.map((pkg, idx) => (idx === i ? { ...pkg, ...p } : pkg)));
  const addPkg = () =>
    edit([...draft, { id: `pkg-${Date.now()}`, name: "", duration: "", price: 0 }]);
  const removePkg = (i: number) => edit(draft.filter((_, idx) => idx !== i));

  const cleaned = draft.filter((p) => p.name.trim() && p.price > 0);
  const canSave = dirty && cleaned.length > 0 && !update.isPending;

  const save = () => {
    if (!canSave) return;
    update.mutate(
      { packages: cleaned },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success("Đã cập nhật gói dịch vụ");
        },
        onError: () => toast.error("Lưu thất bại, vui lòng thử lại"),
      }
    );
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Gói dịch vụ
          </h1>
          <p className="mt-1 text-muted-foreground">
            Các gói khách hàng chọn khi đặt lịch chụp với bạn.
          </p>
        </div>
        <Button className="rounded-full" disabled={!canSave} onClick={save}>
          {update.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Lưu thay đổi
        </Button>
      </header>

      {draft.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Package className="size-6" />
          </span>
          <p className="font-medium">Chưa có gói dịch vụ nào</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Thêm gói để khách hàng chọn khi đặt lịch.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {draft.map((pkg, i) => (
            <div
              key={pkg.id}
              className="grid items-end gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_140px_auto]"
            >
              <Field label="Tên gói">
                <Input
                  value={pkg.name}
                  placeholder="VD: Gói cơ bản"
                  onChange={(e) => updatePkg(i, { name: e.target.value })}
                />
              </Field>
              <Field label="Mô tả">
                <Input
                  value={pkg.duration}
                  placeholder="VD: 1 giờ chụp · 15 ảnh"
                  onChange={(e) => updatePkg(i, { duration: e.target.value })}
                />
              </Field>
              <Field label="Giá (VND)">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={10000}
                  value={pkg.price}
                  onChange={(e) => updatePkg(i, { price: Number(e.target.value) })}
                />
              </Field>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Xoá gói"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => removePkg(i)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="mt-3 rounded-full" onClick={addPkg}>
        <Plus className="size-4" />
        Thêm gói
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        Mức giá tham khảo: gói rẻ nhất hiện tại{" "}
        <span className="font-medium text-foreground">
          {formatPrice(Math.min(...cleaned.map((p) => p.price), profile.pricePerSession))}
        </span>
        . Nếu xoá hết, hệ thống dùng gói mặc định theo giá khởi điểm.
      </p>
    </div>
  );
}

export function DashboardPackages() {
  const { data: profile, isLoading } = useMyPhotographerProfile();

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
        <Skeleton className="h-9 w-48" />
        <div className="mt-7 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return <PackagesEditor profile={profile} />;
}
