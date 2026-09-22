import { Link, useNavigate, useParams } from 'react-router'
import type { CardKind, MemoryStagesDocument, NpcGroupsDocument, Scenario, ValidationIssue } from '../domain/types'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'
import { href, MissingRoute, segment, useQueryState } from '../routing'
import { getCardGroups } from '../scenario/cardGroups'

interface Props {
  scenario: Scenario
  issues: ValidationIssue[]
  npcGroups: NpcGroupsDocument
  memoryStages: MemoryStagesDocument
}

const kinds = (Object.keys(cardKinds) as CardKind[]).filter((kind) => kind !== 'inspection')

export function CardLibrary({ scenario, issues, npcGroups, memoryStages }: Props) {
  const { cardId: selectedId } = useParams()
  const navigate = useNavigate()
  const { params, update } = useQueryState()
  const kind = params.get('kind') ?? 'all'
  const search = params.get('q') ?? ''
  const faceDown = params.get('side') === 'back'
  const revealed = new Set(params.getAll('revealed'))
  const groupId = params.get('group')
  const closeCard = () => { const next = new URLSearchParams(params); next.delete('details'); void navigate(href('/library', next)) }
  const setKind = (value: string) => update({ kind: value === 'all' ? null : value, group: null })
  const selected = scenario.cards.find((card) => card.id === selectedId)
  const query = search.trim().toLocaleLowerCase()
  const memoryStageByCardId = new Map(memoryStages.stages.flatMap((stage) => stage.cardIds.map((cardId) => [cardId, stage.label] as const)))
  const allGroups = getCardGroups(scenario, npcGroups, memoryStages)
  const totals = Object.fromEntries(kinds.map((key) => [key, scenario.cards.filter((card) => card.kind === key).length])) as Record<CardKind, number>
  const groups = allGroups.map((group) => {
    const cards = group.cards.filter((card) => {
      const owner = scenario.characters.find((character) => character.id === card.initialOwnerId)
      const location = scenario.locations.find((item) => item.id === card.locationId)
      return [group.label, card.id, card.title, card.text, ...card.tags, owner?.name, owner?.title, location?.name]
        .join(' ').toLocaleLowerCase().includes(query)
    })
    return { ...group, cards }
  })
  const visibleGroups = groups.filter((group) => (kind === 'all' || group.kind === kind) && (!groupId || group.id === groupId) && group.cards.length > 0)
  const resultCount = visibleGroups.reduce((count, group) => count + group.cards.length, 0)

  if (selectedId && !selected) return <MissingRoute message={`카드 “${selectedId}”을 찾을 수 없습니다.`} to="/library" label="카드 라이브러리로" />
  if ((groupId && !allGroups.some((group) => group.id === groupId)) || (kind !== 'all' && !kinds.includes(kind as CardKind))) return <MissingRoute message="존재하지 않는 카드 분류 주소입니다." to="/library" label="전체 카드 보기" />
  if ((params.has('profile') && !scenario.characters.some((character) => character.id === params.get('profile'))) || [...revealed].some((id) => !scenario.cards.some((card) => card.id === id)) || (params.has('side') && !['front', 'back'].includes(params.get('side')!))) return <MissingRoute message="카드 표시 방식이나 인물·펼친 카드 주소가 올바르지 않습니다." to="/library" label="전체 카드 보기" />

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
            <input type="search" value={search} onChange={(event) => update({ q: event.target.value }, true)} placeholder="카드 · 인물 · 장소 · 태그 검색" />
          </label>
        </div>
      </div>

      <details className="scenario-notes" open={params.get('profiles') === '1' || !!params.get('profile')}>
        <summary onClick={(event) => { event.preventDefault(); update({ profiles: params.get('profiles') === '1' || params.has('profile') ? null : '1', profile: null }) }}>인물 설정서</summary>
        <div>{scenario.characters.map((character) => <details className="character-profile" key={character.id} open={params.get('profile') === character.id}>
          <summary onClick={(event) => { event.preventDefault(); update({ profiles: '1', profile: params.get('profile') === character.id ? null : character.id }) }}>{character.name} · {character.title}</summary><p>{character.publicProfile}</p><p><strong>욕망</strong> · {character.desire}</p><p><strong>파멸</strong> · {character.ruin}</p><Link to={`/characters/${segment(character.id)}`}>인물 설정서 전체 보기 ↗</Link>
        </details>)}</div>
      </details>

      <nav className="kind-filters" aria-label="카드 종류">
        <button type="button" aria-pressed={kind === 'all'} onClick={() => setKind('all')}>
          전체 <span>{scenario.cards.length}</span>
        </button>
        {kinds.map((key) => (
          <button type="button" className={`kind-filter--${key}`} key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>
            {cardKinds[key].label} <span>{totals[key]}</span>
          </button>
        ))}
      </nav>
      <div className="card-display-controls" aria-label="카드 표시 방식">
        <button type="button" aria-pressed={!faceDown} onClick={() => update({ side: null, revealed: null })}>앞면 보기</button>
        <button type="button" aria-pressed={faceDown} onClick={() => update({ side: 'back', revealed: null })}>하나씩 열기</button>
        {faceDown && <><button type="button" onClick={() => update({ revealed: null })}>모두 덮기</button><span>한 번 눌러 펼치고, 다시 눌러 상세 보기</span></>}
        <label className="library-group-filter">묶음 <select aria-label="카드 묶음" value={groupId ?? ''} onChange={(event) => update({ group: event.target.value || null })}><option value="">전체 묶음</option>{allGroups.filter((group) => kind === 'all' || group.kind === kind).map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label>
      </div>
      <p className="library__count" role="status">
        {kind === 'all' ? '전체 종류' : cardKinds[kind as CardKind].label} · {resultCount}장{query && ` · “${search.trim()}” 검색 결과`}
      </p>

      {issues.length > 0 && <div className="issues">{issues.map((issue) => <p key={`${issue.path}-${issue.message}`}><strong>{issue.path}</strong> {issue.message}</p>)}</div>}

      {visibleGroups.map((group) => (
        <section className={`library-group library-group--${group.kind}`} key={group.id} aria-labelledby={`group-${group.id}`}>
          <div className="library-group__header">
            <div><h3 id={`group-${group.id}`}><Link to={href('/library', new URLSearchParams({ kind: group.kind, group: group.id, ...(faceDown ? { side: 'back' } : {}) }))}>{group.label} <span>{group.cards.length}장</span> ↗</Link></h3><p>{group.description}</p></div>
          </div>
          <div className="library__grid">
            {group.cards.map((card, index) => <CardView key={card.id} card={card} faceDown={faceDown && !revealed.has(card.id)} backTitle={group.backTitle} backSubtitle={card.kind === 'memory' ? memoryStageByCardId.get(card.id) : group.backSubtitle} backLabel={`${group.label} 카드 ${index + 1} 펼치기`}
              to={!faceDown || revealed.has(card.id) ? href(`/library/cards/${segment(card.id)}`, params) : undefined}
              onClick={() => update({ revealed: [...revealed, card.id] })} />)}
          </div>
        </section>
      ))}
      {resultCount === 0 && (
        <div className="library__empty">
          <h3>조건에 맞는 카드가 없습니다.</h3>
          <p>다른 종류를 선택하거나 검색어를 바꿔보세요.</p>
          <Link to="/library">전체 카드 보기</Link>
        </div>
      )}

      <CardReader card={selected} onClose={closeCard}>
        {selected &&
            <details className="card-reader__metadata" open={params.get('details') === '1'}>
              <summary onClick={(event) => { event.preventDefault(); update({ details: params.get('details') === '1' ? null : '1' }) }}>설계 정보</summary>
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
