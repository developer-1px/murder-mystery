import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import type { CardPile } from '../domain/table'
import { memoryStages, npcGroups, scenario } from '../scenario/load'
import { getCardGroups } from '../scenario/cardGroups'
import { href, MissingRoute, useQueryState } from '../routing'
import { initialHistory, parseTableHistory, tablePath, tableStorageKey, type TableHistory } from '../tableHistory'
import { CardTable, type TableView } from './CardTable'

const cardGroups = getCardGroups(scenario, npcGroups, memoryStages).filter((group) => group.cards.length)
const deckRows = [
  cardGroups.filter((group) => group.kind === 'memory'),
  cardGroups.filter((group) => group.kind === 'testimony'),
  cardGroups.filter((group) => group.kind === 'rumor' || group.kind === 'evidence'),
]
const initialPiles: CardPile[] = deckRows.flatMap((groups, row) => groups.map((group, column) => ({
  id: `deck-${group.id}`, cards: [...group.cards].reverse().map((card) => ({ cardId: card.id, faceUp: false })),
  zone: 'table' as const, x: groups.length === 1 ? 50 : 4 + column * 92 / (groups.length - 1), y: 4 + row * 32,
})))

function readHistory(): { history: TableHistory; error?: string; warning?: string } {
  let raw: string | null
  try { raw = localStorage.getItem(tableStorageKey(scenario.meta.id)) }
  catch { return { history: initialHistory(initialPiles), warning: '브라우저 저장소를 사용할 수 없어 새로고침 후 기록을 복원할 수 없습니다.' } }
  if (!raw) return { history: initialHistory(initialPiles) }
  try { return { history: parseTableHistory(raw, new Set(scenario.cards.map((card) => card.id))) } }
  catch { return { history: initialHistory(initialPiles), error: '저장된 기록의 형식이나 카드 참조가 현재 시나리오와 맞지 않습니다. 기존 저장 데이터는 덮어쓰지 않았습니다.' } }
}

function viewQuery(view: TableView, historyOpen: boolean) {
  const params = new URLSearchParams()
  view.selectedIds.forEach((id) => params.append('selected', id))
  if (view.readingId) params.set('inspect', view.readingId)
  if (view.choice) { params.set('pile', view.choice.sourceId); params.set('draw', String(view.choice.count)) }
  if (view.helpOpen) params.set('help', '1')
  if (historyOpen) params.set('history', '1')
  return params
}

