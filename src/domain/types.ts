export type CardKind = 'memory' | 'rumor' | 'evidence' | 'testimony'
export type CardZone = 'location' | 'hand' | 'public' | 'court' | 'official'
export type Verdict = 'accepted' | 'rejected' | 'reserved'

export interface Character {
  id: string
  name: string
  title: string
  color: string
  publicProfile: string
  desire: string
  ruin: string
}

export interface Card {
  id: string
  title: string
  kind: CardKind
  text: string
  tags: string[]
  locationId?: string
  initialOwnerId?: string
  claimId?: string
  unlocks?: string[]
}

export interface Location {
  id: string
  name: string
  description: string
  cardIds: string[]
}

export interface Claim {
  id: string
  text: string
}

export interface Scenario {
  meta: { id: string; title: string; version: string; round: number }
  characters: Character[]
  cards: Card[]
  locations: Location[]
  claims: Claim[]
}

export interface CardState {
  zone: CardZone
  ownerId?: string
  visibleTo: string[]
}

export interface GameState {
  cards: Record<string, CardState>
  officialFacts: string[]
  verdicts: Record<string, Verdict>
}

export type GameEvent =
  | { id: string; type: 'acquire'; actorId: string; cardId: string; at: string; forced?: boolean }
  | { id: string; type: 'present'; actorId: string; targetId: string; cardId: string; at: string; forced?: boolean }
  | { id: string; type: 'publish'; actorId: string; cardId: string; at: string; forced?: boolean }
  | { id: string; type: 'submit'; actorId: string; cardId: string; at: string; forced?: boolean }
  | { id: string; type: 'verdict'; actorId: string; claimId: string; verdict: Verdict; at: string; forced?: boolean }

export interface Branch {
  id: string
  name: string
  events: GameEvent[]
  parentId?: string
  forkedAt?: number
}

export interface ValidationIssue {
  path: string
  message: string
  severity: 'error' | 'warning'
}
