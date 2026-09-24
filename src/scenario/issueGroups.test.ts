import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import cards from '../../scenarios/crown-trial/cards.json'
import issueGroups from '../../scenarios/crown-trial/issue-groups.json'
import issueGroupsSchema from '../../schemas/issue-groups.schema.json'
import npcGroups from '../../scenarios/crown-trial/npc-groups.json'
import npcGroupsSchema from '../../schemas/npc-groups.schema.json'
import memoryStages from '../../scenarios/crown-trial/memory-stages.json'
import releasePlan from '../../scenarios/crown-trial/release-plan.json'
import deductionAudit from '../../scenarios/crown-trial/deduction-audit.json'

describe('designer issue groups', () => {
  it('matches the designer-only document schema', () => {
    const validate = new Ajv2020({ allErrors: true }).compile(issueGroupsSchema)
    expect(validate(issueGroups), JSON.stringify(validate.errors)).toBe(true)
  })

  it('uses unique group and fragment ids', () => {
    const groupIds = issueGroups.groups.map((group) => group.id)
    const fragmentIds = issueGroups.groups.flatMap((group) => group.fragments.map((fragment) => fragment.id))

    expect(new Set(groupIds).size).toBe(groupIds.length)
    expect(new Set(fragmentIds).size).toBe(fragmentIds.length)
  })

  it('references existing cards and classifies every card', () => {
    const cardIds = new Set(cards.map((card) => card.id))
    const referencedIds = issueGroups.groups.flatMap((group) => group.fragments.flatMap((fragment) => fragment.cardIds))

    for (const id of referencedIds) expect(cardIds.has(id), id).toBe(true)
    for (const card of cards) expect(referencedIds, card.id).toContain(card.id)
  })

  it('has no unresolved thin or missing story fragments', () => {
    const unresolved = issueGroups.groups.flatMap((group) => group.fragments.filter((fragment) => 'status' in fragment && (fragment.status === 'thin' || fragment.status === 'missing')).map((fragment) => `${group.id}/${fragment.id}`))
    expect(unresolved).toEqual([])
  })

  it('includes every culprit-axis card in the final solution issue', () => {
    const solution = issueGroups.groups.find((group) => group.id === 'issue.case-variants')!
    const solutionIds = new Set(solution.fragments.flatMap((fragment) => fragment.cardIds))
    const axisIds = new Set(deductionAudit.culprit.axes.flatMap((axis) => axis.cardIds))
    expect([...axisIds].filter((id) => !solutionIds.has(id))).toEqual([])
  })
})

describe('NPC inquiry groups', () => {
  it('pairs five players and the victim with four testimony cards each', () => {
    const validate = new Ajv2020({ allErrors: true }).compile(npcGroupsSchema)
    expect(validate(npcGroups), JSON.stringify(validate.errors)).toBe(true)
    expect(new Set(npcGroups.npcs.map((npc) => npc.pairedCharacterId))).toEqual(new Set(['queen', 'cassian', 'isabel', 'seraphine', 'benedict', 'adrian']))

    const testimonyIds = cards.filter((card) => card.kind === 'testimony').map((card) => card.id)
    const groupedIds = npcGroups.npcs.flatMap((npc) => npc.cardIds)
    expect(npcGroups.npcs.map((npc) => npc.cardIds.length)).toEqual([4, 4, 4, 4, 4, 4])
    expect(new Set(groupedIds)).toEqual(new Set(testimonyIds))
    expect(npcGroups.description).toContain('매회 여섯 NPC를 한 번씩만 선택')
    expect(npcGroups.description).toContain('다음 회차에는 같은 NPC를 다시 탐문')
  })

  it('balances the common card pool around three-card choices', () => {
    const counts = Object.fromEntries(['memory', 'rumor', 'testimony', 'evidence'].map((kind) => [kind, cards.filter((card) => card.kind === kind).length]))
    expect(counts).toEqual({ memory: 18, rumor: 24, testimony: 24, evidence: 24 })
    const evidenceByLocation = ['study', 'apothecary', 'west-corridor', 'royal-archive'].map((locationId) => cards.filter((card) => card.kind === 'evidence' && card.locationId === locationId).length)
    expect(evidenceByLocation).toEqual([6, 6, 6, 6])
  })

  it('keeps card copy compact and preserves testimony/evidence writing rules', () => {
    expect(Math.max(...cards.map((card) => card.text.length))).toBeLessThanOrEqual(170)
    for (const card of cards.filter((item) => item.kind === 'testimony')) {
      expect(card.text, card.id).toMatch(/^(“[^”]*”)(\s*“[^”]*”)*$/)
    }
    for (const card of cards.filter((item) => item.kind === 'evidence')) {
      expect(card.text, card.id).not.toMatch(/범인|살해|때문에|따라서|추정|듯하다|증명|알리바이|치사량/)
    }
  })

  it('assigns every memory to exactly one truth stage', () => {
    expect(memoryStages.stages.map((stage) => stage.cardIds.length)).toEqual([6, 6, 6])
    const memoryIds = cards.filter((card) => card.kind === 'memory').map((card) => card.id)
    const stagedIds = memoryStages.stages.flatMap((stage) => stage.cardIds)
    expect(new Set(stagedIds)).toEqual(new Set(memoryIds))
  })

  it('reveals one private-truth stage at each intended point', () => {
    expect(releasePlan.privateTruthSchedule).toEqual([
      { timing: '첫 조사 전', stageId: 'truth-1' },
      { timing: '첫 번째 재판 종료 후', stageId: 'truth-2' },
      { timing: '두 번째 재판 종료 후', stageId: 'truth-3' },
    ])
    expect(Object.values(releasePlan.initialHands).every((hand) => hand.length === 1)).toBe(true)
  })

  it('reveals Benedict parentage as a three-step escalation', () => {
    const benedictCards = memoryStages.stages.map((stage) => stage.cardIds.find((id) => id.startsWith('memory.benedict-')))

    expect(benedictCards).toEqual([
      'memory.benedict-will-clause',
      'memory.benedict-birth-dates',
      'memory.benedict-edmund-letter',
    ])
    expect(cards.find((card) => card.id === benedictCards[0])?.text).toContain('무엇을 가리키는지 알지 못한다')
    expect(cards.find((card) => card.id === benedictCards[1])?.text).toContain('친부를 확정할 수는 없다')
    expect(cards.find((card) => card.id === benedictCards[2])?.text).toContain('당신의 피를 이은 아들이었다')
  })

  it('moves Cassian from survival evidence to the secret meeting that proves Isabel’s alibi', () => {
    const cassianCards = memoryStages.stages.map((stage) => stage.cardIds.find((id) => id.startsWith('memory.cassian-')))

    expect(cassianCards).toEqual([
      'memory.cassian-assault',
      'memory.cassian-sedative',
      'memory.cassian-isabel-truth',
    ])
    expect(cards.find((card) => card.id === cassianCards[0])?.text).toContain('그 순간 살아 있었다는 것은 확실하다')
    expect(cards.find((card) => card.id === cassianCards[1])?.text).toContain('믿음에 처음으로 틈이 생겼다')
    expect(cards.find((card) => card.id === cassianCards[2])?.text).toContain('22시 39분경')
    expect(cards.find((card) => card.id === cassianCards[2])?.text).toContain('22시 52분까지')
  })
})
