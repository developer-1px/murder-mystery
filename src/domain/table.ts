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
  if (!source || source.cards.length < 2 || piles.some((pile) => pile.id === newId)) return piles
  return [
    ...piles.map((pile) => pile.id === id ? { ...pile, cards: pile.cards.slice(0, -1) } : pile),
    { id: newId, cards: source.cards.slice(-1), x: clampPosition(source.x + (source.x > 75 ? -12 : 12)), y: clampPosition(source.y + (source.y > 65 ? -35 : 35)) },
  ]
}

export function flipTop(piles: CardPile[], id: string): CardPile[] {
  return piles.map((pile) => pile.id === id ? { ...pile, cards: pile.cards.map((card, index) => index === pile.cards.length - 1 ? { ...card, faceUp: !card.faceUp } : card) } : pile)
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
