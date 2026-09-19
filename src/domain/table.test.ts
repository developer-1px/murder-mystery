import { describe, expect, it } from 'vitest'
import { coverPile, drawCard, flipTop, movePile, shufflePile, stackPiles, type CardPile } from './table'

const initial = (): CardPile[] => [
  { id: 'deck', x: 10, y: 10, cards: [{ cardId: 'a', faceUp: false }, { cardId: 'b', faceUp: false }, { cardId: 'c', faceUp: false }] },
  { id: 'single', x: 60, y: 60, cards: [{ cardId: 'd', faceUp: true }] },
]

describe('규칙 없는 카드 테이블', () => {
  it('한 장만 꺼내며 순서, 뒷면과 원본 스냅샷을 보존한다', () => {
    const before = initial()
    const after = drawCard(before, 'deck', 'drawn')
    expect(after[0].cards.map((card) => card.cardId)).toEqual(['a', 'b'])
    expect(after[2].cards).toEqual([{ cardId: 'c', faceUp: false }])
    expect(before[0].cards).toHaveLength(3)
    expect(drawCard(after, 'drawn', 'another')).toBe(after)
  })

  it('맨 위만 뒤집고 모두 덮을 수 있다', () => {
    const flipped = flipTop(initial(), 'deck')
    expect(flipped[0].cards.map((card) => card.faceUp)).toEqual([false, false, true])
    expect(coverPile(flipped, 'deck')[0].cards.every((card) => !card.faceUp)).toBe(true)
  })

  it('카드 종류나 게임 규칙과 무관하게 겹쳐 쌓는다', () => {
    const stacked = stackPiles(initial(), 'deck', 'single')
    expect(stacked).toHaveLength(1)
    expect(stacked[0].cards.map((card) => card.cardId)).toEqual(['d', 'a', 'b', 'c'])
    expect(stacked[0].cards[0].faceUp).toBe(true)
    expect(stackPiles(stacked, 'single', 'single')).toBe(stacked)
  })

  it('이동은 테이블 경계 안에 머물고 카드를 최상단에 둔다', () => {
    const moved = movePile(initial(), 'deck', 200, -10)
    expect(moved[1]).toMatchObject({ id: 'deck', x: 100, y: 0 })
    expect(moved.flatMap((pile) => pile.cards)).toHaveLength(4)
  })

  it('섞기는 순서만 바꾸고 카드·앞뒤 상태·이전 스냅샷을 보존한다', () => {
    const before = initial()
    const shuffled = shufflePile(before, 'deck', () => 0)
    expect(shuffled[0].cards.map((card) => card.cardId)).toEqual(['b', 'c', 'a'])
    expect(before[0].cards.map((card) => card.cardId)).toEqual(['a', 'b', 'c'])
    expect(shuffled[1]).toBe(before[1])
  })
})
