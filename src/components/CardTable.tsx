import { Icon } from '../design-system/Icon'
import { Button } from '../design-system/controls'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Scenario } from '../domain/types'
import { cardCandidates, clampPosition, coverPile, drawCards, flipPile, isHandPile, movePiles, placeInHand, placeOnTable, shufflePile, stackSelected, takeCandidate, type CardPile, type TableCard } from '../domain/table'
import { cardKinds } from './cardKinds'
import { tableHelp, tableShortcut } from './tableInput'
import { TableContextMenu, type TableMenuItem } from './TableContextMenu'
import { TableCardPiece, type CardPosition, type CardDestination } from './TableCardPiece'
import { CopyLinkButton } from '../routing'
import { memoryStages, npcGroups } from '../scenario/load'
import { getCardGroups } from '../scenario/cardGroups'
import { useCardHover } from './cardHover'
import './card-table.css'

export interface TableView {
  selectedIds: string[]
  readingId?: string
  choice?: { sourceId: string; count: number }
  helpOpen: boolean
}

// The host supplies legal intents, never pointer handling or card animation.
export interface CardTablePolicy {
  label: string
  hint: string
  handLabel: string
  deckActions: Record<string, { label: string; disabled?: string; backTitle?: string; backSubtitle?: string; run: () => void }>
  choice?: { sourceId: string; cards: TableCard[]; onPick: (cardId: string) => void; note: string }
  play?: { label: string; accepts: (cardId: string) => boolean; run: (cardId: string) => void }
  reorderHand: (cardIds: string[]) => void
}

interface Props {
  scenario: Scenario
  piles: CardPile[]
  onChange?: (piles: CardPile[], label: string, view?: TableView) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  view?: TableView
  onViewChange?: (view: TableView, replace?: boolean) => void
  policy?: CardTablePolicy
  reader?: { pileId?: string; onChange: (pileId?: string) => void }
}

interface Gesture {
  kind: 'cards' | 'box'
  pointerId: number
  startX: number
  startY: number
  beforeSelection: string[]
  ids: string[]
  sourceId?: string
  drawId?: string
  base: CardPile[]
  next?: CardPile[]
  targetId?: string
  moved: boolean
  additive?: boolean
  positions?: Map<string, CardPosition>
  handIndex?: number
  candidateId?: string
}

