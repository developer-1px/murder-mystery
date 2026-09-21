import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import type { Card, Scenario, TimelineDocument } from '../domain/types'
import { MissingRoute, segment } from '../routing'
import { CardReader } from './CardView'
import { cardKinds } from './cardKinds'

export function TimelineBoard({ scenario, document }: { scenario: Scenario; document: TimelineDocument }) {
  const { cardId } = useParams()
  const navigate = useNavigate()
  const cardsById = useMemo(() => new Map(scenario.cards.map((card) => [card.id, card])), [scenario.cards])
  const selected = cardId ? cardsById.get(cardId) : undefined
  const columns = scenario.characters.map((character) => ({ id: character.id, label: character.name }))
  const references = document.rows.flatMap((row) => row.cardIds)
  const placed = new Set(references)
  const duplicates = references.length - placed.size
  const missing = scenario.cards.filter((card) => !placed.has(card.id))

  if (cardId && !selected) return <MissingRoute message="타임라인에 표시할 카드를 찾을 수 없습니다." to="/timeline" label="타임라인으로" />

  return <section className="timeline-board">
    <header className="timeline-board__header">
      <div><span className="eyebrow">DESIGNER ONLY · 사건 재구성</span><h2>시간대 × 인물 카드 분류표</h2><p>{document.description}</p></div>
      <dl className="timeline-board__audit"><div><dt>전체</dt><dd>{scenario.cards.length}장</dd></div><div><dt>배치</dt><dd>{placed.size}장</dd></div><div><dt>중복</dt><dd>{duplicates}장</dd></div><div><dt>미배치</dt><dd>{missing.length}장</dd></div></dl>
    </header>
    <div className="timeline-balance" aria-label="인물별 카드 비중">{columns.map((column) => {
      const cards = scenario.cards.filter((card) => document.characterIdByCardId[card.id] === column.id)
      return <div key={column.id}><strong>{column.label}</strong><b>{cards.length}장</b><small>진실 {cards.filter((card) => card.kind === 'memory').length} · 증언 {cards.filter((card) => card.kind === 'testimony').length} · 소문 {cards.filter((card) => card.kind === 'rumor').length} · 물증 {cards.filter((card) => card.kind === 'evidence').length}</small></div>
    })}</div>
    <p className="timeline-board__guide">각 카드는 이야기에서 가장 직접적인 주요 관점 한 곳에 배치합니다. 여러 인물과 연관되더라도 중복 배치하지 않아 실제 정보 비중을 비교할 수 있습니다.</p>
    <div className="timeline-matrix" role="table" aria-label="시간대와 관련 인물별 카드 분류">
      <div className="timeline-matrix__row timeline-matrix__head" role="row">
        <div role="columnheader">시간대</div><div role="columnheader">사건</div>{columns.map((column) => <div role="columnheader" key={column.id}>{column.label}<small>15장</small></div>)}
      </div>
      {document.rows.map((row) => <div className="timeline-matrix__row" role="row" key={row.id}>
        <div className="timeline-matrix__time" role="rowheader">{row.time}</div>
        <div className="timeline-matrix__event" role="cell">{row.summary}<small>{row.cardIds.length}장</small></div>
        {columns.map((column) => {
          const cards = row.cardIds.map((id) => cardsById.get(id)).filter((card): card is Card => !!card && document.characterIdByCardId[card.id] === column.id)
          return <div className="timeline-matrix__cell" role="cell" key={column.id}>{cards.map((card) => <Link className={`timeline-card timeline-card--${card.kind}`} to={`/timeline/cards/${segment(card.id)}`} key={card.id}><span>{cardKinds[card.kind].label}</span>{card.title}</Link>)}</div>
        })}
      </div>)}
    </div>
    {missing.length > 0 && <aside className="timeline-unplaced"><strong>미배치 카드</strong>{missing.map((card) => <code key={card.id}>{card.id}</code>)}</aside>}
    <CardReader card={selected} onClose={() => { void navigate('/timeline') }} />
  </section>
}
