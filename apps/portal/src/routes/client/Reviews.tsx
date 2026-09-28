import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  HeartHandshake,
  ImageIcon,
  MapPin,
  PenLine,
  Star,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  PageContainer,
  PageHeader,
  Skeleton,
  StatusTabs,
  cn,
  toast,
} from "@lens/ui";
import { useMyBookings } from "@/queries/useBookings";
import type { Booking } from "@/types";

type ReviewTab = "pending" | "completed";

type ReviewTarget = {
  key: string;
  booking: Booking;
  person: {
    id: string;
    name: string;
    avatar?: string;
    roleLabel: string;
  };
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("");

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return day + "/" + month + "/" + year;
};

const REVIEW_TABS: { value: ReviewTab; label: string }[] = [
  { value: "pending", label: "Chờ đánh giá" },
  { value: "completed", label: "Đã đánh giá" },
];

function ReviewRow({ target }: { target: ReviewTarget }) {
  const { booking, person } = target;

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card px-3.5 py-3.5 shadow-xs transition-all hover:-translate-y-px hover:shadow-sm sm:flex-row sm:items-center sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-10 shrink-0 rounded-xl border border-border">
          {person.avatar && <AvatarImage src={person.avatar} alt={person.name} />}
          <AvatarFallback className="rounded-xl bg-muted text-[10px] font-semibold">
            {initialsOf(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Link
              to={"/client/bookings/" + booking.id}
              className="truncate text-xs font-semibold hover:underline sm:text-sm"
            >
              {person.name}
            </Link>
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
              {person.roleLabel}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground sm:text-[11px]">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground/75">{booking.style}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-2.5 shrink-0 sm:size-3" />
              {formatDate(booking.date)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-2.5 shrink-0 sm:size-3" />
              <span className="max-w-[18rem] truncate">{booking.location}</span>
            </span>
          </div>
        </div>
      </div>

      <Button
        size="xs"
        className="h-8 w-full rounded-full bg-ember px-3.5 text-[10px] text-white shadow-sm transition-transform hover:-translate-y-px hover:bg-ember/90 sm:w-auto"
        onClick={() => toast("Viết đánh giá cho " + person.name + " — sắp ra mắt.")}
      >
        <PenLine className="size-3" />
        Viết đánh giá
      </Button>
    </div>
  );
}

function ReviewTips() {
  const tips = [
    {
      icon: Clock3,
      title: "Đúng giờ & Tác phong",
      description: "Có mặt đúng giờ, trao đổi rõ ràng để buổi chụp diễn ra suôn sẻ.",
      tone: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      icon: HeartHandshake,
      title: "Hướng dẫn & Tận tâm",
      description: "Nhận xét cách nhiếp ảnh gia hỗ trợ và phong cách làm việc.",
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      icon: ImageIcon,
      title: "Chất lượng & Sáng tạo ảnh",
      description: "Chia sẻ cảm nhận về chất lượng hình ảnh và kết quả bạn nhận được.",
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-ember/10 text-ember">
          <Star className="size-3.5" />
        </span>
        <div>
          <h2 className="text-xs font-semibold sm:text-sm">Tiêu chí đánh giá chất lượng tại Lens</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Đánh giá khách quan giúp Lens có những cộng tác viên đáng tin cậy.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {tips.map(({ icon: Icon, title, description, tone }) => (
          <div key={title} className="rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
            <span className={cn("flex size-7 items-center justify-center rounded-lg", tone)}>
              <Icon className="size-3" />
            </span>
            <p className="mt-2 text-[10px] font-semibold">{title}</p>
            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ClientReviews() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const [tab, setTab] = useState<ReviewTab>("pending");
  const reviewable = bookings.filter((booking) => booking.status === "released");

  // One review target per photographer. Group shoots expose a row for the lead
  // photographer and each accepted collaborator.
  const targets: ReviewTarget[] = reviewable.flatMap((booking) => {
    const people: ReviewTarget["person"][] = [
      {
        id: booking.photographerId,
        name: booking.photographerName,
        avatar: undefined,
        roleLabel: booking.collaborators?.length ? "Thợ chính" : "Nhiếp ảnh gia",
      },
      ...(booking.collaborators ?? [])
        .filter((collaborator) => collaborator.status === "accepted")
        .map((collaborator) => ({
          id: collaborator.photographerId,
          name: collaborator.photographerName,
          avatar: collaborator.photographerAvatar,
          roleLabel: "Thợ liên kết",
        })),
    ];

    return people.map((person) => ({
      key: booking.id + "-" + person.id,
      booking,
      person,
    }));
  });

  // Review submission is still a UI placeholder, so all completed shoots are
  // shown in the pending state until the review endpoint is available.
  const reviewedCount = 0;
  const visibleTargets = tab === "pending" ? targets : [];

  return (
    <PageContainer>
      <PageHeader
        className="mb-6"
        title={
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-ember/15 bg-ember/10 text-ember">
              <Star className="size-4 fill-current/10" />
            </span>
            <span>Đánh giá của tôi</span>
          </span>
        }
        description={
          <>
            Chia sẻ trải nghiệm sau những buổi chụp đã hoàn thành để giúp cộng đồng nhiếp ảnh và
            <br className="hidden sm:block" /> những người dùng khác tìm được lựa chọn phù hợp.
          </>
        }
        actions={
          !isLoading && targets.length > 0 ? (
            <span className="w-fit shrink-0 rounded-full border border-ember/15 bg-ember/10 px-3 py-1.5 text-[10px] font-medium text-ember">
              {targets.length} mục chờ đánh giá
            </span>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-[1180px]">
        <StatusTabs<ReviewTab>
          tabs={REVIEW_TABS.map(({ value, label }) => ({
            value,
            label,
            count: value === "pending" ? targets.length : reviewedCount,
          }))}
          value={tab}
          onChange={setTab}
          className="mb-5"
        />

        <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-amber-900 shadow-xs dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex items-start gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
              <Gift className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold">Nhận quà tri ân sau mỗi lượt đánh giá</p>
              <p className="mt-0.5 text-[10px] leading-4 text-amber-800/75 dark:text-amber-100/75">
                Tặng ngay voucher 10% cho mỗi đánh giá chất lượng gửi đến Lens.
              </p>
            </div>
          </div>
          <span className="ml-10 inline-flex w-fit items-center gap-1 rounded-full bg-white/65 px-2.5 py-1 text-[9px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200 sm:ml-0">
            <CheckCircle2 className="size-3" />
            Cảm ơn bạn đã đồng hành
          </span>
        </section>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-[4.75rem] rounded-2xl" />
            ))}
          </div>
        ) : visibleTargets.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center shadow-xs">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Star className="size-4" />
            </span>
            <p className="mt-3 text-sm font-semibold">
              {tab === "completed" ? "Bạn chưa có đánh giá đã gửi" : "Chưa có buổi chụp nào để đánh giá"}
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {tab === "completed"
                ? "Những đánh giá bạn gửi sẽ được lưu lại tại đây."
                : "Sau khi hoàn thành một buổi chụp, bạn có thể viết đánh giá cho nhiếp ảnh gia."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTargets.map((target) => (
              <ReviewRow key={target.key} target={target} />
            ))}
          </div>
        )}

        <div className="mt-5">
          <ReviewTips />
        </div>
      </div>
    </PageContainer>
  );
}
