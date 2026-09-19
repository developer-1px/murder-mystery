import { useEffect, useLayoutEffect, useRef, type MouseEventHandler, type ReactNode } from 'react'
import type { Card } from '../domain/types'
import { cardKinds } from './cardKinds'

interface Props {
  card: Card
  onClick?: MouseEventHandler<HTMLElement>
  selected?: boolean
  faceDown?: boolean
  backLabel?: string
}

export function CardView({ card, onClick, selected, faceDown, backLabel }: Props) {
  const ref = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || faceDown) return
    const face = root.querySelector<HTMLElement>('.card__face')!
    let active = true
    const fit = () => {
      if (!active || !face.clientHeight || !face.clientWidth) return
      const overflows = () => face.scrollHeight > face.clientHeight + 1 || face.scrollWidth > face.clientWidth + 1
      face.style.setProperty('--fit', '1')
      if (!overflows()) return
      let low = .05
      let high = 1
      for (let step = 0; step < 12; step++) {
        const middle = (low + high) / 2
        face.style.setProperty('--fit', String(middle))
        if (overflows()) high = middle
        else low = middle
      }
      face.style.setProperty('--fit', String(low))
    }
    fit()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(fit)
    observer?.observe(root)
    document.fonts?.ready.then(fit)
    document.fonts?.addEventListener('loadingdone', fit)
    return () => { active = false; observer?.disconnect(); document.fonts?.removeEventListener('loadingdone', fit) }
  }, [card, faceDown])

  const Surface = onClick ? 'button' : 'article'
  return (
    <Surface ref={(element) => { ref.current = element }} className={`card card--${faceDown ? 'back' : card.kind}`}
      onClick={onClick} aria-pressed={selected} aria-label={faceDown ? backLabel ?? '뒷면 카드' : undefined}>
      <div className="card__face">
        {faceDown ? <>
          <span className="card-back__edition">CROWN TRIAL</span>
          <span className="card-back__seal" aria-hidden="true">♛</span>
          <span className="card-back__caption">왕관재판</span>
        </> : <>
          <span className="card__kind">{cardKinds[card.kind].label}</span>
          <h3>{card.title}</h3>
          <p className="card__text">{card.text}</p>
          <div className="card__tags">{card.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        </>}
      </div>
    </Surface>
  )
}

export function CardReader({ card, faceDown = false, onClose, children }: { card?: Card; faceDown?: boolean; onClose: () => void; children?: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (card) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [card])

  return <dialog ref={dialogRef} className="card-reader" aria-label={faceDown ? '뒷면 카드 크게 보기' : card ? `${card.title} 크게 보기` : '카드 크게 보기'} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    {card && <div className="card-reader__sheet">
      <button type="button" className="card-reader__close" onClick={onClose} aria-label="카드 닫기">닫기 ×</button>
      <CardView card={card} faceDown={faceDown} />
      {!faceDown && children}
    </div>}
  </dialog>
}
