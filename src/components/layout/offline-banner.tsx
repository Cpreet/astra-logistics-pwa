import { WifiOff, CloudUpload } from 'lucide-react'
import { useOnlineStatus, usePendingSyncCount } from '@/hooks/use-online-status'

export function OfflineBanner() {
  const online = useOnlineStatus()
  const pending = usePendingSyncCount()

  if (online && pending === 0) {
    return null
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-2 border-b border-amber-900/50 bg-amber-950/80 px-4 py-2 text-sm text-amber-100"
    >
      {!online ? (
        <>
          <WifiOff className="size-4 shrink-0" aria-hidden />
          <span>Working offline — changes are saved locally.</span>
        </>
      ) : null}
      {pending > 0 ? (
        <>
          <CloudUpload className="size-4 shrink-0" aria-hidden />
          <span>
            {pending} change{pending === 1 ? '' : 's'} waiting to sync (simulated transport in
            MVP).
          </span>
        </>
      ) : null}
    </div>
  )
}
