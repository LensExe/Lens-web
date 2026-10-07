import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Loader2 } from "lucide-react";
import { Button, formatPrice, toast, PageContainer } from "@lens/ui";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { useConfirmReceipt, useMyBookings } from "@/queries/useBookings";
import { useIncomingBookings } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { deliveryProgress, isPaymentDue, remainingAmount } from "@/lib/booking";

export function DeliveryGalleryPage({ mode }: { mode: "photographer" | "client" }) {
  const { booking_id = "" } = useParams();
  const navigate = useNavigate();
  const canUpload = mode === "photographer";
  const backTo = canUpload ? "/dashboard/bookings" : "/client/bookings";

  // Each side reads its own list (client: bookings made, photographer: requests received).
  const clientBookings = useMyBookings();
  const incoming = useIncomingBookings();
  const booking = ((canUpload ? incoming : clientBookings).data ?? []).find(
    (b) => b.id === booking_id,
  );

  const { data: gallery } = useGallery(booking_id);
  const confirmReceipt = useConfirmReceipt();
  // Match the backend guard (+ BookingCard/BookingDetail): the client confirms
  // only once the package's photo count has been delivered.
  const progress = booking && deliveryProgress(booking, gallery?.photos.length ?? 0);
  const paymentDue = booking ? isPaymentDue(booking) : false;
  const showConfirm =
    mode === "client" && booking?.status === "held" && Boolean(gallery?.publishedAt) && !paymentDue;

  const confirm = () =>
    confirmReceipt.mutate(booking_id, {
      onSuccess: () => {
        toast.success("Đã xác nhận nhận ảnh");
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
              ? `Sau khi xác nhận, sàn sẽ giải ngân ${formatPrice(booking.price)} cho nhiếp ảnh gia.`
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

      {paymentDue && booking && (
        <div className="mb-5 mt-3 flex flex-col gap-3 rounded-2xl border border-ember/25 bg-ember/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Photographer đã đánh dấu đã chụp. Thanh toán phần còn lại trước khi xác nhận nhận ảnh.
          </p>
          <Button asChild className="shrink-0 rounded-full bg-ember text-white hover:bg-ember/90">
            <Link to={`/client/bookings/${booking.id}/pay`}>
              <CreditCard className="size-4" />
              Thanh toán {formatPrice(remainingAmount(booking))}
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-4">
        <GalleryPanel
          bookingId={booking_id}
          canUpload={canUpload}
          canPublish={booking?.backendStatus === "shot"}
          required={booking?.packageSnapshot?.photoCount}
        />
      </div>
    </PageContainer>
  );
}
