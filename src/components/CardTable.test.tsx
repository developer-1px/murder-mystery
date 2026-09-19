// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CardPile } from '../domain/table'
import type { Scenario } from '../domain/types'
import { CardTable } from './CardTable'

const scenario: Scenario = {
  meta: { id: 'test', title: '테이블', version: '1', round: 1 }, characters: [], locations: [], claims: [],
  cards: ['a', 'b', 'c', 'd'].map((id) => ({ id, title: `비밀 제목 ${id}`, text: `비밀 본문 ${id}`, tags: ['비밀 태그'], kind: 'memory' })),
}
const initial: CardPile[] = [
  { id: 'deck', x: 10, y: 10, cards: ['a', 'b', 'c'].map((cardId) => ({ cardId, faceUp: false })) },
  { id: 'single', x: 75, y: 10, cards: [{ cardId: 'd', faceUp: true }] },
]
let root: Root
let host: HTMLDivElement
let change = vi.fn<(piles: CardPile[], label: string) => void>()
const undo = vi.fn()
const redo = vi.fn()
const query = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!
const card = (id = 'deck') => query<HTMLButtonElement>(`[data-pile-id="${id}"] .card`)
const emit = (target: EventTarget, event: Event) => act(async () => { target.dispatchEvent(event) })
const key = (code: string, options: KeyboardEventInit = {}, type = 'keydown') => emit(document.activeElement!, new KeyboardEvent(type, { code, key: code === 'Space' ? ' ' : code, bubbles: true, cancelable: true, ...options }))
const pointer = (target: EventTarget, type: string, x: number, y: number, shiftKey = false) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y, shiftKey })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  return emit(target, event)
}
const click = async (target: HTMLElement, shift = false) => {
  await act(() => target.focus())
  await pointer(target, 'pointerdown', 150, 150, shift)
  await pointer(target, 'pointerup', 150, 150, shift)
  await emit(target, new MouseEvent('click', { bubbles: true, detail: 1, shiftKey: shift }))
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  // jsdom에는 native dialog의 top-layer API가 없다. 실제 열기/닫기는 Chrome에서도 검증한다.
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) { this.open = true },
    close(this: HTMLDialogElement) { this.open = false },
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const piece = this.hasAttribute('data-pile-id')
    const x = piece ? parseFloat(this.style.left) * 8 : 0
    const y = piece ? parseFloat(this.style.top) * 5 : 0
    const width = piece ? 200 : 1000
    const height = piece ? 300 : 800
    return { x, y, width, height, left: x, top: y, right: x + width, bottom: y + height, toJSON() {} }
  })
  const dimensions = { clientWidth: 1000, clientHeight: 800, offsetWidth: 200, offsetHeight: 300 }
  for (const name of ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight'] as const) {
    vi.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(dimensions[name])
  }
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  change = vi.fn()
  function Harness() {
    const [piles, setPiles] = useState(initial)
    return <><input aria-label="테스트 입력" /><CardTable scenario={scenario} piles={piles} onChange={(next, label) => { change(next, label); setPiles(next) }} onUndo={undo} onRedo={redo} canUndo canRedo /></>
  }
  await act(() => root.render(<Harness />))
  Object.assign(query('.table-surface'), { setPointerCapture: vi.fn(), hasPointerCapture: () => false, releasePointerCapture: vi.fn() })
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  undo.mockClear()
  redo.mockClear()
})

