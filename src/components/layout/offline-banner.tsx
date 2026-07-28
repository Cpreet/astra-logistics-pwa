import { CloudUpload, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useOnlineStatus, usePendingSyncCount } from '@/hooks/use-online-status'

export function OfflineBanner() {
  const online = useOnlineStatus()
  const pending = usePendingSyncCount()

  if (online && pending === 0) return null

  return (
    <div
      role="status"
      className={
        online
          ? 'flex items-center justify-center gap-2 bg-info-soft px-4 py-1.5 text-xs font-medium text-info'
          : 'flex items-center justify-center gap-2 bg-warning-soft px-4 py-1.5 text-xs font-medium text-warning'
      }
    >
      {online ? (
        <>
          <CloudUpload className="size-3.5 shrink-0" aria-hidden />
          <span>
            {pending} change{pending === 1 ? '' : 's'} queued for sync
          </span>
          <Link to="/sync" className="underline underline-offset-2">
            View
          </Link>
        </>
      ) : (
        <>
          <WifiOff className="size-3.5 shrink-0" aria-hidden />
          <span>Offline — changes are saved on this device</span>
        </>
      )}
    </div>
  )
}
