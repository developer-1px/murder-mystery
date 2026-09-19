import { useRef, useState, type PointerEvent } from 'react'
import type { Scenario } from '../domain/types'
import { clampPosition, coverPile, drawCard, flipTop, movePile, shufflePile, stackPiles, type CardPile } from '../domain/table'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'

interface Props {
  scenario: Scenario
  piles: CardPile[]
  onChange: (piles: CardPile[], label: string) => void
}

interface Drag {
  id: string
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  moved: boolean
}

export function CardTable({ scenario, piles, onChange }: Props) {
  const [readingId, setReadingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ id: string; x: number; y: number; targetId?: string } | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const pieces = useRef(new Map<string, HTMLDivElement>())
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const selected = piles.find((pile) => pile.id === selectedId)
  const readingCard = scenario.cards.find((card) => card.id === readingId && piles.some((pile) => pile.cards.at(-1)?.cardId === card.id && pile.cards.at(-1)?.faceUp))

  const nameOf = (pile: CardPile) => {
    const kinds = new Set(pile.cards.map((item) => scenario.cards.find((card) => card.id === item.cardId)!.kind))
    return `${kinds.size === 1 ? cardKinds[[...kinds][0]].label : '혼합'} ${pile.cards.length > 1 ? '덱' : '카드'}`
  }

  const draw = (pile: CardPile) => {
    const id = crypto.randomUUID()
    onChange(drawCard(piles, pile.id, id), '한 장 꺼내기')
    setSelectedId(id)
  }

  const startDrag = (event: PointerEvent<HTMLDivElement>, pile: CardPile) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('[data-table-control]')) return
    suppressClick.current = false
    setSelectedId(pile.id)
    drag.current = { id: pile.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: pile.x, y: pile.y, moved: false }
  }

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    const surface = surfaceRef.current
    if (!current || current.pointerId !== event.pointerId || !surface) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    current.moved = true
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    const width = event.currentTarget.offsetWidth
    const height = event.currentTarget.offsetHeight
    const x = clampPosition(current.x + dx / Math.max(1, surface.clientWidth - width) * 100)
    const y = clampPosition(current.y + dy / Math.max(1, surface.clientHeight - height) * 100)
    const bounds = surface.getBoundingClientRect()
    const centerX = bounds.left + (surface.clientWidth - width) * x / 100 + width / 2
    const centerY = bounds.top + (surface.clientHeight - height) * y / 100 + height / 2
    const target = [...piles].reverse().find((pile) => {
      if (pile.id === current.id) return false
      const rect = pieces.current.get(pile.id)?.getBoundingClientRect()
      return rect && Math.abs(centerX - (rect.left + rect.width / 2)) < rect.width * .42 && Math.abs(centerY - (rect.top + rect.height / 2)) < rect.height * .42
    })
    setPreview({ id: current.id, x, y, targetId: target?.id })
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (current.moved) {
      suppressClick.current = true
      if (!cancelled && preview) {
        if (preview.targetId) {
          onChange(stackPiles(piles, current.id, preview.targetId), '카드 겹쳐 쌓기')
          setSelectedId(preview.targetId)
        } else onChange(movePile(piles, current.id, preview.x, preview.y), '카드 이동')
      }
    }
    drag.current = null
    setPreview(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <section className="free-table">
      <div className="table-tools">
        <span>{selected ? `${nameOf(selected)} · ${selected.cards.length}장` : '카드를 자유롭게 놓아보세요'}</span>
        {selected && <div className="table-tools__actions">
          <button onClick={() => onChange(flipTop(piles, selected.id), '카드 뒤집기')}>뒤집기</button>
          {selected.cards.length > 1 && <>
            <button onClick={() => draw(selected)}>한 장 꺼내기</button>
            <button onClick={() => onChange(shufflePile(piles, selected.id), '덱 섞기')}>섞기</button>
            <button onClick={() => onChange(coverPile(piles, selected.id), '덱 모두 덮기')}>모두 덮기</button>
          </>}
          {piles.length > 1 && <select aria-label="다른 묶음 위에 쌓기" value="" onChange={(event) => {
            if (!event.target.value) return
            onChange(stackPiles(piles, selected.id, event.target.value), '카드 겹쳐 쌓기')
            setSelectedId(event.target.value)
          }}>
            <option value="">다른 묶음 위에 쌓기…</option>
            {piles.map((pile, index) => pile.id !== selected.id && <option key={pile.id} value={pile.id}>{nameOf(pile)} {index + 1} · {pile.cards.length}장</option>)}
          </select>}
        </div>}
      </div>
        <div className="table-surface" ref={surfaceRef} aria-label="자유 카드 테이블" onClick={(event) => { if (event.target === event.currentTarget) setSelectedId(null) }}>
          <div className="table-watermark" aria-hidden="true"><span>♛</span><strong>왕관재판</strong><small>THE CROWN TRIAL</small></div>
          {piles.map((pile, index) => {
            const top = pile.cards.at(-1)!
            const card = scenario.cards.find((item) => item.id === top.cardId)!
            const position = preview?.id === pile.id ? preview : pile
            const isDeck = pile.cards.length > 1
            const label = `${nameOf(pile)} ${index + 1} · ${pile.cards.length}장`
            return (
              <div key={pile.id} ref={(element) => { if (element) pieces.current.set(pile.id, element); else pieces.current.delete(pile.id) }}
                className={`table-piece ${isDeck ? 'table-piece--deck' : ''} ${selectedId === pile.id ? 'table-piece--selected' : ''} ${preview?.id === pile.id ? 'table-piece--dragging' : ''} ${preview?.targetId === pile.id ? 'table-piece--target' : ''}`}
                style={{ left: `${position.x}%`, top: `${position.y}%`, transform: `translate(-${position.x}%, -${position.y}%)`, zIndex: selectedId === pile.id ? 100 : index + 1 }}
                onPointerDown={(event) => startDrag(event, pile)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={(event) => endDrag(event, true)}
                onClickCapture={(event) => { if (suppressClick.current) { event.stopPropagation(); suppressClick.current = false } }}
                onDoubleClick={(event) => { if ((event.target as HTMLElement).closest('[data-table-control]')) return; if (isDeck && !top.faceUp) draw(pile) }}
                onKeyDown={(event) => {
                  if ((event.target as HTMLElement).closest('[data-table-control]')) return
                  const direction = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key]
                  if (direction) { setSelectedId(pile.id); event.preventDefault(); onChange(movePile(piles, pile.id, pile.x + direction[0], pile.y + direction[1]), '카드 이동') }
                  if (event.key.toLowerCase() === 'f') { setSelectedId(pile.id); event.preventDefault(); onChange(flipTop(piles, pile.id), '카드 뒤집기') }
                  if (event.key === 'Escape') { drag.current = null; setPreview(null) }
                }}>
                <div className="table-piece__label"><span>{nameOf(pile)}</span><b>{pile.cards.length}장</b></div>
                <div className="table-piece__cards"><CardView card={card} faceDown={!top.faceUp} backLabel={`${label} ${isDeck ? '선택' : '펼치기'}`} onClick={() => {
                  setSelectedId(pile.id)
                  if (top.faceUp) setReadingId(card.id)
                  else if (!isDeck) onChange(flipTop(piles, pile.id), '카드 뒤집기')
                }} /></div>
                <div className="table-piece__tools" data-table-control>
                  {isDeck && <button type="button" aria-label={`${label} 한 장 꺼내기`} onClick={() => draw(pile)}>1장 꺼내기</button>}
                  <button type="button" aria-label={`${label} ${isDeck ? '맨 위 ' : ''}뒤집기`} onClick={() => { setSelectedId(pile.id); onChange(flipTop(piles, pile.id), '카드 뒤집기') }}>↻ {isDeck ? '맨 위' : '뒤집기'}</button>
                </div>
              </div>
            )
          })}
          <p className="table-surface__hint" aria-live="polite">{preview?.targetId ? '여기에 놓으면 하나의 덱으로 쌓입니다' : '드래그로 이동 · 겹쳐 쌓기 · 카드를 눌러 펼치고 크게 읽기 · F로 뒤집기'}</p>
        </div>
      <CardReader card={readingCard} onClose={() => setReadingId(null)} />
    </section>
  )
}
