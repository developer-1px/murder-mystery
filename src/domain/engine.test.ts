import { describe, expect, it } from 'vitest'
import { canSeeCard, forkBranch, replay } from './engine'
import { scenario } from '../scenario/load'

describe('event engine', () => {
  it('acquires and publishes a card through deterministic replay', () => {
    const events = [
      { id: '1', type: 'acquire' as const, actorId: 'rowen', cardId: 'evidence.guard-log', at: '2026-01-01' },
      { id: '2', type: 'publish' as const, actorId: 'rowen', cardId: 'evidence.guard-log', at: '2026-01-01' },
    ]
    const acquired = replay(scenario, events, 1)
    expect(acquired.cards['evidence.guard-log']).toMatchObject({ zone: 'hand', ownerId: 'rowen' })
    expect(canSeeCard(acquired, 'evidence.guard-log', 'queen')).toBe(false)
    const published = replay(scenario, events)
    expect(published.cards['evidence.guard-log'].zone).toBe('public')
    expect(canSeeCard(published, 'evidence.guard-log', 'queen')).toBe(true)
  })

  it('records an accepted claim as an official fact', () => {
    const state = replay(scenario, [{ id: '1', type: 'verdict', actorId: 'rowen', claimId: 'claim.alive-2218', verdict: 'accepted', at: '2026-01-01' }])
    expect(state.officialFacts).toEqual(['claim.alive-2218'])
  })

  it('forks without mutating the source branch', () => {
    const source = { id: 'main', name: '기본', events: [{ id: '1', type: 'acquire' as const, actorId: 'rowen', cardId: 'evidence.guard-log', at: '2026-01-01' }] }
    const fork = forkBranch(source, 0, 1)
    expect(fork.events).toHaveLength(0)
    expect(source.events).toHaveLength(1)
    expect(fork.parentId).toBe('main')
  })
})
