import { useCallback, useEffect, useRef, useState } from 'react'

// A short gap between neighbouring cards must not close/reopen the reader.
export function useCardHover() {
  const [cardId, setCardId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const show = useCallback((id: string | null) => {
    clearTimeout(timer.current)
    setCardId(id)
  }, [])
  const leave = useCallback((id: string) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCardId(current => current === id ? null : current), 90)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return { cardId, show, leave }
}
