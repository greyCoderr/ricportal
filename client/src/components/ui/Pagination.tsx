import { Button } from "./Button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) {
    return null;
  }
  return (
    <nav
      aria-label="Pages"
      className="flex items-center justify-end gap-3 pt-3"
    >
      <Button
        variant="secondary"
        size="sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        Previous
      </Button>
      <p className="text-13 text-text-secondary">
        Page {page} of {pages}
      </p>
      <Button
        variant="secondary"
        size="sm"
        aria-label="Next page"
        disabled={page >= pages}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        Next
      </Button>
    </nav>
  );
}
