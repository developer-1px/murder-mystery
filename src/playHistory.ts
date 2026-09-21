import { createPlaySession, type PlayAssets, type PlaySession } from './domain/playSession'

export interface PlayBranch {
  id: string
  name: string
  snapshots: PlaySession[]
}
export interface PlayHistory {
  version: 3
  branches: PlayBranch[]
  last: { branchId: string; step: number }
}
export const playStorageKey = (scenarioId: string) => `murder-mystery:play:${scenarioId}:v3`
export const playPath = (branchId: string, step: number) => `/table/play/${encodeURIComponent(branchId)}/steps/${step}`

export function createPlayHistory(assets: PlayAssets): PlayHistory {
  const session = createPlaySession(assets)
  return { version: 3, branches: [{ id: session.id, name: '첫 번째 재판', snapshots: [session] }], last: { branchId: session.id, step: 0 } }
}

export function readPlayHistory(assets: PlayAssets): { history: PlayHistory; error?: string; warning?: string } {
  let raw: string | null
  try { raw = localStorage.getItem(playStorageKey(assets.scenario.meta.id)) }
  catch { return { history: createPlayHistory(assets), warning: '저장소를 사용할 수 없습니다. 이 플레이는 새로고침하면 사라집니다.' } }
  if (!raw) return { history: createPlayHistory(assets) }
  try {
    const history = JSON.parse(raw) as PlayHistory
    const phases = new Set(['ready', 'inspection', 'rumor', 'testimony', 'investigation', 'discussion', 'court', 'truth_exchange', 'truth_choice', 'accusation', 'defense', 'indictment', 'complete'])
    const cardIds = new Set([...assets.scenario.cards, ...assets.inspectionCards].map(card => card.id))
    const characterIds = new Set(assets.scenario.characters.map(character => character.id))
    if (history.version !== 3 || !Array.isArray(history.branches) || !history.branches.length) throw new Error('format')
    const branchIds = new Set<string>()
    for (const branch of history.branches) {
      if (typeof branch.id !== 'string' || !branch.id || branchIds.has(branch.id) || typeof branch.name !== 'string' || !Array.isArray(branch.snapshots) || !branch.snapshots.length) throw new Error('branch')
      branchIds.add(branch.id)
      for (const session of branch.snapshots) {
        if (session.playerId !== undefined && !characterIds.has(session.playerId)) throw new Error('player')
        if (!session || !phases.has(session.phase) || !characterIds.has(session.actorId) || !Number.isInteger(session.round) || session.round < 1 || session.round > 3 || !Array.isArray(session.log) || !Array.isArray(session.publicCards) || !Array.isArray(session.inspections) || !Array.isArray(session.truthTrades) || !session.truthChoices || !session.truthOutcomes || !session.decks || !session.hands || !session.visitedNpcs || !session.accusations || !session.locationChoices) throw new Error('session')
        for (const id of characterIds) if (!Array.isArray(session.hands[id]) || !Array.isArray(session.visitedNpcs[id])) throw new Error('hand')
        const ids = [...Object.values(session.hands).flat(), ...Object.values(session.decks).flat(), ...session.publicCards.map(card => card.cardId), ...session.inspections.map(card => card.cardId), ...(session.choice?.cardIds ?? [])]
        if (ids.some(id => !cardIds.has(id))) throw new Error('cards')
      }
    }
    const last = history.branches.find(branch => branch.id === history.last?.branchId)
    if (!last || !Number.isInteger(history.last.step) || !last.snapshots[history.last.step]) throw new Error('cursor')
    return { history }
  } catch {
    return { history: createPlayHistory(assets), error: '저장된 플레이가 현재 시나리오와 맞지 않습니다. 원래 기록을 덮어쓰지 않았습니다.' }
  }
}

export function appendPlay(history: PlayHistory, branch: PlayBranch, step: number, session: PlaySession): PlayHistory {
  if (step < branch.snapshots.length - 1) {
    const fork: PlayBranch = { id: crypto.randomUUID(), name: `${branch.name} · 분기 ${history.branches.length}`, snapshots: [...branch.snapshots.slice(0, step + 1), session] }
    return { ...history, branches: [...history.branches, fork], last: { branchId: fork.id, step: fork.snapshots.length - 1 } }
  }
  const next = { ...branch, snapshots: [...branch.snapshots, session] }
  return { ...history, branches: history.branches.map(item => item.id === branch.id ? next : item), last: { branchId: branch.id, step: next.snapshots.length - 1 } }
}
