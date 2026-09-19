import { useState } from 'react'
import type { CardKind, Scenario, ValidationIssue } from '../domain/types'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'

interface Props {
  scenario: Scenario
  issues: ValidationIssue[]
}

const kinds = Object.keys(cardKinds) as CardKind[]
export function CardLibrary({ scenario, issues }: Props) {
  const [kind, setKind] = useState<CardKind | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [faceDown, setFaceDown] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const selected = scenario.cards.find((card) => card.id === selectedId)
  const query = search.trim().toLocaleLowerCase()
  const groups = kinds.map((key) => {
    const all = scenario.cards.filter((card) => card.kind === key)
    const cards = all.filter((card) => {
      const owner = scenario.characters.find((character) => character.id === card.initialOwnerId)
      const location = scenario.locations.find((item) => item.id === card.locationId)
      return [card.id, card.title, card.text, ...card.tags, owner?.name, owner?.title, location?.name]
        .join(' ').toLocaleLowerCase().includes(query)
    })
    return { kind: key, ...cardKinds[key], cards, total: all.length }
  })
  const visibleGroups = groups.filter((group) => (kind === 'all' || group.kind === kind) && group.cards.length > 0)
  const resultCount = visibleGroups.reduce((count, group) => count + group.cards.length, 0)

  return (
    <section className="library">
      <div className="library__header">
        <div>
          <span className="eyebrow">CARD LIBRARY · 설계자 열람</span>
          <h2>시나리오의 모든 카드</h2>
          <p>종류별로 살펴보고, 카드를 눌러 본문과 연결 정보를 확인하세요.</p>
        </div>
        <div className="filters">
          <label className="library__search">
            <span>카드 검색</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="카드 · 인물 · 장소 · 태그 검색" />
          </label>
        </div>
      </div>

      <details className="scenario-notes">
        <summary>인물 설정서</summary>
        <div>{scenario.characters.map((character) => <details className="character-profile" key={character.id}>
          <summary>{character.name} · {character.title}</summary><p>{character.publicProfile}</p><p><strong>욕망</strong> · {character.desire}</p><p><strong>파멸</strong> · {character.ruin}</p>
        </details>)}</div>
      </details>

      <nav className="kind-filters" aria-label="카드 종류">
        <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
          전체 <span>{scenario.cards.length}</span>
        </button>
        {groups.map((group) => (
          <button type="button" className={`kind-filter--${group.kind}`} key={group.kind} aria-pressed={kind === group.kind} onClick={() => setKind(group.kind)}>
            {group.label} <span>{group.total}</span>
          </button>
        ))}
      </nav>
      <div className="card-display-controls" aria-label="카드 표시 방식">
        <button type="button" aria-pressed={!faceDown} onClick={() => { setFaceDown(false); setSelectedId(null) }}>앞면 보기</button>
        <button type="button" aria-pressed={faceDown} onClick={() => { setFaceDown(true); setRevealed(new Set()); setSelectedId(null) }}>하나씩 열기</button>
        {faceDown && <><button type="button" onClick={() => { setRevealed(new Set()); setSelectedId(null) }}>모두 덮기</button><span>한 번 눌러 펼치고, 다시 눌러 상세 보기</span></>}
      </div>
      <p className="library__count" role="status">
        {kind === 'all' ? '전체 종류' : cardKinds[kind].label} · {resultCount}장{query && ` · “${search.trim()}” 검색 결과`}
      </p>

      {issues.length > 0 && <div className="issues">{issues.map((issue) => <p key={`${issue.path}-${issue.message}`}><strong>{issue.path}</strong> {issue.message}</p>)}</div>}

      {visibleGroups.map((group) => (
        <section className={`library-group library-group--${group.kind}`} key={group.kind} aria-labelledby={`group-${group.kind}`}>
          <div className="library-group__header">
            <div><h3 id={`group-${group.kind}`}>{group.label} <span>{group.cards.length}장</span></h3><p>{group.description}</p></div>
          </div>
          <div className="library__grid">
            {group.cards.map((card, index) => <CardView key={card.id} card={card} faceDown={faceDown && !revealed.has(card.id)} backLabel={`${group.label} 카드 ${index + 1} 펼치기`} onClick={() => {
              if (faceDown && !revealed.has(card.id)) setRevealed((ids) => new Set([...ids, card.id]))
              else setSelectedId(card.id)
            }} />)}
          </div>
        </section>
      ))}
      {resultCount === 0 && (
        <div className="library__empty">
          <h3>조건에 맞는 카드가 없습니다.</h3>
          <p>다른 종류를 선택하거나 검색어를 바꿔보세요.</p>
          <button type="button" onClick={() => { setSearch(''); setKind('all') }}>전체 카드 보기</button>
        </div>
      )}

      <CardReader card={selected} onClose={() => setSelectedId(null)}>
        {selected &&
            <details className="card-reader__metadata">
              <summary>설계 정보</summary>
              <dl>
                <dt>종류</dt><dd>{cardKinds[selected.kind].label}</dd>
                <dt>시작 위치</dt><dd>{selected.initialOwnerId ? `${scenario.characters.find((character) => character.id === selected.initialOwnerId)?.name}의 손패` : scenario.locations.find((location) => location.id === selected.locationId)?.name ?? '배치되지 않음'}</dd>
                <dt>연결된 주장</dt><dd>{scenario.claims.find((claim) => claim.id === selected.claimId)?.text ?? '연결된 주장이 없습니다.'}</dd>
                <dt>테이블 배치</dt><dd>테이블에서 자유롭게 옮깁니다. 시나리오의 시작 위치는 참고 정보입니다.</dd>
                <dt>원본</dt><dd><code>scenarios/crown-trial/cards.json</code><br /><code>{selected.id}</code></dd>
              </dl>
            </details>
        }
      </CardReader>
    </section>
  )
}
