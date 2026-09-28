import { cn } from "../../lib/utils";

export interface StatusTab<V extends string> {
  value: V;
  label: string;
  count?: number;
}

/**
 * Underlined status tabs (with counts) that filter a list inside one page —
 * e.g. "Tất cả · Chờ duyệt · Hoàn thành". Navigation between pages stays in
 * the sidebar; these only switch the view of the current list.
 */
export function StatusTabs<V extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: StatusTab<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      data-slot="status-tabs"
      className={cn(
        "-mx-5 flex gap-1 overflow-x-auto border-b border-border px-5 [scrollbar-width:none] md:mx-0 md:px-0",
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            data-selected={selected ? "true" : "false"}
            onClick={() => onChange(tab.value)}
            className={cn(
              "focus-ring relative flex shrink-0 items-center gap-2 rounded-t-lg px-3 pb-3 pt-2 text-sm transition-colors",
              selected
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-xs font-medium tabular-nums",
                  selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
            {selected && (
              <span data-slot="status-tab-indicator" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
}
