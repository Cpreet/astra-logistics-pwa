import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DataTable, type Column } from '@/components/ui/data-table'

interface Row {
  id: string
  code: string
  weight: number
}

const rows: Row[] = [
  { id: '1', code: 'INQ-00002', weight: 480 },
  { id: '2', code: 'INQ-00001', weight: 1250 },
  { id: '3', code: 'INQ-00003', weight: 96 },
]

const columns: Column<Row>[] = [
  {
    id: 'code',
    header: 'Inquiry',
    sortValue: (row) => row.code,
    cell: (row) => row.code,
  },
  {
    id: 'weight',
    header: 'Weight',
    align: 'right',
    numeric: true,
    sortValue: (row) => row.weight,
    cell: (row) => `${row.weight} kg`,
  },
  { id: 'static', header: 'Mode', cell: () => 'AIR' },
]

function renderTable(extra?: Partial<Parameters<typeof DataTable<Row>>[0]>) {
  return render(
    <MemoryRouter>
      <DataTable
        caption="Inquiries"
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        getRowHref={(row) => `/inquiries/${row.id}`}
        {...extra}
      />
    </MemoryRouter>,
  )
}

function bodyCodes(): string[] {
  const body = screen.getAllByRole('rowgroup')[1]!
  return within(body)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0]!.textContent!.trim())
}

describe('DataTable', () => {
  it('renders every row in source order until sorted', () => {
    renderTable()
    expect(bodyCodes()).toEqual(['INQ-00002', 'INQ-00001', 'INQ-00003'])
  })

  it('sorts ascending on first header click and reverses on the second', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: /inquiry/i }))
    expect(bodyCodes()).toEqual(['INQ-00001', 'INQ-00002', 'INQ-00003'])

    await user.click(screen.getByRole('button', { name: /inquiry/i }))
    expect(bodyCodes()).toEqual(['INQ-00003', 'INQ-00002', 'INQ-00001'])
  })

  it('sorts numerically rather than lexically', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByRole('button', { name: /weight/i }))
    const body = screen.getAllByRole('rowgroup')[1]!
    const weights = within(body)
      .getAllByRole('row')
      .map((row) => within(row).getAllByRole('cell')[1]!.textContent!.trim())

    // Lexical order would put "1250 kg" before "480 kg".
    expect(weights).toEqual(['96 kg', '480 kg', '1250 kg'])
  })

  it('exposes the current sort direction to assistive technology', async () => {
    const user = userEvent.setup()
    renderTable()

    const header = screen.getByRole('columnheader', { name: /inquiry/i })
    expect(header).not.toHaveAttribute('aria-sort')

    await user.click(screen.getByRole('button', { name: /inquiry/i }))
    expect(header).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: /inquiry/i }))
    expect(header).toHaveAttribute('aria-sort', 'descending')
  })

  it('gives keyboard users a real link in the first cell of each row', () => {
    renderTable()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(rows.length)
    expect(links[0]).toHaveAttribute('href', '/inquiries/1')
  })

  it('does not offer sorting on columns without a sort value', () => {
    renderTable()
    expect(screen.queryByRole('button', { name: /mode/i })).toBeNull()
  })

  it('renders the empty state instead of an empty table', () => {
    renderTable({ rows: [], emptyState: <p>No inquiries yet</p> })
    expect(screen.getByText('No inquiries yet')).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
