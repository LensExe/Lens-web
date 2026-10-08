import { useRef, type ReactNode } from "react";
import { Check, Download, ImageOff, Loader2, Upload } from "lucide-react";
import { Button, Skeleton, cn, toast } from "@lens/ui";
import { DeliveryProgress } from "@/components/storage/DeliveryProgress";
import { useGallery, usePublishGallery, useUploadPhotos } from "@/queries/useStorage";
import { apiErrorMessage } from "@/lib/errors";
import { formatBytes } from "@/lib/storage";
import type { ShootGallery } from "@/types";

function GalleryGrid({ gallery }: { gallery: ShootGallery }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 xl:columns-4 [&>*]:mb-3">
      {gallery.photos.map((photo, index) => (
        <div
          key={photo.id}
          className="group relative overflow-hidden rounded-xl border border-border break-inside-avoid"
        >
          <img
            src={photo.url}
            alt={photo.name}
            loading="lazy"
            style={{ aspectRatio: ["4 / 5", "1 / 1", "3 / 4"][index % 3] }}
            className={cn("h-full w-full object-cover")}
          />
          <a
            href={photo.originalUrl ?? photo.url}
            download={photo.name}
            target="_blank"
            rel="noreferrer"
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
            aria-label={`Tải ${photo.name}`}
          >
            <Download className="size-4" />
          </a>
        </div>
      ))}
    </div>
  );
}

/** Displays a real booking gallery and uploads files through lens-backend media endpoints. */
export function GalleryPanel({
  bookingId,
  canUpload,
  canPublish = false,
  required,
  emptyActions,
}: {
  bookingId: string;
  canUpload: boolean;
  canPublish?: boolean;
  required?: number;
  emptyActions?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: gallery, isLoading } = useGallery(bookingId);
  const upload = useUploadPhotos(bookingId);
  const publish = usePublishGallery(bookingId);
  const published = Boolean(gallery?.publishedAt);
  const canAddPhotos = canUpload && !published;

  const submitFiles = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    upload.mutate(selected, {
      onSuccess: () => toast.success("Đã tải ảnh lên bộ sưu tập"),
      onError: (error) => toast.error(apiErrorMessage(error, error instanceof Error ? error.message : "Tải ảnh thất bại, vui lòng thử lại")),
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const publishGallery = () =>
    publish.mutate(undefined, {
      onSuccess: () => toast.success("Đã giao bộ sưu tập cho khách hàng"),
      onError: (error) => toast.error(apiErrorMessage(error, error instanceof Error ? error.message : "Không thể giao ảnh, vui lòng thử lại")),
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const progress = required ? (
    <DeliveryProgress delivered={gallery?.photos.length ?? 0} required={required} canUpload={canUpload} />
  ) : null;

  return (
    <div>
      {progress && <div className="mb-4">{progress}</div>}
      {!gallery || gallery.photos.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border p-12 text-center">
          <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ImageOff className="size-7" />
          </span>
          <p className="text-lg font-medium">{canUpload ? "Chưa có ảnh nào" : "Nhiếp ảnh gia chưa giao ảnh"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {canUpload
              ? "Chọn ảnh đã hậu kỳ để tải lên bộ sưu tập của lịch chụp."
              : "Ảnh sẽ xuất hiện ở đây sau khi nhiếp ảnh gia giao bộ sưu tập."}
          </p>
          {canAddPhotos && (
            <Button className="mt-5 rounded-full" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Chọn ảnh tải lên
            </Button>
          )}
          {emptyActions}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {gallery.photos.length} ảnh · {formatBytes(gallery.sizeBytes)}
                {canUpload ? ` · Khách: ${gallery.clientName}` : ""}
              </p>
              {published && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">Đã giao ảnh cho khách</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {canAddPhotos && (
                <Button variant="outline" size="sm" className="rounded-full" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
                  {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Thêm ảnh
                </Button>
              )}
              {canUpload && canPublish && !published && (
                <Button size="sm" className="rounded-full" disabled={publish.isPending || gallery.photos.length === 0} onClick={publishGallery}>
                  {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Giao ảnh cho khách
                </Button>
              )}
            </div>
          </div>
          {canUpload && !published && !canPublish && (
            <p className="mb-4 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Bạn có thể tải ảnh lên trong lúc chuẩn bị. Để giao ảnh, hãy đánh dấu buổi chụp đã hoàn tất ở chi tiết lịch đặt.
            </p>
          )}
          <GalleryGrid gallery={gallery} />
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => submitFiles(event.currentTarget.files)}
      />
    </div>
  );
}
