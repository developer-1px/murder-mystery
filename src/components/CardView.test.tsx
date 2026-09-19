// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { Card } from '../domain/types'
import { CardView } from './CardView'

const card: Card = { id: 'secret-id', title: '숨긴 제목', kind: 'memory', text: '숨긴 본문', tags: ['숨긴 태그'] }

describe('카드 앞뒤', () => {
  it('뒷면은 제목·본문·태그·ID를 마크업과 접근성 이름에 남기지 않는다', () => {
    const html = renderToStaticMarkup(<CardView card={card} faceDown backLabel="기억 카드 1 펼치기" />)
    for (const secret of [card.id, card.title, card.text, ...card.tags]) expect(html).not.toContain(secret)
    expect(html).toContain('기억 카드 1 펼치기')
    expect(html).toContain('card--back')
  })

  it('앞면은 본문을 보여주고 설계용 ID는 제외한다', () => {
    const html = renderToStaticMarkup(<CardView card={card} />)
    for (const content of [card.title, card.text, ...card.tags]) expect(html).toContain(content)
    expect(html).not.toContain(card.id)
    expect(html).toContain('<article')
    expect(html).not.toContain('card--back')
  })

  it('본문과 카드 크기가 바뀌면 전체 텍스트를 보존하며 글자 배율을 다시 맞춘다', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    let height = 100
    let resized = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { resized = callback }
      observe() {}
      disconnect = disconnect
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
    // 실제 줄바꿈·2:3 레이아웃은 Chrome에서 확인한다. 여기서는 측정값에 따른 재맞춤을 검사한다.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return (this.querySelector('.card__text')?.textContent?.length ?? 0) * Number(this.style.getPropertyValue('--fit') || 1)
    })
    try {
      const long = { ...card, text: '긴 본문 '.repeat(200) }
      await act(() => root.render(<CardView card={long} />))
      const face = () => host.querySelector<HTMLElement>('.card__face')!
      expect(Number(face().style.getPropertyValue('--fit'))).toBeLessThan(1)
      expect(face().scrollHeight).toBeLessThanOrEqual(height + 1)
      expect(host.querySelector('.card__text')!.textContent).toBe(long.text)
      height = 2000
      await act(() => resized())
      expect(face().style.getPropertyValue('--fit')).toBe('1')
      height = 100
      await act(() => root.render(<CardView card={card} />))
      expect(face().style.getPropertyValue('--fit')).toBe('1')
      await act(() => root.render(<CardView card={card} faceDown />))
      expect(host.textContent).not.toContain(card.text)
    } finally {
      await act(() => root.unmount())
      host.remove()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
    expect(disconnect).toHaveBeenCalled()
  })
})