export function TablePage() {
  const [stored, setStored] = useState(readHistory)
  const [warning, setWarning] = useState(stored.warning)
  const { branchId, step } = useParams()
  const { params, update } = useQueryState()
  const navigate = useNavigate()
  const history = stored.history
  const branch = history.branches.find((item) => item.id === (branchId ?? history.last.branchId))
  const cursor = step === undefined ? branch?.id === history.last.branchId ? history.last.step : (branch?.snapshots.length ?? 1) - 1 : /^\d+$/.test(step) ? Number(step) : -1
  const snapshot = branch?.snapshots[cursor]
  const save = (next: TableHistory) => {
    setStored({ history: next })
    try { localStorage.setItem(tableStorageKey(scenario.meta.id), JSON.stringify(next)); setWarning(undefined) }
    catch { setWarning('기록 저장에 실패했습니다. 현재 조작은 유지되지만 새로고침하면 복원되지 않을 수 있습니다.') }
  }
  useEffect(() => {
    if (!stored.error && branch && snapshot && (history.last.branchId !== branch.id || history.last.step !== cursor)) save({ ...history, last: { branchId: branch.id, step: cursor } })
  }, [branch?.id, cursor])

  if (stored.error) return <MissingRoute message={stored.error} to="/library" label="카드 라이브러리로" />
  if (!branch || !snapshot) return <MissingRoute message="이 브라우저에 해당 테이블 가지 또는 기록이 없습니다. 테이블 기록 링크는 저장된 같은 브라우저에서만 복원됩니다." to="/table" label="이 브라우저의 마지막 테이블로" />
  if (!branchId || step === undefined) return <Navigate replace to={href(tablePath(branch.id, cursor), params)} />

  const view: TableView = {
    selectedIds: [...new Set(params.getAll('selected'))], readingId: params.get('inspect') ?? undefined,
    choice: params.has('draw') ? { sourceId: params.get('pile') ?? '', count: Number(params.get('draw')) } : undefined,
    helpOpen: params.get('help') === '1',
  }
  const pileIds = new Set(snapshot.piles.map((pile) => pile.id))
  if (view.selectedIds.some((id) => !pileIds.has(id)) || (view.readingId && !pileIds.has(view.readingId)) || (view.choice && (!pileIds.has(view.choice.sourceId) || ![2, 3].includes(view.choice.count))) || (params.has('pile') && !params.has('draw')) || [!!view.readingId, !!view.choice, view.helpOpen].filter(Boolean).length > 1) return <MissingRoute message="이 기록에서 찾을 수 없는 카드 묶음이나 잘못된 보기 주소입니다." to={tablePath(branch.id, cursor)} label="이 기록의 전체 배치로" />
  const historyOpen = params.get('history') === '1'
  const moveTo = (nextBranch: string, nextStep: number) => { void navigate(href(tablePath(nextBranch, nextStep), new URLSearchParams(historyOpen ? { history: '1' } : {}))) }
  const commit = (piles: CardPile[], label: string, nextView?: TableView) => {
    if (piles === snapshot.piles) return
    const snapshots = [...branch.snapshots.slice(0, cursor + 1), { label, piles }]
    const forked = cursor < branch.snapshots.length - 1
    const id = forked ? crypto.randomUUID() : branch.id
    const nextBranch = { id, name: forked ? `테이블 ${history.branches.length + 1}` : branch.name, snapshots }
    save({ version: 1, branches: forked ? [...history.branches, nextBranch] : history.branches.map((item) => item.id === id ? nextBranch : item), last: { branchId: id, step: snapshots.length - 1 } })
    void navigate(href(tablePath(id, snapshots.length - 1), viewQuery(nextView ?? { selectedIds: [], helpOpen: false }, historyOpen)))
  }
  const fork = () => {
    const next = { id: crypto.randomUUID(), name: `테이블 ${history.branches.length + 1}`, snapshots: branch.snapshots.slice(0, cursor + 1) }
    save({ ...history, branches: [...history.branches, next], last: { branchId: next.id, step: cursor } })
    moveTo(next.id, cursor)
  }
  const startScenarioTable = () => {
    const next = { id: crypto.randomUUID(), name: `시나리오 덱 ${history.branches.length + 1}`, snapshots: [{ label: '개인·소문·NPC·장소별 덱 배치', piles: initialPiles }] }
    save({ ...history, branches: [...history.branches, next], last: { branchId: next.id, step: 0 } })
    void navigate(tablePath(next.id, 0))
  }
  const legacyDecks = snapshot.piles.some((pile) => ['deck-memory', 'deck-rumor', 'deck-evidence', 'deck-testimony'].includes(pile.id))

  return <>
    {warning && <p className="route-warning" role="status">{warning}</p>}
    {legacyDecks && <div className="table-deck-notice"><span>이전 덱 구성의 기록입니다. 기존 플레이를 보존하고 개인·NPC·장소별 덱으로 시작할 수 있습니다.</span><button type="button" onClick={startScenarioTable}>새 덱 구성으로 시작</button></div>}
    <details className="table-history" open={historyOpen}>
      <summary onClick={(event) => { event.preventDefault(); update({ history: historyOpen ? null : '1' }) }}>기록 · {cursor}</summary>
      <section className="timeline">
        <div className="section-heading"><span>테이블 기록</span><small>{cursor}/{branch.snapshots.length - 1}</small></div>
        <select aria-label="테이블 가지" value={branch.id} onChange={(event) => { const next = history.branches.find((item) => item.id === event.target.value)!; moveTo(next.id, next.snapshots.length - 1) }}>{history.branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <div className="history-controls"><button disabled={cursor === 0} onClick={() => moveTo(branch.id, cursor - 1)}>↶ 되돌리기</button><button disabled={cursor === branch.snapshots.length - 1} onClick={() => moveTo(branch.id, cursor + 1)}>↷ 다시 하기</button></div>
        <button className="fork-button" onClick={fork}>현재 배치에서 Fork</button>
        <button className="fork-button" onClick={startScenarioTable}>시나리오 덱으로 새 테이블</button>
        {branch.snapshots.map((item, index) => <Link className={`event ${cursor === index ? 'active' : ''}`} key={index} to={`${tablePath(branch.id, index)}?history=1`}><b>{index}</b><span>{item.label}</span></Link>)}
        <p className="timeline__note">이 브라우저에 저장됩니다. 다른 기기에는 기록이 전달되지 않습니다. 과거 배치에서 조작하면 새 가지에 기록합니다.</p>
      </section>
    </details>
    <CardTable scenario={scenario} piles={snapshot.piles} onChange={commit}
      view={view} onViewChange={(next, replace = true) => { void navigate(href(tablePath(branch.id, cursor), viewQuery(next, historyOpen)), { replace }) }}
      onUndo={() => { if (cursor > 0) moveTo(branch.id, cursor - 1) }} onRedo={() => { if (cursor < branch.snapshots.length - 1) moveTo(branch.id, cursor + 1) }} canUndo={cursor > 0} canRedo={cursor < branch.snapshots.length - 1} />
  </>
}
