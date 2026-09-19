import type { Branch, CardState, GameEvent, GameState, Scenario } from './types'

export function createInitialState(scenario: Scenario): GameState {
  const cards: Record<string, CardState> = {}
  for (const card of scenario.cards) {
    cards[card.id] = card.initialOwnerId
      ? { zone: 'hand', ownerId: card.initialOwnerId, visibleTo: [card.initialOwnerId] }
      : { zone: 'location', visibleTo: [] }
  }
  return { cards, officialFacts: [], verdicts: {} }
}

export function reduceEvent(state: GameState, event: GameEvent, scenario: Scenario): GameState {
  const next: GameState = {
    cards: Object.fromEntries(Object.entries(state.cards).map(([id, value]) => [id, { ...value, visibleTo: [...value.visibleTo] }])),
    officialFacts: [...state.officialFacts],
    verdicts: { ...state.verdicts },
  }
  if (event.type === 'acquire') {
    next.cards[event.cardId] = { zone: 'hand', ownerId: event.actorId, visibleTo: [event.actorId] }
  }
  if (event.type === 'present') {
    const current = next.cards[event.cardId]
    next.cards[event.cardId] = { ...current, visibleTo: [...new Set([...current.visibleTo, event.targetId])] }
  }
  if (event.type === 'publish') {
    next.cards[event.cardId] = { zone: 'public', visibleTo: scenario.characters.map((character) => character.id) }
  }
  if (event.type === 'submit') {
    next.cards[event.cardId] = { zone: 'court', visibleTo: scenario.characters.map((character) => character.id) }
  }
  if (event.type === 'verdict') {
    next.verdicts[event.claimId] = event.verdict
    if (event.verdict === 'accepted' && !next.officialFacts.includes(event.claimId)) next.officialFacts.push(event.claimId)
  }
  return next
}

export function replay(scenario: Scenario, events: GameEvent[], count = events.length): GameState {
  return events.slice(0, count).reduce((state, event) => reduceEvent(state, event, scenario), createInitialState(scenario))
}

export function canSeeCard(state: GameState, cardId: string, perspectiveId: string): boolean {
  if (perspectiveId === 'designer') return true
  const card = state.cards[cardId]
  return card.zone === 'public' || card.zone === 'court' || card.zone === 'official' || card.visibleTo.includes(perspectiveId)
}

export function forkBranch(source: Branch, eventCount: number, branchNumber: number): Branch {
  return {
    id: `branch-${Date.now()}-${branchNumber}`,
    name: `${source.name} · 가지 ${branchNumber}`,
    events: source.events.slice(0, eventCount),
    parentId: source.id,
    forkedAt: eventCount,
  }
}

export function describeEvent(event: GameEvent, scenario: Scenario): string {
  const actor = scenario.characters.find((item) => item.id === event.actorId)?.name ?? event.actorId
  const card = 'cardId' in event ? scenario.cards.find((item) => item.id === event.cardId)?.title : undefined
  if (event.type === 'acquire') return `${actor} · 「${card}」 획득`
  if (event.type === 'present') {
    const target = scenario.characters.find((item) => item.id === event.targetId)?.name ?? event.targetId
    return `${actor} → ${target} · 「${card}」 비공개 제시`
  }
  if (event.type === 'publish') return `${actor} · 「${card}」 공개`
  if (event.type === 'submit') return `${actor} · 「${card}」 법정 제출`
  const claim = scenario.claims.find((item) => item.id === event.claimId)?.text ?? event.claimId
  const verdict = { accepted: '인정', rejected: '기각', reserved: '유보' }[event.verdict]
  return `${actor} · ${verdict} — ${claim}`
}
