import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface Column<T> {
  /** Stable key, also used as the sort key. */
  id: string
  header: string
  /** Cell content. */
  cell: (row: T) => ReactNode
  /** Sort value. Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  /** Tailwind width class, e.g. `w-32`. */
  width?: string
  /** Hide below the given breakpoint so narrow screens stay readable. */
  hideBelow?: 'sm' | 'md' | 'lg'
  /** Render numerals with tabular figures — use for codes, weights, money, dates. */
  numeric?: boolean
}

const HIDE_BELOW: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

/**
 * Dense, sortable operational table.
 *
 * Freight desks scan hundreds of rows, so this favours aligned columns and
 * compact rows over card layouts. It always scrolls inside its own container
 * so the page body never scrolls sideways.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  getRowHref,
  emptyState,
  caption,
  initialSort,
  className,
}: {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  /** Makes the whole row navigable. Keyboard users get a real link in the first cell. */
  getRowHref?: (row: T) => string
  emptyState?: ReactNode
  caption: string
  initialSort?: { columnId: string; direction: 'asc' | 'desc' }
  className?: string
}) {
  const navigate = useNavigate()
  const [sort, setSort] = useState(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.id === sort.columnId)
    if (!column?.sortValue) return rows
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (left === right) return 0
      return (left > right ? 1 : -1) * factor
    })
  }, [rows, columns, sort])

  function toggleSort(column: Column<T>) {
    if (!column.sortValue) return
    setSort((current) =>
      current?.columnId === column.id
        ? { columnId: column.id, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { columnId: column.id, direction: 'asc' },
    )
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-card border border-line bg-surface',
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-raised/50">
          <tr className="border-b border-line">
            {columns.map((column) => {
              const isSorted = sort?.columnId === column.id
              const label = (
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortValue ? (
                    isSorted ? (
                      sort.direction === 'asc' ? (
                        <ChevronUp className="size-3" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3" aria-hidden />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3 opacity-0 group-hover/th:opacity-60" aria-hidden />
                    )
                  ) : null}
                </span>
              )

              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'group/th whitespace-nowrap px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-faint',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.width,
                    column.hideBelow && HIDE_BELOW[column.hideBelow],
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className="inline-flex items-center gap-1 rounded transition-colors hover:text-ink"
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((row) => {
            const href = getRowHref?.(row)
            return (
              <tr
                key={getRowId(row)}
                onClick={href ? () => navigate(href) : undefined}
                className={cn(
                  'transition-colors',
                  href && 'cursor-pointer hover:bg-raised',
                )}
              >
                {columns.map((column, columnIndex) => {
                  const content = column.cell(row)
                  return (
                    <td
                      key={column.id}
                      className={cn(
                        'px-3 py-2.5 align-middle text-ink',
                        column.align === 'right' ? 'text-right' : 'text-left',
                        column.numeric && 'tabular',
                        column.hideBelow && HIDE_BELOW[column.hideBelow],
                      )}
                    >
                      {/*
                        The row click is a mouse affordance only. Keyboard and
                        screen-reader users navigate via this real link in the
                        first cell, so the row never becomes a tab trap.
                      */}
                      {href && columnIndex === 0 ? (
                        <Link
                          to={href}
                          className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Secondary text inside a table cell — customer names, timestamps, lane detail. */
export function CellMuted({ children }: { children: ReactNode }) {
  return <span className="block truncate text-xs text-muted">{children}</span>
}

/** Primary identifier inside a table cell. */
export function CellStrong({ children }: { children: ReactNode }) {
  return <span className="block truncate font-medium text-ink">{children}</span>
}
