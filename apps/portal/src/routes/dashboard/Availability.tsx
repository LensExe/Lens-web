import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarRange, CalendarX, Users } from "lucide-react";
import { PageContainer, PageHeader, SaveBar, Skeleton, toast } from "@lens/ui";
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
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  hint: string;
}) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
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
  const total = (status: "free" | "busy" | "booked") =>
    days.reduce((n, d) => n + countSlots(d, status), 0);

  const onSubmit = (e: React.FormEvent) => {
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
      <div className="mb-5 rounded-3xl border border-border/70 bg-gradient-to-br from-muted/55 via-card to-card p-4 shadow-sm sm:p-6">
        <PageHeader
          className="mb-0 gap-5"
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                <CalendarRange className="size-5" />
              </span>
              <span>Lịch làm việc</span>
            </span>
          }
          description={
            <span className="block max-w-3xl text-sm leading-relaxed">
              Bạn mặc định mở lịch từ 07:00 đến 24:00. Chỉ cần đánh dấu những ngày hoặc khoảng
              giờ bận, khách sẽ thấy phần thời gian còn trống.
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              Lịch đang mở mặc định
            </span>
          }
        />
      </div>

      <div className="mb-5 grid w-full gap-3 sm:grid-cols-3">
        <AvailabilityStat
          icon={CalendarCheck}
          value={total("free")}
          label="Khung còn trống"
          hint="Trong 5 tuần tới"
        />
        <AvailabilityStat
          icon={Users}
          value={total("booked")}
          label="Khung đã có khách"
          hint="Không thể đổi — liên hệ khách nếu cần"
        />
        <AvailabilityStat
          icon={CalendarX}
          value={total("busy")}
          label="Khung bạn đánh dấu bận"
          hint="Khách không thấy các khung này"
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
    </PageContainer>
  );
}

export function DashboardAvailability() {
  const { data: saved, isLoading } = useMySchedule();
  const incoming = useIncomingBookings();

  if (isLoading || !saved || incoming.isLoading) {
    return (
      <PageContainer className="max-w-[1480px] py-6 md:py-8 lg:py-10">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-5 h-[34rem] rounded-3xl" />
      </PageContainer>
    );
  }

  return <ScheduleEditor saved={saved} bookings={incoming.data ?? []} />;
}
