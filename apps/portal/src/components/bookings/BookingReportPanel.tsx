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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@lens/ui";
import { useBookingReport, useCreateBookingReport } from "@/queries/useBookingReports";
import { apiErrorMessage } from "@/lib/errors";
import type { Booking } from "@/types";
import type { BookingReportCategory } from "@/types/bookings";

const CATEGORIES: { value: BookingReportCategory; label: string }[] = [
  { value: "photo_quality", label: "Chất lượng ảnh chưa đạt" },
  { value: "missing_deliverables", label: "Thiếu ảnh hoặc sản phẩm bàn giao" },
  { value: "late_delivery", label: "Giao ảnh trễ" },
  { value: "photographer_conduct", label: "Tác phong hoặc trải nghiệm" },
  { value: "booking_mismatch", label: "Buổi chụp khác thỏa thuận" },
  { value: "payment_refund", label: "Thanh toán hoặc hoàn tiền" },
  { value: "other", label: "Vấn đề khác" },
];

const STATUS: Record<string, { label: string; description: string; className: string }> = {
  open: {
    label: "Đang chờ xem xét",
    description: "Lens đã nhận report và sẽ cập nhật khi có kết quả.",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  },
  escalated: {
    label: "Đang được ưu tiên xử lý",
    description: "Report đã được chuyển cấp để xem xét thêm.",
    className: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200",
  },
  resolved: {
    label: "Đã xử lý",
    description: "Lens đã hoàn tất xử lý report này.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
  rejected: {
    label: "Không được chấp nhận",
    description: "Lens đã xem xét nhưng report không đáp ứng điều kiện xử lý.",
    className: "border-border bg-muted text-muted-foreground",
  },
};

const REPORTABLE_STATUSES = new Set(["accepted", "in_progress", "shot", "completed"]);
const MAX_FILES = 5;
const MAX_FILE_BYTES = 12 * 1024 * 1024;

export function BookingReportPanel({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<BookingReportCategory>("photo_quality");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const report = useBookingReport(booking.id);
  const createReport = useCreateBookingReport(booking.id);
  const canReport = REPORTABLE_STATUSES.has(booking.backendStatus ?? "");

  const resetForm = () => {
    setCategory("photo_quality");
    setReason("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const changeOpen = (next: boolean) => {
    if (createReport.isPending) return;
    setOpen(next);
    if (!next) resetForm();
  };

  const addFiles = (selected: FileList | null) => {
    const incoming = Array.from(selected ?? []);
    if (incoming.length === 0) return;
    if (files.length + incoming.length > MAX_FILES) {
      toast.error("Bạn chỉ có thể đính kèm tối đa 5 ảnh.");
      return;
    }
    const invalid = incoming.find((file) =>
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size <= 0 ||
      file.size > MAX_FILE_BYTES,
    );
    if (invalid) {
      toast.error("Chỉ nhận ảnh JPEG, PNG hoặc WebP, tối đa 12 MB mỗi ảnh.");
      return;
    }
    setFiles((current) => [...current, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = () => {
    if (reason.trim().length < 10) {
      toast.error("Vui lòng mô tả vấn đề cụ thể hơn (ít nhất 10 ký tự).");
      return;
    }
    createReport.mutate(
      { category, reason, evidence: files },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          toast.success("Đã gửi report cho booking");
        },
        onError: (error) =>
          toast.error(apiErrorMessage(error, error instanceof Error ? error.message : "Không thể gửi report, vui lòng thử lại.")),
      },
    );
  };

  const currentReport = report.data;
  const status = currentReport ? STATUS[currentReport.status] : undefined;
  const currentCategory = currentReport
    ? CATEGORIES.find((item) => item.value === currentReport.booking_issue_type)?.label
    : undefined;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
            {currentReport
              ? currentReport.status === "resolved"
                ? <CheckCircle2 className="size-4" />
                : <Clock3 className="size-4" />
              : <AlertTriangle className="size-4" />}
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {currentReport ? "Report gần nhất" : "Có vấn đề với buổi chụp?"}
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
              {currentReport
                ? status?.description ?? "Trạng thái report được cập nhật tại đây."
                : "Gửi mô tả và ảnh bằng chứng để Lens xem xét. Report không tự hủy booking hoặc hoàn tiền."}
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
            {report.isLoading || createReport.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Flag className="size-4" />}
            {currentReport ? "Báo thêm vấn đề" : "Báo cáo vấn đề"}
          </Button>
        )}
      </div>
      {currentReport && (
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={"rounded-full border px-2 py-0.5 text-[10px] font-medium " + (status?.className ?? "")}>
              {status?.label ?? currentReport.status}
            </span>
            {currentCategory && <span className="text-xs text-muted-foreground">{currentCategory}</span>}
          </div>
          {currentReport.resolution && (
            <p className="mt-2 text-xs leading-5 text-foreground">
              Phản hồi từ Lens: {currentReport.resolution}
            </p>
          )}
        </div>
      )}
      {report.isError && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-destructive">
          <span>Không tải được trạng thái report.</span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => report.refetch()}>
            Tải lại trạng thái
          </Button>
        </div>
      )}
      {!currentReport && !canReport && !report.isLoading && !report.isError && (
        <p className="mt-3 text-xs text-muted-foreground">
          Bạn có thể gửi report sau khi nhiếp ảnh gia xác nhận booking.
        </p>
      )}

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Báo cáo vấn đề với buổi chụp</DialogTitle>
            <DialogDescription>
              Mô tả rõ vấn đề để Lens có đủ thông tin xem xét. Report không tự động hủy lịch hoặc hoàn tiền.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vấn đề bạn gặp phải</label>
              <Select value={category} onValueChange={(value) => setCategory(value as BookingReportCategory)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn loại vấn đề" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor={"booking-report-reason-" + booking.id} className="text-sm font-medium">
                Mô tả chi tiết
              </label>
              <Textarea
                id={"booking-report-reason-" + booking.id}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Nêu rõ điều gì đã xảy ra, thời điểm và mong muốn được hỗ trợ..."
                maxLength={10000}
                rows={5}
                className="resize-y rounded-xl"
              />
              <p className="text-right text-[11px] text-muted-foreground">{reason.trim().length}/10 ký tự tối thiểu</p>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Ảnh bằng chứng <span className="font-normal text-muted-foreground">(không bắt buộc)</span></p>
                <p className="mt-1 text-xs text-muted-foreground">Tối đa 5 ảnh JPEG, PNG hoặc WebP, mỗi ảnh không quá 12 MB.</p>
              </div>
              <input
                ref={fileInputRef}
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
                onClick={() => fileInputRef.current?.click()}
              >
                <Flag className="size-4" />
                Chọn ảnh bằng chứng
              </Button>
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={file.name + file.lastModified + index} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-xs">
                      <span className="min-w-0 truncate">{file.name}</span>
                      <button
                        type="button"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label={"Xóa " + file.name}
                        disabled={createReport.isPending}
                        onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-full" disabled={createReport.isPending} onClick={() => changeOpen(false)}>
              Để sau
            </Button>
            <Button
              className="rounded-full"
              disabled={createReport.isPending || reason.trim().length < 10}
              onClick={submit}
            >
              {createReport.isPending && <Loader2 className="size-4 animate-spin" />}
              Gửi report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
