import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommandPalette } from '@/features/command-palette/command-palette'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.closest('[role="dialog"]') !== null
  )
}

/**
 * Keyboard-first navigation: Cmd/Ctrl+K palette, "g" prefix jumps, "n" for new.
 */
export function useAppShortcuts(): void {
  const navigate = useNavigate()
  const { open } = useCommandPalette()
  const pendingGoto = useRef(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const cmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (cmdK) {
        event.preventDefault()
        open()
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      if (pendingGoto.current) {
        pendingGoto.current = false
        const routes: Record<string, string> = {
          d: '/',
          c: '/customers',
          i: '/inquiries',
          o: '/documents',
          a: '/modules/air',
          s: '/sync',
        }
        const to = routes[event.key.toLowerCase()]
        if (to) {
          event.preventDefault()
          navigate(to)
        }
        return
      }

      if (event.key.toLowerCase() === 'g') {
        pendingGoto.current = true
        window.setTimeout(() => {
          pendingGoto.current = false
        }, 1200)
        return
      }

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        navigate('/inquiries/new')
        return
      }

      if (event.key === '/') {
        event.preventDefault()
        open()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate, open])
}
