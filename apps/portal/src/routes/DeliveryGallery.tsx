import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button, formatPrice, toast, PageContainer } from "@lens/ui";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { useConfirmReceipt, useMyBookings } from "@/queries/useBookings";
import { useIncomingBookings } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { deliveryProgress } from "@/lib/booking";
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

  // Each side reads its own list (client: bookings made, photographer: requests received).
  const clientBookings = useMyBookings();
  const incoming = useIncomingBookings();
  const booking = ((canUpload ? incoming : clientBookings).data ?? []).find((b) => b.id === id);

  const { data: gallery } = useGallery(id);
  const confirmReceipt = useConfirmReceipt();
  // Match the backend guard (+ BookingCard/BookingDetail): the client confirms
  // only once the package's photo count has been delivered.
  const progress = booking && deliveryProgress(booking, gallery?.photos.length ?? 0);
  const showConfirm = mode === "client" && booking?.status === "held";

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
    <PageContainer>
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

      {showConfirm && booking && progress && (
        <div className="mb-5 mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {progress.complete
              ? `Sau khi xác nhận, sàn sẽ giải ngân ${formatPrice(booking.price)} cho nhiếp ảnh gia và hoàn Lens Xu cho bạn.`
              : `Bạn có thể xác nhận khi nhiếp ảnh gia giao đủ ${progress.required} ảnh (hiện có ${progress.delivered}/${progress.required}).`}
          </p>
          <Button
            className="shrink-0 rounded-full"
            disabled={confirmReceipt.isPending || !progress.complete}
            onClick={confirm}
          >
            {confirmReceipt.isPending && <Loader2 className="size-4 animate-spin" />}
            <Check className="size-4" />
            Xác nhận đã nhận ảnh
          </Button>
        </div>
      )}

      <div className="mt-4">
        <GalleryPanel
          bookingId={id}
          canUpload={canUpload}
          required={booking?.packageSnapshot?.photoCount}
        />
      </div>
    </PageContainer>
  );
}
