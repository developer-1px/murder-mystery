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

export interface IssueFragment {
  id: string
  label: string
  cardIds: string[]
  status?: 'covered' | 'thin' | 'missing'
  note?: string
}

export interface IssueGroup {
  id: string
  title: string
  question: string
  fragments: IssueFragment[]
  auditNote: string
}

export interface IssueGroupsDocument {
  designerOnly: true
  description: string
  groups: IssueGroup[]
}

export interface NpcGroup {
  id: string
  name: string
  role: string
  pairedCharacterId: string
  cardIds: string[]
}

export interface NpcGroupsDocument {
  description: string
  npcs: NpcGroup[]
}

export interface MemoryStage {
  id: string
  label: string
  cardIds: string[]
}

export interface MemoryStagesDocument {
  description: string
  stages: MemoryStage[]
}

export interface ReleasePlanDocument {
  rounds: Array<{ round: number; title: string; cardIds: string[] }>
  privateTruthSchedule: Array<{ timing: string; stageId: string }>
}

export interface TimelineRow {
  id: string
  time: string
  summary: string
  cardIds: string[]
}

export interface TimelineDocument {
  description: string
  designerOnly: boolean
  rows: TimelineRow[]
  characterIdByCardId: Record<string, string>
}

export interface DeductionSet {
  characterId: string
  label: string
  cardIds: string[]
  requiredCardIds?: string[]
  minimumRequired: number
  conditional?: boolean
  note: string
}

export interface DeductionAuditDocument {
  description: string
  sourceOverrides?: Record<string, string>
  alibis: DeductionSet[]
  culprit: {
    characterId: string
    conclusion: string
    axes: Array<{ id: string; label: string; cardIds: string[]; paths: string[][] }>
  }
}

export interface CardRoleAuditDocument {
  description: string
  roles: Record<string, string>
  cardsByPrimaryRole: Record<string, string[]>
}

export interface CommonSettingEntry {
  title: string
  subtitle: string
  paragraphs: string[]
}

export interface CommonSettingSection {
  id: string
  title: string
  summary: string
  entries?: CommonSettingEntry[]
  paragraphs?: string[]
  questions?: string[]
}

export interface CommonSettingDocument {
  eyebrow: string
  title: string
  lead: string[]
  sections: CommonSettingSection[]
}

export interface CharacterSettingRelation {
  name: string
  description: string
}

export interface CharacterSettingSection {
  title: string
  paragraphs?: string[]
  relations?: CharacterSettingRelation[]
  points?: string[]
}

export interface CharacterScoreCondition {
  result: string
  score: number
}

export interface CharacterFinalAction {
  id: string
  title: string
  intent: string
  omen: string
}

export interface CharacterSetting {
  id: string
  name: string
  role: string
  sections: CharacterSettingSection[]
  objective: string
  scoreGuide: string
  victoryConditions: CharacterScoreCondition[]
  ruinConditions: CharacterScoreCondition[]
  finalActions: CharacterFinalAction[]
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
