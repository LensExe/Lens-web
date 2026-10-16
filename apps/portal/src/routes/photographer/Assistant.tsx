import { useState } from "react";
import {
  Button,
  PageContainer,
  Skeleton,
  Switch,
  Textarea,
  toast,
} from "@lens/ui";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { AssistantFaqsSection } from "@/components/assistant/AssistantFaqsSection";
import {
  useAssistantConfig,
  useAssistantReplySuggestions,
  useUpdateAssistantConfig,
} from "@/queries/useAssistant";
import type { AiAssistantSettings } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  auto_sent: "Đã tự trả lời",
  handoff: "Chuyển cho nhiếp ảnh gia",
  generation_failed: "AI gặp lỗi",
  skipped_online: "Nhiếp ảnh gia đang online",
  pending_review: "Chờ xem lại",
  superseded: "Đã thay thế",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

interface ToneSettingsFormProps {
  settings: AiAssistantSettings;
  isSaving: boolean;
  onSave: (toneInstructions: string | null, minSimilarity: number) => void;
}

function ToneSettingsForm({ settings, isSaving, onSave }: ToneSettingsFormProps) {
  const [tone, setTone] = useState(settings.toneInstructions ?? "");
  const [minSimilarity, setMinSimilarity] = useState(settings.minSimilarity);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(tone.trim() || null, minSimilarity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Hướng dẫn giọng điệu</span>
        <Textarea
          value={tone}
          maxLength={2000}
          onChange={(event) => setTone(event.target.value)}
          placeholder="Ví dụ: thân thiện, ngắn gọn, xưng mình và bạn."
          rows={3}
        />
      </label>
      <label className="block space-y-2">
        <span className="flex items-center justify-between text-sm font-medium">
          <span>Ngưỡng khớp FAQ</span>
          <span className="text-muted-foreground">{minSimilarity.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={minSimilarity}
          onChange={(event) => setMinSimilarity(Number(event.target.value))}
          className="w-full accent-ember"
          aria-label="Ngưỡng khớp FAQ"
        />
      </label>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Đang lưu…" : "Lưu cài đặt"}
      </Button>
    </form>
  );
}

export function PhotographerAssistant() {
  const settingsQuery = useAssistantConfig();
  const historyQuery = useAssistantReplySuggestions();
  const update = useUpdateAssistantConfig();
  const settings = settingsQuery.data;

  const saveInstructions = (toneInstructions: string | null, minSimilarity: number) => {
    update.mutate(
      {
        toneInstructions,
        minSimilarity,
      },
      {
        onSuccess: () => toast.success("Đã lưu cài đặt trợ lý AI."),
        onError: () => toast.error("Không lưu được cài đặt trợ lý AI."),
      },
    );
  };

  return (
    <PageContainer className="space-y-5 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Trợ lý AI</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          AI hỗ trợ trả lời tin nhắn khách hàng khi bạn ngoại tuyến. Trợ lý dùng
          thông tin hồ sơ, gói chụp và FAQ bạn quản lý bên dưới.
        </p>
      </header>

      {settingsQuery.isError ? (
        <div className="rounded-xl border border-destructive/30 p-4">
          <p role="alert" className="text-sm text-destructive">
            Không tải được cài đặt AI. Hãy kiểm tra AI API đã được bật và thử lại.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => void settingsQuery.refetch()}
          >
            Thử tải lại
          </Button>
        </div>
      ) : (
        <SettingsSection
          title="Cài đặt trả lời"
          description="Trợ lý chỉ gửi câu trả lời khi cả hai tuỳ chọn được bật và AI worker đang chạy."
        >
          {settingsQuery.isLoading || !settings ? (
            <div className="space-y-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                <div>
                  <p className="text-sm font-medium">Bật trợ lý AI</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cho phép worker xử lý tin nhắn đủ điều kiện cho photographer này.
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  disabled={update.isPending}
                  onCheckedChange={(enabled) =>
                    update.mutate(
                      { enabled },
                      {
                        onSuccess: () => toast.success(enabled ? "Đã bật trợ lý AI." : "Đã tắt trợ lý AI."),
                        onError: () => toast.error("Không cập nhật được trạng thái AI."),
                      },
                    )
                  }
                  aria-label="Bật trợ lý AI"
                />
              </div>
              <div className="flex items-center justify-between gap-4 py-4 last:pb-0">
                <div>
                  <p className="text-sm font-medium">Tự động gửi câu trả lời</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chỉ gửi câu trả lời an toàn; nội dung chưa đủ căn cứ sẽ chuyển cho bạn.
                  </p>
                </div>
                <Switch
                  checked={settings.autoReplyEnabled}
                  disabled={!settings.enabled || update.isPending}
                  onCheckedChange={(autoReplyEnabled) =>
                    update.mutate(
                      { autoReplyEnabled },
                      {
                        onSuccess: () => toast.success(autoReplyEnabled ? "Đã bật tự động trả lời." : "Đã tắt tự động trả lời."),
                        onError: () => toast.error("Không cập nhật được trạng thái tự động trả lời."),
                      },
                    )
                  }
                  aria-label="Tự động gửi câu trả lời"
                />
              </div>
            </div>
          )}
        </SettingsSection>
      )}

      <AssistantFaqsSection />

      <SettingsSection
        title="Giọng điệu và độ tin cậy"
        description="Ngưỡng tin cậy thấp hơn có thể đưa thêm FAQ vào ngữ cảnh trả lời."
      >
        {settingsQuery.isLoading || !settings ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <ToneSettingsForm
            key={JSON.stringify([settings.toneInstructions, settings.minSimilarity])}
            settings={settings}
            isSaving={update.isPending}
            onSave={saveInstructions}
          />
        )}
      </SettingsSection>

      <SettingsSection
        title="Hoạt động gần đây"
        description="Các câu trả lời đã gửi, nội dung cần bạn tiếp quản và lỗi tạo phản hồi."
      >
        {historyQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : historyQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            Không tải được lịch sử hoạt động AI.
          </p>
        ) : (historyQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có hoạt động AI nào. Khi có tin nhắn phù hợp, kết quả sẽ hiện ở đây.
          </p>
        ) : (
          <div className="space-y-3">
            {historyQuery.data?.map((item) => (
              <article key={item.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chủ đề: {item.intent}
                  {item.retrievalSimilarity !== null
                    ? " · Độ khớp FAQ: " + item.retrievalSimilarity.toFixed(2)
                    : ""}
                </p>
                {item.suggestedReply && (
                  <p className="mt-2 whitespace-pre-wrap text-sm">{item.suggestedReply}</p>
                )}
                {item.failureReason && (
                  <p className="mt-2 text-xs text-destructive">{item.failureReason}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
