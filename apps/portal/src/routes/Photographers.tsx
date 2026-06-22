import { type MouseEvent, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton as BoneSkeleton } from "boneyard-js/react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Button,
  Input,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@lens/ui";
import { PhotographerCard } from "@/components/shared/PhotographerCard";
import { PhotographerCardSkeleton } from "@/components/shared/PhotographerCardSkeleton";
import { FilterPanel } from "@/components/photographers/FilterPanel";
import { usePhotographers } from "@/queries/usePhotographers";
import { useScrollReveal } from "@/lib/useScrollReveal";
import {
  PRICE_MAX,
  PRICE_MIN,
  SORT_OPTIONS,
  applyFilters,
  countActiveFilters,
  filtersToParams,
  parseFilters,
  type Filters,
} from "@/lib/photographer-filters";

const SKELETON_HEIGHTS = [320, 240, 380, 280, 260, 340];
const PAGE_SIZE = 9;

// Compact page list with ellipsis for many pages.
function getPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("ellipsis");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function Photographers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const { data, isLoading, isError } = usePhotographers();
  const scopeRef = useRef<HTMLDivElement>(null);

  const filters = parseFilters(searchParams);

  const update = (patch: Partial<Filters>) => {
    setSearchParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  };
  const clear = () =>
    setSearchParams(
      filtersToParams({
        ...filters,
        styles: [],
        city: "",
        priceMin: PRICE_MIN,
        priceMax: PRICE_MAX,
        date: "",
        rating: "",
      }),
      { replace: true }
    );

  const results = data ? applyFilters(data, filters) : [];
  const activeCount = countActiveFilters(filters);

  // Pagination (page lives in the URL alongside filters).
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(searchParams.get("page")) || 1), totalPages);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pageHref = (p: number) => {
    const sp = filtersToParams(filters);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  };
  const goToPage = (p: number) => (e: MouseEvent) => {
    e.preventDefault();
    if (p < 1 || p > totalPages || p === page) return;
    const sp = filtersToParams(filters);
    if (p > 1) sp.set("page", String(p));
    setSearchParams(sp);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reveal once after the first load — filtering/paging stays instant.
  useScrollReveal(scopeRef, [isLoading]);

  return (
    <div ref={scopeRef} className="mx-auto max-w-[1240px] px-5 py-10 md:py-14">
      {/* Editorial header */}
      <header data-reveal className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Tìm nhiếp ảnh gia của bạn
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Chọn người kể câu chuyện của bạn qua từng khung hình. Lọc theo phong
          cách, ngân sách và ngày bạn cần.
        </p>
      </header>

      {/* Toolbar: search + sort + mobile filter */}
      <div
        data-reveal
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 shadow-sm transition-colors focus-within:border-foreground/30">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Tìm theo tên, địa điểm, phong cách..."
            className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
            aria-label="Tìm kiếm nhiếp ảnh gia"
          />
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full lg:hidden">
                <SlidersHorizontal className="size-4" />
                Bộ lọc
                {activeCount > 0 && (
                  <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                    {activeCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-6">
              <SheetTitle className="sr-only">Bộ lọc</SheetTitle>
              <FilterPanel filters={filters} onChange={update} onClear={clear} />
            </SheetContent>
          </Sheet>

          <Select value={filters.sort} onValueChange={(v) => update({ sort: v })}>
            <SelectTrigger className="h-11! rounded-full shadow-sm" aria-label="Sắp xếp">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel filters={filters} onChange={update} onClear={clear} />
          </div>
        </aside>

        {/* Results */}
        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            {isLoading
              ? "Đang tải nhiếp ảnh gia..."
              : `${results.length} nhiếp ảnh gia phù hợp`}
          </p>

          {isError ? (
            <p className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-muted-foreground">
              Không thể tải danh sách nhiếp ảnh gia. Vui lòng thử lại sau.
            </p>
          ) : isLoading ? (
            <div className="columns-1 [column-gap:1.25rem] sm:columns-2 xl:columns-3">
              {SKELETON_HEIGHTS.map((h, i) => (
                <div key={i} className="mb-5 break-inside-avoid">
                  <BoneSkeleton loading name="photographer-card" fallback={<PhotographerCardSkeleton coverHeight={h} />}>
                    {null}
                  </BoneSkeleton>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="text-lg font-medium">Không tìm thấy nhiếp ảnh gia phù hợp</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Thử nới lỏng bộ lọc hoặc từ khoá tìm kiếm khác.
              </p>
              {(activeCount > 0 || filters.q) && (
                <Button variant="outline" className="mt-5 rounded-full" onClick={() => setSearchParams({}, { replace: true })}>
                  Xoá tất cả bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="columns-1 [column-gap:1.25rem] sm:columns-2 xl:columns-3">
                {pageItems.map((photographer) => (
                  <div key={photographer.id} data-reveal className="mb-5 break-inside-avoid">
                    <PhotographerCard photographer={photographer} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-10">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={pageHref(page - 1)}
                        onClick={goToPage(page - 1)}
                        aria-disabled={page === 1}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {getPageList(page, totalPages).map((p, i) => (
                      <PaginationItem key={i}>
                        {p === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href={pageHref(p)}
                            onClick={goToPage(p)}
                            isActive={p === page}
                          >
                            {p}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href={pageHref(page + 1)}
                        onClick={goToPage(page + 1)}
                        aria-disabled={page === totalPages}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
