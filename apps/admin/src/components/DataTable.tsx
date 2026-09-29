import type { ReactNode } from "react";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
  StatusTabs,
  cn,
  type StatusTab,
} from "@lens/ui";
import type { Table } from "@tanstack/react-table";

interface DataTableProps<TData extends object, V extends string> {
  table: Table<TData>;
  recordCount: number;
  isLoading?: boolean;
  /** Optional heading content rendered above the tabs and toolbar. */
  header?: ReactNode;
  /** Status tabs shown in the card header (left). */
  tabs?: { items: StatusTab<V>[]; value: V; onChange: (value: V) => void };
  /** Search / filters in the card header (right). */
  toolbar?: ReactNode;
  toolbarClassName?: string;
  /** Place the toolbar on its own row below the tabs (useful for many tabs). */
  toolbarBelow?: boolean;
  /** Optional custom footer content in place of the default count/pagination. */
  footer?: ReactNode;
  /** Shown inside the card when there are no rows. */
  empty?: ReactNode;
  /** Opens a row's detail; buttons inside cells must stopPropagation. */
  onRowClick?: (row: TData) => void;
  pageSizes?: number[];
  className?: string;
}

/**
 * The console's one table: a card holding (optional) tabs + toolbar, a tinted
 * header band, roomy rows, and a footer — pagination when there's more than
 * one page, otherwise just the result count. Loading skeleton rows and the
 * empty state render inside the same card, so a table never jumps between
 * shapes.
 */
export function DataTable<TData extends object, V extends string = string>({
  table,
  recordCount,
  isLoading,
  header,
  tabs,
  toolbar,
  toolbarClassName,
  toolbarBelow = false,
  footer,
  empty = "Không có dữ liệu",
  onRowClick,
  pageSizes = [10, 25, 50],
  className,
}: DataTableProps<TData, V>) {
  // This wrapper's props (the table instance + recordCount) are referentially
  // stable across sort/pagination, so the React Compiler would memoize it and
  // freeze the grid. Opt out — TanStack mutates the table in place.
  "use no memo";
  return (
    <section className={cn("overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm", className)}>
      {header && <div className="px-5 pt-5 sm:px-6 sm:pt-6">{header}</div>}
      {(tabs || toolbar) && (
        <div
          className={cn(
            "flex flex-col gap-3 border-b border-border/70 bg-muted/[0.08] px-5 pt-3",
            toolbarBelow ? "md:items-stretch" : "md:flex-row md:items-end md:justify-between"
          )}
        >
          {tabs ? (
            <StatusTabs
              className="mx-0 border-b-0 px-0 md:px-0"
              tabs={tabs.items}
              value={tabs.value}
              onChange={tabs.onChange}
            />
          ) : (
            <span />
          )}
          {toolbar && (
            <div className={cn(toolbarBelow ? "w-full pb-3" : "pb-3 md:w-72", toolbarClassName)}>
              {toolbar}
            </div>
          )}
        </div>
      )}

      <DataGrid
        table={table}
        recordCount={recordCount}
        isLoading={isLoading}
        loadingMode="skeleton"
        emptyMessage={empty}
        onRowClick={onRowClick}
        tableLayout={{ headerBackground: false, rowBorder: true, width: "auto" }}
        tableClassNames={{
          headerRow:
            "bg-muted/35 [&>th]:h-11 [&>th]:text-[13px] [&>th]:font-medium [&>th]:text-muted-foreground",
          bodyRow: cn("transition-colors hover:bg-muted/40 [&>td]:py-3", onRowClick && "group"),
          edgeCell: "first:ps-5 last:pe-5",
        }}
      >
        <DataGridContainer border={false} className="overflow-x-auto">
          <DataGridTable />
        </DataGridContainer>
        {!isLoading && recordCount > 0 && (
          <div className="border-t border-border/70 bg-muted/[0.06] px-5 py-3">
            {footer ?? (recordCount > Math.min(...pageSizes) ? (
              <DataGridPagination
                sizes={pageSizes}
                info="Hiển thị {from}–{to} trên {count}"
                rowsPerPageLabel="Số dòng mỗi trang"
                previousPageLabel="Trang trước"
                nextPageLabel="Trang sau"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Hiển thị {recordCount} kết quả</p>
            ))}
          </div>
        )}
      </DataGrid>
    </section>
  );
}
