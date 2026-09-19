import { useEffect, useRef, type ReactNode } from 'react'
import type { Card } from '../domain/types'
import { cardKinds } from './cardKinds'

interface Props {
  card: Card
  onClick?: () => void
  faceDown?: boolean
  backLabel?: string
}

export function CardView({ card, onClick, faceDown, backLabel }: Props) {
  const Surface = onClick ? 'button' : 'article'
  if (faceDown) return (
    <Surface className="card card--back" onClick={onClick} aria-label={backLabel ?? '뒷면 카드'}>
      <span className="card-back__edition">CROWN TRIAL</span>
      <span className="card-back__seal" aria-hidden="true">♛</span>
      <span className="card-back__caption">왕관재판</span>
    </Surface>
  )
  return (
    <Surface className={`card card--${card.kind}`} onClick={onClick}>
      <span className="card__kind">{cardKinds[card.kind].label}</span>
      <h3>{card.title}</h3>
      <p className="card__text">{card.text}</p>
      <div className="card__tags">{card.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    </Surface>
  )
}

export function CardReader({ card, onClose, children }: { card?: Card; onClose: () => void; children?: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (card) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [card])

  return <dialog ref={dialogRef} className="card-reader" aria-label={card ? `${card.title} 크게 보기` : '카드 크게 보기'} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    {card && <div className="card-reader__sheet">
      <button type="button" className="card-reader__close" onClick={onClose} aria-label="카드 닫기">닫기 ×</button>
      <CardView card={card} />
      {children}
    </div>}
  </dialog>
}
