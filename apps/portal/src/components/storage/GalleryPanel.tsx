import { Link, useNavigate } from "react-router-dom";
import { Download, ImageOff, Loader2, Lock, Upload } from "lucide-react";
import { Button, Skeleton, cn, toast } from "@lens/ui";
import { ExpiryBanner } from "@/components/storage/ExpiryBanner";
import { useGallery, useUploadPhotos } from "@/queries/useStorage";
import { formatBytes } from "@/lib/storage";
import type { ShootGallery } from "@/types";

function GalleryGrid({ gallery }: { gallery: ShootGallery }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
      {gallery.photos.map((p, i) => (
        <div
          key={p.id}
          className="group relative overflow-hidden rounded-xl border border-border break-inside-avoid"
        >
          <img
            src={p.url}
            alt={p.name}
            loading="lazy"
            style={{ aspectRatio: ["4 / 5", "1 / 1", "3 / 4"][i % 3] }}
            className={cn("h-full w-full object-cover", gallery.locked && "blur-md")}
          />
          {!gallery.locked && (
            <a
              href={p.url}
              download={p.name}
              target="_blank"
              rel="noreferrer"
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"
              aria-label={`Tải ${p.name}`}
              onClick={() => toast.success("Đang tải ảnh về…")}
            >
              <Download className="size-4" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * The delivery gallery for one booking: photos + (photographer) upload +
 * expiry/lock banners. Reused by the standalone gallery route AND embedded in the
 * booking detail page's delivery step.
 */
export function GalleryPanel({
  bookingId,
  canUpload,
}: {
  bookingId: string;
  canUpload: boolean;
}) {
  const navigate = useNavigate();
  const { data: gallery, isLoading } = useGallery(bookingId);
  const upload = useUploadPhotos(bookingId);

  const doUpload = () =>
    upload.mutate(undefined, {
      onSuccess: () => toast.success("Đã tải ảnh lên bộ sưu tập"),
      onError: () => toast.error("Tải ảnh thất bại, vui lòng thử lại"),
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!gallery || gallery.photos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border p-12 text-center">
        <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ImageOff className="size-7" />
        </span>
        <p className="text-lg font-medium">
          {canUpload ? "Chưa có ảnh nào" : "Nhiếp ảnh gia chưa giao ảnh"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {canUpload
            ? "Tải ảnh buổi chụp lên để giao cho khách hàng."
            : "Ảnh sẽ xuất hiện ở đây ngay khi nhiếp ảnh gia giao."}
        </p>
        {canUpload && (
          <Button className="mt-5 rounded-full" disabled={upload.isPending} onClick={doUpload}>
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Tải ảnh lên
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {gallery.photos.length} ảnh · {formatBytes(gallery.sizeBytes)}
          {canUpload ? ` · Khách: ${gallery.clientName}` : ""}
        </p>
        {canUpload && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={upload.isPending}
            onClick={doUpload}
          >
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Thêm ảnh
          </Button>
        )}
      </div>

      <ExpiryBanner
        gallery={gallery}
        onUpgrade={canUpload ? () => navigate("/dashboard/storage") : undefined}
      />

      {gallery.locked && (
        <div className="my-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          <Lock className="size-4 shrink-0 text-muted-foreground" />
          <span>
            Bộ sưu tập vượt hạn mức gói hiện tại nên tạm bị khoá.{" "}
            {canUpload ? (
              <Link to="/dashboard/storage" className="font-medium underline">
                Nâng cấp gói để mở lại
              </Link>
            ) : (
              "Vui lòng liên hệ nhiếp ảnh gia."
            )}
          </span>
        </div>
      )}

      <div className="mt-4">
        <GalleryGrid gallery={gallery} />
      </div>
    </div>
  );
}
