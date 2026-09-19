import { describe, expect, it } from 'vitest'
import { scenario, validationIssues } from '../scenario/load'
import { validateMeaning } from './validate'
import { canSeeCard, replay } from './engine'

describe('scenario validation', () => {
  it('accepts the bundled scenario', () => {
    expect(validationIssues).toEqual([])
  })

  it('reports an unreachable card with its data path', () => {
    const broken = { ...scenario, cards: [...scenario.cards, { id: 'lost', title: '잃어버린 카드', kind: 'evidence' as const, text: '도달 불가', tags: [] }] }
    expect(validateMeaning(broken)).toContainEqual({ path: 'cards.json/lost', message: '초기 소유자와 장소가 없어 도달할 수 없는 카드', severity: 'warning' })
  })

  it('gives every character private starting memories', () => {
    const state = replay(scenario, [])
    for (const character of scenario.characters) {
      const memories = scenario.cards.filter((card) => card.kind === 'memory' && card.initialOwnerId === character.id)
      expect(memories.length, `${character.name}의 시작 기억`).toBeGreaterThan(0)
      for (const memory of memories) {
        expect(state.cards[memory.id].ownerId).toBe(character.id)
        for (const other of scenario.characters.filter((item) => item.id !== character.id)) {
          expect(canSeeCard(state, memory.id, other.id), memory.id).toBe(false)
        }
      }
    }
  })

  it('places each investigation card at exactly one matching location', () => {
    expect(new Set(scenario.cards.map((card) => card.id)).size).toBe(scenario.cards.length)
    for (const card of scenario.cards.filter((item) => !item.initialOwnerId)) {
      const locations = scenario.locations.filter((location) => location.cardIds.includes(card.id))
      expect(locations.map((location) => location.id), card.id).toEqual([card.locationId])
    }
    for (const location of scenario.locations) {
      expect(new Set(location.cardIds).size).toBe(location.cardIds.length)
      for (const id of location.cardIds) {
        expect(scenario.cards.find((card) => card.id === id)?.locationId, id).toBe(location.id)
      }
    }
  })

  it('connects every trial claim to an available card', () => {
    for (const claim of scenario.claims) {
      expect(scenario.cards.some((card) => card.claimId === claim.id), claim.id).toBe(true)
    }
  })
})
