import { useState } from 'react'
import { CardLibrary } from './components/CardLibrary'
import { CardTable } from './components/CardTable'
import { cardKinds } from './components/cardKinds'
import type { CardPile } from './domain/table'
import type { CardKind } from './domain/types'
import { scenario, validationIssues } from './scenario/load'

interface TableBranch {
  id: string
  name: string
  snapshots: { label: string; piles: CardPile[] }[]
}

const initialPiles: CardPile[] = (Object.keys(cardKinds) as CardKind[]).map((kind, index) => ({
  id: `deck-${kind}`,
  cards: scenario.cards.filter((card) => card.kind === kind).map((card) => ({ cardId: card.id, faceUp: false })),
  x: 4 + index * 30,
  y: 12,
})).filter((pile) => pile.cards.length)

export default function App() {
  const [workspace, setWorkspace] = useState<'table' | 'library'>('table')
  const [branches, setBranches] = useState<TableBranch[]>([{ id: 'main', name: '기본 테이블', snapshots: [{ label: '처음 배치', piles: initialPiles }] }])
  const [branchId, setBranchId] = useState('main')
  const [cursor, setCursor] = useState(0)
  const branch = branches.find((item) => item.id === branchId)!
  const snapshot = branch.snapshots[cursor]

  const fork = () => {
    const next: TableBranch = { id: crypto.randomUUID(), name: `테이블 ${branches.length + 1}`, snapshots: branch.snapshots.slice(0, cursor + 1) }
    setBranches((items) => [...items, next])
    setBranchId(next.id)
  }

  const commit = (piles: CardPile[], label: string) => {
    if (piles === snapshot.piles) return
    const snapshots = [...branch.snapshots.slice(0, cursor + 1), { label, piles }]
    if (cursor < branch.snapshots.length - 1) {
      const id = crypto.randomUUID()
      setBranches((items) => [...items, { id, name: `테이블 ${items.length + 1}`, snapshots }])
      setBranchId(id)
    } else setBranches((items) => items.map((item) => item.id === branchId ? { ...item, snapshots } : item))
    setCursor(snapshots.length - 1)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><span className="eyebrow">MURDER MYSTERY WORKBENCH</span><h1>{scenario.meta.title}</h1></div>
        <div className="topbar__actions">
          <span className={`health ${validationIssues.some((issue) => issue.severity === 'error') ? 'health--error' : ''}`}><i />{validationIssues.length ? `검증 ${validationIssues.length}건` : '시나리오 정상'}</span>
          <nav className="workspace-tabs" aria-label="작업 공간">
            <button className={workspace === 'table' ? 'active' : ''} onClick={() => setWorkspace('table')}>카드 테이블</button>
            <button className={workspace === 'library' ? 'active' : ''} onClick={() => setWorkspace('library')}>카드 라이브러리</button>
          </nav>
        </div>
      </header>
      {workspace === 'table' && <details className="table-history">
        <summary>기록 · {cursor}</summary>
        <section className="timeline">
          <div className="section-heading"><span>테이블 기록</span><small>{cursor}/{branch.snapshots.length - 1}</small></div>
          <select aria-label="테이블 가지" value={branchId} onChange={(event) => { const next = branches.find((item) => item.id === event.target.value)!; setBranchId(next.id); setCursor(next.snapshots.length - 1) }}>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <div className="history-controls"><button disabled={cursor === 0} onClick={() => setCursor(cursor - 1)}>↶ 되돌리기</button><button disabled={cursor === branch.snapshots.length - 1} onClick={() => setCursor(cursor + 1)}>↷ 다시 하기</button></div>
          <button className="fork-button" onClick={fork}>현재 배치에서 Fork</button>
          {branch.snapshots.map((item, index) => <button className={`event ${cursor === index ? 'active' : ''}`} key={index} onClick={() => setCursor(index)}><b>{index}</b><span>{item.label}</span></button>)}
          <p className="timeline__note">과거 배치에서 조작하면 새 가지에 기록합니다. 새로고침하면 초기화됩니다.</p>
        </section>
      </details>}
      {workspace === 'table' ? <CardTable scenario={scenario} piles={snapshot.piles} onChange={commit}
        onUndo={() => setCursor((value) => Math.max(0, value - 1))}
        onRedo={() => setCursor((value) => Math.min(branch.snapshots.length - 1, value + 1))}
        canUndo={cursor > 0} canRedo={cursor < branch.snapshots.length - 1}
      /> : <CardLibrary scenario={scenario} issues={validationIssues} />}
    </main>
  )
}
