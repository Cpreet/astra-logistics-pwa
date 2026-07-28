import { FileText, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Sheet } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/auth-context'

export function QuickCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { can } = useAuth()

  const actions = [
    {
      label: 'New inquiry',
      description: 'Capture a lane and cargo request',
      icon: FileText,
      to: '/inquiries/new',
      allowed: can('inquiries.write'),
    },
    {
      label: 'New customer',
      description: 'Add a shipper, consignee, or broker',
      icon: UserPlus,
      to: '/customers/new',
      allowed: can('customers.write'),
    },
  ].filter((action) => action.allowed)

  return (
    <Sheet open={open} onClose={onClose} title="Create" description="Pick what you want to add">
      {actions.length === 0 ? (
        <p className="text-sm text-muted">
          Your role has read-only access. Ask an administrator for edit permissions.
        </p>
      ) : (
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={action.to}>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate(action.to)
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
                  <action.icon className="size-4 text-brand" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{action.label}</span>
                  <span className="block text-xs text-muted">{action.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
