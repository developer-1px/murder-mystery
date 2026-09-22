import type { Card, MemoryStagesDocument, Scenario } from './types'
import type { CardGroup } from '../scenario/cardGroups'

export type PlayPhase = 'ready' | 'inspection' | 'rumor' | 'testimony' | 'investigation' | 'discussion' | 'court' | 'truth_exchange' | 'truth_choice' | 'accusation' | 'defense' | 'indictment' | 'complete'

export interface PlaySession {
  id: string
  round: number
  phase: PlayPhase
  actorId: string
  // The human perspective stays fixed while actorId advances around the table.
  // Absent on legacy hot-seat snapshots until a perspective is selected.
  playerId?: string
  turnIndex: number
  hands: Record<string, string[]>
  decks: Record<string, string[]>
  choice?: { deckId: string; cardIds: string[]; participantIds: string[] }
  locationChoices: Record<string, string>
  visitedNpcs: Record<string, string[]>
  // Added after the first playtest format; absent in older saved sessions.
  roundVisitedNpcs?: string[]
  inspectionStage: 'select' | 'result'
  investigationStage: 'locations' | 'cards'
  investigationQueue: string[]
  inspections: Array<{ round: number; cardId: string; published: boolean }>
  publicCards: Array<{ cardId: string; actorId: string; round: number; source: 'court' | 'inspection'; targetId?: string }>
  courtTurn?: { cardId: string; targetId: string }
  accusations: Record<string, string>
  truthTrades: Array<{ round: number; fromId: string; toId: string; offeredId: string; receivedId: string }>
  truthChoices: Record<string, { revealId: string; buryId: string }>
  truthOutcomes: Record<string, 'revealed' | 'buried'>
  indictment?: string
  log: Array<{ text: string; round: number }>
}

export interface PlayAssets {
  scenario: Scenario
  groups: CardGroup[]
  memoryStages: MemoryStagesDocument
  inspectionCards: Card[]
}

export type PlayAction =
  | { type: 'start' }
  | { type: 'play-as'; playerId: string }
  | { type: 'inspect'; cardId: string }
  | { type: 'finish-inspection' }
  | { type: 'open-deck'; deckId: string }
  | { type: 'take-card'; cardId: string }
  | { type: 'choose-location'; deckId: string }
  | { type: 'end-discussion' }
  | { type: 'submit-evidence'; cardId: string; targetId: string }
  | { type: 'end-question' }
  | { type: 'trade-truth'; offeredId: string; targetId: string; requestedId: string }
  | { type: 'skip-truth-trade' }
  | { type: 'choose-truth'; revealId: string }
  | { type: 'accuse'; targetId: string }
  | { type: 'end-defense' }
  | { type: 'indict'; targetId: string }
  | { type: 'reorder-hand'; cardIds: string[] }

const inspectionDeckId = 'inspections'
const overviewInspectionId = 'inspection.overview'

export function getInspectionBlockReason(session: PlaySession, cardId: string): string | undefined {
  if (session.phase !== 'inspection' || session.inspectionStage !== 'select') return '현재 검시 요청 단계가 아닙니다.'
  const deck = session.decks[inspectionDeckId] ?? []
  if (!deck.includes(cardId)) return '이미 받은 검시 소견입니다.'
  const usesOverviewRequest = deck.includes(overviewInspectionId) || session.inspections.some(({ cardId: receivedId }) => receivedId === overviewInspectionId)
  if (usesOverviewRequest && session.round === 1 && cardId !== overviewInspectionId) return '첫 요청에서는 시신 전반에 관한 소견을 먼저 받아야 합니다.'
  if (session.round > 1 && cardId === overviewInspectionId) return '첫 소견은 1라운드에만 요청할 수 있습니다.'
  return undefined
}

