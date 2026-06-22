import { Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Skeleton,
  toast,
} from "@lens/ui";
import { useMyBookings } from "@/queries/useBookings";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function ClientReviews() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const reviewable = bookings.filter((b) => b.status === "completed");

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Đánh giá của tôi
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chia sẻ trải nghiệm sau những buổi chụp đã hoàn thành.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : reviewable.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Star className="size-6" />
          </span>
          <p className="font-medium">Chưa có gì để đánh giá</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sau khi hoàn thành một buổi chụp, bạn có thể viết đánh giá cho nhiếp
            ảnh gia tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewable.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <Avatar className="size-12 shrink-0">
                <AvatarFallback>{initialsOf(booking.photographerName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{booking.photographerName}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.style} · {formatDate(booking.date)}
                </p>
              </div>
              <Button
                variant="outline"
                className="shrink-0 rounded-full"
                onClick={() => toast("Tính năng viết đánh giá sắp ra mắt.")}
              >
                <Star className="size-4" />
                Viết đánh giá
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
