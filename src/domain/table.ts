export interface TableCard {
  cardId: string
  faceUp: boolean
}

export interface CardPile {
  id: string
  cards: TableCard[] // 마지막 카드가 맨 위입니다.
  x: number
  y: number
}

export const clampPosition = (value: number) => Math.max(0, Math.min(100, value))

export function movePile(piles: CardPile[], id: string, x: number, y: number): CardPile[] {
  const pile = piles.find((item) => item.id === id)
  return pile ? [...piles.filter((item) => item.id !== id), { ...pile, x: clampPosition(x), y: clampPosition(y) }] : piles
}

export function stackPiles(piles: CardPile[], sourceId: string, targetId: string): CardPile[] {
  const source = piles.find((pile) => pile.id === sourceId)
  const target = piles.find((pile) => pile.id === targetId)
  if (!source || !target || sourceId === targetId) return piles
  return piles.filter((pile) => pile.id !== sourceId).map((pile) => pile.id === targetId ? { ...pile, cards: [...target.cards, ...source.cards] } : pile)
}

export function drawCard(piles: CardPile[], id: string, newId: string): CardPile[] {
  const source = piles.find((pile) => pile.id === id)
  return source && source.cards.length > 1 ? drawCards(piles, id, [newId]) : piles
}

export function drawCards(piles: CardPile[], id: string, newIds: string[]): CardPile[] {
  const source = piles.find((pile) => pile.id === id)
  if (!source || !newIds.length || new Set(newIds).size !== newIds.length || newIds.some((newId) => piles.some((pile) => pile.id === newId))) return piles
  const count = Math.min(newIds.length, source.cards.length)
  const remaining = source.cards.slice(0, -count)
  return [
    ...piles.filter((pile) => pile.id !== id || remaining.length).map((pile) => pile.id === id ? { ...pile, cards: remaining } : pile),
    ...source.cards.slice(-count).reverse().map((card, index) => ({
      id: newIds[index], cards: [card],
      x: clampPosition(source.x + (source.x > 75 ? -12 : 12) + index * 4),
      y: clampPosition(source.y + (source.y > 65 ? -35 : 35) + index * 3),
    })),
  ]
}

export function cardCandidates(piles: CardPile[], id: string, count: number): TableCard[] {
  if (!Number.isInteger(count) || count < 1 || count > 3) return []
  return piles.find((pile) => pile.id === id)?.cards.slice(-count).reverse() ?? []
}

// 손패는 테이블 아래의 배치일 뿐, 소유권이나 공개 권한을 의미하지 않는다.
export function takeCandidate(piles: CardPile[], sourceId: string, count: number, cardId: string, newId: string): CardPile[] {
  const candidates = cardCandidates(piles, sourceId, count)
  if (!candidates.some((card) => card.cardId === cardId) || piles.some((pile) => pile.id === newId)) return piles
  const source = piles.find((pile) => pile.id === sourceId)!
  const shownIds = new Set(candidates.map((card) => card.cardId))
  const remaining = source.cards.filter((card) => card.cardId !== cardId).map((card) => shownIds.has(card.cardId) ? { ...card, faceUp: false } : card)
  const handCount = piles.filter((pile) => pile.y >= 90).length
  return [
    ...piles.filter((pile) => pile.id !== sourceId || remaining.length > 0).map((pile) => pile.id === sourceId ? { ...pile, cards: remaining } : pile),
    { id: newId, cards: [{ cardId, faceUp: true }], x: 4 + (handCount % 7) * 15, y: 100 },
  ]
}

export function flipPile(piles: CardPile[], id: string): CardPile[] {
  return piles.map((pile) => pile.id === id ? { ...pile, cards: [...pile.cards].reverse().map((card) => ({ ...card, faceUp: !card.faceUp })) } : pile)
}

export function movePiles(piles: CardPile[], ids: string[], dx: number, dy: number): CardPile[] {
  const moving = piles.filter((pile) => ids.includes(pile.id))
  if (!moving.length) return piles
  const x = Math.max(-Math.min(...moving.map((pile) => pile.x)), Math.min(dx, 100 - Math.max(...moving.map((pile) => pile.x))))
  const y = Math.max(-Math.min(...moving.map((pile) => pile.y)), Math.min(dy, 100 - Math.max(...moving.map((pile) => pile.y))))
  return [...piles.filter((pile) => !ids.includes(pile.id)), ...moving.map((pile) => ({ ...pile, x: pile.x + x, y: pile.y + y }))]
}

export function stackSelected(piles: CardPile[], ids: string[], targetId: string): CardPile[] {
  return piles.filter((pile) => ids.includes(pile.id) && pile.id !== targetId).reduce((next, pile) => stackPiles(next, pile.id, targetId), piles)
}

export function coverPile(piles: CardPile[], id: string): CardPile[] {
  return piles.map((pile) => pile.id === id ? { ...pile, cards: pile.cards.map((card) => ({ ...card, faceUp: false })) } : pile)
}

export function shufflePile(piles: CardPile[], id: string, random = Math.random): CardPile[] {
  return piles.map((pile) => {
    if (pile.id !== id) return pile
    const cards = [...pile.cards]
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
    return { ...pile, cards }
  })
}
