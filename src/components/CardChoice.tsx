import { useEffect, useRef, type CSSProperties } from 'react'
import type { Card } from '../domain/types'
import { CardView } from './CardView'

export function CardChoice({ cards, onPick, onCancel }: { cards: Card[]; onPick: (id: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return <dialog ref={ref} className="card-choice" aria-label="카드 골라 가져오기"
    style={{ '--choice-count': cards.length } as CSSProperties}
    onCancel={(event) => { event.preventDefault(); onCancel() }}
    onClick={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <header><div><span className="eyebrow">REVEAL & PICK</span><h2>{cards.length}장 중 한 장을 골라주세요</h2></div><button type="button" onClick={onCancel}>취소 · Esc</button></header>
    <div className="card-choice__cards">
      {cards.map((card) => <CardView key={card.id} card={card} onClick={() => onPick(card.id)} />)}
    </div>
    <p>카드를 누르면 내 손패로 가져옵니다. 나머지는 원래 덱에 뒷면으로 돌아갑니다.</p>
  </dialog>
}
