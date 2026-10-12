import { ArrowLeft, ArrowRight } from 'react-bootstrap-icons'

interface PaginationControlsProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

const PaginationControls = ({
  page,
  pageCount,
  onPageChange,
}: PaginationControlsProps) => {
  if (pageCount <= 1) return null

  const visiblePages = new Set<number>()
  if (pageCount <= 5) {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      visiblePages.add(pageNumber)
    }
  } else {
    const windowStart =
      page <= 3 ? 1 : page >= pageCount - 2 ? pageCount - 2 : page - 1
    for (
      let pageNumber = windowStart;
      pageNumber < windowStart + 3;
      pageNumber += 1
    ) {
      visiblePages.add(pageNumber)
    }
    visiblePages.add(1)
    visiblePages.add(pageCount)
  }

  const pageItems: Array<number | 'ellipsis'> = []
  let previousPage = 0
  for (const pageNumber of [...visiblePages].sort((a, b) => a - b)) {
    if (pageNumber - previousPage > 1) pageItems.push('ellipsis')
    pageItems.push(pageNumber)
    previousPage = pageNumber
  }

  return (
    <div className="d-flex justify-content-end align-items-center gap-2 mt-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary text-body border-secondary"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ArrowLeft size={14} />
      </button>

      {pageItems.map((pageItem, index) =>
        pageItem === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-muted"
            aria-label="More pages"
          >
            …
          </span>
        ) : (
          <button
            key={pageItem}
            type="button"
            className={`btn btn-sm ${
              pageItem === page
                ? 'btn-secondary text-white'
                : 'btn-outline-secondary text-body border-secondary'
            }`}
            onClick={() => onPageChange(pageItem)}
          >
            {pageItem}
          </button>
        ),
      )}

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary text-body border-secondary"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label="Next page"
      >
        <ArrowRight size={14} />
      </button>
    </div>
  )
}

export default PaginationControls
