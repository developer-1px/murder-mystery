import { useMemo, useState } from 'react'
import { CardView } from './components/CardView'
import { canSeeCard, describeEvent, forkBranch, replay } from './domain/engine'
import type { Branch, Card, GameEvent, Verdict } from './domain/types'
import { scenario, validationIssues } from './scenario/load'

type Workspace = 'playtest' | 'library'

const eventId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>('playtest')
  const [perspective, setPerspective] = useState('designer')
  const [branches, setBranches] = useState<Branch[]>([{ id: 'main', name: '기본 실행', events: [] }])
  const [branchId, setBranchId] = useState('main')
  const branch = branches.find((item) => item.id === branchId)!
  const [cursor, setCursor] = useState(0)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState(scenario.locations[0].id)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const state = useMemo(() => replay(scenario, branch.events, cursor), [branch, cursor])
  const selectedCard = scenario.cards.find((card) => card.id === selectedCardId)
  const activeCharacterId = perspective === 'designer' ? scenario.characters[0].id : perspective
  const designer = perspective === 'designer'

  const commit = (event: GameEvent) => {
    const nextEvents = [...branch.events.slice(0, cursor), event]
    setBranches((items) => items.map((item) => item.id === branch.id ? { ...item, events: nextEvents } : item))
    setCursor(nextEvents.length)
  }

  const fork = () => {
    const next = forkBranch(branch, cursor, branches.length)
    setBranches((items) => [...items, next])
    setBranchId(next.id)
    setCursor(next.events.length)
  }

  const switchBranch = (id: string) => {
    const next = branches.find((item) => item.id === id)!
    setBranchId(id)
    setCursor(next.events.length)
  }

  const acquire = (card: Card, forced = false) => commit({ id: eventId(), type: 'acquire', actorId: activeCharacterId, cardId: card.id, at: now(), forced })
  const publish = (card: Card) => commit({ id: eventId(), type: 'publish', actorId: activeCharacterId, cardId: card.id, at: now() })
  const submit = (card: Card) => commit({ id: eventId(), type: 'submit', actorId: activeCharacterId, cardId: card.id, at: now() })
  const present = (card: Card, targetId: string) => commit({ id: eventId(), type: 'present', actorId: activeCharacterId, targetId, cardId: card.id, at: now() })
  const verdict = (claimId: string, value: Verdict) => commit({ id: eventId(), type: 'verdict', actorId: activeCharacterId, claimId, verdict: value, at: now() })

  const hand = scenario.cards.filter((card) => state.cards[card.id].zone === 'hand' && state.cards[card.id].ownerId === activeCharacterId && canSeeCard(state, card.id, perspective))
  const publicCards = scenario.cards.filter((card) => ['public', 'court'].includes(state.cards[card.id].zone))
  const locationCards = scenario.cards.filter((card) => card.locationId === selectedLocationId && state.cards[card.id].zone === 'location')
  const filteredCards = scenario.cards.filter((card) => {
    const query = search.toLowerCase()
    return (kind === 'all' || card.kind === kind) && `${card.title} ${card.text} ${card.tags.join(' ')}`.toLowerCase().includes(query)
  })

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">MURDER MYSTERY WORKBENCH</span>
          <h1>{scenario.meta.title}</h1>
        </div>
        <div className="topbar__actions">
          <span className={`health ${validationIssues.some((issue) => issue.severity === 'error') ? 'health--error' : ''}`}>
            <i /> {validationIssues.length ? `검증 ${validationIssues.length}건` : '시나리오 정상'}
          </span>
          <nav className="workspace-tabs" aria-label="작업 공간">
            <button className={workspace === 'playtest' ? 'active' : ''} onClick={() => setWorkspace('playtest')}>테스트 실행</button>
            <button className={workspace === 'library' ? 'active' : ''} onClick={() => setWorkspace('library')}>카드 라이브러리</button>
          </nav>
        </div>
      </header>

      {workspace === 'playtest' ? (
        <div className="workbench">
          <aside className="sidebar sidebar--left">
            <section>
              <div className="section-heading"><span>관점</span><small>VIEWPOINT</small></div>
              <button className={`character character--designer ${designer ? 'active' : ''}`} onClick={() => setPerspective('designer')}>
                <span className="character__sigil">✦</span><span><strong>설계자</strong><small>모든 정보 열람</small></span>
              </button>
              <div className="character-list">
                {scenario.characters.map((character) => (
                  <button className={`character ${perspective === character.id ? 'active' : ''}`} onClick={() => setPerspective(character.id)} key={character.id} style={{ '--character': character.color } as React.CSSProperties}>
                    <span className="character__sigil">{character.name[0]}</span>
                    <span><strong>{character.name}</strong><small>{character.title}</small></span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="section-heading"><span>조사 장소</span><small>ROUND {scenario.meta.round}</small></div>
              <div className="location-list">
                {scenario.locations.map((location) => (
                  <button className={selectedLocationId === location.id ? 'active' : ''} onClick={() => setSelectedLocationId(location.id)} key={location.id}>
                    <strong>{location.name}</strong><small>{location.description}</small>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="tabletop">
            <div className="tabletop__header">
              <div><span className="eyebrow">ACTIVE LOCATION</span><h2>{scenario.locations.find((item) => item.id === selectedLocationId)?.name}</h2></div>
              <div className="round-badge"><strong>Ⅰ</strong><span>첫 번째<br />조사 라운드</span></div>
            </div>

            <div className="zone">
              <div className="zone__heading"><h3>조사 가능한 카드</h3><span>{locationCards.length}장 남음</span></div>
              <div className="card-row">
                {locationCards.length ? locationCards.map((card) => (
                  <CardView key={card.id} card={card} state={state.cards[card.id]} designer={designer} selected={selectedCardId === card.id} onClick={() => setSelectedCardId(card.id)} />
                )) : <p className="empty">이 장소에서 확인할 카드를 모두 가져갔습니다.</p>}
              </div>
            </div>

            <div className="zone zone--public">
              <div className="zone__heading"><h3>공개 테이블 · 법정</h3><span>모두가 아는 정보</span></div>
              <div className="card-row card-row--small">
                {publicCards.length ? publicCards.map((card) => <CardView key={card.id} card={card} state={state.cards[card.id]} compact designer={designer} onClick={() => setSelectedCardId(card.id)} />) : <p className="empty">아직 공개된 카드가 없습니다.</p>}
              </div>
              <div className="facts">
                <span>공식 사실</span>
                {state.officialFacts.length ? state.officialFacts.map((id) => <strong key={id}>⚖ {scenario.claims.find((claim) => claim.id === id)?.text}</strong>) : <small>재판에서 인정된 사실이 없습니다.</small>}
              </div>
            </div>

            <div className="zone zone--hand">
              <div className="zone__heading"><h3>{designer ? scenario.characters[0].name : scenario.characters.find((item) => item.id === perspective)?.name}의 손패</h3><span>{hand.length}장</span></div>
              <div className="card-row card-row--small">
                {hand.map((card) => <CardView key={card.id} card={card} state={state.cards[card.id]} compact designer={designer} selected={selectedCardId === card.id} onClick={() => setSelectedCardId(card.id)} />)}
              </div>
            </div>
          </section>

          <aside className="sidebar sidebar--right">
            <section className="inspector">
              <div className="section-heading"><span>카드 작업</span><small>INSPECTOR</small></div>
              {selectedCard ? (
                <>
                  <CardView card={selectedCard} state={state.cards[selectedCard.id]} designer={designer} />
                  <div className="action-grid">
                    {state.cards[selectedCard.id].zone === 'location' && <button className="primary" onClick={() => acquire(selectedCard)}>손패로 가져오기</button>}
                    {designer && state.cards[selectedCard.id].zone !== 'hand' && <button onClick={() => acquire(selectedCard, true)}>강제로 손패 이동</button>}
                    {state.cards[selectedCard.id].zone === 'hand' && <button onClick={() => publish(selectedCard)}>모두에게 공개</button>}
                    {state.cards[selectedCard.id].zone === 'hand' && <button onClick={() => submit(selectedCard)}>법정에 제출</button>}
                  </div>
                  {state.cards[selectedCard.id].zone === 'hand' && (
                    <label className="select-label">비공개 제시
                      <select defaultValue="" onChange={(event) => { if (event.target.value) present(selectedCard, event.target.value); event.target.value = '' }}>
                        <option value="">상대 선택…</option>
                        {scenario.characters.filter((character) => character.id !== activeCharacterId).map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
                      </select>
                    </label>
                  )}
                  {selectedCard.claimId && state.cards[selectedCard.id].zone === 'court' && (
                    <div className="verdicts">
                      <span>{scenario.claims.find((claim) => claim.id === selectedCard.claimId)?.text}</span>
                      <div><button onClick={() => verdict(selectedCard.claimId!, 'accepted')}>인정</button><button onClick={() => verdict(selectedCard.claimId!, 'rejected')}>기각</button><button onClick={() => verdict(selectedCard.claimId!, 'reserved')}>유보</button></div>
                    </div>
                  )}
                </>
              ) : <p className="empty">카드를 선택하면 내용과 행동을 확인할 수 있습니다.</p>}
            </section>

            <section className="timeline">
              <div className="section-heading"><span>실행 기록</span><small>{cursor}/{branch.events.length}</small></div>
              <select value={branchId} onChange={(event) => switchBranch(event.target.value)}>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
              <button className="fork-button" onClick={fork}>현재 시점에서 Fork</button>
              <button className={`event ${cursor === 0 ? 'active' : ''}`} onClick={() => setCursor(0)}><b>0</b><span>게임 시작</span></button>
              {branch.events.map((event, index) => (
                <button className={`event ${cursor === index + 1 ? 'active' : ''}`} onClick={() => setCursor(index + 1)} key={event.id}>
                  <b>{index + 1}</b><span>{describeEvent(event, scenario)}{event.forced && <em>강제 조작</em>}</span>
                </button>
              ))}
            </section>
          </aside>
        </div>
      ) : (
        <section className="library">
          <div className="library__header">
            <div><span className="eyebrow">CARD LIBRARY</span><h2>시나리오의 모든 카드</h2><p>문구, 연결, 현재 상태를 한곳에서 검사합니다.</p></div>
            <div className="filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="카드, 태그, 내용 검색" /><select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">모든 유형</option><option value="memory">기억</option><option value="rumor">소문</option><option value="evidence">물증</option><option value="testimony">증언</option></select></div>
          </div>
          {validationIssues.length > 0 && <div className="issues">{validationIssues.map((issue) => <p key={`${issue.path}-${issue.message}`}><strong>{issue.path}</strong> {issue.message}</p>)}</div>}
          <div className="library__grid">{filteredCards.map((card) => <CardView key={card.id} card={card} state={state.cards[card.id]} designer onClick={() => setSelectedCardId(card.id)} />)}</div>
        </section>
      )}
    </main>
  )
}
