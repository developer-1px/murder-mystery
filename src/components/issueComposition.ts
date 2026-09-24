import type { Card, CardRoleAuditDocument, IssueGroupsDocument, NpcGroupsDocument, Scenario, TimelineDocument } from '../domain/types'
import desireAudit from '../../scenarios/crown-trial/desire-ruin-audit.json'
import evidenceAllocation from '../../scenarios/crown-trial/evidence-allocation.json'

export interface CompositionBucket { id: string; label: string; target?: number; cards: Card[]; missing: string[]; note?: string }
export function getIssueComposition(scenario: Scenario, document: IssueGroupsDocument, npcs: NpcGroupsDocument, timeline: TimelineDocument, roles: CardRoleAuditDocument) {
  const byId = new Map(scenario.cards.map(card => [card.id, card]))
  const make = (id: string, label: string, ids: string[], target?: number, note?: string): CompositionBucket => {
    const unique = [...new Set(ids)]
    return { id, label, target, note, cards: unique.flatMap(id => byId.has(id) ? [byId.get(id)!] : []), missing: unique.filter(id => !byId.has(id)) }
  }
  return scenario.characters.map(character => {
    const group = document.groups.find(group => group.id === `suspicion.${character.id}` || group.id === `investigator.${character.id}`)
    const assigned = scenario.cards.filter(card => timeline.characterIdByCardId[card.id] === character.id)
    const rumor = assigned.filter(card => card.kind === 'rumor')
    const testimonyIds = npcs.npcs.filter(npc => npc.pairedCharacterId === character.id).flatMap(npc => npc.cardIds)
    const truth = scenario.cards.filter(card => card.kind === 'memory' && card.initialOwnerId === character.id)
    const linked = [...new Set(group?.fragments.flatMap(fragment => fragment.cardIds) ?? [])]
    const evidenceIds = linked.filter(id => byId.get(id)?.kind === 'evidence')
    const evidenceIdsForPlayer = evidenceAllocation.players.find(player => player.characterId === character.id)?.cardIds ?? assigned.filter(card => card.kind === 'evidence').map(card => card.id)
    const assignedEvidence = evidenceIdsForPlayer.flatMap(id => byId.has(id) ? [byId.get(id)!] : [])
    const relatedEvidence = evidenceIds.filter(id => !assignedEvidence.some(card => card.id === id))
    const motivation = desireAudit.characters.find(item => item.characterId === character.id)
    const testimonyTarget = character.id === 'rowen' ? 0 : 3
    const ownTarget = 10 + testimonyTarget
    const roleIds = (role: string) => testimonyIds.filter(id => roles.cardsByPrimaryRole[role]?.includes(id))
    const buckets = [
      make('rumor', '소문', rumor.map(c => c.id), 4),
      make('hearsay', '카더라', rumor.filter(c => c.tags.includes('카더라')).map(c => c.id), 2),
      make('sighting', '수소문', rumor.filter(c => c.tags.includes('수소문')).map(c => c.id), 2),
      make('memory', '묻어야 하는 진실', truth.map(c => c.id), 2),
      make('testimony', '탐문', testimonyIds, testimonyTarget, testimonyTarget === 0 ? '로웬의 전담 NPC는 없습니다. 루시엔은 아드리안의 공통 의료 NPC입니다.' : undefined),
      make('identification', '이해관계', roleIds('testimony_interest'), testimonyTarget ? 1 : 0),
      make('movement', '당일 행적', roleIds('movement_testimony'), testimonyTarget ? 1 : 0),
      make('hint', '진술의 빈틈', roleIds('testimony_gap'), testimonyTarget ? 1 : 0),
      make('evidence', '전용 증거', evidenceIdsForPlayer, 4, '이 인물에게 배정된 전용 증거만 셉니다. 다른 인물의 증거를 참고로 연결해도 장수는 늘지 않습니다.'),
      make('desire', '욕망 단서', motivation?.desire ?? [], desireAudit.rule.desirePerCharacter),
      make('ruin', '파멸 단서', motivation?.ruin ?? [], desireAudit.rule.ruinPerCharacter),
      make('extra', '참고 증거', relatedEvidence, undefined, '다른 인물에게 배정되어 있으나 이 쟁점에도 연결된 증거입니다. 전용 증거 4장에 포함하지 않습니다.'),
    ]
    const inScope = !evidenceAllocation.outOfScopeCharacterIds.includes(character.id)
    if (!inScope) for (const bucket of buckets) bucket.target = undefined
    const messages: string[] = []
    for (const bucket of buckets) {
      if (bucket.target !== undefined && bucket.cards.length !== bucket.target) messages.push(`${bucket.label} ${bucket.cards.length}/${bucket.target}장`)
      if (bucket.missing.length) messages.push(`${bucket.label}: 원본 없는 카드 ${bucket.missing.join(', ')}`)
    }
    if (inScope) {
      const ownIds = new Set(buckets.filter(bucket => ['rumor', 'memory', 'testimony', 'evidence'].includes(bucket.id)).flatMap(bucket => bucket.cards.map(card => card.id)))
      if (ownIds.size !== ownTarget) messages.push(`전용 구성 ${ownIds.size}/${ownTarget}장`)
      for (const id of ownIds) if (!linked.includes(id)) messages.push(`${byId.get(id)?.title ?? id}: 쟁점 연결 누락`)
      for (const id of linked) if (!ownIds.has(id)) messages.push(`${byId.get(id)?.title ?? id}: 전용 ${ownTarget}장 밖의 쟁점 연결`)
      for (const id of evidenceIdsForPlayer) if (evidenceAllocation.players.filter(player => player.cardIds.includes(id)).length !== 1) messages.push(`${byId.get(id)?.title ?? id}: 전용 증거 배정 중복`)
      for (const id of ownIds) if ((group?.fragments.flatMap(fragment => fragment.cardIds).filter(link => link === id).length ?? 0) > 1) messages.push(`${byId.get(id)?.title ?? id}: 이야기 장면 중복 배치`)
      for (const location of scenario.locations) if (assignedEvidence.filter(card => card.locationId === location.id).length !== 1) messages.push(`${location.name}: 전용 증거 1장 필요`)
      for (const id of [...(motivation?.desire ?? []), ...(motivation?.ruin ?? [])]) if (!ownIds.has(id) || byId.get(id)?.kind === 'memory') messages.push(`${byId.get(id)?.title ?? id}: 욕망·파멸은 전용 공개 카드에서 지정`)
      if (motivation?.desire.some(id => motivation.ruin.includes(id))) messages.push('욕망·파멸 단서는 서로 다른 4장 필요')
    }
    for (const card of rumor) if (Number(card.tags.includes('카더라')) + Number(card.tags.includes('수소문')) !== 1) messages.push(`${card.title}: 소문 유형 누락 또는 중복`)
    const subtypeIds = ['identification', 'movement', 'hint']
    for (const id of testimonyIds) if (buckets.filter(b => subtypeIds.includes(b.id)).filter(b => b.cards.some(c => c.id === id)).length !== 1) messages.push(`${byId.get(id)?.title ?? id}: 탐문 유형 누락 또는 중복`)
    return { character, group, buckets, messages, motivation, assignedEvidenceCount: assignedEvidence.length, inScope }
  })
}
