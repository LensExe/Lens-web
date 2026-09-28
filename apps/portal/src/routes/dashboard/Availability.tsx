import { useState, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  CalendarRange,
  CalendarX,
  Lightbulb,
  LockKeyhole,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader, SaveBar, Skeleton, cn, toast } from "@lens/ui";
import { WeekScheduleEditor } from "@/components/schedule/WeekScheduleEditor";
import { UnsavedChangesGuard } from "@/components/UnsavedChangesGuard";
import { useIncomingBookings, useMySchedule, useSaveMySchedule } from "@/queries/useDashboard";
import {
  BOOKING_WINDOW_DAYS,
  addDaysISO,
  bookingSlots,
  countSlots,
  dayAvailability,
  occupiesSlot,
  todayISO,
} from "@/lib/schedule";
import type { Booking, WorkSchedule } from "@/types";

function AvailabilityStat({
  icon: Icon,
  value,
  label,
  hint,
  tone = "neutral",
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  hint: string;
  tone?: "neutral" | "ember" | "lagoon" | "success";
}) {
  const iconTone = {
    neutral: "bg-muted text-foreground",
    ember: "bg-ember/10 text-ember",
    lagoon: "bg-lagoon/10 text-lagoon",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  }[tone];

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconTone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      </div>
      <div className="mt-4 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground sm:text-base">{label}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ScheduleTips({ busyBlocks, bookedSessions }: { busyBlocks: number; bookedSessions: number }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
            <CalendarX className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold sm:text-base">Quản lý ngày nghỉ &amp; giờ bận định kỳ</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Khoanh những khoảng thời gian bạn không thể nhận lịch. Khách sẽ chỉ thấy các khung giờ còn trống.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
            {busyBlocks} khoảng bận đã cài
          </span>
          <span className="rounded-full bg-lagoon/10 px-3 py-1.5 text-lagoon">
            {bookedSessions} buổi đã chốt trong 7 ngày tới
          </span>
        </div>
        <p className="mt-4 border-t border-border/70 pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Chọn một ngày trên lịch để đánh dấu bận cả ngày hoặc thêm nhiều khoảng bận trong cùng ngày.
        </p>
      </div>

      <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <Lightbulb className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold sm:text-base">Mẹo tối ưu lịch cho thợ ảnh</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Giữ một khoảng đệm giữa các buổi chụp để di chuyển và chuẩn bị thiết bị.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <li className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-ember" />Cập nhật lịch ngay khi có việc riêng.</li>
          <li className="flex gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-ember" />Mở thêm khung giờ buổi tối khi muốn nhận nhiều booking hơn.</li>
        </ul>
      </aside>
    </section>
  );
}

// Edits stay in a local draft until "Lưu lịch" — one request per save, no
// request per click.
function ScheduleEditor({ saved, bookings }: { saved: WorkSchedule; bookings: Booking[] }) {
  const save = useSaveMySchedule();
  const [draft, setDraft] = useState<WorkSchedule | null>(null);
  const schedule = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  // Slots clients already hold, by date.
  const now = new Date().toISOString();
  const today = todayISO();
  const bookingsByDate: Record<string, Booking[]> = {};
  for (const b of bookings) {
    const isPastBooking = b.date < today && b.status !== "cancelled" && b.status !== "awaiting_deposit";
    if (isPastBooking || occupiesSlot(b, now)) (bookingsByDate[b.date] ??= []).push(b);
  }

  const from = addDaysISO(todayISO(), 1);
  const days = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
    const date = addDaysISO(from, i);
    return dayAvailability(schedule, date, (bookingsByDate[date] ?? []).flatMap((b) => bookingSlots(b)));
  });
  const firstWeek = days.slice(0, 7);
  const totalInWeek = (status: "free" | "busy" | "booked") =>
    firstWeek.reduce((n, d) => n + countSlots(d, status), 0);
  const weeklyHours = schedule.weekly.reduce(
    (hours, ranges) =>
      hours +
      ranges.reduce((dayHours, range) => {
        const [startHour, startMinute] = range.start.split(":").map(Number);
        const [endHour, endMinute] = range.end.split(":").map(Number);
        return dayHours + (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
      }, 0),
    0,
  );
  const bookedSessions = bookings.filter(
    (booking) => booking.date >= from && booking.date <= addDaysISO(from, 6) && booking.status !== "cancelled",
  ).length;
  const busyBlocks = schedule.busy.filter(
    (block) => block.date >= from && block.date <= addDaysISO(from, 6),
  ).length;
  const openSlots = totalInWeek("free") + totalInWeek("booked");
  const fillRate = openSlots ? Math.round((totalInWeek("booked") / openSlots) * 100) : 0;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(schedule, {
      onSuccess: () => {
        setDraft(null);
        toast.success("Đã lưu lịch làm việc");
      },
      onError: () => toast.error("Lưu lịch thất bại, vui lòng thử lại"),
    });
  };

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
      <div className="mb-5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:p-5">
        <PageHeader
          className="mb-0 gap-4"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
                <CalendarRange className="size-[18px]" />
              </span>
              <span>Lịch làm việc</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Quản lý khung giờ nhận lịch, các buổi chụp đã chốt và khoảng thời gian bạn không thể nhận khách.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              Mở lịch tự động · 07:00–24:00
            </span>
          }
        />
      </div>

      <div className="mb-5 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AvailabilityStat
          icon={CalendarCheck}
          value={`${weeklyHours.toLocaleString("vi-VN")} giờ`}
          label="Tổng giờ tuần này"
          hint="Khung sẵn sàng để nhận booking"
        />
        <AvailabilityStat
          icon={Users}
          value={bookedSessions}
          label="Buổi chụp đã chốt"
          hint="Trong 7 ngày sắp tới"
          tone="ember"
        />
        <AvailabilityStat
          icon={LockKeyhole}
          value={busyBlocks}
          label="Khung giờ đã khóa"
          hint="Khoảng bận bạn đã cài"
          tone="lagoon"
        />
        <AvailabilityStat
          icon={TrendingUp}
          value={`${fillRate}%`}
          label="Tỉ lệ lấp đầy"
          hint="Dựa trên lịch 7 ngày tới"
          tone="success"
        />
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full space-y-5">
        <WeekScheduleEditor
          schedule={schedule}
          bookingsByDate={bookingsByDate}
          onChange={setDraft}
        />
        {(dirty || save.isPending) && (
          <SaveBar
            dirty={dirty}
            saving={save.isPending}
            onReset={() => setDraft(null)}
            resetLabel="Huỷ thay đổi"
            saveLabel="Lưu lịch"
          />
        )}
      </form>

      <UnsavedChangesGuard
        when={dirty}
        message="Các thay đổi lịch làm việc chưa được lưu sẽ bị bỏ. Khách vẫn thấy lịch cũ."
      />
      <div className="mt-5">
        <ScheduleTips busyBlocks={busyBlocks} bookedSessions={bookedSessions} />
      </div>
    </PageContainer>
  );
}

export function DashboardAvailability() {
  const { data: saved, isLoading } = useMySchedule();
  const incoming = useIncomingBookings();

  if (isLoading || !saved || incoming.isLoading) {
    return (
      <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
        <Skeleton className="h-36 rounded-2xl" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-[34rem] rounded-3xl" />
      </PageContainer>
    );
  }

  return <ScheduleEditor saved={saved} bookings={incoming.data ?? []} />;
}
