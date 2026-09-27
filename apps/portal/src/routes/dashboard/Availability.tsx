import { useState } from "react";
import { CalendarCheck, CalendarX, Users } from "lucide-react";
import { PageContainer, PageHeader, SaveBar, Skeleton, StatCard, toast } from "@lens/ui";
import { WeeklyHoursEditor } from "@/components/schedule/WeeklyHoursEditor";
import { BusyDaysEditor } from "@/components/schedule/BusyDaysEditor";
import { UnsavedChangesGuard } from "@/components/UnsavedChangesGuard";
import { useIncomingBookings, useMySchedule, useSaveMySchedule } from "@/queries/useDashboard";
import {
  BOOKING_WINDOW_DAYS,
  addDaysISO,
  countSlots,
  dayAvailability,
  occupiesSlot,
  todayISO,
} from "@/lib/schedule";
import type { Booking, WorkSchedule } from "@/types";

// Edits stay in a local draft until "Lưu lịch" — one request per save, no
// request per click.
function ScheduleEditor({ saved, bookings }: { saved: WorkSchedule; bookings: Booking[] }) {
  const save = useSaveMySchedule();
  const [draft, setDraft] = useState<WorkSchedule | null>(null);
  const schedule = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  // Slots clients already hold, by date.
  const now = new Date().toISOString();
  const bookingsByDate: Record<string, Booking[]> = {};
  for (const b of bookings) {
    if (occupiesSlot(b, now)) (bookingsByDate[b.date] ??= []).push(b);
  }

  const from = addDaysISO(todayISO(), 1);
  const days = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
    const date = addDaysISO(from, i);
    return dayAvailability(schedule, date, (bookingsByDate[date] ?? []).flatMap((b) => b.timeSlot ?? []));
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
    <PageContainer>
      <PageHeader
        title="Lịch làm việc"
        description="Đặt giờ làm cố định hằng tuần, rồi đánh dấu những ngày hoặc khung bạn bận. Khách chỉ đặt được vào khung còn trống."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          value={total("free")}
          label="Khung còn trống"
          hint="Trong 5 tuần tới"
        />
        <StatCard
          icon={Users}
          value={total("booked")}
          label="Khung đã có khách"
          hint="Không thể đổi — liên hệ khách nếu cần"
        />
        <StatCard
          icon={CalendarX}
          value={total("busy")}
          label="Khung bạn đánh dấu bận"
          hint="Khách không thấy các khung này"
        />
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <WeeklyHoursEditor schedule={schedule} onChange={setDraft} />
        <BusyDaysEditor
          schedule={schedule}
          onChange={setDraft}
          days={days}
          bookingsByDate={bookingsByDate}
        />
        <SaveBar
          dirty={dirty}
          saving={save.isPending}
          onReset={() => setDraft(null)}
          resetLabel="Huỷ thay đổi"
          saveLabel="Lưu lịch"
        />
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
      <PageContainer>
        <Skeleton className="h-9 w-56" />
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 rounded-3xl" />
      </PageContainer>
    );
  }

  return <ScheduleEditor saved={saved} bookings={incoming.data ?? []} />;
}
