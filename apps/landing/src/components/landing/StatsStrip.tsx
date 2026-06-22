import CountUp from "@lens/ui/components/effects/CountUp";

type Stat = {
  to: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  label: string;
};

const stats: Stat[] = [
  { to: 1200, separator: ".", suffix: "+", label: "Nhiếp ảnh gia" },
  { to: 28000, separator: ".", suffix: "+", label: "Buổi chụp hoàn thành" },
  { to: 63, label: "Tỉnh thành phủ sóng" },
  { to: 4.9, suffix: "/5", label: "Đánh giá trung bình" },
];

export function StatsStrip() {
  return (
    <section className="px-5 py-12">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 rounded-[36px] border border-border bg-card px-6 py-10 md:grid-cols-4 md:px-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold tracking-tight md:text-4xl">
              {stat.prefix}
              <CountUp
                to={stat.to}
                separator={stat.separator}
                duration={1.6}
                className="tabular-nums"
              />
              {stat.suffix}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
