import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import type { Scenario } from '../domain/types'
import { cardCandidates, coverPile, drawCards, flipPile, movePiles, shufflePile, stackSelected, takeCandidate, type CardPile } from '../domain/table'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'
import { tableHelp, tableShortcut } from './tableInput'
import { TableContextMenu, type TableMenuItem } from './TableContextMenu'
import { CardChoice } from './CardChoice'

interface Props {
  scenario: Scenario
  piles: CardPile[]
  onChange: (piles: CardPile[], label: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
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
}

export function CardTable({ scenario, piles, onChange, onUndo, onRedo, canUndo, canRedo }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reading, setReading] = useState<{ id: string; held: boolean } | null>(null)
  const [preview, setPreview] = useState<{ piles: CardPile[]; ids: string[]; targetId?: string } | null>(null)
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; ids: string[] } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [choice, setChoice] = useState<{ sourceId: string; count: number; base: CardPile[] } | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDialogElement>(null)
  const pieces = useRef(new Map<string, HTMLDivElement>())
  const gesture = useRef<Gesture | null>(null)
  const hoveredId = useRef<string | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const heldKeys = useRef(new Set<string>())
  const suppressClick = useRef(false)
  const shown = preview?.piles ?? piles
  const selection = selectedIds.filter((id) => piles.some((pile) => pile.id === id))
  const readingPile = piles.find((pile) => pile.id === reading?.id)
  const readingTop = readingPile?.cards.at(-1)
  const readingCard = scenario.cards.find((card) => card.id === readingTop?.cardId)
  const candidates = choice?.base === piles ? cardCandidates(piles, choice.sourceId, choice.count) : []

  const nameOf = (pile: CardPile) => {
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
    if (id) pieces.current.get(id)?.querySelector<HTMLButtonElement>('.card')?.focus({ preventScroll: true })
  }

  const closeMenu = () => {
    if (menu?.ids.length) focusPile(menu.ids.at(-1))
    else surfaceRef.current?.focus({ preventScroll: true })
    setMenu(null)
  }

  const inspect = (id: string, held = false) => {
    setReading({ id, held })
    if (!held) heldKeys.current.clear()
  }

  const take = (sourceId: string, count: number, cardId: string) => {
    const id = crypto.randomUUID()
    const next = takeCandidate(piles, sourceId, count, cardId, id)
    if (next === piles) return
    setChoice(null)
    onChange(next, count === 1 ? '펼쳐서 손패로 가져오기' : count + '장 중 한 장 가져오기')
    setSelectedIds([id])
    hoveredId.current = null
    pendingFocus.current = id
    inspect(id)
  }

  const reveal = (id: string, count = 1) => {
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
    const id = choice?.sourceId
    setChoice(null)
    focusPile(id)
  }

  const changeSelected = (ids: string[], operation: (piles: CardPile[], id: string) => CardPile[], label: string) => {
    if (!ids.length) return
    onChange(ids.reduce((next, id) => operation(next, id), piles), label)
    setSelectedIds(ids)
  }

  const group = (ids: string[]) => {
    if (ids.length < 2) return
    const target = ids.at(-1)!
    onChange(stackSelected(piles, ids, target), '선택한 카드 쌓기')
    setSelectedIds([target])
  }

  const openMenu = (ids: string[], x: number, y: number) => {
    setSelectedIds(ids)
    setReading(null)
    heldKeys.current.clear()
    setMenu({ x, y, ids })
  }

  const menuItems = (ids: string[]): TableMenuItem[] => {
    const deck = ids.length === 1 && (piles.find((pile) => pile.id === ids[0])?.cards.length ?? 0) > 1
    return [
      { label: '크게 읽기', shortcut: '더블클릭', disabled: ids.length !== 1, run: () => inspect(ids[0]) },
      { label: '뒤집기', shortcut: 'F', disabled: !ids.length, run: () => changeSelected(ids, flipPile, '뒤집기') },
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
    setBox(null)
    suppressClick.current = true
  }

  const startCards = (event: PointerEvent<HTMLDivElement>, pile: CardPile) => {
    if (event.button !== 0) return
    const wasSelected = selection.includes(pile.id)
    const ids = event.shiftKey ? wasSelected ? selection.filter((id) => id !== pile.id) : [...selection, pile.id] : wasSelected ? selection : [pile.id]
    setSelectedIds(ids)
    suppressClick.current = false
    if (!ids.includes(pile.id)) return
    gesture.current = {
      kind: 'cards', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      beforeSelection: selection, ids, sourceId: pile.id,
      drawId: pile.cards.length > 1 && !wasSelected && !event.shiftKey ? crypto.randomUUID() : undefined,
      base: piles, moved: false,
    }
  }

  const startBox = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-pile-id], [data-table-control]')) return
    gesture.current = {
      kind: 'box', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      beforeSelection: selection, ids: [], base: piles, moved: false, additive: event.shiftKey,
    }
    suppressClick.current = false
  }

  const moveGesture = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    const surface = surfaceRef.current
    if (!current || current.pointerId !== event.pointerId || !surface) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    event.preventDefault()
    surface.setPointerCapture(event.pointerId)
    const bounds = surface.getBoundingClientRect()
    if (current.kind === 'box') {
      current.moved = true
      const left = Math.max(bounds.left, Math.min(current.startX, event.clientX))
      const top = Math.max(bounds.top, Math.min(current.startY, event.clientY))
      const right = Math.min(bounds.right, Math.max(current.startX, event.clientX))
      const bottom = Math.min(bounds.bottom, Math.max(current.startY, event.clientY))
      setBox({ x: left - bounds.left, y: top - bounds.top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) })
      const hit = piles.filter((pile) => {
        const rect = pieces.current.get(pile.id)?.getBoundingClientRect()
        return rect && rect.right > left && rect.left < right && rect.bottom > top && rect.top < bottom
      }).map((pile) => pile.id)
      setSelectedIds([...new Set([...(current.additive ? current.beforeSelection : []), ...hit])])
      return
    }
    const source = current.base.find((pile) => pile.id === current.sourceId)!
    const element = pieces.current.get(current.sourceId!)!
    const width = element.offsetWidth
    const height = element.offsetHeight
    if (!current.moved && current.drawId) {
      current.base = drawCards(current.base, current.sourceId!, [current.drawId]).map((pile) => pile.id === current.drawId ? { ...pile, x: source.x, y: source.y } : pile)
      current.ids = [current.drawId]
      setSelectedIds(current.ids)
    }
    current.moved = true
    const next = movePiles(current.base, current.ids, dx / Math.max(1, surface.clientWidth - width) * 100, dy / Math.max(1, surface.clientHeight - height) * 100)
    const moving = next.find((pile) => pile.id === (current.drawId ?? current.sourceId))!
    const centerX = bounds.left + (surface.clientWidth - width) * moving.x / 100 + width / 2
    const centerY = bounds.top + (surface.clientHeight - height) * moving.y / 100 + height / 2
    current.targetId = [...piles].reverse().find((pile) => {
      if (current.ids.includes(pile.id)) return false
      const rect = pieces.current.get(pile.id)?.getBoundingClientRect()
      return rect && Math.abs(centerX - (rect.left + rect.width / 2)) < rect.width * .38 && Math.abs(centerY - (rect.top + rect.height / 2)) < rect.height * .38
    })?.id
    current.next = next
    setPreview({ piles: next, ids: current.ids, targetId: current.targetId })
  }

  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    gesture.current = null
    suppressClick.current = current.moved
    if (current.kind === 'cards' && current.moved && current.next) {
      if (current.drawId && current.targetId === current.sourceId) setSelectedIds(current.beforeSelection)
      else {
        const next = current.targetId ? stackSelected(current.next, current.ids, current.targetId) : current.next
        onChange(next, current.drawId ? '한 장 꺼내 이동' : current.targetId ? '카드 겹쳐 쌓기' : '카드 이동')
        setSelectedIds(current.targetId ? [current.targetId] : current.ids)
      }
      hoveredId.current = null
    } else if (current.kind === 'box' && !current.moved) setSelectedIds([])
    else if (current.kind === 'cards' && !event.shiftKey) setSelectedIds([current.sourceId!])
    setPreview(null)
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
      if (document.querySelector('dialog[open]') || menu || element.closest('[role="menu"]')) return
      if (element.closest('button:not(.card), summary') && ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) return
      const action = tableShortcut(event, editing)
      if (!action) return
      const ids = targetIds()
      if (action === 'inspect' && !ids.length) return
      event.preventDefault()
      if (event.repeat) return
      if (action === 'cancel') {
        if (gesture.current) cancelGesture()
        else { setReading(null); setSelectedIds([]); heldKeys.current.clear() }
        return
      }
      if (gesture.current) return
      if (action === 'inspect') {
        heldKeys.current.add(event.code)
        inspect(pointedId() ?? ids.at(-1)!, true)
      } else if (action === 'undo') onUndo()
      else if (action === 'redo') onRedo()
      else if (action === 'selectAll') setSelectedIds(piles.map((pile) => pile.id))
      else if (action === 'help') setHelpOpen(true)
      else if (action === 'flip') changeSelected(ids, flipPile, '뒤집기')
      else if (action === 'shuffle') changeSelected(ids.filter((id) => piles.find((pile) => pile.id === id)!.cards.length > 1), shufflePile, '덱 섞기')
      else if (action === 'group') group(ids)
      else if (typeof action === 'number' && ids.length === 1) reveal(ids[0], action)
      else if (action === 'menu') {
        const rect = pieces.current.get(ids.at(-1) ?? '')?.getBoundingClientRect() ?? surfaceRef.current!.getBoundingClientRect()
        openMenu(ids, rect.left + Math.min(rect.width / 2, 100), rect.top + 30)
      } else if (['left', 'right', 'up', 'down'].includes(String(action)) && ids.length) {
        onChange(movePiles(piles, ids, action === 'left' ? -2 : action === 'right' ? 2 : 0, action === 'up' ? -2 : action === 'down' ? 2 : 0), '카드 이동')
        setSelectedIds(ids)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      heldKeys.current.delete(event.code)
      if (!heldKeys.current.size) setReading((value) => value?.held ? null : value)
    }
    const onBlur = () => { heldKeys.current.clear(); setReading((value) => value?.held ? null : value); setMenu(null); hoveredId.current = null; cancelGesture() }
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

  return (
    <section className="free-table">
      <div className="table-tools">
        <span>{selection.length ? selection.length + '개 선택' : '뒷면 클릭으로 펼쳐 가져오기 · Shift+클릭으로 선택'}</span>
        <div className="table-reveal-tools" aria-label="펼쳐 보고 가져오기">
          {[1, 2, 3].map((count) => <button key={count} type="button" disabled={selection.length !== 1} aria-label={count === 1 ? '한 장 펼쳐 가져오기' : count + '장 중 한 장 고르기'}
            onClick={() => reveal(selection[0], count)}><kbd>{count}</kbd><span>{count === 1 ? '한 장 가져오기' : count + '장 중 고르기'}</span></button>)}
        </div>
        {selection.length > 0 && <button type="button" aria-haspopup="menu" onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          openMenu(selection, rect.left, rect.bottom + 6)
        }}>동작 ▾</button>}
        <button type="button" className="table-help-button" onClick={() => setHelpOpen(true)}>조작법 <kbd>?</kbd></button>
      </div>
      <div className="table-surface" ref={surfaceRef} aria-label="자유 카드 테이블" tabIndex={-1}
        onPointerDown={startBox} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={cancelGesture}
        onLostPointerCapture={() => { if (gesture.current) cancelGesture() }}
        onContextMenu={(event) => {
          if ((event.target as HTMLElement).closest('[data-pile-id]')) return
          event.preventDefault()
          openMenu(selection, event.clientX, event.clientY)
        }}
        onClickCapture={(event) => { if (suppressClick.current) { event.stopPropagation(); suppressClick.current = false } }}>
        <div className="table-watermark" aria-hidden="true"><span>♛</span><strong>왕관재판</strong><small>THE CROWN TRIAL</small></div>
        <div className="table-hand-area" aria-label="내 손패 영역"><span>내 손패 <small>가져온 카드도 자유롭게 옮길 수 있습니다</small></span></div>
        {shown.map((pile, index) => {
          const top = pile.cards.at(-1)!
          const card = scenario.cards.find((item) => item.id === top.cardId)!
          const label = nameOf(pile) + ' ' + (index + 1) + ' · ' + pile.cards.length + '장'
          return <div key={pile.id} data-pile-id={pile.id} ref={(element) => { if (element) pieces.current.set(pile.id, element); else pieces.current.delete(pile.id) }}
            className={['table-piece', pile.cards.length > 1 && 'table-piece--deck', selectedIds.includes(pile.id) && 'table-piece--selected', preview?.ids.includes(pile.id) && 'table-piece--dragging', preview?.targetId === pile.id && 'table-piece--target'].filter(Boolean).join(' ')}
            style={{ left: pile.x + '%', top: pile.y + '%', transform: 'translate(-' + pile.x + '%, -' + pile.y + '%)', zIndex: preview?.ids.includes(pile.id) ? 200 + index : selectedIds.includes(pile.id) ? 100 + index : index + 1 }}
            onPointerDown={(event) => startCards(event, pile)}
            onPointerEnter={() => { hoveredId.current = pile.id }}
            onPointerLeave={() => { if (hoveredId.current === pile.id) hoveredId.current = null }}
            onDoubleClick={() => { if (!suppressClick.current) inspect(pile.id) }}
            onContextMenu={(event) => { event.preventDefault(); openMenu(selection.includes(pile.id) ? selection : [pile.id], event.clientX, event.clientY) }}>
            <div className="table-piece__label"><span>{nameOf(pile)}</span><b>{pile.cards.length}장</b></div>
            <div className="table-piece__cards"><CardView card={card} selected={selectedIds.includes(pile.id)} faceDown={!top.faceUp} backLabel={label + ' 펼쳐 가져오기'}
              onClick={(event) => {
                if (event.detail > 1) return
                if (!event.shiftKey && !top.faceUp) reveal(pile.id)
                else if (event.detail === 0) setSelectedIds(event.shiftKey ? selection.includes(pile.id) ? selection.filter((id) => id !== pile.id) : [...selection, pile.id] : [pile.id])
              }} /></div>
          </div>
        })}
        {box && <div className="table-selection-box" style={{ left: box.x, top: box.y, width: box.width, height: box.height }} />}
        <p className="table-surface__hint" aria-live="polite">{preview?.targetId ? '놓으면 이 묶음 위에 쌓입니다' : preview ? '놓아 배치 · Esc로 취소' : '1 한 장 가져오기 · 2 / 3 펼쳐 보고 고르기 · F 뒤집기 · Space 확대 · 우클릭 메뉴'}</p>
      </div>
      {menu && <TableContextMenu x={menu.x} y={menu.y} items={menuItems(menu.ids)} onClose={closeMenu} />}
      <CardReader card={reading?.held ? undefined : readingCard} faceDown={!readingTop?.faceUp} onClose={() => setReading(null)} />
      {choice && candidates.length > 0 && <CardChoice cards={candidates.map((item) => scenario.cards.find((card) => card.id === item.cardId)!)}
        onPick={(id) => take(choice.sourceId, choice.count, id)} onCancel={cancelChoice} />}
      {reading?.held && readingCard && <div className="card-peek" role="region" aria-label="카드 잠깐 확대">
        <div><CardView card={readingCard} faceDown={!readingTop?.faceUp} /><p>키를 놓으면 테이블로 돌아갑니다</p></div>
      </div>}
      <dialog className="table-help" ref={helpRef} aria-label="테이블 조작법" onClose={() => setHelpOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setHelpOpen(false) }}>
        <div><header><h2>카드만, 자연스럽게.</h2><button onClick={() => setHelpOpen(false)} aria-label="조작법 닫기">닫기 ×</button></header>
          <dl>{tableHelp.map(([keys, description]) => <div key={keys}><dt>{keys}</dt><dd>{description}</dd></div>)}</dl>
          <p>확대는 뒤집기가 아닙니다. 뒷면 카드는 확대해도 뒷면입니다.</p>
        </div>
      </dialog>
    </section>
  )
}
