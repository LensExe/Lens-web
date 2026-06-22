import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@lens/ui";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

interface DataTableProps<TData extends object> {
  table: Table<TData>;
  recordCount: number;
  emptyMessage?: ReactNode;
}

// Thin wrapper around the ReUI Data Grid with Vietnamese pagination labels.
export function DataTable<TData extends object>({
  table,
  recordCount,
  emptyMessage = "Không có dữ liệu",
}: DataTableProps<TData>) {
  // This wrapper's props (the table instance + recordCount) are referentially
  // stable across sort/pagination, so the React Compiler would memoize it and
  // freeze the grid. Opt out — TanStack mutates the table in place.
  "use no memo";
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      emptyMessage={emptyMessage}
      tableLayout={{ headerBackground: true, rowBorder: true, width: "auto" }}
    >
      <div className="space-y-4">
        <DataGridContainer className="overflow-x-auto rounded-2xl">
          <DataGridTable />
        </DataGridContainer>
        <DataGridPagination
          sizes={[5, 10, 25, 50]}
          sizesLabel="Hiện"
          sizesDescription="dòng"
          info="{from}–{to} trên {count}"
          rowsPerPageLabel="Số dòng mỗi trang"
          previousPageLabel="Trang trước"
          nextPageLabel="Trang sau"
        />
      </div>
    </DataGrid>
  );
}
