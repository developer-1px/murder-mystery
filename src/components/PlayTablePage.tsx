import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import type { Card, Character } from '../domain/types'
import { availableEvidence, createPlaySession, getDeckBlockReason, getInspectionBlockReason, randomPlayerAction, transitionPlay, type PlayAction, type PlayAssets, type PlayPhase, type PlaySession } from '../domain/playSession'
import { characterSettings, memoryStages, npcGroups, scenario } from '../scenario/load'
import { getCardGroups } from '../scenario/cardGroups'
import inspectionDocument from '../../scenarios/crown-trial/inspections.json'
import { appendPlay, playPath, playStorageKey, readPlayHistory, recoverPlayHistory, type PlayHistory } from '../playHistory'
import { href, MissingRoute, useQueryState } from '../routing'
import { CardReader, CardView } from './CardView'
import { CardTable, type CardTablePolicy } from './CardTable'
import { playTablePiles } from '../domain/playTable'
import './play-table.css'
import { CharacterSettings } from './CharacterSettings'

const groups = getCardGroups(scenario, npcGroups, memoryStages)
const assets: PlayAssets = { scenario, groups, memoryStages, inspectionCards: inspectionDocument as Card[] }
const cards = new Map([...scenario.cards, ...assets.inspectionCards].map(card => [card.id, card]))
const tableScenario = { ...scenario, cards: [...cards.values()] }
const player = (id: string) => scenario.characters.find(character => character.id === id)!
const phases: { id: PlayPhase; label: string }[] = [
  { id: 'inspection', label: '검시' }, { id: 'rumor', label: '소문' }, { id: 'testimony', label: '탐문' },
  { id: 'investigation', label: '조사' }, { id: 'discussion', label: '밀담' }, { id: 'court', label: '재판' },
]
const courtLabels = ['질문하는 재판', '혐의를 세우는 재판', '최후의 재판']

function phaseTitle(session: PlaySession) {
  if (session.phase === 'ready') return '새벽이 오기 전에'
  if (session.phase === 'court') return courtLabels[session.round - 1]
  return ({ inspection: '로웬의 검시', rumor: '궁정의 소문', testimony: '사람의 흔적', investigation: '장소에 남은 증거', discussion: '문이 닫힌 사이', truth_exchange: '진실을 맡기는 시간', truth_choice: '밝힐 진실과 묻을 진실', accusation: '당신이 지목한 범인', defense: '마지막 변론', indictment: '로웬의 최종 기소', complete: '진실의 운명이 정해졌습니다' } as Record<string, string>)[session.phase]
}

