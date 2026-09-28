import { Star } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Skeleton,
  toast,
  PageContainer,
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
  const reviewable = bookings.filter((b) => b.status === "released");

  // One review target PER photographer — group shoots get a row for the lead and
  // each accepted collaborator (không gộp chung một review).
  const targets = reviewable.flatMap((b) => {
    const people = [
      {
        id: b.photographerId,
        name: b.photographerName,
        avatar: undefined as string | undefined,
        roleLabel: b.collaborators?.length ? "Thợ chính" : "Nhiếp ảnh gia",
      },
      ...(b.collaborators ?? [])
        .filter((c) => c.status === "accepted")
        .map((c) => ({
          id: c.photographerId,
          name: c.photographerName,
          avatar: c.photographerAvatar,
          roleLabel: "Thợ liên kết",
        })),
    ];
    return people.map((person) => ({ key: `${b.id}-${person.id}`, booking: b, person }));
  });

  return (
    <PageContainer>
      <header className="mx-auto mb-6 w-full max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <Star className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Đánh giá của tôi
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Chia sẻ trải nghiệm sau những buổi chụp đã hoàn thành.
              </p>
            </div>
          </div>

          {!isLoading && targets.length > 0 && (
            <span className="w-fit shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {targets.length} mục chờ đánh giá
            </span>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="mx-auto w-full max-w-4xl space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl sm:h-24" />
          ))}
        </div>
      ) : targets.length === 0 ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-12 text-center sm:px-10">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Star className="size-6" />
          </span>
          <p className="font-medium">Chưa có buổi chụp nào để đánh giá</p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sau khi hoàn thành một buổi chụp, bạn có thể viết đánh giá cho nhiếp
            ảnh gia tại đây.
          </p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-4xl space-y-3">
          {targets.map(({ key, booking, person }) => (
            <div
              key={key}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:gap-4">
                <Avatar className="size-11 shrink-0 sm:size-12">
                  {person.avatar && <AvatarImage src={person.avatar} alt={person.name} />}
                  <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="min-w-0 truncate font-semibold">{person.name}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {person.roleLabel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {booking.style} · {formatDate(booking.date)}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full rounded-full sm:w-auto sm:shrink-0"
                onClick={() => toast(`Viết đánh giá cho ${person.name} — sắp ra mắt.`)}
              >
                <Star className="size-4" />
                Viết đánh giá
              </Button>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
