import {
  ArrowRight,
  Building2,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  MoonStar,
  Plane,
  Plus,
  Receipt,
  Search,
  Sun,
  Users,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Kbd } from '@/components/ui/kbd'
import { humanize } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { reloadDemoData } from '@/db/seed'
import { useAuth } from '@/features/auth/auth-context'
import { useTheme } from '@/features/theme/theme-context'
import { useCustomers } from '@/hooks/use-customers'
import { useInquiries } from '@/hooks/use-inquiries'
import { cn } from '@/utils/cn'

interface CommandPaletteContextValue {
  open: () => void
  close: () => void
  isOpen: boolean
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

interface CommandItem {
  id: string
  group: string
  label: string
  hint?: string
  icon: typeof Search
  run: () => void | Promise<void>
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={isOpen} onClose={close} />
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { signOut, can } = useAuth()
  const { resolved, toggle } = useTheme()
  const { notify } = useToast()
  const queryClient = useQueryClient()
  const { data: customers = [] } = useCustomers()
  const { data: inquiries = [] } = useInquiries()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const items = useMemo<CommandItem[]>(() => {
    const go = (to: string) => () => {
      navigate(to)
      onClose()
    }

    const base: CommandItem[] = []

    if (can('inquiries.write')) {
      base.push({
        id: 'new-inquiry',
        group: 'Create',
        label: 'New inquiry',
        hint: 'Capture a lane request',
        icon: Plus,
        run: go('/inquiries/new'),
      })
    }
    if (can('customers.write')) {
      base.push({
        id: 'new-customer',
        group: 'Create',
        label: 'New customer',
        hint: 'Add a shipper or consignee',
        icon: Plus,
        run: go('/customers/new'),
      })
    }

    base.push(
      {
        id: 'nav-dashboard',
        group: 'Go to',
        label: 'Dashboard',
        icon: LayoutDashboard,
        run: go('/'),
      },
      { id: 'nav-customers', group: 'Go to', label: 'Customers', icon: Users, run: go('/customers') },
      {
        id: 'nav-inquiries',
        group: 'Go to',
        label: 'Inquiries',
        icon: FileText,
        run: go('/inquiries'),
      },
      {
        id: 'nav-documents',
        group: 'Go to',
        label: 'Documents',
        hint: 'Labels, waybills, invoices',
        icon: Receipt,
        run: go('/documents'),
      },
      { id: 'nav-air', group: 'Go to', label: 'Air freight', icon: Plane, run: go('/modules/air') },
      { id: 'nav-sync', group: 'Go to', label: 'Sync activity', icon: Database, run: go('/sync') },
    )

    for (const customer of customers.slice(0, 40)) {
      base.push({
        id: `customer-${customer.id}`,
        group: 'Customers',
        label: customer.legalName,
        hint: customer.customerCode,
        icon: Building2,
        run: go(`/customers/${customer.id}`),
      })
    }

    for (const inquiry of inquiries.slice(0, 40)) {
      base.push({
        id: `inquiry-${inquiry.id}`,
        group: 'Inquiries',
        label: `${inquiry.inquiryNumber} · ${inquiry.origin.code} → ${inquiry.destination.code}`,
        hint: humanize(inquiry.status),
        icon: FileText,
        run: go(`/inquiries/${inquiry.id}`),
      })
    }

    base.push(
      {
        id: 'toggle-theme',
        group: 'System',
        label: resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        icon: resolved === 'dark' ? Sun : MoonStar,
        run: () => {
          toggle()
          onClose()
        },
      },
      {
        id: 'reload-demo',
        group: 'System',
        label: 'Reload demo data',
        hint: 'Restores sample customers and inquiries',
        icon: Database,
        run: async () => {
          await reloadDemoData()
          await queryClient.invalidateQueries()
          notify({ tone: 'success', message: 'Demo data reloaded' })
          onClose()
        },
      },
      {
        id: 'sign-out',
        group: 'System',
        label: 'Sign out',
        icon: LogOut,
        run: async () => {
          await signOut()
          onClose()
          navigate('/login', { replace: true })
        },
      },
    )

    return base
  }, [can, customers, inquiries, navigate, onClose, resolved, toggle, signOut, notify, queryClient])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return items.filter((item) => !['Customers', 'Inquiries'].includes(item.group)).slice(0, 12)
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(term) ||
          item.hint?.toLowerCase().includes(term) ||
          item.group.toLowerCase().includes(term),
      )
      .slice(0, 20)
  }, [items, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (open) {
      setQuery('')
      window.setTimeout(() => inputRef.current?.focus(), 20)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        void filtered[activeIndex]?.run()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, filtered, activeIndex, onClose])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
      <button
        type="button"
        aria-label="Close command palette"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-overlay shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-faint" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers, inquiries, or type a command…"
            aria-label="Search or run a command"
            className="min-h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <Kbd className="hidden sm:block">Esc</Kbd>
        </div>

        <ul ref={listRef} className="max-h-[min(24rem,55vh)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">
              No matches for “{query}”
            </li>
          ) : (
            filtered.map((item, index) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              const active = index === activeIndex
              return (
                <li key={item.id}>
                  {showGroup ? (
                    <p className="px-3 pb-1 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">
                      {item.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    data-active={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void item.run()}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      active ? 'bg-brand-soft' : 'hover:bg-raised',
                    )}
                  >
                    <item.icon
                      className={cn('size-4 shrink-0', active ? 'text-brand' : 'text-faint')}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.label}
                      </span>
                      {item.hint ? (
                        <span className="block truncate text-xs text-muted">{item.hint}</span>
                      ) : null}
                    </span>
                    {active ? (
                      <ArrowRight className="size-3.5 shrink-0 text-brand" aria-hidden />
                    ) : null}
                  </button>
                </li>
              )
            })
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[0.7rem] text-faint">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            to select
          </span>
        </div>
      </div>
    </div>
  )
}
