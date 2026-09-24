import { motion, useIsPresent, usePresenceData, useReducedMotion } from 'motion/react'
import type { PointerEvent, MouseEvent } from 'react'
import type { Card } from '../domain/types'
import { CardView } from './CardView'

export interface CardPosition { x: number; y: number; width: number }
export interface CardDestination extends CardPosition { faceDown: boolean }

// The card ID stays mounted across deck, hand, hover, reading and choice states.
export function TableCardPiece({ card, pileId, position, origin, faceDown, backTitle, backSubtitle, label, count, selected, moving, raised, target, candidate, inactive, disabled, disabledReason, concealed, inHand, previewKind, previewed, zIndex, onPointerDown, onPointerEnter, onPointerLeave, onClick, onDoubleClick, onContextMenu }: {
  card: Card; pileId: string; position: CardPosition; origin?: CardPosition; faceDown: boolean
  backTitle: string; backSubtitle?: string; label: string; count: number
  selected: boolean; moving: boolean; raised: boolean; target: boolean; candidate: boolean; inactive: boolean; zIndex: number
  disabled?: boolean; disabledReason?: string
  concealed?: boolean; inHand?: boolean
  previewKind?: 'hover' | 'reader'; previewed?: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
  onPointerEnter: () => void; onPointerLeave: () => void
  onClick: (event: MouseEvent<HTMLElement>) => void
  onDoubleClick: () => void; onContextMenu: (event: MouseEvent<HTMLDivElement>) => void
}) {
  const present = useIsPresent()
  const destinations = usePresenceData() as Map<string, CardDestination> | undefined
  const destination = destinations?.get(card.id) ?? { ...position, faceDown }
  const reduced = useReducedMotion()
  const back = present ? faceDown : destination.faceDown
  return <motion.div data-pile-id={pileId} data-card-id={card.id} data-choice-card={candidate || undefined} data-card-zone={inHand ? 'hand' : 'table'} data-card-preview={previewKind}
    inert={inactive || !present} aria-hidden={inactive || !present || previewKind === 'hover' || undefined}
    title={disabledReason}
    className={['table-piece', previewed && 'table-piece--previewed', disabled && 'table-piece--disabled', count > 1 && 'table-piece--deck', selected && 'table-piece--selected', moving && 'table-piece--dragging', raised && 'table-piece--raised', target && 'table-piece--target'].filter(Boolean).join(' ')}
    initial={origin ? { ...origin, opacity: 1 } : false}
    animate={{ ...position, opacity: 1 }}
    exit={{ x: destination.x, y: destination.y, width: destination.width, opacity: 0, transition: { duration: reduced ? 0 : .26, opacity: { delay: reduced ? 0 : .18, duration: .08 } } }}
    transition={moving || reduced ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 42, mass: .85 }}
    style={{ zIndex, pointerEvents: !present ? 'none' : undefined, visibility: concealed ? 'hidden' : undefined }}
    onPointerDown={onPointerDown} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
    onDoubleClick={onDoubleClick} onContextMenu={onContextMenu}>
    <div className="table-piece__label"><span title={label}>{label}</span><b>{count}장</b></div>
    <motion.div className="table-piece__cards" key={back ? 'back' : 'front'}
      initial={reduced ? false : { rotateY: 85 }} animate={{ rotateY: 0 }} transition={{ duration: reduced ? 0 : .2, ease: 'easeOut' }}>
      <CardView card={card} selected={selected} faceDown={back} backTitle={backTitle} backSubtitle={backSubtitle}
        disabled={disabled} tabIndex={previewKind === 'hover' ? -1 : undefined} backLabel={label + ' · ' + count + '장 펼쳐 가져오기'} onClick={onClick} />
    </motion.div>
  </motion.div>
}
