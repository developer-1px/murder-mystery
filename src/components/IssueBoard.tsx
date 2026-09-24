import { Disclosure, DisclosureSummary, ActionLink } from '../design-system/controls'
import { Icon } from '../design-system/Icon'
import { TruthConsequences } from './TruthConsequences'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import type { Card, IssueGroupsDocument, Scenario } from '../domain/types'
import { cardRoleAudit, npcGroups, timeline, releasePlan, characterSettings } from '../scenario/load'
import { CardReader, CardView } from './CardView'
import { cardKinds } from './cardKinds'
import { MissingRoute, segment } from '../routing'
import { getIssueComposition } from './issueComposition'
import './issue-composition.css'
import evidenceAllocation from '../../scenarios/crown-trial/evidence-allocation.json'

interface Props {
  scenario: Scenario
  document: IssueGroupsDocument
  inspectionCards?: Card[]
}
const columns = [
  ['rumor', '소문', '4'], ['hearsay', '카더라', '2'], ['sighting', '수소문', '2'],
  ['memory', '진실', '2'], ['testimony', '탐문', '3'], ['identification', '이해관계', '1'],
  ['movement', '행적', '1'], ['hint', '빈틈', '1'], ['evidence', '전용 증거', '4'],
  ['desire', '욕망', '2'], ['ruin', '파멸', '2'],
]
export function IssueBoard({ scenario, document, inspectionCards = [] }: Props) {
  const { groupId, cardId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const category = params.get('category') ?? 'all'
  const people = getIssueComposition(scenario, document, npcGroups, timeline, cardRoleAudit)
  const active = people.find(person => person.group?.id === groupId) ?? (!groupId ? people[0] : undefined)
  const shared = document.groups.filter(group => !people.some(person => person.group?.id === group.id))
  const group = active?.group ?? shared.find(group => group.id === groupId)
  const allCards = [...scenario.cards, ...inspectionCards]
  const byId = new Map(allCards.map(card => [card.id, card]))
  const route = `/issues/${segment(group?.id ?? '')}`
  const path = (id?: string, bucket = category) => {
    const query = new URLSearchParams(location.search)
    if (bucket === 'all') query.delete('category')
    else query.set('category', bucket)
    return `${route}${id ? `/cards/${segment(id)}` : ''}${query.size ? `?${query}` : ''}${location.hash}`
  }
  const uniqueIds = [...new Set([...(active?.buckets.flatMap(bucket => bucket.cards.map(card => card.id)) ?? []), ...(group?.fragments.flatMap(fragment => fragment.cardIds) ?? [])])]
  const selected = cardId ? byId.get(cardId) : undefined
  const setting = characterSettings.find(setting => setting.id === active?.character.id)
  const warnings = people.flatMap(person => person.messages.map(message => `${person.character.name}: ${message}`))
  const unmapped = scenario.cards.filter(card => card.kind === 'rumor' || card.kind === 'evidence').filter(card => !evidenceAllocation.commonCardIds.includes(card.id) && !scenario.characters.some(person => person.id === timeline.characterIdByCardId[card.id]))
  if (!group) return <MissingRoute message="해당 인물 또는 공통 쟁점을 찾을 수 없습니다." to="/issues" label="카드 구성으로" />
  if (cardId && (!selected || !uniqueIds.includes(cardId))) return <MissingRoute message="이 인물에 연결된 카드가 아닙니다." to={route} label="인물 카드로" />
  if (category !== 'all' && !active?.buckets.some(bucket => bucket.id === category)) return <MissingRoute message="존재하지 않는 카드 범주입니다." to={route} label="전체 범주로" />
  const displayBuckets = active && category !== 'all' ? active.buckets.filter(bucket => bucket.id === category) : []
  const labelsFor = (card: Card) => active?.buckets.filter(bucket => !['rumor','memory','testimony','evidence','extra'].includes(bucket.id) && bucket.cards.some(item => item.id === card.id)).map(bucket => bucket.label) ?? []
  const renderCard = (card: Card) => <div className="composition-card" key={card.id}>
    <CardView card={card} to={path(card.id)} />
    <div className="composition-card__labels">{labelsFor(card).map(label => <span key={label}>{label}</span>)}
      {card.kind === 'evidence' && <span>{scenario.locations.find(place => place.id === card.locationId)?.name ?? '장소 미배정'}</span>}
    </div>
  </div>
  return <section className="issue-board composition-board">
    <header className="issue-board__header"><div><span className="eyebrow">DESIGNER ONLY · 카드 구성</span><h2>인물별 카드 구성과 연결</h2><p>인물을 고르고 이야기 순서대로 카드를 읽어 보세요. 장면마다 무엇이 이어지고 무엇이 아직 설명되지 않는지 함께 적었습니다.</p></div>
      <div className="composition-total"><strong>{scenario.cards.length}장</strong><span>{['rumor','evidence','testimony','memory'].map(kind => `${cardKinds[kind as Card['kind']].label} ${scenario.cards.filter(card => card.kind === kind).length}`).join(' · ')}</span></div>
    </header>
    <Disclosure className="composition-counts"><DisclosureSummary>카드 장수와 유형 비교</DisclosureSummary><div className="composition-table-wrap"><table className="composition-table"><caption>인물별 실제 / 목표 장수 · 유형과 욕망·파멸은 상위 카드에 포함됩니다. 로웬의 전담 탐문 목표는 0장입니다.</caption><thead><tr><th scope="col">인물</th>{columns.map(([id,label,target]) => <th scope="col" key={id}>{label}<small>목표 {target}</small></th>)}<th scope="col">구성 상태</th></tr></thead>
      <tbody>{people.map(person => <tr key={person.character.id} aria-selected={active?.character.id === person.character.id}><th scope="row"><Link to={`/issues/${segment(person.group?.id ?? '')}`}>{person.character.name}</Link></th>{columns.map(([id]) => {
        const bucket = person.buckets.find(bucket => bucket.id === id)
        return <td key={id}>{bucket ? <Link className={bucket.target === undefined ? '' : bucket.cards.length === bucket.target && !bucket.missing.length ? 'composition-ok' : 'composition-gap'} to={`/issues/${segment(person.group?.id ?? '')}?category=${id}#composition-detail`} aria-label={`${person.character.name} ${bucket.label} ${bucket.cards.length}장${bucket.target === undefined ? ' · 구성 보류' : ` 목표 ${bucket.target}장`}`}>{bucket.cards.length}{bucket.target !== undefined && <small> / {bucket.target}</small>}</Link> : <span title="이 인물에게 배정된 측근 NPC가 없습니다">—</span>}</td>
      })}<td className={!person.inScope ? '' : person.messages.length ? 'composition-gap' : 'composition-ok'}>{!person.inScope ? '별도 검토' : person.messages.length ? `${person.messages.length}건 확인` : '장수 일치'}</td></tr>)}</tbody></table></div>
    <p className="composition-note">소문·진실은 인물 배정, 탐문은 측근 NPC 덱, 증거는 인물별 전용 배정 기준입니다. 여섯 인물 모두 진실 2·소문 4·증거 4를 갖춥니다. 다섯 인물은 측근 탐문 3장을 더해 13장이고, 전담 NPC가 없는 로웬은 10장입니다. 참고 증거는 목표 4장에 포함하지 않습니다. 아드리안의 주치의 루시엔은 별도로 의료 탐문 3장입니다. 장수 일치는 서사의 완성도를 보증하지 않습니다.</p>
    {(warnings.length > 0 || unmapped.length > 0) && <aside className="composition-warnings ui-notice" data-tone="warning"><strong>확인할 구성</strong><ul>{warnings.map((warning,index) => <li key={index}>{warning}</li>)}{unmapped.map(card => <li key={card.id}><Link to={`/library/cards/${segment(card.id)}`}>{card.title}</Link> · 인물 배정 없음</li>)}</ul></aside>}
    <Disclosure className="composition-pending"><DisclosureSummary>공통 증거 {evidenceAllocation.commonCardIds.length}장 · 배정 보류 {evidenceAllocation.deferredCardIds.length}장</DisclosureSummary><p className="composition-note">공통 증거 8장은 의료·시간·동선·현장 비교 자료입니다. 어느 인물의 전용 4장에도 중복 산입하지 않으며 루시엔의 공통 의료 탐문 3장과 함께 대조합니다.</p><ul>{evidenceAllocation.commonCardIds.map(id => <li key={id}><Link to={`/library/cards/${segment(id)}`}>{byId.get(id)?.title ?? id}</Link></li>)}</ul></Disclosure>
    </Disclosure>
    <nav className="composition-people" aria-label="인물과 공통 쟁점">{people.map(person => <ActionLink size="compact" key={person.character.id} to={`/issues/${segment(person.group?.id ?? '')}`} aria-current={active === person ? 'page' : undefined}>{person.character.name}</ActionLink>)}{shared.map(item => <ActionLink size="compact" key={item.id} to={`/issues/${segment(item.id)}`} aria-current={group.id === item.id ? 'page' : undefined}>공통 사인</ActionLink>)}</nav>
    <article className="composition-detail ui-panel" id="composition-detail"><header><span className="eyebrow">{active ? 'CHARACTER CARDS' : 'SHARED CARDS'}</span><h3>{group.title}</h3><p>{group.question}</p></header>
      {active && <>
        <nav className="composition-filters" aria-label="카드 구성 범주"><ActionLink size="compact" to={path(undefined,'all')} aria-current={category === 'all' ? 'page' : undefined}>이야기 순서</ActionLink>{active.buckets.map(bucket => <ActionLink size="compact" key={bucket.id} to={path(undefined,bucket.id)} aria-current={category === bucket.id ? 'page' : undefined}>{bucket.label} <b>{bucket.cards.length}{bucket.target !== undefined && `/${bucket.target}`}</b></ActionLink>)}</nav>
        <p className="composition-note">연결된 원본 카드 {uniqueIds.length}장 · 전용 증거 {active.assignedEvidenceCount}{active.inScope ? '/4' : ''}장 · 참고 증거 {active.buckets.find(b => b.id === 'extra')?.cards.length}장. 같은 카드는 범주가 겹쳐도 원본 장수에 한 번만 셉니다.</p>
        {['desire','ruin'].includes(category) && <p className="composition-note">{active.motivation?.inference} 배포 차수는 제작자 수동 배포안 기준이며, 실제 게임의 자동 해금 조건은 아닙니다.</p>}
        {displayBuckets.map(bucket => <section className="composition-bucket" key={bucket.id}><header><h4>{bucket.label}</h4><span>{bucket.cards.length}장{bucket.target !== undefined && ` / 목표 ${bucket.target}장`}</span></header>{bucket.note && <p>{bucket.note}</p>}{bucket.cards.length ? <div className="composition-cards">{bucket.cards.map(card => <div key={card.id}>{renderCard(card)}{['desire','ruin'].includes(category) && <small className="composition-round">배포안 {releasePlan.rounds.find(round => round.cardIds.includes(card.id))?.round ?? '미배정'}차</small>}</div>)}</div> : <p>이 범주에 연결된 카드가 없습니다.</p>}{bucket.missing.map(id => <p className="composition-gap" key={id}>원본 없음: {id}</p>)}</section>)}
      </>}
      {category === 'all' && <div className="composition-story" aria-label="이야기 순서로 읽는 카드">
        {!active && <p className="composition-note">공통 카드와 인물별 단서를 교차 대조합니다. 아래 참조는 전용 장수에 더하지 않습니다.</p>}
        {group.fragments.map((fragment, index) => <section className="story-scene" key={fragment.id} id={`fragment-${fragment.id}`} aria-labelledby={`story-${fragment.id}`}>
          <header><span className="story-scene__number">{String(index + 1).padStart(2, '0')}</span><div><h4 id={`story-${fragment.id}`}>{fragment.label}</h4><span className="story-scene__count">{fragment.cardIds.length}장 함께 읽기</span></div></header>
          {fragment.note && <p className="story-scene__narrative">{fragment.note}</p>}
          <div className="composition-cards">{fragment.cardIds.map(id => byId.has(id) ? renderCard(byId.get(id)!) : <p className="composition-gap" key={id}>원본 없음: {id}</p>)}</div>
        </section>)}
        <aside className="story-open-question"><h4>이어 읽고 점검할 부분</h4><p>{group.auditNote}</p></aside>
      </div>}
      {setting && ['all', 'memory'].includes(category) && <section className="composition-truths" id="truth-consequences">
        <h3>진실을 맡긴 뒤, 달라지는 결말</h3>
        <p className="composition-note">설득할 때의 설명과 실제 파장을 비교해 보세요. 매장은 이미 공식 입증된 사실을 지우지 않습니다.</p>
        {setting.finalActions.map(truth => <article key={truth.id}>
          <h4><Link to={path(truth.id)}>{truth.title}</Link></h4><p>{truth.intent}</p>
          <TruthConsequences truth={truth} />
          <nav aria-label={`${truth.title} 연결 단서`}>{truth.connectionCardIds?.map(id => <Link key={id} to={uniqueIds.includes(id) ? path(id) : `/library/cards/${segment(id)}`}>{byId.get(id)?.title ?? id}</Link>)}</nav>
        </article>)}
      </section>}
      {setting && <Disclosure className="composition-connections"><DisclosureSummary>인물의 신념과 목표</DisclosureSummary><p className="composition-note">{setting.objective}</p><p>{setting.belief}</p><ul>{setting.goals.map(goal => <li key={goal}>{goal}</li>)}</ul><Link className="composition-note" to={`/characters/${segment(setting.id)}`}>전체 인물 설정 보기 <Icon name="arrowUpRight" size="1em" /></Link></Disclosure>}
    </article>
    <CardReader card={selected} onClose={() => { void navigate(path()) }}>{selected && <div className="issue-card-meta"><span>{cardKinds[selected.kind].label}</span>{labelsFor(selected).map(label => <span key={label}>{label}</span>)}<code>{selected.id}</code><Link to={`/library/cards/${segment(selected.id)}`}>라이브러리에서 보기 <Icon name="arrowUpRight" size="1em" /></Link></div>}</CardReader>
  </section>
}
