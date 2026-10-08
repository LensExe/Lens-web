import { Link } from "react-router-dom";
import { CalendarDays, CalendarPlus, Inbox, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button, Skeleton, cn } from "@lens/ui";
import { useMyBookings } from "@/queries/useBookings";
import { useIncomingBookings } from "@/queries/useDashboard";
import { bookingStatusMeta } from "@/lib/booking";
import { currentUser } from "@/lib/session";
import type { Conversation } from "@/types";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const ROLE = {
  client: { label: "Khách hàng", chip: "bg-muted text-foreground" },
  photographer: { label: "Nhiếp ảnh gia", chip: "bg-muted text-foreground" },
} as const;

/** Right-hand context for a thread: who this is + the bookings between you two. */
export function ConversationInfo({ conversation }: { conversation: Conversation }) {
  const isPhotographer = currentUser.role === "photographer";
  const otherIsPhotographer = conversation.participantRole === "photographer";
  // Bookings between the two of us, read from the viewer's side.
  const made = useMyBookings();
  const received = useIncomingBookings();
  const source = isPhotographer ? received : made;
  const shared = (source.data ?? []).filter((b) =>
    isPhotographer
      ? b.clientId === conversation.participantId
      : b.photographerId === conversation.participantId,
  );
  const detailBase = isPhotographer ? "/dashboard/bookings" : "/client/bookings";

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center border-b border-border px-5 py-6 text-center">
          <Avatar className="size-16">
            <AvatarImage src={conversation.participantAvatar} alt={conversation.participantName} />
            <AvatarFallback>{initialsOf(conversation.participantName)}</AvatarFallback>
          </Avatar>
          <p className="mt-3 font-semibold">{conversation.participantName}</p>
          <span
            className={cn(
              "mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              ROLE[conversation.participantRole].chip,
            )}
          >
            {ROLE[conversation.participantRole].label}
          </span>
          {otherIsPhotographer && (
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <Link to={`/photographers/${conversation.participantId}`}>
                <UserRound className="size-4" />
                Xem hồ sơ
              </Link>
            </Button>
          )}
        </div>

        <div className="p-5">
          <p className="text-sm font-semibold">
            Lịch đặt giữa hai bạn
            {shared.length > 0 && (
              <span className="font-normal text-muted-foreground"> ({shared.length})</span>
            )}
          </p>
          {source.isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : shared.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Chưa có lịch đặt nào giữa hai bạn.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {shared.map((b) => {
                const status = bookingStatusMeta(b);
                return (
                  <Link
                    key={b.id}
                    to={`${detailBase}/${b.id}`}
                    className="focus-ring flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <CalendarDays className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{b.style}</p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(b.date)}
                        {b.timeSlot ? ` · ${b.timeSlot}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Next step with this person */}
      {!isPhotographer && otherIsPhotographer ? (
        <div className="border-t border-border p-4">
          <Button asChild className="w-full rounded-full bg-ember text-white hover:bg-ember/90">
            <Link to={`/photographers/${conversation.participantId}/book`}>
              <CalendarPlus className="size-4" />
              Đặt lịch mới
            </Link>
          </Button>
        </div>
      ) : isPhotographer && !otherIsPhotographer ? (
        <div className="border-t border-border p-4">
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/dashboard/bookings">
              <Inbox className="size-4" />
              Xem yêu cầu đặt lịch
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