export function CardTable({ scenario, piles, onChange, onUndo, onRedo, canUndo, canRedo, view, onViewChange, policy, reader }: Props) {
  const cardGroups = useMemo(() => getCardGroups(scenario, npcGroups, memoryStages), [scenario])
  const [preview, setPreview] = useState<{ piles: CardPile[]; ids: string[]; positions: Map<string, CardPosition>; targetId?: string; handIndex?: number } | null>(null)
  const { cardId: hover, show: setHover, leave: leaveHover } = useCardHover()
  const [pressedPositions, setPressedPositions] = useState<Map<string, CardPosition> | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0, cardWidth: 160 })
  const reducedMotion = useReducedMotion()
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([])
  const selectedIds = preview?.ids ?? view?.selectedIds ?? localSelectedIds
  const setSelectedIds = (ids: string[]) => {
    if (ids.join('\0') === selectedIds.join('\0')) return
    if (view && onViewChange) onViewChange({ ...view, selectedIds: ids })
    else setLocalSelectedIds(ids)
  }
  const [localReading, setLocalReading] = useState<{ id: string; held: boolean } | null>(null)
  const reading = reader ? localReading?.held ? localReading : reader.pileId ? { id: reader.pileId, held: false } : null : view ? localReading?.held ? localReading : view.readingId ? { id: view.readingId, held: false } : null : localReading
  const setReading = (value: typeof reading | ((previous: typeof reading) => typeof reading)) => {
    const next = typeof value === 'function' ? value(reading) : value
    setLocalReading(next?.held || (!view && !reader) ? next : null)
    if (reader && !next?.held && reader.pileId !== next?.id) reader.onChange(next?.id)
    if (view && onViewChange && !next?.held && view.readingId !== next?.id) onViewChange({ ...view, readingId: next?.id, choice: undefined }, false)
  }
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; ids: string[] } | null>(null)
  const [localHelpOpen, setLocalHelpOpen] = useState(false)
  const helpOpen = view?.helpOpen ?? localHelpOpen
  const setHelpOpen = (open: boolean) => {
    if (view && onViewChange) { if (view.helpOpen !== open) onViewChange({ ...view, helpOpen: open, readingId: undefined, choice: undefined }, false) }
    else setLocalHelpOpen(open)
  }
  const [localChoice, setLocalChoice] = useState<{ sourceId: string; count: number; base: CardPile[] } | null>(null)
  const choice = policy?.choice ? { sourceId: policy.choice.sourceId, count: policy.choice.cards.length, base: piles } : view ? view.choice ? { ...view.choice, base: piles } : null : localChoice
  const setChoice = (next: typeof localChoice) => {
    if (view && onViewChange) onViewChange({ ...view, choice: next ? { sourceId: next.sourceId, count: next.count } : undefined, readingId: undefined }, false)
    else setLocalChoice(next)
  }
  const surfaceRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const overlayCloseRef = useRef<HTMLButtonElement>(null)
  const lastPiles = useRef(piles)
  const origins = useRef(new Map<string, CardPosition>())
  const helpRef = useRef<HTMLDialogElement>(null)
  const pieceFor = (id: string) => [...(surfaceRef.current?.querySelectorAll<HTMLDivElement>('.table-piece:not([inert])') ?? [])].find((element) => element.dataset.pileId === id)
  const gesture = useRef<Gesture | null>(null)
  const hoveredId = useRef<string | null>(null)
  const pendingFocus = useRef<string | null>(view?.selectedIds.at(-1) ?? null)
  const heldKeys = useRef(new Set<string>())
  const suppressClick = useRef(false)
  const shown = preview?.piles ?? piles
  const selection = selectedIds.filter((id) => piles.some((pile) => pile.id === id))
  const candidates = policy?.choice?.cards ?? (choice?.base === piles ? cardCandidates(piles, choice.sourceId, choice.count) : [])
  const modal = !!choice || !!reading && !reading.held
  const handWidth = size.cardWidth * .74
  const handTop = size.height - handWidth * 1.5 - 44
  const hand = shown.filter(isHandPile)
  const positionOf = (pile: CardPile, layoutPiles = shown): CardPosition => {
    if (!isHandPile(pile)) return { x: (size.width - size.cardWidth) * pile.x / 100, y: (size.height - size.cardWidth * 1.5 - 28) * pile.y / 100 + 28, width: size.cardWidth }
    const items = layoutPiles.filter(isHandPile)
    const spacing = Math.min(handWidth + 14, Math.max(0, (size.width - handWidth - 64) / Math.max(1, items.length - 1)))
    const span = handWidth + Math.max(0, items.length - 1) * spacing
    return { x: (size.width - span) / 2 + Math.max(0, items.findIndex((item) => item.id === pile.id)) * spacing, y: handTop, width: handWidth }
  }
  const returnPositions = new Map<string, CardDestination>(shown.flatMap((pile) => pile.cards.map((card) => [card.cardId, { ...positionOf(pile), faceDown: !card.faceUp }] as const)))

  useLayoutEffect(() => {
    const surface = surfaceRef.current!
    const measure = () => setSize({ width: surface.clientWidth, height: surface.clientHeight, cardWidth: sizeRef.current!.offsetWidth })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(surface)
    observer.observe(sizeRef.current!)
    return () => observer.disconnect()
  }, [])

  // History navigation changes the board, not the identity of every card on it.
  useLayoutEffect(() => {
    if (lastPiles.current === piles) return
    const previous = lastPiles.current
    lastPiles.current = piles
    // A background player's private turn may update its host without changing
    // our visible board. Keep an in-progress hover/drag alive in that case.
    if (policy && previous.length === piles.length && piles.every((pile, index) => {
      const before = previous[index]
      return pile.id === before.id && pile.zone === before.zone && pile.x === before.x && pile.y === before.y
        && pile.cards.length === before.cards.length && pile.cards.every((card, cardIndex) => card.cardId === before.cards[cardIndex].cardId && card.faceUp === before.cards[cardIndex].faceUp)
    })) return
    const active = gesture.current
    gesture.current = null
    if (active && surfaceRef.current?.hasPointerCapture(active.pointerId)) surfaceRef.current.releasePointerCapture(active.pointerId)
    setPreview(null)
    setPressedPositions(null)
    setBox(null)
    setMenu(null)
    setHover(null)
    hoveredId.current = null
    heldKeys.current.clear()
    setLocalReading(null)
    setLocalChoice(null)
  }, [piles])

  useEffect(() => {
    if (!modal) return
    const previous = document.activeElement as HTMLElement | null
    ;(overlayCloseRef.current ?? surfaceRef.current?.querySelector<HTMLButtonElement>('[data-choice-card] .card'))?.focus({ preventScroll: true })
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const nodes = [...surfaceRef.current!.querySelectorAll<HTMLElement>('[data-table-overlay] button, [data-table-overlay] a, .table-piece:not([inert]):not([aria-hidden=true]) .card')]
      const index = nodes.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      nodes[(index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length]?.focus({ preventScroll: true })
    }
    window.addEventListener('keydown', trap)
    return () => { window.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [modal, choice?.sourceId, reading?.id])

  const nameOf = (pile: CardPile) => {
    const group = cardGroups.find((group) => pile.cards.every((item) => group.cards.some((card) => card.id === item.cardId)))
    if (group) {
      const category = { memory: '기억', rumor: '소문', testimony: '탐문', evidence: '조사' }[group.kind]
      return group.kind === 'rumor' ? '소문 · 공용' : `${category} · ${group.backTitle}`
    }
    const kinds = new Set(pile.cards.map((item) => scenario.cards.find((card) => card.id === item.cardId)!.kind))
    return (kinds.size === 1 ? cardKinds[[...kinds][0]].label : '혼합') + (pile.cards.length > 1 ? ' 덱' : ' 카드')
  }

  const pointedId = () => {
    const focused = document.activeElement?.closest<HTMLElement>('[data-pile-id]')?.dataset.pileId
    const id = hoveredId.current ?? focused
    return id && piles.some((pile) => pile.id === id) ? id : undefined
  }

  const targetIds = () => {
    const id = pointedId()
    return id ? selection.includes(id) ? selection : [id] : selection
  }

  const focusPile = (id?: string) => {
    if (id) pieceFor(id)?.querySelector<HTMLButtonElement>('.card')?.focus({ preventScroll: true })
  }

  const closeMenu = () => {
    if (menu?.ids.length) focusPile(menu.ids.at(-1))
    else surfaceRef.current?.focus({ preventScroll: true })
    setMenu(null)
  }

  const inspect = (id: string, held = false) => {
    setHover(null)
    setReading({ id, held })
    if (!held) heldKeys.current.clear()
  }

  const applyChange = (next: CardPile[], label: string, ids: string[], readingId?: string) => {
    if (policy) return
    if (view) onChange?.(next, label, { selectedIds: ids, readingId, helpOpen: false })
    else { onChange?.(next, label); setSelectedIds(ids); if (readingId) inspect(readingId) }
  }

  const take = (sourceId: string, count: number, cardId: string) => {
    if (policy) { policy.choice?.onPick(cardId); return }
    const id = crypto.randomUUID()
    const next = takeCandidate(piles, sourceId, count, cardId, id)
    if (next === piles) return
    if (!view) setChoice(null)
    const source = piles.find((pile) => pile.id === sourceId)!
    origins.current.set(cardId, positionOf(source))
    applyChange(next, count === 1 ? '펼쳐서 손패로 가져오기' : count + '장 중 한 장 가져오기', [id])
    hoveredId.current = null
    pendingFocus.current = id
  }

  const reveal = (id: string, count = 1) => {
    if (policy) { const action = policy.deckActions[id]; if (action && !action.disabled) action.run(); return }
    const cards = cardCandidates(piles, id, count)
    if (!cards.length) return
    if (cards.length === 1) take(id, 1, cards[0].cardId)
    else {
      setReading(null)
      heldKeys.current.clear()
      setChoice({ sourceId: id, count, base: piles })
    }
  }

  const cancelChoice = () => {
    if (policy?.choice) { cancelGesture(); return }
    const id = choice?.sourceId
    setChoice(null)
    focusPile(id)
  }

  const moveToHand = (ids: string[]) => {
    if (ids.length) applyChange(placeInHand(piles, ids), '손패에 넣기', ids)
  }
  const putOnTable = (ids: string[]) => {
    const next = placeOnTable(piles, ids).map((pile) => ids.includes(pile.id) ? { ...pile, x: 35 + ids.indexOf(pile.id) * 8, y: 45 } : pile)
    if (ids.length) applyChange(next, '테이블에 내려놓기', ids)
  }

  const changeSelected = (ids: string[], operation: (piles: CardPile[], id: string) => CardPile[], label: string) => {
    if (!ids.length) return
    applyChange(ids.reduce((next, id) => operation(next, id), piles), label, ids)
  }

  const group = (ids: string[]) => {
    if (ids.length < 2) return
    const target = ids.at(-1)!
    applyChange(stackSelected(piles, ids, target), '선택한 카드 쌓기', [target])
  }

  const openMenu = (ids: string[], x: number, y: number) => {
    setSelectedIds(ids)
    setReading(null)
    heldKeys.current.clear()
    setMenu({ x, y, ids })
  }

  const menuItems = (ids: string[]): TableMenuItem[] => {
    if (policy) {
      const pile = piles.find(item => item.id === ids[0])
      const action = policy.deckActions[ids[0]]
      const cardId = pile?.cards.at(-1)?.cardId
      return [
        { label: '크게 읽기', disabled: ids.length !== 1, run: () => inspect(ids[0]) },
        ...(action ? [{ label: action.label, disabled: !!action.disabled, run: action.run }] : []),
        ...(policy.play && cardId && isHandPile(pile!) ? [{ label: policy.play.label, disabled: !policy.play.accepts(cardId), run: () => policy.play!.run(cardId) }] : []),
      ]
    }
    const deck = ids.length === 1 && (piles.find((pile) => pile.id === ids[0])?.cards.length ?? 0) > 1
    return [
      { label: '크게 읽기', shortcut: '더블클릭', disabled: ids.length !== 1, run: () => inspect(ids[0]) },
      { label: '뒤집기', shortcut: 'F', disabled: !ids.length, run: () => changeSelected(ids, flipPile, '뒤집기') },
      { label: '손패에 넣기', disabled: !ids.length || ids.every((id) => isHandPile(piles.find((pile) => pile.id === id)!)), run: () => moveToHand(ids) },
      { label: '테이블에 내려놓기', disabled: !ids.some((id) => isHandPile(piles.find((pile) => pile.id === id)!)), run: () => putOnTable(ids) },
      { label: '한 장 펼쳐 가져오기', shortcut: '1', disabled: ids.length !== 1, run: () => reveal(ids[0]) },
      { label: '2장 중 한 장 고르기', shortcut: '2', disabled: !deck, run: () => reveal(ids[0], 2) },
      { label: '3장 중 한 장 고르기', shortcut: '3', disabled: !deck, run: () => reveal(ids[0], 3) },
      { label: '덱 섞기', shortcut: 'R', disabled: !ids.some((id) => piles.find((pile) => pile.id === id)!.cards.length > 1), run: () => changeSelected(ids, shufflePile, '덱 섞기') },
      { label: '선택한 카드 쌓기', shortcut: 'G', disabled: ids.length < 2, run: () => group(ids) },
      { label: '모두 뒷면으로', disabled: !ids.length, run: () => changeSelected(ids, coverPile, '모두 덮기') },
      { label: '되돌리기', shortcut: 'Ctrl/⌘ Z', disabled: !canUndo, run: onUndo },
      { label: '다시 하기', shortcut: 'Ctrl/⌘ ⇧ Z', disabled: !canRedo, run: onRedo },
    ]
  }

  const cancelGesture = () => {
    const current = gesture.current
    if (current) {
      setSelectedIds(current.beforeSelection)
      gesture.current = null
      if (surfaceRef.current?.hasPointerCapture(current.pointerId)) surfaceRef.current.releasePointerCapture(current.pointerId)
    }
    setPreview(null)
    setPressedPositions(null)
    setBox(null)
    suppressClick.current = true
  }

  const startCards = (event: PointerEvent<HTMLDivElement>, pile: CardPile, candidateId?: string) => {
    if (event.button !== 0 || (modal && !candidateId) || reading?.held) return
    if (policy && !candidateId && !isHandPile(pile) && (!policy.deckActions[pile.id] || policy.deckActions[pile.id].disabled)) return
    if (candidateId) {
      const rect = event.currentTarget.getBoundingClientRect()
      const bounds = surfaceRef.current!.getBoundingClientRect()
      gesture.current = { kind: 'cards', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, beforeSelection: selection, ids: [candidateId], sourceId: pile.id, candidateId, base: piles, moved: false,
        positions: new Map([[candidateId, { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width }]]) }
      suppressClick.current = false
      setPressedPositions(gesture.current.positions!)
      surfaceRef.current!.setPointerCapture(event.pointerId)
      return
    }
    const wasSelected = selection.includes(pile.id)
    const ids = event.shiftKey ? wasSelected ? selection.filter((id) => id !== pile.id) : [...selection, pile.id] : wasSelected ? selection : [pile.id]
    setSelectedIds(ids)
    suppressClick.current = false
    if (!ids.includes(pile.id)) return
    gesture.current = {
      kind: 'cards', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      beforeSelection: selection, ids, sourceId: pile.id,
      drawId: !policy && pile.cards.length > 1 && !wasSelected && !event.shiftKey ? crypto.randomUUID() : undefined,
      base: piles, moved: false,
      positions: new Map(ids.map((id) => {
        const rect = id === pile.id ? event.currentTarget.getBoundingClientRect() : pieceFor(id)?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
        const bounds = surfaceRef.current!.getBoundingClientRect()
        return [id, { x: rect.left - bounds.left - surfaceRef.current!.clientLeft, y: rect.top - bounds.top - surfaceRef.current!.clientTop, width: rect.width }]
      })),
    }
    setPressedPositions(gesture.current.positions!)
  }

  const startBox = (event: PointerEvent<HTMLDivElement>) => {
    if (policy || event.button !== 0 || modal || (event.target as HTMLElement).closest('[data-pile-id], [data-table-control], [data-table-overlay]')) return
    gesture.current = {
      kind: 'box', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      beforeSelection: selection, ids: [], base: piles, moved: false, additive: event.shiftKey,
    }
    suppressClick.current = false
  }

  const moveGesture = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    const surface = surfaceRef.current
    if (!current && surface && !modal && !reading) {
      const bounds = surface.getBoundingClientRect()
      if (event.clientY - bounds.top >= handTop) {
        const id = [...hand].reverse().find((pile) => { const pos = positionOf(pile); return event.clientX - bounds.left >= pos.x && event.clientX - bounds.left <= pos.x + pos.width })?.id
        if (id) { hoveredId.current = id; setHover(id) }
      }
    }
    if (!current || current.pointerId !== event.pointerId || !surface) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    event.preventDefault()
    surface.setPointerCapture(event.pointerId)
    const bounds = surface.getBoundingClientRect()
    if (current.candidateId) {
      current.moved = true
      setHover(null)
      const origin = current.positions!.get(current.candidateId)!
      current.handIndex = event.clientY - bounds.top >= handTop - 32 && event.clientY <= bounds.bottom && event.clientX >= bounds.left && event.clientX <= bounds.right ? hand.length : undefined
      setPreview({ piles, ids: current.ids, positions: new Map([[current.candidateId, { ...origin, x: origin.x + dx, y: origin.y + dy }]]), handIndex: current.handIndex })
      return
    }
    if (current.kind === 'box') {
      current.moved = true
      const left = Math.max(bounds.left, Math.min(current.startX, event.clientX))
      const top = Math.max(bounds.top, Math.min(current.startY, event.clientY))
      const right = Math.min(bounds.right, Math.max(current.startX, event.clientX))
      const bottom = Math.min(bounds.bottom, Math.max(current.startY, event.clientY))
      setBox({ x: left - bounds.left, y: top - bounds.top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) })
      const hit = piles.filter((pile) => {
        const rect = pieceFor(pile.id)?.getBoundingClientRect()
        return rect && rect.right > left && rect.left < right && rect.bottom > top && rect.top < bottom
      }).map((pile) => pile.id)
      setSelectedIds([...new Set([...(current.additive ? current.beforeSelection : []), ...hit])])
      return
    }
    const source = current.base.find((pile) => pile.id === current.sourceId)!
    if (!current.moved && current.drawId) {
      current.base = drawCards(current.base, current.sourceId!, [current.drawId]).map((pile) => pile.id === current.drawId ? { ...pile, x: source.x, y: source.y } : pile)
      current.ids = [current.drawId]
      current.positions!.set(current.drawId, current.positions!.get(current.sourceId!)!)
      // 놓기 전의 임시 카드 ID는 아직 기록에 없으므로 URL에 쓰지 않는다.
      setLocalSelectedIds(current.ids)
    }
    current.moved = true
    setHover(null)
    const positions = new Map(current.ids.map((id) => {
      const origin = current.positions!.get(id)!
      return [id, { ...origin, x: origin.x + dx, y: origin.y + dy }] as const
    }))
    let next = placeOnTable(current.base, current.ids).map((pile) => {
      const pos = positions.get(pile.id)
      return pos ? { ...pile,
        x: clampPosition((pos.x + pos.width / 2 - size.cardWidth / 2) / Math.max(1, size.width - size.cardWidth) * 100),
        y: clampPosition((pos.y + pos.width * .75 - size.cardWidth * .75 - 28) / Math.max(1, size.height - size.cardWidth * 1.5 - 28) * 100),
      } : pile
    })
    const inHand = event.clientY - bounds.top >= handTop - 32
    const otherHand = next.filter((pile) => isHandPile(pile) && !current.ids.includes(pile.id))
    current.handIndex = inHand ? otherHand.filter((pile) => { const pos = positionOf(pile, next); return event.clientX - bounds.left > pos.x + pos.width / 2 }).length : undefined
    if (inHand) next = placeInHand(next, current.ids, current.handIndex)
    current.targetId = inHand ? undefined : [...piles].reverse().find((pile) => {
      if (current.ids.includes(pile.id)) return false
      if (isHandPile(pile)) return false
      const rect = pieceFor(pile.id)?.getBoundingClientRect()
      return rect && Math.abs(event.clientX - (rect.left + rect.width / 2)) < rect.width * .46 && Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * .46
    })?.id
    current.next = next
    setPreview({ piles: next, ids: current.ids, positions, targetId: current.targetId, handIndex: current.handIndex })
  }

  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    gesture.current = null
    suppressClick.current = current.moved
    if (current.candidateId) {
      suppressClick.current = true
      if ((!current.moved || current.handIndex !== undefined) && choice) take(choice.sourceId, choice.count, current.candidateId)
    } else if (policy && current.kind === 'cards' && current.moved) {
      const source = piles.find(pile => pile.id === current.sourceId)
      const bounds = surfaceRef.current!.getBoundingClientRect()
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom
      if (source && inside) {
        if (!isHandPile(source)) reveal(source.id)
        else if (current.handIndex !== undefined && current.next) policy.reorderHand(current.next.filter(isHandPile).flatMap(pile => pile.cards.map(card => card.cardId)))
        else if (policy.play?.accepts(source.cards.at(-1)!.cardId)) policy.play.run(source.cards.at(-1)!.cardId)
      }
      hoveredId.current = null
    } else if (current.kind === 'cards' && current.moved && current.next) {
      if (current.drawId && current.targetId === current.sourceId) setSelectedIds(current.beforeSelection)
      else {
        const next = current.targetId ? stackSelected(current.next, current.ids, current.targetId) : current.next
        applyChange(next, current.handIndex !== undefined ? '손패에 배치' : current.drawId ? '한 장 꺼내 이동' : current.targetId ? '카드 겹쳐 쌓기' : '카드 이동', current.targetId ? [current.targetId] : current.ids)
      }
      hoveredId.current = null
    } else if (current.kind === 'box' && !current.moved) setSelectedIds([])
    else if (current.kind === 'cards' && !event.shiftKey) setSelectedIds([current.sourceId!])
    setPreview(null)
    setPressedPositions(null)
    setBox(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  useEffect(() => {
    if (helpOpen) helpRef.current?.showModal()
    else helpRef.current?.close()
  }, [helpOpen])

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      focusPile(pendingFocus.current)
      pendingFocus.current = null
    }
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement
      const editing = !!element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
      if (modal) {
        if (event.key === 'Escape') { event.preventDefault(); if (choice) cancelChoice(); else setReading(null) }
        return
      }
      if (document.querySelector('dialog[open], [popover]:popover-open') || menu || element.closest('[role="menu"]')) return
      if (element.closest('button:not(.card), summary') && ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return
      const action = tableShortcut(event, editing)
      if (!action) return
      if (policy && !['inspect', 'undo', 'redo', 'cancel', 'menu', 'left', 'right'].includes(String(action))) return
      const ids = targetIds()
      if (action === 'inspect' && !ids.length) return
      event.preventDefault()
      if (event.repeat) return
      if (action === 'cancel') {
        if (gesture.current) cancelGesture()
        else { setReading(null); setHover(null); setSelectedIds([]); heldKeys.current.clear() }
        return
      }
      if (gesture.current) return
      if (action === 'inspect') {
        heldKeys.current.add(event.code)
        inspect(pointedId() ?? ids.at(-1)!, true)
      } else if (action === 'undo' && canUndo) onUndo()
      else if (action === 'redo' && canRedo) onRedo()
      else if (action === 'selectAll') setSelectedIds(piles.map((pile) => pile.id))
      else if (action === 'help') setHelpOpen(true)
      else if (action === 'flip') changeSelected(ids, flipPile, '뒤집기')
      else if (action === 'shuffle') changeSelected(ids.filter((id) => piles.find((pile) => pile.id === id)!.cards.length > 1), shufflePile, '덱 섞기')
      else if (action === 'group') group(ids)
      else if (typeof action === 'number' && ids.length === 1) reveal(ids[0], action)
      else if (action === 'menu') {
        const rect = pieceFor(ids.at(-1) ?? '')?.getBoundingClientRect() ?? surfaceRef.current!.getBoundingClientRect()
        openMenu(ids, rect.left + Math.min(rect.width / 2, 100), rect.top + 30)
      } else if (['left', 'right', 'up', 'down'].includes(String(action)) && ids.length) {
        const handPiles = piles.filter(isHandPile)
        if (ids.length === 1 && handPiles.some((pile) => pile.id === ids[0]) && (action === 'left' || action === 'right')) {
          const index = handPiles.findIndex((pile) => pile.id === ids[0])
          const next = placeInHand(piles, ids, index + (action === 'left' ? -1 : 1))
          if (policy) policy.reorderHand(next.filter(isHandPile).flatMap(pile => pile.cards.map(card => card.cardId)))
          else applyChange(next, '손패 순서 변경', ids)
        } else if (!policy) applyChange(movePiles(placeOnTable(piles, ids), ids, action === 'left' ? -2 : action === 'right' ? 2 : 0, action === 'up' ? -2 : action === 'down' ? 2 : 0), '카드 이동', ids)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      heldKeys.current.delete(event.code)
      if (!heldKeys.current.size) setReading((value) => value?.held ? null : value)
    }
    const onBlur = () => { heldKeys.current.clear(); setReading((value) => value?.held ? null : value); setMenu(null); hoveredId.current = null; setHover(null); cancelGesture() }
    const onPointerEnd = () => { if (gesture.current) cancelGesture() }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    window.addEventListener('pointerup', onPointerEnd)
    window.addEventListener('pointercancel', onPointerEnd)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
    }
  })

  const visible = shown.map((pile) => ({ pile, top: pile.cards.at(-1)!, candidate: false }))
  if (choice) {
    const source = piles.find((pile) => pile.id === choice.sourceId)!
    for (const top of candidates) {
      const existing = visible.find((item) => item.top.cardId === top.cardId)
      if (existing) existing.candidate = true
      else visible.push({ pile: source, top, candidate: true })
    }
  }
  const closeOverlay = () => { if (choice) cancelChoice(); else { const id = reading?.id; setReading(null); pendingFocus.current = id ?? null } }
  const activeCard = !choice && !gesture.current?.moved ? visible.find(item => reading ? item.pile.id === reading.id : !modal && isHandPile(item.pile) && item.pile.id === hover) : undefined
  const rendered = [...visible.map(item => ({ ...item, floating: false })), ...(activeCard ? [{ ...activeCard, floating: true }] : [])]

  return (
    <section className={`free-table${policy ? ' free-table--governed' : ''}`}>
      {!policy && <div className="table-tools" inert={modal}>
        <span>{selection.length ? selection.length + '개 선택' : '뒷면 클릭으로 펼쳐 가져오기 · Shift+클릭으로 선택'}</span>
        <div className="table-reveal-tools" aria-label="펼쳐 보고 가져오기">
          {[1, 2, 3].map((count) => <Button key={count} type="button" disabled={selection.length !== 1} aria-label={count === 1 ? '한 장 펼쳐 가져오기' : count + '장 중 한 장 고르기'}
            onClick={() => reveal(selection[0], count)}><kbd>{count}</kbd><span>{count === 1 ? '한 장 가져오기' : count + '장 중 고르기'}</span></Button>)}
          {selection.length > 0 && <Button className="table-place-button" type="button" onClick={() => selection.every((id) => isHandPile(piles.find((pile) => pile.id === id)!)) ? putOnTable(selection) : moveToHand(selection)}>{selection.every((id) => isHandPile(piles.find((pile) => pile.id === id)!)) ? '테이블에 놓기 ↑' : '손패에 넣기 ↓'}</Button>}
        </div>
        {selection.length > 0 && <Button type="button" aria-haspopup="menu" onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          openMenu(selection, rect.left, rect.bottom + 6)
        }}>동작 ▾</Button>}
        <Button type="button" className="table-help-button" onClick={() => setHelpOpen(true)}>조작법 <kbd>?</kbd></Button>
      </div>}
      <div className={`table-surface ${reading?.held ? 'table-surface--peek' : ''} ${choice ? 'table-surface--choice' : ''}`} ref={surfaceRef} role={modal ? 'dialog' : undefined} aria-modal={modal || undefined} aria-label={choice ? '카드 골라 가져오기' : reading && !reading.held ? '카드 크게 보기' : policy?.label ?? '자유 카드 테이블'} tabIndex={-1}
        onPointerDown={startBox} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={cancelGesture}
        onLostPointerCapture={() => { if (gesture.current) cancelGesture() }}
        onContextMenu={(event) => {
          if (modal || (event.target as HTMLElement).closest('[data-pile-id]')) return
          event.preventDefault()
          openMenu(selection, event.clientX, event.clientY)
        }}
        onClickCapture={(event) => { if (suppressClick.current) { event.stopPropagation(); suppressClick.current = false } }}>
        <div className="table-watermark" aria-hidden="true"><span><Icon name="crown" size="1em" /></span><strong>왕관재판</strong><small>THE CROWN TRIAL</small></div>
        <div ref={sizeRef} className="table-card-size" aria-hidden="true" />
        <div className={`table-hand-area ${preview?.handIndex !== undefined ? 'table-hand-area--active' : ''}`} aria-label="내 손패 영역">
          <span><strong>{policy?.handLabel ?? '내 손패'} · {hand.length}</strong><small>{preview?.handIndex !== undefined ? '여기에 놓으면 손패가 정렬됩니다' : policy?.play ? `올려서 읽기 · 끌어서 순서 변경 · 위로 끌어 ${policy.play.label}` : '올려서 읽기 · 끌어서 순서 변경'}</small></span>
          {!hand.length && <div className="table-hand-area__empty">가져온 카드가 이곳에 모입니다</div>}
        </div>
        {policy?.play && <div className={`table-play-target ${preview && preview.handIndex === undefined ? 'table-play-target--active' : ''}`}><span>{policy.play.label}</span><small>손패의 카드를 이곳에 놓으세요</small></div>}
        <AnimatePresence custom={returnPositions} initial={false}>
        {size.width > 0 && rendered.map(({ pile, top, candidate, floating }, index) => {
          const card = scenario.cards.find((item) => item.id === top.cardId)!
          const home = positionOf(pile)
          const moving = !!preview?.ids.includes(candidate ? card.id : pile.id)
          const held = !!pressedPositions?.has(pile.id)
          const enlarged = floating
          const concealed = !floating && !!reading && activeCard?.top.cardId === card.id
          let position = preview?.positions.get(pile.id) ?? pressedPositions?.get(pile.id) ?? home
          if (candidate) {
            const width = Math.min(400, (size.height - 140) / 1.5, (size.width - 80 - 24 * (candidates.length - 1)) / candidates.length)
            const span = candidates.length * width + (candidates.length - 1) * 24
            position = preview?.positions.get(card.id) ?? pressedPositions?.get(card.id) ?? { x: (size.width - span) / 2 + candidates.findIndex((item) => item.cardId === top.cardId) * (width + 24), y: (size.height - width * 1.5) / 2 + 8, width }
          } else if (enlarged) {
            const width = Math.min(reading ? 500 : 340, (size.height - 110) / 1.5, size.width - 64)
            position = { x: reading ? (size.width - width) / 2 : Math.max(16, Math.min(size.width - width - 16, home.x + home.width - width / 2)), y: reading ? (size.height - width * 1.5) / 2 + 12 : Math.max(16, handTop - width * 1.5 - 24), width }
          }
          const group = cardGroups.find((item) => item.cards.some((member) => member.id === card.id))
          const stage = memoryStages.stages.find((item) => item.cardIds.includes(card.id))
          const deckAction = policy?.deckActions[pile.id]
          const backTitle = deckAction?.backTitle ?? group?.backTitle
          const backSubtitle = deckAction?.backSubtitle ?? (card.kind === 'memory' ? stage?.label : group?.backSubtitle ?? cardKinds[card.kind].label)
          return <TableCardPiece key={floating ? 'active-card-preview' : card.id} card={card} pileId={pile.id} position={position} origin={floating || candidate ? home : origins.current.get(card.id)}
            faceDown={candidate ? false : !top.faceUp} backTitle={backTitle ?? cardKinds[card.kind].label} backSubtitle={backSubtitle}
            label={deckAction?.label ?? nameOf(pile)} count={candidate ? 1 : pile.cards.length} selected={selectedIds.includes(pile.id) && !candidate}
            disabled={!!deckAction?.disabled && !candidate} disabledReason={candidate ? undefined : deckAction?.disabled}
            concealed={concealed} inHand={isHandPile(pile)}
            previewKind={floating ? reading ? 'reader' : 'hover' : undefined}
            previewed={!floating && !reading && activeCard?.top.cardId === card.id}
            moving={moving || held} raised={enlarged || candidate} target={preview?.targetId === pile.id} candidate={candidate}
            inactive={concealed || modal && !candidate && reading?.id !== pile.id}
            zIndex={floating ? 680 : candidate && moving ? 680 : candidate || reading?.id === pile.id ? 600 + index : moving ? 300 + index : selectedIds.includes(pile.id) ? 100 + index : index + 1}
            onPointerDown={(event) => startCards(event, pile, candidate ? card.id : undefined)}
            onPointerEnter={() => { if (!candidate && !modal && !gesture.current) { hoveredId.current = pile.id; if (isHandPile(pile)) setHover(pile.id) } }}
            onPointerLeave={() => { if (!candidate) { if (hoveredId.current === pile.id) hoveredId.current = null; leaveHover(pile.id) } }}
            onDoubleClick={() => { if (!modal && !suppressClick.current) inspect(pile.id) }}
            onContextMenu={(event) => { event.preventDefault(); if (!modal) openMenu(selection.includes(pile.id) ? selection : [pile.id], event.clientX, event.clientY) }}
            onClick={(event) => {
                if (candidate && choice) { take(choice.sourceId, choice.count, card.id); return }
                if (modal || event.detail > 1) return
                if (policy) {
                  if (policy.deckActions[pile.id]) reveal(pile.id)
                  else inspect(pile.id)
                  return
                }
                if (!event.shiftKey && !top.faceUp && !isHandPile(pile)) reveal(pile.id)
                else if (!event.shiftKey && !top.faceUp) changeSelected([pile.id], flipPile, '손패 뒤집기')
                else if (event.detail === 0) setSelectedIds(event.shiftKey ? selection.includes(pile.id) ? selection.filter((id) => id !== pile.id) : [...selection, pile.id] : [pile.id])
              }} />
        })}
        </AnimatePresence>
        <AnimatePresence>
          {(choice || reading) && <motion.div key="shade" className="table-overlay-shade" data-table-overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .18 }} onPointerDown={(event) => event.stopPropagation()} onClick={closeOverlay} />}
        </AnimatePresence>
        {modal && <div className="table-overlay-controls" data-table-overlay onPointerDown={(event) => event.stopPropagation()}>
          <h2>{choice ? `${candidates.length}장 중 한 장을 골라주세요` : '카드 크게 보기'}</h2>
          <div className="dialog-actions"><CopyLinkButton />{!(choice && policy) && <Button ref={overlayCloseRef} type="button" onClick={closeOverlay} aria-label={choice ? '카드 선택 취소' : '카드 닫기'}>{choice ? '취소' : '닫기'} · Esc</Button>}</div>
        </div>}
        {reading && !reading.held && policy?.play && (() => { const id = piles.find(pile => pile.id === reading.id)?.cards.at(-1)?.cardId; return id && policy.play.accepts(id) ? <Button variant="primary" className="table-reading-action" data-table-overlay onClick={() => { setReading(null); policy.play!.run(id) }}>{policy.play.label} <Icon name="arrowRight" /></Button> : null })()}
        {(choice || reading) && <p className="table-overlay-note">{choice ? policy?.choice?.note ?? '클릭하거나 손패로 끌어 한 장을 가져옵니다. 나머지는 원래 덱과 순서로 돌아갑니다.' : reading?.held ? '키를 놓으면 원래 자리로 돌아갑니다' : 'Esc 또는 빈 곳을 누르면 원래 자리로 돌아갑니다'}</p>}
        {box && <div className="table-selection-box" style={{ left: box.x, top: box.y, width: box.width, height: box.height }} />}
        {!modal && !reading && <p className="table-surface__hint" aria-live="polite">{preview?.handIndex !== undefined ? '놓으면 손패에 정렬됩니다 · Esc로 취소' : policy ? policy.hint : preview?.targetId ? '놓으면 이 묶음 위에 쌓입니다' : preview ? '놓아 배치 · Esc로 취소' : '1 한 장 가져오기 · 2 / 3 펼쳐 보고 고르기 · F 뒤집기 · Space 확대 · 우클릭 메뉴'}</p>}
      </div>
      {menu && <TableContextMenu x={menu.x} y={menu.y} items={menuItems(menu.ids)} onClose={closeMenu} />}
      <dialog className="table-help" ref={helpRef} aria-label="테이블 조작법" onClose={() => setHelpOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setHelpOpen(false) }}>
        <div><header><h2>카드만, 자연스럽게.</h2><div className="dialog-actions"><CopyLinkButton /><Button onClick={() => setHelpOpen(false)} aria-label="조작법 닫기">닫기 <Icon name="close" /></Button></div></header>
          <dl>{tableHelp.map(([keys, description]) => <div key={keys}><dt>{keys}</dt><dd>{description}</dd></div>)}</dl>
          <p>확대는 뒤집기가 아닙니다. 뒷면 카드는 확대해도 뒷면입니다.</p>
        </div>
      </dialog>
    </section>
  )
}
