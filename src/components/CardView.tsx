import type { Card, CardState } from '../domain/types'
import { cardKinds } from './cardKinds'

interface Props {
  card: Card
  state?: CardState
  compact?: boolean
  selected?: boolean
  onClick?: () => void
  designer?: boolean
}

export function CardView({ card, state, compact, selected, onClick, designer }: Props) {
  return (
    <button className={`card card--${card.kind} ${compact ? 'card--compact' : ''} ${selected ? 'card--selected' : ''}`} onClick={onClick} type="button">
      <span className="card__kind">{cardKinds[card.kind].label}</span>
      <h3>{card.title}</h3>
      {!compact && <p className="card__text">{card.text}</p>}
      <div className="card__tags">{card.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      {designer && state && (
        <div className="card__meta">
          <code>{card.id}</code>
          <span>{state.zone}{state.ownerId ? ` · ${state.ownerId}` : ''}</span>
        </div>
      )}
    </button>
  )
}
