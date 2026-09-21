import type { CardPile } from './domain/table'

export interface TableBranch {
  id: string
  name: string
  snapshots: { label: string; piles: CardPile[] }[]
}
export interface TableHistory {
  version: 1
  branches: TableBranch[]
  last: { branchId: string; step: number }
}
export const tableStorageKey = (scenarioId: string) => `murder-mystery:table:${scenarioId}:v1`
export const tablePath = (branchId: string, step: number) => `/table/${encodeURIComponent(branchId)}/steps/${step}`

export function initialHistory(piles: CardPile[]): TableHistory {
  return { version: 1, branches: [{ id: 'main', name: '기본 테이블', snapshots: [{ label: '처음 배치', piles }] }], last: { branchId: 'main', step: 0 } }
}

// URL은 기록의 위치만 담는다. 배치 기록은 이 브라우저에만 저장하며 다른 기기의 기록인 척 복원하지 않는다.
export function parseTableHistory(raw: string, cardIds: Set<string>): TableHistory {
  const value = JSON.parse(raw) as TableHistory
  if (value?.version !== 1 || !Array.isArray(value.branches) || !value.branches.length) throw new Error('지원하지 않는 기록 형식')
  const branchIds = new Set<string>()
  for (const branch of value.branches) {
    if (!branch || typeof branch.id !== 'string' || !branch.id || branchIds.has(branch.id) || typeof branch.name !== 'string' || !Array.isArray(branch.snapshots) || !branch.snapshots.length) throw new Error('잘못된 테이블 가지')
    branchIds.add(branch.id)
    for (const snapshot of branch.snapshots) {
      if (!snapshot || typeof snapshot.label !== 'string' || !Array.isArray(snapshot.piles)) throw new Error('잘못된 배치 기록')
      const seenCards = new Set<string>()
      const seenPiles = new Set<string>()
      for (const pile of snapshot.piles) {
        if (!pile || typeof pile.id !== 'string' || !pile.id || seenPiles.has(pile.id) || !Number.isFinite(pile.x) || !Number.isFinite(pile.y) || pile.x < 0 || pile.x > 100 || pile.y < 0 || pile.y > 100 || !Array.isArray(pile.cards) || !pile.cards.length) throw new Error('잘못된 카드 묶음')
        if (pile.zone !== undefined && pile.zone !== 'table' && pile.zone !== 'hand') throw new Error('잘못된 카드 배치 영역')
        seenPiles.add(pile.id)
        for (const card of pile.cards) {
          if (!card || !cardIds.has(card.cardId) || seenCards.has(card.cardId) || typeof card.faceUp !== 'boolean') throw new Error('시나리오와 맞지 않는 카드 기록')
          seenCards.add(card.cardId)
        }
      }
    }
  }
  const last = value.last && value.branches.find((branch) => branch.id === value.last.branchId)
  if (!last || !Number.isInteger(value.last.step) || value.last.step < 0 || !last.snapshots[value.last.step]) throw new Error('잘못된 마지막 기록 위치')
  return value
}
