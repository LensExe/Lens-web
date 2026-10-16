import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { Button, Input, Skeleton, Textarea, toast } from "@lens/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  useAssistantFaqs,
  useCreateAssistantFaq,
  useDeactivateAssistantFaq,
  useUpdateAssistantFaq,
} from "@/queries/useAssistant";
import type { AiAssistantFaq, AiAssistantFaqInput } from "@/types";

const DEMO_FAQS: AiAssistantFaqInput[] = [
  {
    question: "Gói chụp chân dung cơ bản gồm những gì?",
    answer:
      "[DEMO] Gói chân dung cơ bản gồm 90 phút chụp và 20 ảnh chỉnh sửa. Đây là số liệu minh hoạ; hãy thay bằng gói thật của bạn.",
    alternatives: ["Một gói chụp gồm những gì?", "Gói chân dung có bao nhiêu ảnh?"],
  },
  {
    question: "Mất bao lâu để nhận ảnh đã chỉnh sửa?",
    answer:
      "[DEMO] Bộ ảnh hoàn thiện trong 7 ngày làm việc. Thời gian này chỉ để minh hoạ; hãy thay bằng thời gian giao ảnh thực tế.",
    alternatives: ["Khi nào mình nhận được ảnh?", "Thời gian hậu kỳ là bao lâu?"],
  },
  {
    question: "Studio nhận chụp ở những khu vực nào?",
    answer:
      "[DEMO] Studio nhận chụp tại Hà Nội và khu vực lân cận. Đây là khu vực minh hoạ; hãy sửa theo phạm vi phục vụ thật.",
    alternatives: ["Bạn có thể chụp ở đâu?", "Có nhận chụp ngoại cảnh không?"],
  },
];

