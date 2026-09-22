import type { Card, CardKind, MemoryStagesDocument, NpcGroupsDocument, Scenario } from '../domain/types'

export interface CardGroup {
  id: string
  kind: CardKind
  label: string
  description: string
  backTitle: string
  backSubtitle?: string
  cards: Card[] // 첫 카드부터 확인하는 순서. 테이블에서는 마지막 카드가 맨 위이므로 역순으로 쌓는다.
}

export function getCardGroups(scenario: Scenario, npcGroups: NpcGroupsDocument, memoryStages: MemoryStagesDocument): CardGroup[] {
  const stageByCard = new Map(memoryStages.stages.flatMap((stage, index) => stage.cardIds.map((id) => [id, index] as const)))
  return [
    ...scenario.characters.map((character) => ({
      id: `memory-${character.id}`, kind: 'memory' as const, label: `${character.name} · 묻어야 하는 진실`,
      description: `${character.name}에게 시작할 때 주는 두 장입니다. 교환 전에는 뒷면만 보여 주며 내용은 교환이 끝난 뒤 확인합니다.`,
      backTitle: '왕관재판', backSubtitle: '묻어야 하는 진실',
      cards: scenario.cards.filter((card) => card.kind === 'memory' && card.initialOwnerId === character.id)
        .sort((a, b) => (stageByCard.get(a.id) ?? Infinity) - (stageByCard.get(b.id) ?? Infinity)),
    })),
    { id: 'all-rumors', kind: 'rumor', label: '소문', description: '범주를 미리 구분하지 않습니다. 세 장을 읽고 한 장을 선택해 공개합니다.', backTitle: '소문', cards: scenario.cards.filter((card) => card.kind === 'rumor') },
    ...npcGroups.npcs.map((npc) => ({
      id: npc.id, kind: 'testimony' as const, label: `${npc.name} · ${npc.role}`,
      description: `${scenario.characters.find((character) => character.id === npc.pairedCharacterId)?.name ?? npc.pairedCharacterId}와 연결된 탐문 NPC. 두 장을 읽고 한 장을 획득하며 나머지는 덱에 남깁니다.`,
      backTitle: npc.name, backSubtitle: npc.role,
      cards: npc.cardIds.map((id) => scenario.cards.find((card) => card.id === id)).filter((card): card is Card => !!card && card.kind === 'testimony'),
    })),
    ...scenario.locations.map((location) => ({
      id: `location-${location.id}`, kind: 'evidence' as const, label: location.name,
      description: '혼자면 두 장, N명이 함께 조사하면 N+1장을 확인하고 각자 한 장씩 획득합니다.',
      backTitle: location.name, backSubtitle: '조사 / 증거',
      cards: scenario.cards.filter((card) => card.kind === 'evidence' && card.locationId === location.id),
    })),
  ]
}