export function PlayTablePage() {
  const [stored, setStored] = useState(() => readPlayHistory(assets))
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  const [warning, setWarning] = useState(stored.warning)
  const [runAt, setRunAt] = useState<{ branchId: string; step: number } | null>(null)
  const { branchId, step } = useParams()
  const navigate = useNavigate()
  const { params, update } = useQueryState()
  const history = stored.history
  const branch = history.branches.find(item => item.id === (branchId ?? history.last.branchId))
  const cursor = step === undefined ? (branch?.id === history.last.branchId ? history.last.step : (branch?.snapshots.length ?? 1) - 1) : /^\d+$/.test(step) ? Number(step) : -1
  const session = branch?.snapshots[cursor]
  const autoRunning = runAt?.branchId === branch?.id && runAt?.step === cursor && cursor === (branch?.snapshots.length ?? 0) - 1
  const save = (next: PlayHistory) => {
    setStored({ history: next })
    try { localStorage.setItem(playStorageKey(scenario.meta.id), JSON.stringify(next)) }
    catch { setWarning('저장에 실패했습니다. 현재 플레이는 유지되지만 새로고침하면 복원되지 않을 수 있습니다.') }
  }
  useEffect(() => {
    if (stored.error || !branch || !session) return
    save({ ...history, last: { branchId: branch.id, step: cursor } })
  }, [branch?.id, cursor])
  useEffect(() => {
    const pause = () => setRunAt(null)
    window.addEventListener('popstate', pause)
    return () => window.removeEventListener('popstate', pause)
  }, [])

  if (stored.error) return <section className="play-recovery">
    <span className="eyebrow">왕관재판 · 플레이 복구</span>
    <h2>새 시나리오로 이어갈 준비</h2>
    <p>{stored.error}</p>
    <button className="play-primary" disabled={recovering} onClick={async () => {
      setRecovering(true)
      setRecoveryError('')
      try {
        const next = await recoverPlayHistory(assets)
        setStored({ history: next })
        setWarning('이전 기록을 이 브라우저에 별도 보관했습니다. 새 플레이를 시작합니다.')
        void navigate(playPath(next.last.branchId, next.last.step), { replace: true })
      } catch {
        setRecoveryError('기록 보관 또는 저장에 실패했습니다. 기존 기록은 보존됩니다. 브라우저 저장 공간과 권한을 확인한 뒤 다시 시도해 주세요.')
      } finally { setRecovering(false) }
    }}>{recovering ? '이전 기록 보관 중…' : '이전 기록 보관하고 새 플레이'}</button>
    {recoveryError && <p role="alert">{recoveryError}</p>}
    <Link to="/guide">게임 진행 읽기</Link>
  </section>
  if (!branch || !session) return <MissingRoute message="이 브라우저에 해당 플레이 기록이 없습니다. 플레이 링크는 같은 브라우저에 저장된 기록을 엽니다." />
  if (!branchId || step === undefined) return <Navigate replace to={href(playPath(branch.id, cursor), params)} />
  const go = (next: PlayHistory, keepView = false, run = false) => {
    save(next)
    setRunAt(run ? next.last : null)
    void navigate(keepView ? href(playPath(next.last.branchId, next.last.step), params) : playPath(next.last.branchId, next.last.step))
  }
  const act = (action: PlayAction, automatic = false) => {
    const next = transitionPlay(session, action, assets)
    if (next !== session) go(appendPlay(history, branch, cursor, next), automatic || action.type === 'reorder-hand', autoRunning || action.type === 'start' || action.type === 'play-as' && next.phase !== 'ready')
  }
  const newGame = () => {
    const session = createPlaySession(assets)
    go({ ...history, branches: [...history.branches, { id: session.id, name: `플레이 ${history.branches.length + 1}`, snapshots: [session] }], last: { branchId: session.id, step: 0 } })
  }
  return <>
    {warning && <div className="play-warning" role="status"><span>{warning}</span><button onClick={() => setWarning(undefined)} aria-label="안내 닫기">×</button></div>}
    <PlayTable session={session} act={act} newGame={newGame} cursor={cursor} lastStep={branch.snapshots.length - 1}
      autoRunning={autoRunning} onToggleAuto={() => setRunAt(autoRunning ? null : { branchId: branch.id, step: cursor })}
      onUndo={() => { setRunAt(null); void navigate(playPath(branch.id, cursor - 1)) }} onRedo={() => { setRunAt(null); void navigate(playPath(branch.id, cursor + 1)) }} />
    {params.get('history') === '1' && <div className="play-history">
      <header><h3>플레이 기록</h3><button onClick={() => update({ history: null })}>닫기 ×</button></header>
      <p>과거에서 다른 선택을 하면 원래 진행을 남기고 분기합니다. 기록은 이 브라우저에 저장됩니다.</p>
      {history.branches.map(item => <details key={item.id} open={item.id === branch.id}>
        <summary>{item.name} · {item.snapshots.length - 1}회 진행</summary>
        {item.snapshots.map((snapshot, index) => <Link key={index} onClick={() => setRunAt(null)} aria-current={item.id === branch.id && index === cursor ? 'step' : undefined} to={playPath(item.id, index)}>
          <b>{String(index).padStart(2, '0')}</b>{snapshot.log.at(-1)?.text ?? '게임 준비'}
        </Link>)}
      </details>)}
      <button className="play-primary" onClick={newGame}>새 플레이 시작</button>
      <Link to="/table/archive">이전 카드 배치 기록 열기</Link>
    </div>}
  </>
}

