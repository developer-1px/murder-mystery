import type { CardPile } from './table'
import type { PlayAssets, PlaySession } from './playSession'

// Game ownership and visibility are projected into the existing table model.
// Never use this projection as the game state or write free-table mutations back.
export function playTablePiles(session: PlaySession, assets: PlayAssets, privateVisible: boolean, viewerId = session.actorId): CardPile[] {
  const piles: CardPile[] = []
  const add = (id: string, cardIds: string[], faceUp: boolean, zone: 'table' | 'hand' = 'table') => {
    if (cardIds.length) piles.push({ id, cards: [...cardIds].reverse().map(cardId => ({ cardId, faceUp })), zone, x: 50, y: 12 })
  }
  if (privateVisible && viewerId === session.actorId) {
    if (session.phase === 'inspection' && session.inspectionStage === 'select') {
      for (const card of assets.inspectionCards) add(card.id, [card.id], false)
    }
    if (['rumor', 'testimony', 'investigation'].includes(session.phase)) {
      const kind = session.phase === 'rumor' ? 'rumor' : session.phase === 'testimony' ? 'testimony' : 'evidence'
      for (const group of assets.groups.filter(group => group.kind === kind)) {
        add(group.id, [...(session.choice?.deckId === group.id ? session.choice.cardIds : []), ...(session.decks[group.id] ?? [])], false)
      }
    }
  }
  if (session.phase === 'court') {
    for (const entry of session.publicCards.filter(entry => entry.round === session.round && entry.source === 'court')) add(entry.cardId, [entry.cardId], true)
  }
  piles.forEach((pile, index) => { pile.x = piles.length === 1 ? 50 : 8 + index * 84 / (piles.length - 1) })
  if (privateVisible && session.phase !== 'ready') {
    for (const id of session.hands[viewerId] ?? []) add(id, [id], true, 'hand')
  }
  return piles
}
