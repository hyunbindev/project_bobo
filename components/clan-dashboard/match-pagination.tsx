import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function MatchPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination className="mx-0 w-auto justify-start sm:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={currentPage === 1}
            className={
              currentPage === 1 ? "pointer-events-none opacity-40" : ""
            }
            href={`?page=${Math.max(currentPage - 1, 1)}`}
            text="이전"
          />
        </PaginationItem>

        {pages.map((page, index) =>
          page === null ? (
            <PaginationItem key={`ellipsis:${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                className={
                  page === currentPage
                    ? "rounded-sm border-primary text-primary"
                    : "rounded-sm"
                }
                href={`?page=${page}`}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            aria-disabled={currentPage === totalPages}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-40" : ""
            }
            href={`?page=${Math.min(currentPage + 1, totalPages)}`}
            text="다음"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sortedPages = [...pageSet]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const pages: Array<number | null> = [];

  for (const page of sortedPages) {
    const previousPage = pages.at(-1);

    if (typeof previousPage === "number" && page - previousPage > 1) {
      pages.push(null);
    }

    pages.push(page);
  }

  return pages;
}
