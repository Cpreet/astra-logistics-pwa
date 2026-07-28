import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditLogEntry } from '@/types/audit'

const listAuditTrailForEntity = vi.fn()
const listActiveUsers = vi.fn()

vi.mock('@/repositories/audit-repository', () => ({
  listAuditTrailForEntity: (id: string) => listAuditTrailForEntity(id),
}))
vi.mock('@/repositories/user-repository', () => ({
  listActiveUsers: () => listActiveUsers(),
}))

const { AuditTrail } = await import('@/features/audit/audit-trail')

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'audit-1',
    entityType: 'customer',
    entityId: 'customer-1',
    action: 'update',
    summary: 'Customer CUS-00001 status changed',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    previousValues: { status: 'lead' },
    newValues: { status: 'active' },
    changedFields: ['status'],
    ...overrides,
  }
}

async function renderTrail(entries: AuditLogEntry[]) {
  listAuditTrailForEntity.mockResolvedValue(entries)
  listActiveUsers.mockResolvedValue([{ id: 'user-1', name: 'Sam Rivera' }])

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AuditTrail entityId="customer-1" />
    </QueryClientProvider>,
  )
  await screen.findByRole('region', { name: /audit history/i })
}

beforeEach(() => {
  listAuditTrailForEntity.mockReset()
  listActiveUsers.mockReset()
})

describe('AuditTrail', () => {
  it('shows an empty state rather than a bare heading', async () => {
    await renderTrail([])
    expect(await screen.findByText(/no recorded changes yet/i)).toBeInTheDocument()
  })

  it('renders the summary, actor and the field-level change', async () => {
    await renderTrail([entry()])

    expect(await screen.findByText('Customer CUS-00001 status changed')).toBeInTheDocument()
    expect(screen.getByText(/sam rivera/i)).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('lead')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows the reason when one was recorded', async () => {
    await renderTrail([entry({ reason: 'Two invoices overdue by 60 days' })])
    expect(await screen.findByText(/two invoices overdue by 60 days/i)).toBeInTheDocument()
  })

  it('collapses a create behind a disclosure instead of listing every field', async () => {
    await renderTrail([
      entry({
        action: 'create',
        summary: 'Customer CUS-00001 created',
        previousValues: null,
        newValues: { legalName: 'Acme Ltd', status: 'lead', currency: 'GBP' },
        changedFields: ['legalName', 'status', 'currency'],
      }),
    ])

    expect(await screen.findByText(/3 initial values/i)).toBeInTheDocument()
  })

  it('excludes identity bookkeeping from a create disclosure count', async () => {
    await renderTrail([
      entry({
        action: 'create',
        previousValues: null,
        newValues: { legalName: 'Acme Ltd', id: 'x', createdAt: 'y', createdBy: 'z' },
        changedFields: ['legalName', 'id', 'createdAt', 'createdBy'],
      }),
    ])

    // Only legalName is meaningful — id/createdAt/createdBy are implied by "Created".
    expect(await screen.findByText(/1 initial value$/i)).toBeInTheDocument()
  })

  it('falls back to System when the actor is not a known user', async () => {
    await renderTrail([entry({ userId: 'ghost' })])
    expect(await screen.findByText(/by system/i)).toBeInTheDocument()
  })

  it('labels each action distinctly', async () => {
    await renderTrail([
      entry({ id: 'a', action: 'create', changedFields: [] }),
      entry({ id: 'b', action: 'update', changedFields: [] }),
      entry({ id: 'c', action: 'delete', changedFields: [], reason: 'Duplicate' }),
    ])

    expect(await screen.findByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.getByText('Deleted')).toBeInTheDocument()
  })
})
