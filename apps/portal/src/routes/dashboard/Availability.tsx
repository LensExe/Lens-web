import { CalendarCheck, X } from "lucide-react";
import { Calendar, Skeleton } from "@lens/ui";
import { useMyAvailability, useToggleAvailability } from "@/queries/useDashboard";

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDateVN = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

export function DashboardAvailability() {
  const { data: dates = [], isLoading } = useMyAvailability();
  const { mutate: toggle, isPending } = useToggleAvailability();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);

  // Only future free days are actionable; past ones are kept but not shown here.
  const upcoming = dates.filter((d) => d >= todayISO).sort();
  const selectedDates = upcoming.map(fromISODate);

  // mode="multiple" hands back the full new selection — diff it against the
  // current set to find the single date the click toggled.
  const handleSelect = (next: Date[] | undefined) => {
    const nextSet = new Set((next ?? []).map(toISODate));
    const currentSet = new Set(upcoming);
    const added = [...nextSet].find((d) => !currentSet.has(d));
    const removed = [...currentSet].find((d) => !nextSet.has(d));
    const changed = added ?? removed;
    if (changed) toggle(changed);
  };

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Lịch trống
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chọn những ngày bạn sẵn sàng nhận lịch chụp. Khách hàng sẽ chỉ đặt được
          vào các ngày này.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="rounded-2xl border border-border bg-card p-2">
          {isLoading ? (
            <Skeleton className="h-72 w-72 rounded-2xl" />
          ) : (
            <Calendar
              mode="multiple"
              selected={selectedDates}
              disabled={{ before: today }}
              onSelect={handleSelect}
            />
          )}
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarCheck className="size-5 text-muted-foreground" />
            Ngày rảnh sắp tới
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({upcoming.length})
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Bạn chưa chọn ngày trống nào. Hãy chọn trên lịch bên cạnh.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {upcoming.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={isPending}
                  onClick={() => toggle(d)}
                  className="focus-ring group flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1.5 pl-3 pr-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {formatDateVN(d)}
                  <span className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                    <X className="size-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
