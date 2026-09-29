import { type MouseEvent, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton as BoneSkeleton } from "boneyard-js/react";
import { ArrowDownUp, ChevronRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
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
import { StylePicker } from "@/components/photographers/StylePicker";
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
  const toggleStyle = (style: Filters["styles"][number]) => {
    const styles = filters.styles.includes(style)
      ? filters.styles.filter((s) => s !== style)
      : [...filters.styles, style];
    update({ styles });
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
        exp: "",
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
    <div ref={scopeRef} className="portal-frame-container pb-12 pt-6 sm:pb-16 sm:pt-10">
      {/* Editorial hero */}
      <section
        data-reveal
        className="relative isolate overflow-hidden rounded-[1.75rem] bg-foreground px-5 py-6 text-background shadow-[0_20px_48px_-30px_rgba(0,0,0,0.65)] sm:px-8 sm:py-8 lg:px-10 lg:py-9"
      >
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 size-64 rounded-full bg-ember/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 size-72 rounded-full bg-white/[0.06] blur-3xl" />

        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-end lg:gap-10">
          <header className="max-w-3xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-background/60">
              <Sparkles className="size-3.5 text-ember" />
              Lens photographer directory
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.25rem]">
              Tìm người kể chuyện
              <span className="block text-background/55">cho khung hình của bạn.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-background/70 sm:text-base">
              Chọn người kể câu chuyện của bạn qua từng khung hình. Lọc theo phong cách,
              ngân sách và ngày bạn cần.
            </p>
          </header>

          <aside className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-background">Bắt đầu thật đơn giản</p>
              <span className="rounded-full bg-ember/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ember">
                3 bước
              </span>
            </div>
            <ol className="mt-4 space-y-3">
              {["Chọn phong cách bạn yêu thích", "Xem hồ sơ & đánh giá", "Gửi yêu cầu đặt lịch"].map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm text-background/70">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-semibold text-background">
                    0{i + 1}
                  </span>
                  <span className="flex-1">{label}</span>
                  {i < 2 && <ChevronRight className="size-3.5 text-background/35" />}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      {/* Search and sort controls */}
      <section
        data-reveal
        className="relative z-10 -mt-5 rounded-[1.75rem] border border-border/80 bg-card p-3 shadow-[0_18px_40px_-24px_rgba(24,24,27,0.45)] sm:-mt-7 sm:p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <div className="group flex min-h-14 items-center gap-3 rounded-[1.25rem] border border-border/80 bg-background px-3.5 shadow-[0_8px_24px_-18px_rgba(24,24,27,0.55)] transition-all hover:border-border focus-within:border-ember/45 focus-within:bg-card focus-within:ring-4 focus-within:ring-ember/10 sm:px-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-focus-within:bg-ember/10 group-focus-within:text-ember">
                <Search className="size-4" />
              </span>
              <Input
                value={filters.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Tên, địa điểm hoặc phong cách..."
                className="h-12 min-w-0 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
                aria-label="Tìm kiếm nhiếp ảnh gia"
              />
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 flex-1 rounded-[1.25rem] border-border/80 bg-background px-3.5 shadow-sm transition-all hover:border-ember/35 hover:bg-ember/[0.03] lg:hidden sm:flex-none sm:px-4"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-ember/10 text-ember">
                    <SlidersHorizontal className="size-3.5" />
                  </span>
                  Bộ lọc
                  {activeCount > 0 && (
                    <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-ember text-[10px] font-semibold text-white">
                      {activeCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[90vw] max-w-md overflow-y-auto border-border/80 bg-card p-5 shadow-2xl sm:p-6"
              >
                <SheetTitle className="sr-only">Bộ lọc</SheetTitle>
                <FilterPanel filters={filters} onChange={update} onClear={clear} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
              <label className="mb-2 hidden px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:block">
                Sắp xếp theo
              </label>
              <Select value={filters.sort} onValueChange={(v) => update({ sort: v })}>
                <SelectTrigger
                  className="h-12 w-full rounded-[1.25rem] border-border/80 bg-background px-3.5 shadow-sm transition-all hover:border-border focus:ring-4 focus:ring-ember/10 sm:px-4"
                  aria-label="Sắp xếp"
                >
                  <ArrowDownUp className="size-3.5 text-muted-foreground" />
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
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-sm">
            <FilterPanel filters={filters} onChange={update} onClear={clear} />
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0">
          {/* Compact style quick-pick strip */}
          <div data-reveal className="rounded-2xl border border-border/80 bg-card p-3 shadow-sm sm:p-4 [&>section]:mb-0">
            <StylePicker selected={filters.styles} onToggle={toggleStyle} />

            <div className="mt-2 flex min-w-0 items-center border-t border-border/70 pt-2.5">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-ember" />
                {isLoading ? (
                  "Đang tải nhiếp ảnh gia..."
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{results.length}</span> nhiếp ảnh gia phù hợp
                  </>
                )}
              </p>
            </div>
          </div>

          {isError ? (
            <p className="rounded-[1.75rem] border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
              Không thể tải danh sách nhiếp ảnh gia. Vui lòng thử lại sau.
            </p>
          ) : isLoading ? (
            <div className="columns-1 [column-gap:0.75rem] sm:columns-2 lg:columns-3 xl:[column-gap:1rem]">
              {SKELETON_HEIGHTS.map((h, i) => (
                <div key={i} className="mb-3 break-inside-avoid">
                  <BoneSkeleton loading name="photographer-card" fallback={<PhotographerCardSkeleton coverHeight={h} />}>
                    {null}
                  </BoneSkeleton>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-card p-10 text-center shadow-sm">
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
              <div className="columns-1 [column-gap:0.75rem] sm:columns-2 lg:columns-3 xl:[column-gap:1rem]">
                {pageItems.map((photographer) => (
                  <div key={photographer.id} data-reveal className="mb-3 break-inside-avoid">
                    <PhotographerCard photographer={photographer} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-8">
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
