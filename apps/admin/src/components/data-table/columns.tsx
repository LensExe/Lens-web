import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";

// Column `meta` presets for DataTable — alignment lives with the column.

/** Numbers and money: right-aligned, tabular figures. */
export const NUM = {
  headerClassName: "text-right [&>div]:justify-end",
  cellClassName: "text-right tabular-nums",
};

/** Row actions: pinned to the right edge. */
export const ACTIONS = {
  headerClassName: "text-right",
  cellClassName: "text-right",
};

/** Trailing "›" for tables whose rows open a detail page. */
export function chevronColumn<TData>(): ColumnDef<TData> {
  return {
    id: "_open",
    header: () => <span className="sr-only">Mở</span>,
    enableSorting: false,
    cell: () => (
      <ChevronRight className="ms-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    ),
    meta: { headerClassName: "w-10", cellClassName: "w-10" },
  };
}
