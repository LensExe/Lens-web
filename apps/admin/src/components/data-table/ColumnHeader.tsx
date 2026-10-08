import type { Column } from "@tanstack/react-table";
import { DataGridColumnHeader, cn } from "@lens/ui";

/**
 * Column title in the console's table style. Sortable and plain headers look
 * the same (small, sentence case, muted); the sort arrow only shows on hover /
 * focus, or stays visible while the column is sorted. `align="right"` lines a
 * header up with right-aligned numbers.
 */
export function ColumnHeader<TData, TValue>({
  column,
  title,
  align,
}: {
  column: Column<TData, TValue>;
  title: string;
  align?: "right";
}) {
  // Receives the TanStack column, which mutates in place — keep it out of the
  // React Compiler's memoization (see DataTable).
  "use no memo";
  return (
    <DataGridColumnHeader
      column={column}
      title={title}
      className={cn(
        "text-[13px] font-medium leading-4 text-muted-foreground hover:bg-transparent hover:text-foreground disabled:opacity-100",
        column.getIsSorted()
          ? "text-foreground"
          : "[&_svg]:opacity-0 hover:[&_svg]:opacity-60 focus-visible:[&_svg]:opacity-60",
        align === "right" && "ms-0 -me-2"
      )}
    />
  );
}