describe('테이블 실제 입력 경로', () => {
  it('클릭은 선택만 하며 뒷면 더블클릭도 비밀을 노출하지 않는다', async () => {
    await click(card())
    expect(card().getAttribute('aria-pressed')).toBe('true')
    expect(card().classList.contains('card--back')).toBe(true)
    expect(change).not.toHaveBeenCalled()
    await emit(card(), new MouseEvent('dblclick', { bubbles: true }))
    const reader = query('.card-reader')
    expect(reader.getAttribute('aria-label')).toBe('뒷면 카드 크게 보기')
    expect(reader.textContent).not.toContain('비밀')
  })

  it('Space/Alt 유지 확대는 현재 면만 보이며 마지막 키 해제·blur에 닫힌다', async () => {
    await act(() => card().focus())
    await key('Space')
    expect(query('.card-peek').textContent).not.toContain('비밀')
    await key('AltLeft', { key: 'Alt', altKey: true })
    await key('Space', {}, 'keyup')
    expect(query('.card-peek')).not.toBeNull()
    await key('AltLeft', { key: 'Alt' }, 'keyup')
    expect(query('.card-peek')).toBeNull()
    await act(() => card('single').focus())
    await key('Space')
    expect(query('.card-peek').textContent).toContain('비밀 본문 d')
    await emit(window, new Event('blur'))
    expect(query('.card-peek')).toBeNull()
    expect(change).not.toHaveBeenCalled()
  })

  it('다중 선택 중 확대는 선택 마지막이 아니라 가리킨 카드를 보여준다', async () => {
    await click(card())
    await click(card('single'), true)
    await act(() => card().focus())
    await key('Space')
    expect(query('.card-peek').textContent).not.toContain('비밀 본문 d')
  })

  it('드래그 중에는 저장하지 않고 Esc·blur·외부 pointerup은 취소한다', async () => {
    const surface = query('.table-surface')
    await pointer(card(), 'pointerdown', 150, 150)
    await pointer(surface, 'pointermove', 450, 650)
    expect(host.querySelectorAll('[data-pile-id]')).toHaveLength(3)
    expect(change).not.toHaveBeenCalled()
    await key('Escape')
    expect(host.querySelectorAll('[data-pile-id]')).toHaveLength(2)
    await pointer(surface, 'pointerup', 450, 650)
    await pointer(card(), 'pointerdown', 150, 150)
    await pointer(surface, 'pointermove', 450, 650)
    await emit(window, new Event('blur'))
    expect(host.querySelectorAll('[data-pile-id]')).toHaveLength(2)
    await pointer(card(), 'pointerdown', 150, 150)
    await pointer(window, 'pointerup', 1100, 900)
    expect(change).not.toHaveBeenCalled()
    await act(() => card().focus())
    await key('KeyZ', { metaKey: true })
    expect(undo).toHaveBeenCalledOnce()
  })

  it('한 장 꺼내 이동은 놓을 때 한 번 저장하고 모든 카드와 앞뒤를 보존한다', async () => {
    const originalChange = change
    await pointer(card(), 'pointerdown', 150, 150)
    await pointer(query('.table-surface'), 'pointermove', 450, 650)
    expect(query('.table-piece--dragging')).not.toBeNull()
    await pointer(query('.table-surface'), 'pointerup', 450, 650)
    expect(originalChange).toHaveBeenCalledOnce()
    const next = originalChange.mock.calls[0][0] as CardPile[]
    expect(next.find((pile) => pile.id === 'deck')!.cards).toHaveLength(2)
    expect(next.at(-1)!.cards).toEqual([{ cardId: 'c', faceUp: false }])
    expect(next.flatMap((pile) => pile.cards).map((item) => item.cardId).sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('선택한 덱을 드래그하면 전체가 움직이고 숫자로 꺼낸 뒤 G가 새 선택에 적용된다', async () => {
    await click(card())
    expect(card().getAttribute('aria-pressed')).toBe('true')
    const move = change
    // jsdom은 초점이 있는 DOM 순서 변경에도 window blur를 발생시킨다.
    // 초점이 있는 실제 드래그는 Chrome에서 확인하고 여기서는 포인터 상태 전이를 검사한다.
    await act(() => card().blur())
    await pointer(card(), 'pointerdown', 150, 150)
    expect(card().getAttribute('aria-pressed')).toBe('true')
    await pointer(query('.table-surface'), 'pointermove', 450, 650)
    expect(query('.table-piece--dragging')).not.toBeNull()
    await pointer(query('.table-surface'), 'pointerup', 450, 650)
    expect(move).toHaveBeenCalledOnce()
    const moved = move.mock.calls[0][0] as CardPile[]
    expect(moved).toHaveLength(2)
    expect(moved.find((pile) => pile.id === 'deck')!.cards).toHaveLength(3)
    await act(() => card().focus())
    await key('Digit2', { key: '2' })
    expect(host.querySelectorAll('[data-pile-id]')).toHaveLength(4)
    expect(document.activeElement?.closest('[data-pile-id]')?.getAttribute('data-pile-id')).not.toBe('deck')
    await key('KeyG', { key: 'g' })
    expect(host.querySelectorAll('[data-pile-id]')).toHaveLength(3)
  })

  it('텍스트 입력·한글 조합·키 반복은 카드 조작을 일으키지 않는다', async () => {
    await click(card())
    await act(() => query('input').focus())
    await key('KeyF', { key: 'f' })
    await key('KeyZ', { ctrlKey: true })
    await act(() => card().focus())
    await key('KeyF', { key: 'ㄹ', isComposing: true })
    await key('KeyF', { key: 'f', repeat: true })
    expect(change).not.toHaveBeenCalled()
    expect(undo).not.toHaveBeenCalled()
  })

  it('키보드 메뉴는 첫 항목에 초점을 두고 방향키·Escape 후 카드로 돌아온다', async () => {
    await click(card())
    await key('F10', { key: 'F10', shiftKey: true })
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem')
    expect(document.activeElement?.textContent).toContain('크게 읽기')
    await key('ArrowDown')
    expect(document.activeElement?.textContent).toContain('뒤집기')
    await key('Escape')
    expect(query('[role="menu"]')).toBeNull()
    expect(document.activeElement).toBe(card())
  })
})
