import { expect, it } from 'vitest'
import { scenario, npcGroups, memoryStages } from '../scenario/load'
import { getCardGroups } from '../scenario/cardGroups'
import inspections from '../../scenarios/crown-trial/inspections.json'
import type { Card } from './types'
import { createPlaySession, transitionPlay, type PlayAssets } from './playSession'
import { playTablePiles } from './playTable'

const assets: PlayAssets = { scenario, memoryStages, groups: getCardGroups(scenario, npcGroups, memoryStages), inspectionCards: inspections as Card[] }
it('잠긴 차례에는 개인 손패·덱 후보를 투영하지 않는다', () => {
  const session = { ...createPlaySession(assets), phase: 'rumor' as const }
  expect(playTablePiles(session, assets, false)).toEqual([])
  const piles = playTablePiles(session, assets, true)
  expect(piles.filter(pile => pile.zone === 'hand').flatMap(pile => pile.cards.map(card => card.cardId))).toEqual(session.hands[session.actorId])
})
it('손패 정렬은 현재 인물의 카드 순열만 허용한다', () => {
  const session = createPlaySession(assets)
  session.hands.rowen = ['one', 'two']
  const reordered = transitionPlay(session, { type: 'reorder-hand', cardIds: ['two', 'one'] }, assets)
  expect(reordered.hands.rowen).toEqual(['two', 'one'])
  expect(reordered.actorId).toBe(session.actorId)
  expect(reordered.phase).toBe(session.phase)
  expect(transitionPlay(session, { type: 'reorder-hand', cardIds: ['one', 'one'] }, assets)).toBe(session)
  expect(transitionPlay(session, { type: 'reorder-hand', cardIds: ['one', 'foreign'] }, assets)).toBe(session)
})