function shuffled(cardIds: string[]): string[] {
  const result = [...cardIds]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function playerIds(assets: PlayAssets): string[] {
  return assets.scenario.characters.map((character) => character.id)
}

function rowenId(assets: PlayAssets): string {
  return assets.scenario.characters.find((character) => character.id === 'rowen')?.id ?? playerIds(assets).at(-1) ?? ''
}

function nameOf(id: string, assets: PlayAssets): string {
  return assets.scenario.characters.find((character) => character.id === id)?.name ?? id
}

function record(session: PlaySession, text: string): void {
  session.log.push({ text, round: session.round })
}

function dealMemories(session: PlaySession, assets: PlayAssets): void {
  const stage = assets.memoryStages.stages[session.round - 1]
  if (!stage) return
  for (const cardId of stage.cardIds) {
    const card = assets.scenario.cards.find((entry) => entry.id === cardId)
    if (!card?.initialOwnerId || !session.hands[card.initialOwnerId]) continue
    const deck = Object.entries(session.decks).find(([, ids]) => ids.includes(cardId))
    if (!deck) continue
    session.decks[deck[0]] = deck[1].filter((id) => id !== cardId)
    session.hands[card.initialOwnerId].push(cardId)
  }
  record(session, `${stage.label}을 각 인물의 비공개 손패에 배분했습니다.`)
}

export function createPlaySession(assets: PlayAssets): PlaySession {
  const ids = playerIds(assets)
  const session: PlaySession = {
    id: crypto.randomUUID(), round: 1, phase: 'ready', actorId: rowenId(assets), turnIndex: 0,
    hands: Object.fromEntries(ids.map((id) => [id, []])),
    decks: Object.fromEntries(assets.groups.map((group) => [group.id,
      group.kind === 'memory' ? group.cards.map((card) => card.id) : shuffled(group.cards.map((card) => card.id)),
    ])),
    locationChoices: {}, visitedNpcs: Object.fromEntries(ids.map((id) => [id, []])), roundVisitedNpcs: [],
    inspectionStage: 'select', investigationStage: 'locations', investigationQueue: [],
    inspections: [], publicCards: [], accusations: {}, truthTrades: [], truthChoices: {}, truthOutcomes: {}, log: [],
  }
  session.decks[inspectionDeckId] = assets.inspectionCards.map((card) => card.id)
  dealMemories(session, assets)
  return session
}

function setPhase(session: PlaySession, phase: PlayPhase, assets: PlayAssets): void {
  session.phase = phase
  session.turnIndex = 0
  session.actorId = ['inspection', 'discussion', 'indictment', 'complete'].includes(phase)
    ? rowenId(assets) : playerIds(assets)[0]
  delete session.choice
  delete session.courtTurn
}

function nextPlayer(session: PlaySession, followingPhase: PlayPhase, assets: PlayAssets): void {
  const ids = playerIds(assets)
  if (session.turnIndex + 1 < ids.length) {
    session.turnIndex += 1
    session.actorId = ids[session.turnIndex]
  } else {
    setPhase(session, followingPhase, assets)
  }
}

function nextRound(session: PlaySession, assets: PlayAssets): void {
  session.round += 1
  session.locationChoices = {}
  session.roundVisitedNpcs = []
  session.investigationQueue = []
  session.investigationStage = 'locations'
  session.inspectionStage = 'select'
  setPhase(session, 'inspection', assets)
  dealMemories(session, assets)
  record(session, `${session.round}라운드를 시작합니다.`)
}

// 현재 라운드의 남은 인물도 서로 다른 NPC를 하나씩 선택할 수 있어야 한다.
// 각 인물은 자신이 이전 라운드에 탐문한 NPC를 다시 선택할 수 없다.
function leavesNpcChoices(session: PlaySession, selectedDeckId: string, assets: PlayAssets): boolean {
  const pending = playerIds(assets).slice(session.turnIndex + 1)
  const claimed = new Set(session.roundVisitedNpcs ?? [])
  const slots = assets.groups.filter((group) => group.kind === 'testimony'
    && group.id !== selectedDeckId
    && !claimed.has(group.id)
    && (session.decks[group.id]?.length ?? 0) > 0).map((group) => group.id)
  const assigned = new Map<number, string>()
  function place(actorId: string, seen: Set<number>): boolean {
    for (let index = 0; index < slots.length; index += 1) {
      if (seen.has(index) || session.visitedNpcs[actorId]?.includes(slots[index])) continue
      seen.add(index)
      const previous = assigned.get(index)
      if (!previous || place(previous, seen)) {
        assigned.set(index, actorId)
        return true
      }
    }
    return false
  }
  return pending.every((actorId) => place(actorId, new Set()))
}

export function getDeckBlockReason(session: PlaySession, group: CardGroup, assets: PlayAssets): string | undefined {
  if (session.choice) return '먼저 펼친 카드에서 한 장을 선택하세요.'
  if (group.kind === 'memory') return '묻어야 할 진실 두 장은 게임 시작 시 자동으로 배분됩니다.'
  const matching = (session.phase === 'rumor' && group.kind === 'rumor')
    || (session.phase === 'testimony' && group.kind === 'testimony')
    || (session.phase === 'investigation' && session.investigationStage === 'locations' && group.kind === 'evidence')
  if (!matching) return '현재 단계에서 사용할 덱이 아닙니다.'
  const remaining = session.decks[group.id]?.length ?? 0
  if (!remaining) return '이 덱에 남은 카드가 없습니다.'
  if (group.kind === 'testimony') {
    if (session.visitedNpcs[session.actorId]?.includes(group.id)) return '이 인물은 이전 라운드에 이미 탐문한 NPC입니다.'
    if (session.roundVisitedNpcs?.includes(group.id)) return '이번 라운드에 다른 인물이 이미 탐문한 NPC입니다.'
    if (!leavesNpcChoices(session, group.id, assets)) return '남은 인물들이 서로 다른 NPC를 탐문할 수 있도록 다른 NPC를 선택하세요.'
  }
  if (group.kind === 'evidence') {
    if (session.locationChoices[session.actorId]) return '이미 조사 장소를 선택했습니다.'
    const reserved = Object.values(session.locationChoices).filter((id) => id === group.id).length
    if (reserved >= remaining) return '먼저 선택한 인원에게 배분하면 남는 카드가 없습니다. 다른 장소를 선택하세요.'
  }
  return undefined
}

export function availableEvidence(session: PlaySession, assets: PlayAssets): Card[] {
  const hand = session.hands[session.actorId] ?? []
  const submitted = new Set(session.publicCards.map((entry) => entry.cardId))
  return hand.flatMap((id) => {
    const card = assets.scenario.cards.find((entry) => entry.id === id)
    return card && card.kind !== 'memory' && !submitted.has(id) ? [card] : []
  })
}

// Bots choose legal moves, not deductions. They use the same transition commands
// as the human; sampled outcomes are then saved in the ordinary play history.
export function randomPlayerAction(session: PlaySession, assets: PlayAssets): PlayAction | undefined {
  if (!session.playerId || session.actorId === session.playerId) return undefined
  const pick = <T,>(items: T[]): T | undefined => items[Math.floor(Math.random() * items.length)]
  const other = () => pick(playerIds(assets).filter(id => id !== session.actorId))
  const suspect = () => pick(playerIds(assets).filter(id => id !== session.actorId && id !== rowenId(assets)))
  switch (session.phase) {
    case 'inspection': {
      if (session.inspectionStage === 'result') return { type: 'finish-inspection' }
      const cardId = pick((session.decks[inspectionDeckId] ?? []).filter((id) => !getInspectionBlockReason(session, id)))
      return cardId ? { type: 'inspect', cardId } : undefined
    }
    case 'rumor':
    case 'testimony':
    case 'investigation': {
      if (session.choice) {
        const cardId = pick(session.choice.cardIds)
        return cardId ? { type: 'take-card', cardId } : undefined
      }
      const group = pick(assets.groups.filter(group => !getDeckBlockReason(session, group, assets)))
      return group ? { type: session.phase === 'investigation' ? 'choose-location' : 'open-deck', deckId: group.id } : undefined
    }
    case 'court': {
      if (session.courtTurn) return { type: 'end-question' }
      const card = pick(availableEvidence(session, assets))
      const targetId = other()
      return card && targetId ? { type: 'submit-evidence', cardId: card.id, targetId } : undefined
    }
    case 'accusation': {
      const targetId = suspect()
      return targetId ? { type: 'accuse', targetId } : undefined
    }
    case 'defense': return { type: 'end-defense' }
    case 'truth_exchange': {
      const ownTruths = session.hands[session.actorId].filter((id) => {
        const card = memoryCard(id, assets)
        return card && (session.actorId !== rowenId(assets) || card.initialOwnerId === session.actorId)
      })
      const targetId = pick(playerIds(assets).filter((id) => id !== session.actorId && session.hands[id].some((cardId) => {
        const card = memoryCard(cardId, assets)
        return card && (id !== rowenId(assets) || card.initialOwnerId === id)
      })))
      const offeredId = pick(ownTruths)
      const requestedId = targetId ? pick(session.hands[targetId].filter((id) => {
        const card = memoryCard(id, assets)
        return card && (targetId !== rowenId(assets) || card.initialOwnerId === targetId)
      })) : undefined
      return offeredId && targetId && requestedId && Math.random() > .2
        ? { type: 'trade-truth', offeredId, targetId, requestedId }
        : { type: 'skip-truth-trade' }
    }
    case 'truth_choice': {
      const revealId = pick(session.hands[session.actorId].filter((id) => memoryCard(id, assets)))
      return revealId ? { type: 'choose-truth', revealId } : undefined
    }
    case 'indictment': {
      const targetId = other()
      return targetId ? { type: 'indict', targetId } : undefined
    }
    // Discussion is a deliberate collection-review stop for the human.
    case 'ready':
    case 'discussion':
    case 'complete': return undefined
  }
}

function openCandidates(session: PlaySession, deckId: string, count: number, participants: string[]): void {
  const cards = session.decks[deckId]
  session.choice = { deckId, cardIds: cards.slice(0, count), participantIds: participants }
  session.decks[deckId] = cards.slice(count)
}

function nextInvestigationGroup(session: PlaySession, assets: PlayAssets): void {
  const deckId = session.investigationQueue.shift()
  if (!deckId) {
    setPhase(session, 'discussion', assets)
    record(session, '모든 조사가 끝났습니다. 밀담과 수사를 진행한 뒤 재판을 여세요.')
    return
  }
  const participants = playerIds(assets).filter((id) => session.locationChoices[id] === deckId)
  session.actorId = participants[0]
  session.turnIndex = playerIds(assets).indexOf(session.actorId)
  openCandidates(session, deckId, Math.min(participants.length + 1, session.decks[deckId].length), participants)
}

function validOther(session: PlaySession, targetId: string, assets: PlayAssets): boolean {
  return targetId !== session.actorId && playerIds(assets).includes(targetId)
}

function defenseOrder(assets: PlayAssets): string[] {
  const rowen = rowenId(assets)
  return [...playerIds(assets).filter((id) => id !== rowen), rowen]
}

function memoryCard(id: string, assets: PlayAssets): Card | undefined {
  const card = assets.scenario.cards.find((entry) => entry.id === id)
  return card?.kind === 'memory' ? card : undefined
}

function finishTruthTradeTurn(session: PlaySession, assets: PlayAssets): void {
  if (session.turnIndex + 1 < playerIds(assets).length) {
    nextPlayer(session, 'truth_exchange', assets)
  } else if (session.round < 3) {
    nextRound(session, assets)
  } else {
    setPhase(session, 'truth_choice', assets)
    record(session, '모든 진실 교환이 끝났습니다. 기소 결과를 보기 전에 밝힐 진실 하나를 결정합니다.')
  }
}

function resolveTruthOutcomes(session: PlaySession, assets: PlayAssets): void {
  const indicted = session.indictment
  for (const holderId of playerIds(assets)) {
    for (const cardId of session.hands[holderId].filter((id) => memoryCard(id, assets))) {
      const originalOwnerId = memoryCard(cardId, assets)?.initialOwnerId
      session.truthOutcomes[cardId] = holderId === indicted || originalOwnerId === holderId || session.truthChoices[holderId]?.revealId === cardId
        ? 'revealed' : 'buried'
    }
  }
}

export function transitionPlay(session: PlaySession, action: PlayAction, assets: PlayAssets): PlaySession {
  // 후보, 덱 순서, 질문 대기 상태까지 한 스냅샷으로 저장한다. 거부된 명령은 원본을 그대로 돌려준다.
  const next = structuredClone(session)
  switch (action.type) {
    case 'play-as': {
      if (session.playerId || !playerIds(assets).includes(action.playerId)) return session
      next.playerId = action.playerId
      record(next, `${nameOf(action.playerId, assets)}의 1인칭 플레이테스트를 시작합니다. 나머지 인물은 무작위로 진행합니다.`)
      if (next.phase === 'ready') {
        setPhase(next, 'inspection', assets)
        record(next, '1라운드가 시작되었습니다. 로웬이 검시관에게 첫 소견을 요청합니다.')
      }
      return next
    }
    case 'reorder-hand': {
      const ownerId = session.playerId ?? session.actorId
      const current = session.hands[ownerId]
      if (action.cardIds.length !== current.length || new Set(action.cardIds).size !== current.length || action.cardIds.some(id => !current.includes(id)) || action.cardIds.every((id, index) => id === current[index])) return session
      next.hands[ownerId] = [...action.cardIds]
      record(next, `${nameOf(ownerId, assets)}이 손패 순서를 정리했습니다.`)
      return next
    }
    case 'start': {
      if (session.phase !== 'ready') return session
      setPhase(next, 'inspection', assets)
      record(next, '1라운드가 시작되었습니다. 로웬이 검시관에게 첫 소견을 요청합니다.')
      return next
    }
    case 'inspect': {
      if (session.phase !== 'inspection' || session.inspectionStage !== 'select' || session.actorId !== rowenId(assets)) return session
      if (!session.decks[inspectionDeckId]?.includes(action.cardId)) return session
      if (getInspectionBlockReason(session, action.cardId)) return session
      const card = assets.inspectionCards.find((entry) => entry.id === action.cardId)
      if (!card) return session
      next.decks[inspectionDeckId] = next.decks[inspectionDeckId].filter((id) => id !== card.id)
      next.inspections.push({ round: next.round, cardId: card.id, published: false })
      next.inspectionStage = 'result'
      record(next, `${nameOf(next.actorId, assets)}이 검시관에게 ${card.title} 항목의 검시를 요청했습니다. 소견은 재판 시작까지 비공개입니다.`)
      return next
    }
    case 'finish-inspection': {
      if (session.phase !== 'inspection' || session.inspectionStage !== 'result') return session
      setPhase(next, 'rumor', assets)
      return next
    }
    case 'open-deck': {
      if (session.phase !== 'rumor' && session.phase !== 'testimony') return session
      const group = assets.groups.find((entry) => entry.id === action.deckId)
      if (!group || getDeckBlockReason(session, group, assets)) return session
      openCandidates(next, group.id, Math.min(group.kind === 'rumor' ? 3 : 2, next.decks[group.id].length), [next.actorId])
      record(next, `${nameOf(next.actorId, assets)}이 ${group.kind === 'rumor' ? '소문' : group.backTitle} 카드를 확인합니다.`)
      return next
    }
    case 'take-card': {
      const choice = session.choice
      if (!['rumor', 'testimony', 'investigation'].includes(session.phase) || !choice?.cardIds.includes(action.cardId)) return session
      if (choice.participantIds[0] !== session.actorId) return session
      next.hands[next.actorId].push(action.cardId)
      const unchosen = choice.cardIds.filter((id) => id !== action.cardId)
      const pending = choice.participantIds.slice(1)
      record(next, `${nameOf(next.actorId, assets)}이 ${session.phase === 'rumor' ? '소문' : session.phase === 'testimony' ? '탐문' : '조사'} 카드 한 장을 비공개 손패에 넣었습니다.`)
      if (session.phase === 'investigation' && pending.length) {
        next.choice = { ...choice, cardIds: unchosen, participantIds: pending }
        next.actorId = pending[0]
        next.turnIndex = playerIds(assets).indexOf(next.actorId)
        return next
      }
      next.decks[choice.deckId].push(...unchosen)
      delete next.choice
      if (session.phase === 'rumor') nextPlayer(next, 'testimony', assets)
      if (session.phase === 'testimony') {
        next.visitedNpcs[next.actorId].push(choice.deckId)
        next.roundVisitedNpcs = [...(next.roundVisitedNpcs ?? []), choice.deckId]
        nextPlayer(next, 'investigation', assets)
      }
      if (session.phase === 'investigation') nextInvestigationGroup(next, assets)
      return next
    }
    case 'choose-location': {
      if (session.phase !== 'investigation' || session.investigationStage !== 'locations') return session
      const group = assets.groups.find((entry) => entry.id === action.deckId)
      if (!group || group.kind !== 'evidence' || getDeckBlockReason(session, group, assets)) return session
      next.locationChoices[next.actorId] = group.id
      record(next, `${nameOf(next.actorId, assets)}이 ${group.backTitle} 조사를 선택했습니다.`)
      if (Object.keys(next.locationChoices).length < playerIds(assets).length) {
        next.turnIndex += 1
        next.actorId = playerIds(assets)[next.turnIndex]
      } else {
        next.investigationStage = 'cards'
        next.investigationQueue = assets.groups.filter((entry) => entry.kind === 'evidence' && Object.values(next.locationChoices).includes(entry.id)).map((entry) => entry.id)
        nextInvestigationGroup(next, assets)
      }
      return next
    }
    case 'end-discussion': {
      if (session.phase !== 'discussion') return session
      for (const inspection of next.inspections) {
        if (inspection.published) continue
        inspection.published = true
        next.publicCards.push({ cardId: inspection.cardId, actorId: rowenId(assets), round: inspection.round, source: 'inspection' })
      }
      setPhase(next, 'court', assets)
      record(next, `${next.round}번째 재판을 시작하며 이번 검사의 결과를 공식 공개했습니다.`)
      return next
    }
    case 'submit-evidence': {
      if (session.phase !== 'court' || session.courtTurn || !availableEvidence(session, assets).some((card) => card.id === action.cardId)) return session
      if (session.round < 3 && !validOther(session, action.targetId, assets)) return session
      next.hands[next.actorId] = next.hands[next.actorId].filter((id) => id !== action.cardId)
      next.publicCards.push({ cardId: action.cardId, actorId: next.actorId, round: next.round, source: 'court', ...(next.round < 3 ? { targetId: action.targetId } : {}) })
      const card = assets.scenario.cards.find((entry) => entry.id === action.cardId)!
      record(next, `${nameOf(next.actorId, assets)}이 「${card.title}」을 재판에 제출했습니다.`)
      if (next.round < 3) {
        next.courtTurn = { cardId: action.cardId, targetId: action.targetId }
        record(next, `${nameOf(next.actorId, assets)} → ${nameOf(action.targetId, assets)}: ${next.round === 1 ? '관련 사실에 대한 질문' : '혐의 주장과 질문'}을 진행합니다.`)
      } else {
        nextPlayer(next, 'truth_exchange', assets)
      }
      return next
    }
    case 'end-question': {
      if (session.phase !== 'court' || session.round >= 3 || !session.courtTurn) return session
      record(next, `${nameOf(next.actorId, assets)}의 질문과 응답을 마쳤습니다.`)
      delete next.courtTurn
      if (next.turnIndex + 1 < playerIds(assets).length) nextPlayer(next, 'inspection', assets)
      else {
        setPhase(next, 'truth_exchange', assets)
        record(next, `${next.round}번째 재판이 끝났습니다. 뒷면 상태로 진실 한 장씩을 교환할 수 있습니다.`)
      }
      return next
    }
    case 'trade-truth': {
      if (session.phase !== 'truth_exchange' || !validOther(session, action.targetId, assets)) return session
      if (!session.hands[session.actorId].includes(action.offeredId) || !session.hands[action.targetId]?.includes(action.requestedId)) return session
      const offered = memoryCard(action.offeredId, assets)
      const requested = memoryCard(action.requestedId, assets)
      if (!offered || !requested) return session
      if (session.actorId === rowenId(assets) && offered.initialOwnerId !== session.actorId) return session
      if (action.targetId === rowenId(assets) && requested.initialOwnerId !== action.targetId) return session
      next.hands[session.actorId] = next.hands[session.actorId].filter((id) => id !== action.offeredId)
      next.hands[action.targetId] = next.hands[action.targetId].filter((id) => id !== action.requestedId)
      next.hands[session.actorId].push(action.requestedId)
      next.hands[action.targetId].push(action.offeredId)
      next.truthTrades.push({ round: next.round, fromId: session.actorId, toId: action.targetId, offeredId: action.offeredId, receivedId: action.requestedId })
      record(next, `${nameOf(session.actorId, assets)}과 ${nameOf(action.targetId, assets)}이 뒷면으로 진실 한 장씩을 교환했습니다.`)
      finishTruthTradeTurn(next, assets)
      return next
    }
    case 'skip-truth-trade': {
      if (session.phase !== 'truth_exchange') return session
      record(next, `${nameOf(session.actorId, assets)}이 이번 교환 기회를 넘겼습니다.`)
      finishTruthTradeTurn(next, assets)
      return next
    }
    case 'choose-truth': {
      if (session.phase !== 'truth_choice' || session.truthChoices[session.actorId]) return session
      const held = session.hands[session.actorId].filter((id) => memoryCard(id, assets))
      if (held.length !== 2 || !held.includes(action.revealId)) return session
      next.truthChoices[session.actorId] = { revealId: action.revealId, buryId: held.find((id) => id !== action.revealId)! }
      record(next, `${nameOf(session.actorId, assets)}이 밝힐 진실과 묻을 진실을 비공개로 결정했습니다.`)
      nextPlayer(next, 'accusation', assets)
      return next
    }
    case 'accuse': {
      if (session.phase !== 'accusation' || session.accusations[session.actorId] || action.targetId === rowenId(assets) || !validOther(session, action.targetId, assets)) return session
      next.accusations[next.actorId] = action.targetId
      record(next, `${nameOf(next.actorId, assets)}이 범인 지목을 비공개로 확정했습니다.`)
      nextPlayer(next, 'defense', assets)
      if (next.phase === 'defense') {
        next.actorId = defenseOrder(assets)[0]
        record(next, '전원의 범인 지목이 확정되어 동시에 공개했습니다. 로웬은 마지막으로 최후변론합니다.')
      }
      return next
    }
    case 'end-defense': {
      if (session.phase !== 'defense') return session
      record(next, `${nameOf(next.actorId, assets)}이 최후변론을 마쳤습니다.`)
      const order = defenseOrder(assets)
      if (next.turnIndex + 1 < order.length) {
        next.turnIndex += 1
        next.actorId = order[next.turnIndex]
      } else {
        setPhase(next, 'indictment', assets)
      }
      return next
    }
    case 'indict': {
      if (session.phase !== 'indictment' || session.actorId !== rowenId(assets) || !validOther(session, action.targetId, assets)) return session
      next.indictment = action.targetId
      record(next, `${nameOf(next.actorId, assets)}이 ${nameOf(action.targetId, assets)}을 최종 기소했습니다. 세 번의 재판을 마쳤습니다.`)
      resolveTruthOutcomes(next, assets)
      setPhase(next, 'complete', assets)
      return next
    }
  }
}
