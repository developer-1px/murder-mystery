import { useMemo } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import type { Card, DeductionAuditDocument, IssueGroupsDocument, Scenario } from '../domain/types'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'
import { MissingRoute, SectionLink, segment } from '../routing'

interface Props {
  scenario: Scenario
  document: IssueGroupsDocument
  deduction?: DeductionAuditDocument
  inspectionCards?: Card[]
}

export function IssueBoard({ scenario, document, deduction, inspectionCards = [] }: Props) {
  const { groupId: selectedGroupId, cardId: selectedCardId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const cardsById = useMemo(() => new Map([...scenario.cards, ...inspectionCards].map((card) => [card.id, card])), [scenario.cards, inspectionCards])
  const group = selectedGroupId ? document.groups.find((item) => item.id === selectedGroupId) : document.groups[0]
  const selectedCard = selectedCardId ? cardsById.get(selectedCardId) : undefined

  if (!group) return <MissingRoute message="해당 쟁점을 찾을 수 없습니다." to="/issues" label="쟁점 목록으로" />
  if (!selectedGroupId) return <Navigate replace to={`/issues/${segment(group.id)}${location.search}${location.hash}`} />
  if (selectedCardId && (!selectedCard || !group.fragments.some((fragment) => fragment.cardIds.includes(selectedCardId)))) return <MissingRoute message="이 쟁점에 연결된 카드가 아닙니다." to={`/issues/${segment(group.id)}`} label="쟁점으로 돌아가기" />

  const references = group.fragments.flatMap((fragment) => fragment.cardIds)
  const uniqueCards = new Set(references).size
  const hypothesis = deduction?.hypotheses.find((item) => group.id === `suspicion.${item.characterId}`)

  const locationOf = (card: Card) => card.initialOwnerId
    ? `${scenario.characters.find((character) => character.id === card.initialOwnerId)?.name ?? card.initialOwnerId}의 손패`
    : scenario.locations.find((location) => location.id === card.locationId)?.name ?? (inspectionCards.some((item) => item.id === card.id) ? '공식 검시' : '배치되지 않음')

  return (
    <section className="issue-board">
      <header className="issue-board__header">
        <div>
          <span className="eyebrow">DESIGNER ONLY · 쟁점 연결</span>
          <h2>핵심 쟁점의 정보 조각</h2>
          <p>{document.description}</p>
        </div>
        <div className="issue-board__totals" aria-label="분류 현황">
          <strong>{document.groups.length}</strong><span>핵심 쟁점</span>
          <strong>{document.groups.reduce((sum, item) => sum + item.fragments.length, 0)}</strong><span>정보 조각</span>
        </div>
      </header>

      <div className="issue-board__layout">
        <nav className="issue-nav" aria-label="핵심 쟁점">
          {document.groups.map((item, index) => {
            const count = new Set(item.fragments.flatMap((fragment) => fragment.cardIds)).size
            return <Link key={item.id} aria-current={item.id === group.id ? 'page' : undefined} to={`/issues/${segment(item.id)}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <small>{item.fragments.length}조각 · {count}장</small>
            </Link>
          })}
        </nav>

        <article className="issue-detail">
          <header className="issue-detail__header">
            <span className="issue-detail__number">ISSUE {String(document.groups.indexOf(group) + 1).padStart(2, '0')}</span>
            <h3>{group.title}</h3>
            <p>{group.question}</p>
            <div><span>{group.fragments.length}개 조각</span><span>{uniqueCards}장</span><span>{references.length}개 연결</span></div>
          </header>

          <aside className="issue-audit"><strong>분리 기준</strong><p>{group.auditNote}</p></aside>

          {hypothesis && <section className="issue-hypothesis" aria-labelledby="issue-hypothesis-title">
            <header><span>살해 가설</span><h4 id="issue-hypothesis-title">{hypothesis.label}</h4></header>
            <div className="issue-hypothesis__flow">
              <article><span>01 · 확인된 위해</span><p>{hypothesis.confirmedAct}</p></article>
              <i aria-hidden="true">→</i>
              <article><span>02 · 검시의 제동</span><p>{hypothesis.insufficientFinding}</p></article>
              <i aria-hidden="true">→</i>
              <article className="issue-hypothesis__alpha"><span>03 · 가능했던 +α</span><p>{hypothesis.plusAlpha}</p></article>
              <i aria-hidden="true">→</i>
              <article><span>04 · 실행 여부</span><p>{hypothesis.actual}</p></article>
            </div>
            <p className="issue-hypothesis__rule">앞의 세 단계는 살해가 가능했다는 가설을 세우고, 마지막 단계의 카드 연결만 실제 실행 여부를 가릅니다.</p>
          </section>}

          <div className="fragment-list">
            {group.fragments.map((fragment, index) => (
              <section className={`fragment fragment--${fragment.status ?? 'covered'}`} key={fragment.id} id={`fragment-${fragment.id}`} aria-labelledby={`fragment-heading-${fragment.id}`}>
                <header>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div><h4 id={`fragment-heading-${fragment.id}`}><SectionLink id={`fragment-${fragment.id}`}>{fragment.label}</SectionLink></h4><small>{fragment.status === 'missing' ? '미작성' : `${fragment.cardIds.length}장 연결`}{fragment.status === 'thin' && ' · 보강 필요'}</small></div>
                </header>
                {fragment.note && <p className="fragment__note">{fragment.note}</p>}
                <div className="fragment__cards">
                  {fragment.cardIds.map((cardId) => {
                    const card = cardsById.get(cardId)
                    return card ? <CardView key={cardId} card={card} to={`/issues/${segment(group.id)}/cards/${segment(cardId)}#${segment(`fragment-${fragment.id}`)}`} /> : <p className="fragment__missing" key={cardId}>누락된 카드 · {cardId}</p>
                  })}
                  {fragment.cardIds.length === 0 && <p className="fragment__empty">연결된 카드가 없습니다.</p>}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <CardReader card={selectedCard} onClose={() => { void navigate(`/issues/${segment(group.id)}${location.hash}`) }}>
        {selectedCard && <div className="issue-card-meta">
          <span>{cardKinds[selectedCard.kind].label}</span>
          <span>{locationOf(selectedCard)}</span>
          <code>{selectedCard.id}</code>
          <Link to={`/library/cards/${segment(selectedCard.id)}`}>라이브러리에서 보기 ↗</Link>
        </div>}
      </CardReader>
    </section>
  )
}
