import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button, formatPrice, toast } from "@lens/ui";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { useConfirmReceipt, useMyBookings } from "@/queries/useBookings";
import { useGallery } from "@/queries/useStorage";
import { formatCoins } from "@/lib/wallet";

export function DeliveryGallery({
  mode,
}: {
  mode: "photographer" | "client";
}) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const canUpload = mode === "photographer";
  const backTo = canUpload ? "/dashboard/bookings" : "/client/bookings";

  // Client can confirm receipt straight from the gallery (→ released + cashback).
  const { data: bookings = [] } = useMyBookings();
  const { data: gallery } = useGallery(id);
  const confirmReceipt = useConfirmReceipt();
  const booking = bookings.find((b) => b.id === id);
  // Match the backend guard (+ BookingCard/BookingDetail): the client can only
  // confirm once the photographer has actually delivered photos.
  const canConfirm =
    mode === "client" &&
    booking?.status === "held" &&
    !!gallery?.photos.length;

  const confirm = () =>
    confirmReceipt.mutate(id, {
      onSuccess: (updated) => {
        const earned = updated.coinsEarned ?? 0;
        toast.success(
          earned > 0
            ? `Đã xác nhận · nhận +${formatCoins(earned)} hoàn lại`
            : "Đã xác nhận nhận ảnh"
        );
        navigate("/client/bookings");
      },
      onError: () => toast.error("Không thể xác nhận, vui lòng thử lại"),
    });

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {canUpload ? "Về quản lý đặt lịch" : "Về lịch đặt của tôi"}
      </button>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Ảnh buổi chụp{booking ? ` ${booking.style}` : ""}
      </h1>

      {canConfirm && booking && (
        <div className="mb-5 mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Sau khi xác nhận, sàn sẽ giải ngân {formatPrice(booking.price)} cho
            nhiếp ảnh gia và hoàn Lens Xu cho bạn.
          </p>
          <Button
            className="shrink-0 rounded-full"
            disabled={confirmReceipt.isPending}
            onClick={confirm}
          >
            {confirmReceipt.isPending && <Loader2 className="size-4 animate-spin" />}
            <Check className="size-4" />
            Xác nhận đã nhận ảnh
          </Button>
        </div>
      )}

      <div className="mt-4">
        <GalleryPanel bookingId={id} canUpload={canUpload} />
      </div>
    </div>
  );
}
