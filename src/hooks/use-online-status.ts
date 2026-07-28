import { useEffect, useState } from 'react'
import { countPendingOutbox } from '@/repositories/sync-outbox-repository'

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return online
}

export function usePendingSyncCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    const refresh = async () => {
      const next = await countPendingOutbox()
      if (active) setCount(next)
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), 5_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return count
}
