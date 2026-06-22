import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

export function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
