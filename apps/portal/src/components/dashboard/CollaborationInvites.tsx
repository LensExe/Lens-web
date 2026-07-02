import { Check, Loader2, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, Button, formatPrice, toast } from "@lens/ui";
import {
  useMyCollaborations,
  useRespondToInvite,
} from "@/queries/useCollaborations";
import { photographerPayout } from "@/lib/booking";
import { currentUser } from "@/lib/session";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const myEntry = (b: Booking) =>
  (b.collaborators ?? []).find((c) => c.photographerId === currentUser.id);

export function CollaborationInvites() {
  const { data: collabs = [] } = useMyCollaborations();
  const respond = useRespondToInvite();

  const pending = collabs.filter((b) => myEntry(b)?.status === "invited");
  if (pending.length === 0) return null;

  const respondTo = (bookingId: string, status: "accepted" | "declined") =>
    respond.mutate(
      { bookingId, status },
      {
        onSuccess: () =>
          toast.success(
            status === "accepted"
              ? "Đã đồng ý tham gia buổi chụp"
              : "Đã từ chối lời mời"
          ),
        onError: () => toast.error("Không thể phản hồi, vui lòng thử lại"),
      }
    );

  return (
    <section className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Users className="size-4 text-muted-foreground" />
        Lời mời liên kết
      </h2>
      <div className="space-y-3">
        {pending.map((b) => {
          const entry = myEntry(b)!;
          const amount = Math.round(
            (photographerPayout(b.price) * entry.sharePct) / 100
          );
          return (
            <div
              key={b.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-11 shrink-0">
                  <AvatarFallback>{initialsOf(b.photographerName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {b.photographerName} mời bạn cùng chụp
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.style} · {formatDate(b.date)} · {b.location}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">
                  Tỷ lệ của bạn:{" "}
                  <span className="font-semibold">{entry.sharePct}%</span> · nhận{" "}
                  <span className="font-semibold">{formatPrice(amount)}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={respond.isPending}
                    onClick={() => respondTo(b.id, "declined")}
                  >
                    <X className="size-4" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={respond.isPending}
                    onClick={() => respondTo(b.id, "accepted")}
                  >
                    {respond.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    <Check className="size-4" />
                    Đồng ý
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
