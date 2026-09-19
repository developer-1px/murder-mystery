import { describe, expect, it } from 'vitest'
import { scenario, validationIssues } from '../scenario/load'
import { validateMeaning } from './validate'

describe('scenario validation', () => {
  it('accepts the bundled scenario', () => {
    expect(validationIssues).toEqual([])
  })

  it('reports an unreachable card with its data path', () => {
    const broken = { ...scenario, cards: [...scenario.cards, { id: 'lost', title: '잃어버린 카드', kind: 'evidence' as const, text: '도달 불가', tags: [] }] }
    expect(validateMeaning(broken)).toContainEqual({ path: 'cards.json/lost', message: '초기 소유자와 장소가 없어 도달할 수 없는 카드', severity: 'warning' })
  })
})