export function AssistantFaqsSection() {
  const faqsQuery = useAssistantFaqs();
  const createFaq = useCreateAssistantFaq();
  const updateFaq = useUpdateAssistantFaq();
  const deactivateFaq = useDeactivateAssistantFaq();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [alternatives, setAlternatives] = useState("");
  const [isAddingDemo, setIsAddingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const isSaving =
    createFaq.isPending || updateFaq.isPending || deactivateFaq.isPending || isAddingDemo;
  const hasNoFaqs = faqsQuery.isSuccess && (faqsQuery.data?.length ?? 0) === 0;

  const resetForm = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setAlternatives("");
  };

  const editFaq = (faq: AiAssistantFaq) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setAlternatives(faq.alternatives.join("\n"));
  };

  const addDemoFaqs = async () => {
    setIsAddingDemo(true);
    setDemoProgress(0);
    let addedCount = 0;
    try {
      for (const faq of DEMO_FAQS) {
        await createFaq.mutateAsync(faq);
        addedCount += 1;
        setDemoProgress(addedCount);
      }
      toast.success("Đã thêm 3 FAQ demo. Hãy sửa nội dung trước khi dùng với khách.");
    } catch {
      toast.error(
        addedCount > 0
          ? `Đã thêm ${addedCount}/3 FAQ demo. Hãy tải lại danh sách để xem các mục đã thêm.`
          : "Không thêm được FAQ demo. Hãy kiểm tra API và Ollama rồi thử lại.",
      );
    } finally {
      setIsAddingDemo(false);
      setDemoProgress(0);
    }
  };

  const submitFaq = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: AiAssistantFaqInput = {
      question: question.trim(),
      answer: answer.trim(),
      alternatives: alternatives
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    const onSuccess = () => {
      toast.success(editingId ? "Đã cập nhật FAQ." : "Đã thêm FAQ.");
      resetForm();
    };
    const onError = () => toast.error("Không lưu được FAQ. Hãy thử lại.");

    if (editingId) {
      updateFaq.mutate({ id: editingId, patch: input }, { onSuccess, onError });
    } else {
      createFaq.mutate(input, { onSuccess, onError });
    }
  };

  const toggleFaq = (faq: AiAssistantFaq) => {
    if (!faq.isActive) {
      updateFaq.mutate(
        { id: faq.id, patch: { isActive: true } },
        {
          onSuccess: () => toast.success("Đã bật lại FAQ."),
          onError: () => toast.error("Không bật lại được FAQ."),
        },
      );
      return;
    }
    deactivateFaq.mutate(faq.id, {
      onSuccess: () => toast.success("Đã tạm tắt FAQ."),
      onError: () => toast.error("Không tắt được FAQ."),
    });
  };

  return (
    <SettingsSection
      title="Thông tin để AI trả lời"
      description="Thêm câu hỏi thường gặp và câu trả lời chính xác. AI sẽ tra cứu các mục đang bật trước khi trả lời khách."
    >
      {(hasNoFaqs || isAddingDemo) && !editingId && !question.trim() && !answer.trim() && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-3">
          <p className="text-sm text-muted-foreground">
            Thêm bộ mẫu gồm gói chụp, thời gian giao ảnh và khu vực phục vụ. Cả ba câu trả lời đều
            được đánh dấu [DEMO].
          </p>
          <Button type="button" variant="outline" onClick={addDemoFaqs} disabled={isSaving}>
            <Sparkles className="size-4" />
            {isAddingDemo ? `Đang thêm ${demoProgress}/3…` : "Thêm bộ FAQ demo (3 mục)"}
          </Button>
        </div>
      )}
      <form onSubmit={submitFaq} className="space-y-3 rounded-xl bg-muted/40 p-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Câu hỏi</span>
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            placeholder="Ví dụ: Gói chụp chân dung gồm những gì?"
            required
            aria-label="Câu hỏi FAQ"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Câu trả lời</span>
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={4000}
            placeholder="Nhập thông tin chính xác về dịch vụ, giá, thời gian..."
            rows={4}
            required
            aria-label="Câu trả lời FAQ"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            Cách hỏi tương tự{" "}
            <span className="font-normal text-muted-foreground">(mỗi dòng một cách hỏi)</span>
          </span>
          <Textarea
            value={alternatives}
            onChange={(event) => setAlternatives(event.target.value)}
            placeholder={"Cho mình xin thông tin gói chụp\nGói này có giá bao nhiêu?"}
            rows={2}
            aria-label="Cách hỏi tương tự"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            <Plus className="size-4" />
            {isSaving ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm FAQ"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="size-4" />
              Hủy chỉnh sửa
            </Button>
          )}
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {faqsQuery.isLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : faqsQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 p-4">
            <p role="alert" className="text-sm text-destructive">
              Không tải được FAQ. Hãy kiểm tra AI API đã được cập nhật rồi thử lại.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => void faqsQuery.refetch()}
            >
              Thử tải lại
            </Button>
          </div>
        ) : (faqsQuery.data ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Chưa có FAQ. Sau khi thêm bộ demo, bạn có thể sửa hoặc tắt từng mục tại đây.
          </p>
        ) : (
          faqsQuery.data?.map((faq) => (
            <article key={faq.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{faq.question}</h3>
                    <span
                      className={
                        faq.isActive
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      }
                    >
                      {faq.isActive ? "Đang dùng" : "Đã tắt"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                  {faq.alternatives.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Cách hỏi khác: {faq.alternatives.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editFaq(faq)}
                    aria-label="Chỉnh sửa FAQ"
                    title="Chỉnh sửa FAQ"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => toggleFaq(faq)}
                    aria-label={faq.isActive ? "Tạm tắt FAQ" : "Bật lại FAQ"}
                    title={faq.isActive ? "Tạm tắt FAQ" : "Bật lại FAQ"}
                  >
                    {faq.isActive ? (
                      <Trash2 className="size-4 text-destructive" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              {editingId === faq.id && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3" />
                  Đang chỉnh sửa mục này ở biểu mẫu phía trên.
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </SettingsSection>
  );
}
