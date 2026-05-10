import tableStyles from '../admin/adminTable.module.css'

const MAX_VISIBLE_PAGES = 5

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

function getPageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }
  const half = Math.floor(MAX_VISIBLE_PAGES / 2)
  let start = Math.max(0, page - half)
  const end = Math.min(totalPages, start + MAX_VISIBLE_PAGES)
  if (end - start < MAX_VISIBLE_PAGES) {
    start = Math.max(0, end - MAX_VISIBLE_PAGES)
  }
  return Array.from({ length: end - start }, (_, i) => start + i)
}

export function Pagination({ page, totalPages, onPageChange, disabled = false }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={tableStyles.paginationBar}>
      <button
        type="button"
        className={tableStyles.pageButton}
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page === 0}
      >
        이전
      </button>
      {getPageNumbers(page, totalPages).map((pageNum) => (
        <button
          key={pageNum}
          type="button"
          className={
            pageNum === page
              ? tableStyles.pageButtonActive
              : tableStyles.pageButton
          }
          onClick={() => onPageChange(pageNum)}
          disabled={disabled}
        >
          {pageNum + 1}
        </button>
      ))}
      <button
        type="button"
        className={tableStyles.pageButton}
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages - 1}
      >
        다음
      </button>
    </div>
  )
}
