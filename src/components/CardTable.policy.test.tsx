// @vitest-environment jsdom
import { act, type HTMLAttributes, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Scenario } from '../domain/types'
import type { CardPile } from '../domain/table'
import { CardTable, type CardTablePolicy } from './CardTable'
import type { CardPosition } from './TableCardPiece'

// Geometry targets and React identity are owner contracts; spring frames are checked in Chrome.
vi.mock('motion/react', async () => {
  const { createElement } = await import('react')
  type MotionProps = HTMLAttributes<HTMLDivElement> & { animate?: CardPosition; initial?: unknown; exit?: unknown; transition?: unknown; whileHover?: unknown }
  return {
    motion: { div: ({ animate, initial, exit, transition, whileHover, style, ...props }: MotionProps) => createElement('div', { ...props, style: { ...style, width: animate?.width } }) },
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    useReducedMotion: () => true, useIsPresent: () => true, usePresenceData: () => undefined,
  }
})

const scenario: Scenario = { meta: { id: 'policy', title: '정본 카드 UI', version: '1', round: 1 }, characters: [], locations: [], claims: [],
  cards: ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, kind: 'rumor', title: id, text: `카드 ${id}`, tags: [] })) }
let host: HTMLDivElement
let root: Root
const emit = (target: EventTarget, event: Event) => act(() => { target.dispatchEvent(event) })
const policy = (): CardTablePolicy => ({ label: '규칙 테이블', hint: '', handLabel: '내 손패', deckActions: {}, reorderHand: vi.fn() })
const mount = (piles: CardPile[], rules: CardTablePolicy, onChange = vi.fn()) => act(() => root.render(<MemoryRouter><CardTable scenario={scenario} piles={piles} policy={rules} onChange={onChange} onUndo={() => {}} onRedo={() => {}} canUndo={false} canRedo={false} /></MemoryRouter>))

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  Object.assign(HTMLDialogElement.prototype, { showModal() {}, close() {} })
  for (const [key, value] of Object.entries({ clientWidth: 1000, clientHeight: 800, offsetWidth: 200 })) vi.spyOn(HTMLElement.prototype, key as 'clientWidth', 'get').mockReturnValue(value)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 800, width: 1000, height: 800, toJSON() {} })
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('게임 덱 클릭은 정책으로 위임하고 자유 뒤집기·숫자키는 실행하지 않는다', async () => {
  const run = vi.fn(); const change = vi.fn()
  const rules = { ...policy(), deckActions: { deck: { label: '소문', run } } }
  await mount([{ id: 'deck', x: 50, y: 10, cards: [{ cardId: 'a', faceUp: false }] }], rules, change)
  const card = host.querySelector<HTMLButtonElement>('.card')!
  await emit(card, new MouseEvent('click', { bubbles: true, detail: 1 }))
  expect(run).toHaveBeenCalledOnce()
  for (const code of ['KeyF', 'Digit3']) await emit(card, new KeyboardEvent('keydown', { bubbles: true, code, key: code }))
  expect(change).not.toHaveBeenCalled()
  expect(run).toHaveBeenCalledOnce()
  expect(host.querySelector('.table-reveal-tools')).toBeNull()
})

it('호스트가 정한 N장 그대로 보여주고 한 장 선택을 위임한다', async () => {
  const pick = vi.fn()
  const cards = scenario.cards.map(card => ({ cardId: card.id, faceUp: true }))
  await mount([{ id: 'deck', x: 50, y: 10, cards }], { ...policy(), choice: { sourceId: 'deck', cards, onPick: pick, note: '배분' } })
  expect(host.querySelectorAll('[data-choice-card]:not([data-card-preview])')).toHaveLength(6)
  await emit(host.querySelector('[data-choice-card] .card')!, new MouseEvent('click', { bubbles: true, detail: 1 }))
  expect(pick).toHaveBeenCalledOnce()
  expect(pick).toHaveBeenCalledWith('f')
  expect(host.querySelector('[aria-label="카드 선택 취소"]')).toBeNull()
})

it('손패 원본을 남기고 같은 미리보기 노드·크기로 다른 카드에 이동한다', async () => {
  const piles: CardPile[] = ['a', 'b'].map(id => ({ id, cards: [{ cardId: id, faceUp: true }], zone: 'hand', x: 50, y: 100 }))
  await mount(piles, policy())
  const surface = host.querySelector('.table-surface')!
  await emit(surface, new MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 700 }))
  const preview = host.querySelector<HTMLElement>('[data-card-preview="hover"]')!
  expect(preview.dataset.cardId).toBe('a')
  const width = preview.style.width
  await emit(surface, new MouseEvent('pointermove', { bubbles: true, clientX: 600, clientY: 700 }))
  expect(host.querySelector('[data-card-preview="hover"]')).toBe(preview)
  expect(preview.dataset.cardId).toBe('b')
  expect(preview.style.width).toBe(width)
  const originals = [...host.querySelectorAll<HTMLElement>('[data-card-zone="hand"]:not([data-card-preview])')]
  expect(originals).toHaveLength(2)
  expect(originals.every(card => card.style.visibility !== 'hidden' && !card.hasAttribute('inert'))).toBe(true)
})
