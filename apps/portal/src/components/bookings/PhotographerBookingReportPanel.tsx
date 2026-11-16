import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Flag, Loader2, Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
  toast,
} from "@lens/ui";
import { apiErrorMessage } from "@/lib/errors";
import { useBookingReport, useCreateBookingReport } from "@/queries/useBookingReports";
import type { Booking } from "@/types";

const REPORTABLE_STATUSES = new Set(["accepted", "in_progress", "shot", "completed"]);
const MAX_FILES = 5;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const STATUS: Record<string, { label: string; description: string }> = {
  open: {
    label: "Đang chờ xem xét",
    description: "Lens đã nhận report và sẽ cập nhật khi có kết quả.",
  },
  escalated: {
    label: "Đang ưu tiên xử lý",
    description: "Report đã được chuyển cấp để xem xét thêm.",
  },
  resolved: { label: "Đã xử lý", description: "Lens đã hoàn tất xử lý report này." },
  rejected: {
    label: "Không được chấp nhận",
    description: "Lens đã xem xét nhưng report không đáp ứng điều kiện xử lý.",
  },
};

export function PhotographerBookingReportPanel({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const report = useBookingReport(booking.id);
  const createReport = useCreateBookingReport(booking.id);
  const canReport = REPORTABLE_STATUSES.has(booking.backendStatus ?? "");
  const current = report.data;
  const status = current ? STATUS[current.status] : undefined;

  const reset = () => {
    setReason("");
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = () => {
    if (reason.trim().length < 10) {
      toast.error("Vui lòng mô tả vấn đề cụ thể hơn (ít nhất 10 ký tự).");
      return;
    }
    createReport.mutate(
      { reason, evidence: files },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
          toast.success("Đã gửi báo cáo booking cho Lens");
        },
        onError: (error) =>
          toast.error(
            apiErrorMessage(
              error,
              error instanceof Error ? error.message : "Không thể gửi báo cáo, vui lòng thử lại.",
            ),
          ),
      },
    );
  };

  const addFiles = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []);
    if (files.length + selected.length > MAX_FILES) {
      toast.error("Bạn chỉ có thể đính kèm tối đa 5 ảnh.");
      return;
    }
    if (
      selected.some(
        (file) => !ALLOWED_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_FILE_BYTES,
      )
    ) {
      toast.error("Chỉ nhận ảnh JPEG, PNG hoặc WebP, tối đa 12 MB mỗi ảnh.");
      return;
    }
    setFiles((currentFiles) => [...currentFiles, ...selected]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            {current?.status === "resolved" ? (
              <CheckCircle2 className="size-4" />
            ) : current ? (
              <Clock3 className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {current ? "Report gần nhất" : "Có vấn đề với booking?"}
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
              {current
                ? (status?.description ?? "Trạng thái report được cập nhật tại đây.")
                : "Gửi mô tả và ảnh bằng chứng để Lens xem xét. Báo cáo không tự thay đổi trạng thái booking."}
            </p>
          </div>
        </div>
        {canReport && (
          <Button
            variant="outline"
            className="shrink-0 rounded-full"
            disabled={report.isLoading || createReport.isPending}
            onClick={() => setOpen(true)}
          >
            {report.isLoading || createReport.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Flag className="size-4" />
            )}
            {current ? "Báo thêm vấn đề" : "Báo cáo vấn đề"}
          </Button>
        )}
      </div>

      {current && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">
            {status?.label ?? current.status}
          </span>
          {current.resolution && (
            <p className="mt-2 text-xs leading-5">Phản hồi từ Lens: {current.resolution}</p>
          )}
        </div>
      )}
      {report.isError && (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-destructive">
          <span>Không tải được trạng thái report.</span>
          <Button variant="ghost" size="sm" onClick={() => report.refetch()}>
            Tải lại
          </Button>
        </div>
      )}
      {!current && !canReport && !report.isLoading && !report.isError && (
        <p className="mt-3 text-xs text-muted-foreground">
          Bạn có thể gửi report sau khi booking được xác nhận.
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (createReport.isPending) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Báo cáo vấn đề với booking</DialogTitle>
            <DialogDescription>
              Mô tả rõ vấn đề để Lens có đủ thông tin xem xét. Báo cáo không tự động thay đổi
              booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor={`photographer-report-${booking.id}`} className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <Textarea
                id={`photographer-report-${booking.id}`}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nêu rõ điều gì đã xảy ra, thời điểm và thông tin liên quan..."
                maxLength={10000}
                rows={5}
                className="resize-y rounded-xl"
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {reason.trim().length}/10 ký tự tối thiểu
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Ảnh bằng chứng{" "}
                <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Tối đa 5 ảnh JPEG, PNG hoặc WebP, mỗi ảnh không quá 12 MB.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => addFiles(event.currentTarget.files)}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={files.length >= MAX_FILES || createReport.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <Flag className="size-4" /> Chọn ảnh bằng chứng
              </Button>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Xóa ${file.name}`}
                    disabled={createReport.isPending}
                    onClick={() =>
                      setFiles((currentFiles) =>
                        currentFiles.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={createReport.isPending}
              onClick={() => setOpen(false)}
            >
              Để sau
            </Button>
            <Button
              className="rounded-full"
              disabled={createReport.isPending || reason.trim().length < 10}
              onClick={submit}
            >
              {createReport.isPending && <Loader2 className="size-4 animate-spin" />} Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
