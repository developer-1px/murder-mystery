import type { Card, CardState } from '../domain/types'

const kindLabel = { memory: '기억', rumor: '소문', evidence: '물증', testimony: '증언' }

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
      <span className="card__kind">{kindLabel[card.kind]}</span>
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
