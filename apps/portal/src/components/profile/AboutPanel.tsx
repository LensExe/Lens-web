import { BadgeCheck, Briefcase, CalendarDays, MapPin, Package } from "lucide-react";
import { formatPrice } from "@lens/ui";
import { packageSummary, resolvePackages } from "@/lib/booking";
import { experienceLabel } from "@/lib/photographer-filters";
import { badgeById } from "@/lib/achievements";
import type { Photographer } from "@/types";

const formatDayMonth = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/** About tab: bio, specialties and packages; availability + facts on the side. */
export function AboutPanel({
  photographer,
  badges,
}: {
  photographer: Photographer;
  badges: string[];
}) {
  const packages = resolvePackages(photographer);
  const upcoming = photographer.availableDates.slice(0, 8);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="min-w-0 space-y-8">
        <section>
          <h2 className="text-lg font-semibold">Giới thiệu</h2>
          <p className="mt-2 max-w-3xl leading-relaxed text-foreground/80">{photographer.bio}</p>
        </section>

        {badges.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold">Điểm mạnh</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((id) => {
                const badge = badgeById(id);
                if (!badge) return null;
                return (
                  <span
                    key={id}
                    title={badge.description}
                    className="flex items-center gap-1.5 rounded-full bg-lagoon/10 px-3 py-1.5 text-sm font-medium text-lagoon dark:bg-lagoon/15"
                  >
                    <BadgeCheck className="size-4" />
                    {badge.name}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Package className="size-5 text-muted-foreground" />
            Gói dịch vụ
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-medium">{pkg.name}</p>
                {pkg.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{pkg.description}</p>
                )}
                <p className="mt-2 text-xs font-medium text-foreground/80">{packageSummary(pkg)}</p>
                <p className="mt-3 text-lg font-semibold">{formatPrice(pkg.price)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-muted-foreground" />
            Lịch trống sắp tới
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Hiện chưa có lịch trống.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {upcoming.map((d) => (
                <span
                  key={d}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs tabular-nums text-foreground/80"
                >
                  {formatDayMonth(d)}
                </span>
              ))}
            </div>
          )}
        </div>

        <dl className="space-y-3 rounded-3xl border border-border bg-card p-5 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Khu vực:</dt>
            <dd className="font-medium">{photographer.city}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            <dt className="sr-only">Kinh nghiệm</dt>
            <dd className="font-medium">{experienceLabel(photographer.experienceYears)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
