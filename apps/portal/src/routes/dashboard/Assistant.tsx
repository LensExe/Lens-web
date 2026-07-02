import { useEffect, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  Button,
  Input,
  Skeleton,
  Switch,
  Textarea,
  toast,
} from "@lens/ui";
import {
  useAssistantConfig,
  useUpdateAssistantConfig,
} from "@/queries/useAssistant";
import type { FAQItem } from "@/types";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function DashboardAssistant() {
  const { data, isLoading } = useAssistantConfig();
  const save = useUpdateAssistantConfig();

  const [enabled, setEnabled] = useState(true);
  const [services, setServices] = useState("");
  const [style, setStyle] = useState("");
  const [area, setArea] = useState("");
  const [tone, setTone] = useState("");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Hydrate the form once the config loads.
  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setServices(data.services);
    setStyle(data.style);
    setArea(data.area);
    setTone(data.tone);
    setFaqs(data.faqs);
  }, [data]);

  const setFaq = (i: number, patch: Partial<FAQItem>) =>
    setFaqs((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const addFaq = () => setFaqs((prev) => [...prev, { q: "", a: "" }]);
  const removeFaq = (i: number) =>
    setFaqs((prev) => prev.filter((_, idx) => idx !== i));

  const submit = () =>
    save.mutate(
      {
        enabled,
        services,
        style,
        area,
        tone,
        faqs: faqs.filter((f) => f.q.trim() || f.a.trim()),
      },
      {
        onSuccess: () => toast.success("Đã lưu dữ liệu huấn luyện trợ lý AI"),
        onError: () => toast.error("Không thể lưu, vui lòng thử lại"),
      }
    );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[760px] px-5 py-8 md:py-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 py-8 md:py-10">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
          <Sparkles className="size-6 text-ember" />
          Trợ lý AI
        </h1>
        <p className="mt-1 text-muted-foreground">
          Cung cấp thông tin để trợ lý tự trả lời khách thay bạn. Trợ lý chỉ trả
          lời trong phạm vi dữ liệu này và luôn chuyển cho bạn khi có khiếu nại,
          huỷ hoặc tranh chấp tiền.
        </p>
      </header>

      <div className="mt-7 space-y-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Kích hoạt trợ lý</p>
            <p className="text-sm text-muted-foreground">
              Bật để có thể dùng trợ lý trong các hội thoại.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Kích hoạt trợ lý" />
        </div>

        <Field
          label="Giá & dịch vụ"
          hint="Các gói, mức giá, những gì bao gồm — trợ lý sẽ dựa vào đây khi khách hỏi giá."
        >
          <Textarea
            value={services}
            onChange={(e) => setServices(e.target.value)}
            placeholder="Ví dụ: Gói cơ bản 450k (1h, 15 ảnh)…"
            className="min-h-24"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phong cách">
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Chân dung, ánh sáng tự nhiên…"
            />
          </Field>
          <Field label="Khu vực nhận job">
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Hà Nội và lân cận"
            />
          </Field>
        </div>

        <Field label="Giọng văn" hint="Cách trợ lý xưng hô, mức độ trang trọng.">
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="Thân thiện, ngắn gọn"
          />
        </Field>

        {/* FAQs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Câu hỏi thường gặp</p>
            <Button variant="outline" size="sm" className="rounded-full" onClick={addFaq}>
              <Plus className="size-4" />
              Thêm câu hỏi
            </Button>
          </div>
          {faqs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Chưa có câu hỏi mẫu. Thêm các câu khách hay hỏi để trợ lý trả lời
              chính xác hơn.
            </p>
          ) : (
            faqs.map((f, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={f.q}
                    onChange={(e) => setFaq(i, { q: e.target.value })}
                    placeholder="Câu hỏi"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Xoá câu hỏi"
                    onClick={() => removeFaq(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  value={f.a}
                  onChange={(e) => setFaq(i, { a: e.target.value })}
                  placeholder="Câu trả lời"
                />
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button className="rounded-full" disabled={save.isPending} onClick={submit}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
