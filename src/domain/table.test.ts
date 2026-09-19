import { describe, expect, it } from 'vitest'
import { coverPile, drawCard, drawCards, flipPile, movePile, movePiles, shufflePile, stackPiles, stackSelected, type CardPile } from './table'

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

  it('덱은 실제 묶음처럼 순서를 반대로 하고 양면을 뒤집는다', () => {
    const flipped = flipPile(initial(), 'deck')
    expect(flipped[0].cards.map((card) => card.cardId)).toEqual(['c', 'b', 'a'])
    expect(flipped[0].cards.map((card) => card.faceUp)).toEqual([true, true, true])
    expect(flipPile(flipped, 'deck')).toEqual(initial())
    expect(coverPile(flipped, 'deck')[0].cards.every((card) => !card.faceUp)).toBe(true)
  })

  it('여러 장을 위에서부터 꺼내도 카드가 사라지거나 복제되지 않는다', () => {
    const before = initial()
    const drawn = drawCards(before, 'deck', ['one', 'two', 'three', 'extra'])
    expect(drawn.map((pile) => pile.id)).toEqual(['single', 'one', 'two', 'three'])
    expect(drawn.flatMap((pile) => pile.cards).map((card) => card.cardId)).toEqual(['d', 'c', 'b', 'a'])
    expect(before[0].cards).toHaveLength(3)
    expect(drawCards(before, 'deck', ['single'])).toBe(before)
  })

  it('그룹은 경계에 닿아도 카드 사이 간격을 유지한다', () => {
    const moved = movePiles(initial(), ['deck', 'single'], 70, -80)
    expect(moved.map((pile) => [pile.x, pile.y])).toEqual([[50, 0], [100, 50]])
    expect(stackSelected(moved, ['deck', 'single'], 'single')[0].cards).toHaveLength(4)
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