function PlayTable({ session, act, newGame, cursor, lastStep, onUndo, onRedo, autoRunning, onToggleAuto }: {
  session: PlaySession; act: (action: PlayAction, automatic?: boolean) => void; newGame: () => void;
  cursor: number; lastStep: number; onUndo: () => void; onRedo: () => void;
  autoRunning: boolean; onToggleAuto: () => void;
}) {
  const { params, update } = useQueryState()
  const [stalled, setStalled] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const reducedMotion = useReducedMotion()
  const actor = player(session.actorId)
  const viewer = session.playerId ? player(session.playerId) : undefined
  const ownTurn = viewer?.id === actor.id
  const automaticTurn = !!viewer && !ownTurn && !['ready', 'discussion', 'complete'].includes(session.phase)
  const view = viewer && ['character', 'record'].includes(params.get('view') ?? '') ? params.get('view')! : 'table'
  const publicIds = new Set(session.publicCards.map(entry => entry.cardId))
  const visibleIds = new Set([...Object.entries(session.truthOutcomes).filter(([, outcome]) => outcome === 'revealed').map(([id]) => id), ...publicIds, ...(viewer ? session.hands[viewer.id] : []), ...(ownTurn ? session.choice?.cardIds ?? [] : []), ...session.inspections.filter(entry => entry.published || viewer?.id === 'rowen').map(entry => entry.cardId)])
  const readingId = params.get('card') ?? ''
  const reading = visibleIds.has(readingId) ? cards.get(readingId) : undefined
  const evidence = availableEvidence(session, assets)
  const pendingEvidence = session.phase === 'court' && !session.courtTurn && ownTurn ? evidence.find(card => card.id === params.get('evidence')) : undefined
  const courtPhase = ['court', 'truth_exchange', 'truth_choice', 'accusation', 'defense', 'indictment', 'complete'].includes(session.phase)
  const phaseIndex = courtPhase ? 5 : phases.findIndex(phase => phase.id === session.phase)
  const readCard = (id: string) => update({ card: id })
  const submit = (id: string) => { update({ card: null, evidence: id }) }
  const currentInspection = session.inspections.find(entry => entry.round === session.round)
  const take = (id: string) => act({ type: 'take-card', cardId: id })
  const piles = useMemo(() => viewer ? playTablePiles(session, assets, true, viewer.id) : [], [session, viewer])
  const canvasReadingId = view === 'table' && piles.some(pile => pile.id === readingId) ? readingId : undefined
  const cardStage = ownTurn && (['rumor', 'testimony', 'investigation'].includes(session.phase) || session.phase === 'inspection' && !currentInspection || session.phase === 'court' && !session.courtTurn && !pendingEvidence)
  const readingOtherView = view !== 'table' || !!reading || params.get('history') === '1' || overviewOpen
  useEffect(() => {
    setStalled(false)
    if (!autoRunning || !automaticTurn || readingOtherView) return
    const timer = window.setTimeout(() => {
      const action = randomPlayerAction(session, assets)
      if (action) act(action, true)
      else setStalled(true)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [session, autoRunning, automaticTurn, readingOtherView, act])
  const myHand = viewer ? session.hands[viewer.id] : []
  const mySubmitted = session.publicCards.filter(entry => entry.source === 'court' && entry.actorId === viewer?.id)
  const collectionCounts = [['memory', '진실'], ['rumor', '소문'], ['testimony', '탐문'], ['evidence', '조사']].map(([kind, label]) => ({ label, count: myHand.filter(id => cards.get(id)?.kind === kind).length }))
  const turnLabel = !viewer ? '인물 선택' : ['discussion', 'complete'].includes(session.phase) ? '모두 함께' : ownTurn ? '내 차례' : `${actor.name}의 차례`
  const autoLabel = cursor < lastStep ? '과거 기록' : session.phase === 'complete' ? '플레이 완료' : !autoRunning ? '자동 진행 멈춤' : readingOtherView ? '읽는 동안 대기' : automaticTurn ? `${actor.name} 진행 중` : session.phase === 'discussion' ? '수집 검토' : '내 선택 대기'
  const policy: CardTablePolicy = {
    label: '게임 플레이 카드 테이블', handLabel: viewer ? `${viewer.name}의 손패` : '내 손패',
    hint: viewer ? '내 시점 고정 · 손패에 올려서 읽기 · 드래그로 정렬 · 클릭/Space로 확대' : '플레이할 인물을 선택하세요.',
    deckActions: Object.fromEntries(session.phase === 'inspection' ? assets.inspectionCards.map(card => [card.id, {
      label: card.title, backTitle: '검시 요청', backSubtitle: card.title, disabled: !ownTurn ? '다른 인물의 차례입니다.' : getInspectionBlockReason(session, card.id),
      run: () => act({ type: 'inspect', cardId: card.id }),
    }]) : groups.filter(group => group.kind !== 'memory').map(group => [group.id, {
      label: group.backTitle, disabled: !ownTurn ? '다른 인물의 차례입니다.' : getDeckBlockReason(session, group, assets),
      run: () => act({ type: session.phase === 'investigation' ? 'choose-location' : 'open-deck', deckId: group.id }),
    }])),
    choice: ownTurn && session.choice ? { sourceId: session.choice.deckId, cards: session.choice.cardIds.map(cardId => ({ cardId, faceUp: true })), onPick: take,
      note: `${actor.name} · 클릭하거나 아래 손패로 끌어 한 장을 가져오세요. 고르지 않은 카드는 덱 아래로 돌아갑니다.` } : undefined,
    play: session.phase === 'court' && ownTurn && !session.courtTurn && !pendingEvidence ? { label: '증거 제출', accepts: id => evidence.some(card => card.id === id), run: submit } : undefined,
    reorderHand: cardIds => act({ type: 'reorder-hand', cardIds }),
  }

  if (session.phase === 'ready' && viewer) return <div className="play-reading">
    <CharacterSettings key={viewer.id} settings={characterSettings} characterId={viewer.id} onBack={onUndo} footer={<footer className="play-reading__start"><p>당신의 이야기와 두 진실을 확인했다면, 그날 밤의 조사를 시작하세요.</p><button className="play-primary" onClick={() => act({ type: 'start' })}>설정서를 읽었습니다 · {viewer.name}으로 시작 →</button></footer>} />
  </div>

  return <section className="play" data-view={view} data-phase={session.phase} data-choosing={!viewer || undefined} style={{ '--actor-color': viewer?.color ?? actor.color } as CSSProperties}>
    <header className="play-toolbar">
      <h2 className="sr-only">{viewer ? `${viewer.name} 시점 · ${session.round}라운드` : '플레이할 인물 선택'}</h2>
      <nav className="play-tabs" aria-label="플레이 화면">
        {[['table', '테이블'], ['character', '내 인물'], ['record', `공개 기록 ${session.publicCards.length}`]].map(([id, title]) => <button key={id} aria-label={id === 'table' ? '게임 테이블' : title} aria-pressed={view === id} onClick={() => update({ view: id === 'table' ? null : id, card: null, evidence: null })}>{title}</button>)}
      </nav>
      <div className="play-history-tools"><button onClick={onUndo} disabled={cursor === 0} aria-label="이전 선택으로 되돌리기">↶</button><button onClick={onRedo} disabled={cursor === lastStep} aria-label="다음 선택 복원">↷</button><button onClick={() => update({ history: '1' })}>기록 · {cursor}</button></div>
    </header>
    <div className="play-phase-control">
      <button popoverTarget="play-overview" aria-label="진행 현황 열기"><span>{session.round} / 3 R</span><strong>{viewer ? phaseTitle(session) : '플레이테스트'}</strong><small>{turnLabel}</small><span aria-hidden="true">⌄</span></button>
    </div>
    <div id="play-overview" className="play-overview" popover="auto" role="dialog" aria-label="진행 현황" onToggle={event => setOverviewOpen(event.currentTarget.matches(':popover-open'))}>
      <header><strong>진행 현황</strong><button popoverTarget="play-overview" popoverTargetAction="hide" aria-label="진행 현황 닫기">×</button></header>
      <div className="play-progress" aria-label="라운드 진행">
        {phases.map((phase, index) => <div key={phase.id} className={index === phaseIndex ? 'is-current' : index < phaseIndex ? 'is-done' : ''} aria-current={index === phaseIndex ? 'step' : undefined}><span>{index < phaseIndex ? '✓' : `0${index + 1}`}</span>{phase.label}</div>)}
      </div>
      <p>{stageHint(session)}</p>
      <div className="play-seats" aria-label="플레이어 순서">{scenario.characters.map(character => <div key={character.id} style={{ '--seat-color': character.color } as CSSProperties} className={`${actor.id === character.id && session.phase !== 'ready' ? 'is-active' : ''} ${viewer?.id === character.id ? 'is-me' : ''}`}>
        <span className="play-avatar">{character.name.slice(0, 1)}</span><span><strong>{character.name}{viewer?.id === character.id ? ' · 나' : ''}</strong><small>{actor.id === character.id && session.phase !== 'ready' ? '현재 차례' : viewer?.id === character.id ? '직접 플레이' : viewer ? '랜덤 플레이어' : character.title}</small></span><b>{session.hands[character.id].length}<small>장</small></b>
      </div>)}</div>
      {viewer && <>
      <div className="play-collection" aria-label="내 카드 수집 현황"><strong>{viewer.name}의 수집 <b>{myHand.length + mySubmitted.length}</b></strong><span>손패 {myHand.length}</span>{collectionCounts.map(item => <span key={item.label}>{item.label} <b>{item.count}</b></span>)}<span>제출 {mySubmitted.length}</span></div>
      <button className="play-text-button" onClick={event => { event.currentTarget.closest<HTMLElement>('[popover]')?.hidePopover(); newGame() }}>다른 인물로 새 테스트</button>
      </>}
      <footer>카드에 올려 읽기 · 드래그로 정렬 · 클릭/Space로 확대</footer>
    </div>
    {viewer && <div className="play-hud">
      <button className="play-my-hand" popoverTarget="play-overview" aria-label="내 카드 수집 현황 열기"><span className="play-avatar" style={{ '--seat-color': viewer.color } as CSSProperties}>{viewer.name.slice(0, 1)}</span><strong>{viewer.name}</strong><span>손패 <b>{myHand.length}</b></span><small>제출 {mySubmitted.length}</small><span aria-hidden="true">⌃</span></button>
      <div className="play-auto-tools"><span role="status">{autoLabel}</span>{session.phase !== 'complete' && <button onClick={onToggleAuto} disabled={cursor < lastStep} aria-label={autoRunning ? '자동 진행 멈추기' : '자동 진행 재개'}><span aria-hidden="true">{autoRunning ? 'Ⅱ' : '▶'}</span>{autoRunning ? '멈춤' : '자동 진행'}</button>}</div>
    </div>}
    <div className="play-surface">
      <div className="play-table-mark" aria-hidden="true">♛</div>
      {view === 'record' ? <PublicRecord session={session} onRead={readCard} /> : view === 'character' && viewer ? <CharacterSheet actor={viewer} session={session} onRead={readCard} /> : <>
        <p className="play-stage-note">{!viewer ? '한 인물만 직접 플레이하고, 나머지 다섯 인물은 무작위로 행동합니다.' : automaticTurn ? '다른 인물이 진행하는 동안에도 내 손패를 읽고 정리할 수 있습니다.' : stageHint(session)}</p>
        <div className={`play-canvas ${cardStage ? '' : 'play-canvas--background'}`}>
          <CardTable scenario={tableScenario} piles={piles} policy={policy} onUndo={onUndo} onRedo={onRedo} canUndo={cursor > 0} canRedo={cursor < lastStep}
            reader={{ pileId: canvasReadingId, onChange: id => update({ card: id ?? null }) }} />
        </div>
        <div className={`play-scene-content ${cardStage ? 'play-scene-content--cards' : ''}`}>
        {!viewer ? <div className="play-intro">
          <span className="eyebrow">CHOOSE YOUR PERSPECTIVE</span><h3>누구의 시점으로 플레이할까요?</h3>
          <div className="play-person-choices play-perspective-choices">{scenario.characters.map(character => <button key={character.id} onClick={() => act({ type: 'play-as', playerId: character.id })} style={{ '--seat-color': character.color } as CSSProperties}><span>{character.name.slice(0, 1)}</span><strong>{character.name}</strong><small>{character.title}</small><em>{session.phase === 'ready' ? '설정서 먼저 읽기' : '이 인물로 이어서 플레이'} →</em></button>)}</div>
          <small>{session.phase === 'ready' ? '묻어야 할 진실 2장과 소문·탐문·조사 카드로 재판을 준비합니다.' : '기존 덱과 진행은 그대로 두고 선택한 인물의 시점으로 이어갑니다.'}<br />자동 플레이는 추론 AI가 아닌 무작위 선택입니다. 기존 기록은 유지됩니다.</small>
        </div> : automaticTurn ? <div className="play-bot-turn">
          <span className="play-avatar" style={{ '--seat-color': actor.color } as CSSProperties}>{actor.name.slice(0, 1)}</span>
          <h4>{actor.name} · {autoRunning ? '랜덤 플레이 중' : '진행 대기'}</h4>
          <p>{stalled ? '현재 규칙에서 가능한 선택을 찾지 못했습니다. 기록에서 이전 선택으로 돌아가 확인하세요.' : session.log.at(-1)?.text}</p>
          <small>{autoRunning ? '다른 인물은 무작위로 선택합니다. 내 차례가 오면 자동으로 멈춥니다.' : '내 손패를 읽거나 정리한 뒤 자동 진행을 재개하세요.'}</small>
        </div> : <AnimatePresence mode="wait" initial={false}><motion.div className="play-stage" key={`${session.round}-${session.phase}-${session.actorId}-${session.choice ? 'choice' : 'board'}`} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }}>
          {session.phase === 'inspection' && currentInspection && <div className="play-inspection-result"><div className="play-feature-card"><CardView card={cards.get(currentInspection.cardId)!} onClick={() => readCard(currentInspection.cardId)} /></div><div><span className="play-private-label">로웬만 확인</span><h4>재판이 열리기 전까지<br />당신만 아는 결과입니다.</h4><p>검시 항목은 모두에게 알려집니다.<br />결과는 이번 재판이 시작되면 자동 공개됩니다.</p><button className="play-primary" onClick={() => act({ type: 'finish-inspection' })}>결과 확인 · 소문 단계로 →</button></div></div>}
          {session.phase === 'discussion' && <div className="play-discussion"><div className="play-discussion-symbol">☽</div><h4>이번 라운드에 어떤 카드가 모였나요?</h4><p>내 손패를 읽고 단서가 어떻게 연결되는지 확인하세요.<br />준비가 되면 재판을 열어 증거 한 장을 제출합니다.</p><div className="play-inspection-sealed">✧ {cards.get(currentInspection?.cardId ?? '')?.title} · 재판 개정 시 공개</div><button className="play-primary" onClick={() => act({ type: 'end-discussion' })}>수집 확인 · 제{session.round}재판 개정 →</button></div>}
          {session.phase === 'court' && (session.courtTurn ? <div className="play-question"><div className="play-feature-card"><CardView card={cards.get(session.courtTurn.cardId)!} onClick={() => readCard(session.courtTurn!.cardId)} /></div><div><span className="eyebrow">공식 증거 제출 완료</span><h4>{actor.name} → {player(session.courtTurn.targetId)?.name}</h4><p>{session.round === 2 ? '이 증거로 의심하는 혐의를 주장하고 질문하세요.' : '이 증거와 관련된 질문을 한 번 하세요.'}<br />질문받은 인물은 자유롭게 답합니다.</p><button className="play-primary" onClick={() => act({ type: 'end-question' })}>질문·답변을 마쳤습니다 →</button></div></div> : pendingEvidence ? <div className="play-submit"><div className="play-feature-card"><CardView card={pendingEvidence} onClick={() => readCard(pendingEvidence.id)} /></div><div className="play-submit-panel"><h4>{session.round === 3 ? '마지막 증거를 남깁니다.' : session.round === 2 ? '누구의 혐의를 주장하나요?' : '누구에게 질문하나요?'}</h4><p>제출한 카드는 모두에게 공개되고 손패에서 이동합니다.</p>{session.round === 3 ? <button className="play-primary" onClick={() => act({ type: 'submit-evidence', cardId: pendingEvidence.id, targetId: '' })}>최종 증거로 제출 →</button> : <CharacterChoices actorId={actor.id} onChoose={targetId => act({ type: 'submit-evidence', cardId: pendingEvidence.id, targetId })} />}<button className="play-text-button" onClick={() => update({ evidence: null })}>다른 증거 선택</button></div></div> : null)}
          {session.phase === 'truth_exchange' && <TruthExchange session={session} actor={actor} act={act} />}
          {session.phase === 'truth_choice' && <TruthChoice session={session} actor={actor} act={act} />}
          {session.phase === 'accusation' && <div className="play-nominate"><span className="play-private-label">비공개 지목 · {Object.keys(session.accusations).length} / 5 제출</span><h4>누가 아드리안을 죽였다고 생각하나요?</h4><p>로웬은 살해범 후보가 아닙니다. 모두 제출하기 전까지 지목은 공개되지 않습니다.<br />이 지목은 기소가 아닙니다. 최후변론 후 로웬이 결정합니다.</p><CharacterChoices actorId={actor.id} excludeRowen onChoose={targetId => act({ type: 'accuse', targetId })} /></div>}
          {session.phase === 'defense' && <div className="play-defense"><Nominations session={session} /><h4>{actor.name}의 최후변론</h4><p>{actor.id === 'rowen' ? '공개된 증거와 변론을 바탕으로 수사 결론을 정리하세요.' : <>“{player(session.accusations[actor.id])?.name}이 범인이라고 생각하는 이유는…”<br />“그리고 내가 범인이 아닌 이유는…”</>}</p><span className="play-subtle">공개 증거를 근거로 변론합니다. 이 단계에는 질문·반박이 없습니다.</span><button className="play-primary" onClick={() => act({ type: 'end-defense' })}>변론을 마쳤습니다 →</button></div>}
          {session.phase === 'indictment' && <div className="play-nominate"><Nominations session={session} /><h4>로웬, 한 사람을 기소하십시오.</h4><p>앞선 지목과 달라도 됩니다. 공개 증거와 가진 모든 카드, 최후변론을 바탕으로 결정하세요.</p><CharacterChoices actorId="rowen" excludeRowen onChoose={targetId => act({ type: 'indict', targetId })} confirm /></div>}
          {session.phase === 'complete' && <TruthEnding session={session} onRead={readCard} onRecord={() => update({ view: 'record' })} newGame={newGame} />}
        </motion.div></AnimatePresence>}
        </div>
      </>}
    </div>
    <CardReader card={canvasReadingId ? undefined : reading} onClose={() => update({ card: null })}>
      {reading && session.choice?.cardIds.includes(reading.id) && ownTurn ? <button className="play-primary" onClick={() => take(reading.id)}>이 카드 가져오기 →</button> : reading && session.phase === 'court' && !session.courtTurn && evidence.some(card => card.id === reading.id) && ownTurn ? <button className="play-primary" onClick={() => submit(reading.id)}>이 증거를 재판에 제출 →</button> : null}
    </CardReader>
  </section>
}

function TruthExchange({ session, actor, act }: { session: PlaySession; actor: Character; act: (action: PlayAction) => void }) {
  const [offeredId, setOfferedId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [requestedId, setRequestedId] = useState('')
  const offered = session.hands[actor.id].filter(id => cards.get(id)?.kind === 'memory' && (actor.id !== 'rowen' || cards.get(id)?.initialOwnerId === 'rowen'))
  const targetTruths = targetId ? session.hands[targetId].filter(id => cards.get(id)?.kind === 'memory' && (targetId !== 'rowen' || cards.get(id)?.initialOwnerId === 'rowen')) : []
  return <div className="play-nominate play-truth-exchange">
    <span className="play-private-label">제{session.round}재판 뒤 · 뒷면 교환</span>
    <h4>내 진실 한 장을 누구에게 맡길까요?</h4>
    <p>내용은 말할 수 있지만 앞면은 보여 줄 수 없습니다. 교환은 반드시 한 장 대 한 장입니다.{actor.id === 'rowen' && <><br />로웬은 원래 자신의 진실만 내놓을 수 있습니다.</>}</p>
    <div className="play-record-cards">{offered.map(id => <div key={id}><CardView card={cards.get(id)!} /><button className="play-primary" aria-pressed={offeredId === id} onClick={() => setOfferedId(id)}>{offeredId === id ? '내놓을 진실로 선택됨' : '이 진실을 내놓기'}</button></div>)}</div>
    {offeredId && <CharacterChoices actorId={actor.id} onChoose={id => { setTargetId(id); setRequestedId('') }} />}
    {targetId && <div className="play-person-choices">{targetTruths.map((id, index) => <button key={id} aria-pressed={requestedId === id} onClick={() => setRequestedId(id)}><span>?</span><strong>묻어야 하는 진실 {index + 1}</strong><small>교환 뒤에만 내용을 확인합니다.</small></button>)}</div>}
    {offeredId && targetId && requestedId && <button className="play-primary" onClick={() => act({ type: 'trade-truth', offeredId, targetId, requestedId })}>{player(targetId).name}과 1장 ↔ 1장 교환 →</button>}
    <button className="play-text-button" onClick={() => act({ type: 'skip-truth-trade' })}>이번에는 교환하지 않기</button>
  </div>
}

function TruthChoice({ session, actor, act }: { session: PlaySession; actor: Character; act: (action: PlayAction) => void }) {
  const held = session.hands[actor.id].filter(id => cards.get(id)?.kind === 'memory')
  return <div className="play-nominate play-truth-choice">
    <span className="play-private-label">기소 전에 비공개로 결정</span>
    <h4>무엇을 밝히고, 무엇을 묻겠습니까?</h4>
    <p>밝힐 진실 한 장을 고르십시오. 나머지 한 장은 묻기로 결정됩니다.<br />진실의 책임은 원래 주인에게 있지만, 그 파장은 다른 인물의 권리와 왕국의 미래에도 이어집니다.<br />자기 진실을 다시 들고 있다면 묻기로 골라도 마지막에 자동으로 밝혀집니다.</p>
    <div className="play-record-cards">{held.map(id => <div key={id}><CardView card={cards.get(id)!} /><button className="play-primary" onClick={() => act({ type: 'choose-truth', revealId: id })}>이 진실을 밝힌다 →</button></div>)}</div>
  </div>
}

function TruthEnding({ session, onRead, onRecord, newGame }: { session: PlaySession; onRead: (id: string) => void; onRecord: () => void; newGame: () => void }) {
  const revealed = Object.entries(session.truthOutcomes).filter(([, outcome]) => outcome === 'revealed').map(([id]) => id)
  const buried = Object.entries(session.truthOutcomes).filter(([, outcome]) => outcome === 'buried').map(([id]) => id)
  return <div className="play-complete play-truth-ending"><span>⚖</span><h4>{player(session.indictment ?? '')?.name} 기소</h4><p>로웬의 기소로 진실의 운명이 확정되었습니다.</p>
    <section className="play-truth-group play-truth-group--revealed"><h5><span>세상에 밝혀진 진실</span><b>{revealed.length}</b></h5><p>공개된 진실은 원래 주인뿐 아니라 다른 인물의 권리와 왕국의 결말에도 영향을 줍니다. 아래 파장을 재판 기록과 함께 읽으세요.</p><div className="play-record-cards">{revealed.map(id => <CardView key={id} card={cards.get(id)!} onClick={() => onRead(id)} />)}</div></section>
    <section className="play-ending-consequences"><h5>공개된 진실이 바꾼 미래</h5><p>각 결과의 조건을 재판 기록과 대조합니다. 같은 사실이 이미 공식 입증되었다면 카드를 묻어도 그 사실은 지워지지 않습니다. 계승·후견 자격을 먼저 정하고, 남은 후보와 보호자가 선택을 마칩니다.</p>{characterSettings.flatMap(setting => setting.finalActions).filter(truth => revealed.includes(truth.id)).map(truth => <div key={truth.id}><strong>{truth.title}</strong><p>{truth.omen}</p></div>)}</section>
    <section className="play-truth-group play-truth-group--buried"><h5><span>영원히 묻힌 진실</span><b>{buried.length}</b></h5><p>묻힌 진실의 내용은 끝내 공개되지 않습니다.</p><div className="play-record-cards">{buried.map(id => <CardView key={id} card={cards.get(id)!} faceDown backTitle="영원히 묻힌 진실" backLabel="내용이 공개되지 않은 진실" />)}</div></section>
    <small>기소된 사람이 가진 진실과 자기 손에 남은 자기 진실은 모두 밝혀졌습니다.</small><button className="play-primary" onClick={onRecord}>공개 기록 돌아보기 →</button><button className="play-text-button" onClick={newGame}>기존 기록을 남기고 새 플레이</button>
  </div>
}

function CharacterChoices({ actorId, onChoose, confirm = false, excludeRowen = false }: { actorId: string; onChoose: (id: string) => void; confirm?: boolean; excludeRowen?: boolean }) {
  const [selected, setSelected] = useState('')
  return <div className="play-person-choices">{scenario.characters.filter(character => character.id !== actorId && (!excludeRowen || character.id !== 'rowen')).map(character => <button key={character.id} onClick={() => confirm ? setSelected(character.id) : onChoose(character.id)} aria-pressed={confirm ? selected === character.id : undefined} style={{ '--seat-color': character.color } as CSSProperties}><span>{character.name.slice(0, 1)}</span><strong>{character.name}</strong><small>{character.title}</small></button>)}{confirm && selected && <button className="play-primary play-indict-confirm" onClick={() => onChoose(selected)}>{player(selected).name} 기소 확정 →</button>}</div>
}

function Nominations({ session }: { session: PlaySession }) {
  return <div className="play-nominations">{scenario.characters.filter(character => character.id !== 'rowen').map(character => <div key={character.id}><small>{character.name}</small><span>→</span><strong>{player(session.accusations[character.id])?.name ?? '미제출'}</strong></div>)}</div>
}

function PublicRecord({ session, onRead }: { session: PlaySession; onRead: (id: string) => void }) {
  return <div className="play-record"><header><span className="eyebrow">THE COURT RECORD</span><h3>재판에 제출된 기록</h3><p>재판에 제출한 증거와 공개된 검시 결과입니다. 비공개 손패와 미공개 지목은 표시하지 않습니다.</p></header>
    {!session.publicCards.length && <div className="play-empty">아직 재판이 열리지 않았습니다.<br />수집한 카드는 각자의 손패에 보관됩니다.</div>}
    {[1, 2, 3].map(round => { const entries = session.publicCards.filter(entry => entry.round === round); return entries.length ? <section key={round}><h4>제{round}재판 <span>{entries.length}장</span></h4><div className="play-record-cards">{entries.map(entry => <div key={entry.cardId}><small>{entry.source === 'inspection' ? '로웬 · 검시 결과' : `${player(entry.actorId).name} · 제출 증거`}</small><CardView card={cards.get(entry.cardId)!} onClick={() => onRead(entry.cardId)} /></div>)}</div></section> : null })}
    {['defense', 'indictment', 'complete'].includes(session.phase) && <section><h4>최종 범인 지목</h4><Nominations session={session} /></section>}
    {session.phase === 'complete' && <section><h4>진실의 운명</h4><div className="play-record-cards">{Object.entries(session.truthOutcomes).filter(([, outcome]) => outcome === 'revealed').map(([id]) => <div key={id}><small>세상에 밝혀짐</small><CardView card={cards.get(id)!} onClick={() => onRead(id)} /></div>)}</div><p>{Object.values(session.truthOutcomes).filter(outcome => outcome === 'buried').length}개의 진실은 끝내 묻혔습니다.</p></section>}
  </div>
}

function CharacterSheet({ actor, session, onRead }: { actor: Character; session: PlaySession; onRead: (id: string) => void }) {
  const setting = characterSettings.find(setting => setting.id === actor.id)
  return <div className="play-character"><header><span className="eyebrow">{actor.title} · PRIVATE</span><h3>{actor.name}</h3><p>{setting?.objective ?? actor.desire}</p></header><div className="play-character-memories">{session.hands[actor.id].filter(id => cards.get(id)?.kind === 'memory').map(id => <CardView key={id} card={cards.get(id)!} onClick={() => onRead(id)} />)}</div>
    {setting && <section><h4>당신의 신념</h4><p>{setting.belief}</p><ul>{setting.goals.map(goal => <li key={goal}>{goal}</li>)}</ul><p>공통 목표는 실제 진범을 알아내는 것입니다. 지키려던 것을 지켰는지는 그와 별개로 남습니다.</p></section>}
    {setting && <section><h4>내 진실의 무게</h4><p>두 진실이 모두 공개되면 발각되어 가장 두려워한 대가를 치릅니다. 그래도 지키려던 것까지 잃는지는 아직 정해지지 않았습니다.</p>{setting.finalActions.map(truth => <div key={truth.id}><strong>{truth.title}</strong><p>{truth.intent}</p></div>)}</section>}
    {actor.id === 'rowen' && session.inspections.length > 0 && <section><h4>내 검시 결과</h4><p>아직 공개하지 않은 결과도 이곳에서 다시 읽을 수 있습니다.</p><div className="play-record-cards">{session.inspections.map(entry => <div key={entry.cardId}><small>{entry.round}라운드 · {entry.published ? '공개 완료' : '나만 아는 결과'}</small><CardView card={cards.get(entry.cardId)!} onClick={() => onRead(entry.cardId)} /></div>)}</div></section>}
    {setting?.sections.map(section => <section key={section.title}><h4>{section.title}</h4>{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.relations?.map(relation => <p key={relation.name}><strong>{relation.name}</strong> — {relation.description}</p>)}{section.points?.map(text => <p key={text}>{text}</p>)}</section>)}
  </div>
}

function stageHint(session: PlaySession) {
  if (session.choice) return `${groups.find(group => group.id === session.choice!.deckId)?.backTitle ?? '선택한 덱'}에서 확인한 카드입니다. 한 장을 손패로 가져갑니다.`
  return ({ ready: '묻어야 할 진실 두 장을 받고 조사와 재판을 시작합니다.', inspection: session.round === 1 ? '첫 라운드에는 시신 전반에 관한 소견을 요청합니다.' : '검시관에게 자세히 살펴볼 항목 하나를 요청합니다.', rumor: '공용 소문 덱을 눌러 세 장을 읽고 한 장을 가져옵니다.', testimony: '로웬도 다른 인물과 똑같이 탐문합니다. 이번 라운드에 아직 선점되지 않은 NPC 중, 자신이 이전에 만나지 않은 한 사람을 고르세요.', investigation: '장소를 골라 혼자 2장을 보고 1장을 가져갑니다. 고르지 않은 카드는 덱 아래로 돌립니다. 1장만 남으면 그 카드를 가져갑니다.', discussion: '재판이 열리기 전, 마지막으로 이야기를 맞출 시간입니다.', court: `제${session.round}재판 · 각자 한 장씩 공개 증거를 제출합니다.`, truth_exchange: '상대와 합의해 뒷면 상태의 진실 한 장씩을 교환합니다.', truth_choice: '기소 결과를 보기 전에 하나를 밝히고 하나를 묻기로 결정합니다.', accusation: '로웬을 제외한 다섯 사람 중 진범이라고 생각하는 사람을 지목합니다.', defense: '범인 지목이 공개되었습니다. 로웬은 마지막에 수사 결론을 정리합니다.', indictment: '로웬은 공개 증거와 가진 모든 카드로 한 사람을 기소합니다.', complete: '기소된 사람의 진실은 모두 밝혀졌고, 나머지는 결정한 운명을 따릅니다.' } as Record<PlayPhase, string>)[session.phase]
}
