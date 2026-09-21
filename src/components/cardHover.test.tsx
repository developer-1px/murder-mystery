// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { useCardHover } from './cardHover'

it('인접 카드 이동은 열린 호버를 교체하고 실제 이탈만 닫는다', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  const host = document.createElement('div')
  const root = createRoot(host)
  let hover: ReturnType<typeof useCardHover>
  function Harness() { hover = useCardHover(); return <span>{hover.cardId}</span> }
  try {
    await act(() => root.render(<Harness />))
    await act(() => hover.show('a'))
    await act(() => hover.leave('a'))
    await act(() => vi.advanceTimersByTime(50))
    expect(host.textContent).toBe('a')
    await act(() => hover.show('b'))
    await act(() => vi.advanceTimersByTime(100))
    expect(host.textContent).toBe('b')
    await act(() => hover.leave('b'))
    await act(() => vi.advanceTimersByTime(90))
    expect(host.textContent).toBe('')
  } finally {
    await act(() => root.unmount())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  }
})
