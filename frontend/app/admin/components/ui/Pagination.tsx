'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  showInfo = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-[var(--admin-border)]">
      {showInfo && totalItems !== undefined && (
        <div className="text-sm text-[var(--admin-text-muted)]">
          Showing{' '}
          <span className="font-medium text-[var(--admin-text-secondary)]">{startItem}</span> to{' '}
          <span className="font-medium text-[var(--admin-text-secondary)]">{endItem}</span> of{' '}
          <span className="font-medium text-[var(--admin-text-secondary)]">{totalItems}</span>{' '}
          results
        </div>
      )}

      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card-hover)]
            disabled:hover:bg-transparent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, idx) =>
          typeof page === 'string' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-1 text-sm text-[var(--admin-text-muted)]"
            >
              {page}
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[32px] px-2 py-1.5 text-sm rounded-lg transition-colors
                ${
                  currentPage === page
                    ? 'bg-[var(--admin-primary)] text-white'
                    : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card-hover)]'
                }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card-hover)]
            disabled:hover:bg-transparent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
