// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { scenario, timeline } from '../scenario/load'
import { TimelineBoard } from './TimelineBoard'

describe('시간대 × 인물 카드 분류표', () => {
  it('모든 카드를 한 번씩 시간대에 배치하고 여섯 인물 열을 제공한다', () => {
    const ids = timeline.rows.flatMap((row) => row.cardIds)
    expect(ids).toHaveLength(scenario.cards.length)
    expect(new Set(ids).size).toBe(scenario.cards.length)
    expect(new Set(ids)).toEqual(new Set(scenario.cards.map((card) => card.id)))

    const html = renderToStaticMarkup(<MemoryRouter><TimelineBoard scenario={scenario} document={timeline} /></MemoryRouter>)
    for (const character of scenario.characters) expect(html).toContain(`>${character.name}<`)
    for (const character of scenario.characters) {
      const owned = scenario.cards.filter((card) => timeline.characterIdByCardId[card.id] === character.id)
      expect(owned).toHaveLength(15)
      expect(['memory', 'testimony', 'rumor', 'evidence'].map((kind) => owned.filter((card) => card.kind === kind).length)).toEqual([3, 4, 4, 4])
    }
    expect(html).toContain('21:52')
    expect(html).toContain('23:05')
    expect(html).toContain('미배치</dt><dd>0장')
  })
})
