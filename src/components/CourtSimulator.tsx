import { useMemo, useState } from 'react'
import type { Card, CardRoleAuditDocument, Character, MemoryStagesDocument, NpcGroupsDocument, Scenario } from '../domain/types'
import { getCardGroups, type CardGroup } from '../scenario/cardGroups'
import { CardReader, CardView } from './CardView'

type CourtEntry = { round: number; actor: Character; card: Card; source: 'inspection' | 'court'; target?: Character }
type Simulation = { rounds: CourtEntry[][]; remainingHands: Record<string, number> }

function randomSource(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ result >>> 15, result | 1)
    result ^= result + Math.imul(result ^ result >>> 7, result | 61)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function takeChoice(deck: string[], count: number, random: () => number): string | undefined {
  const candidates = deck.splice(0, Math.min(count, deck.length))
  if (!candidates.length) return undefined
  const [selected] = candidates.splice(Math.floor(random() * candidates.length), 1)
  deck.push(...candidates)
  return selected
}

function npcAssignments(characters: Character[], groups: CardGroup[], visited: Record<string, Set<string>>, random: () => number) {
  const assignments = new Map<string, CardGroup>()
  const used = new Set<string>()
  const actors = shuffle(characters, random)
  function place(index: number): boolean {
    if (index === actors.length) return true
    const actor = actors[index]
    for (const group of shuffle(groups.filter(group => !used.has(group.id) && !visited[actor.id].has(group.id)), random)) {
      used.add(group.id); assignments.set(actor.id, group)
      if (place(index + 1)) return true
      used.delete(group.id); assignments.delete(actor.id)
    }
    return false
  }
  place(0)
  return assignments
}

function simulate(seed: number, scenario: Scenario, npcGroups: NpcGroupsDocument, memoryStages: MemoryStagesDocument, inspectionCards: Card[]): Simulation {
  const random = randomSource(seed)
  const groups = getCardGroups(scenario, npcGroups, memoryStages)
  const cardById = new Map(scenario.cards.map(card => [card.id, card]))
  const decks = Object.fromEntries(groups.map(group => [group.id, shuffle(group.cards.map(card => card.id), random)]))
  const hands = Object.fromEntries(scenario.characters.map(character => [character.id, [] as string[]]))
  const visited = Object.fromEntries(scenario.characters.map(character => [character.id, new Set<string>()]))
  const rumor = groups.find(group => group.kind === 'rumor')!
  const testimonies = groups.filter(group => group.kind === 'testimony')
  const locations = groups.filter(group => group.kind === 'evidence')
  const overview = inspectionCards.find(card => card.id === 'inspection.overview')
  const inspections = [...(overview ? [overview] : []), ...shuffle(inspectionCards.filter(card => card.id !== 'inspection.overview'), random)]
  const rounds: CourtEntry[][] = []

  for (let round = 1; round <= 3; round += 1) {
    for (const actor of scenario.characters) {
      const cardId = takeChoice(decks[rumor.id], 3, random)
      if (cardId) hands[actor.id].push(cardId)
    }
    const assignedNpc = npcAssignments(scenario.characters, testimonies, visited, random)
    for (const actor of scenario.characters) {
      const group = assignedNpc.get(actor.id)
      if (!group) continue
      const cardId = takeChoice(decks[group.id], 2, random)
      if (cardId) hands[actor.id].push(cardId)
      visited[actor.id].add(group.id)
    }
    const locationActors = new Map<string, Character[]>()
    for (const actor of shuffle(scenario.characters, random)) {
      const eligible = locations.filter(group => (decks[group.id]?.length ?? 0) > (locationActors.get(group.id)?.length ?? 0))
      const group = eligible[Math.floor(random() * eligible.length)]
      if (group) locationActors.set(group.id, [...(locationActors.get(group.id) ?? []), actor])
    }
    for (const [groupId, actors] of locationActors) {
      const candidates = decks[groupId].splice(0, Math.min(actors.length + 1, decks[groupId].length))
      for (const actor of shuffle(actors, random)) {
        if (!candidates.length) break
        hands[actor.id].push(candidates.splice(Math.floor(random() * candidates.length), 1)[0])
      }
      decks[groupId].push(...candidates)
    }

    const rowen = scenario.characters.find(character => character.id === 'rowen') ?? scenario.characters.at(-1)!
    const inspection = inspections[round - 1]
    const entries: CourtEntry[] = inspection ? [{ round, actor: rowen, card: inspection, source: 'inspection' }] : []
    for (const actor of scenario.characters) {
      const available = hands[actor.id]
      if (!available.length) continue
      const card = cardById.get(available.splice(Math.floor(random() * available.length), 1)[0])
      const targets = scenario.characters.filter(character => character.id !== actor.id)
      const target = round < 3 ? targets[Math.floor(random() * targets.length)] : undefined
      if (card) entries.push({ round, actor, card, source: 'court', target })
    }
    rounds.push(entries)
  }

  return { rounds, remainingHands: Object.fromEntries(scenario.characters.map(character => [character.id, hands[character.id].length])) }
}

const roleLabels: Record<string, string> = { buried_truth: '묻어야 하는 진실', motive: '동기', psychological_evidence: '심증', physical_evidence: '물증', desire: '욕망', ruin: '파멸', secret_hint: '비밀 암시', timeline: '시간·동선', rebuttal: '반증' }

export function CourtSimulator({ scenario, npcGroups, memoryStages, inspectionCards, roleAudit }: { scenario: Scenario; npcGroups: NpcGroupsDocument; memoryStages: MemoryStagesDocument; inspectionCards: Card[]; roleAudit: CardRoleAuditDocument }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [court, setCourt] = useState(1)
  const [selected, setSelected] = useState<Card>()
  const result = useMemo(() => simulate(seed, scenario, npcGroups, memoryStages, inspectionCards), [seed, scenario, npcGroups, memoryStages, inspectionCards])
  const visible = result.rounds.slice(0, court).flat()
  const kindCounts = ['rumor', 'testimony', 'evidence'].map(kind => ({ kind, count: visible.filter(entry => entry.card.kind === kind).length }))
  const roleByCard = useMemo(() => new Map(Object.entries(roleAudit.cardsByPrimaryRole).flatMap(([role, ids]) => ids.map(id => [id, role] as const))), [roleAudit])

  return <section className="court-simulator">
    <header className="court-simulator__header">
      <div><span className="eyebrow">DESIGNER TESTBED</span><h2>재판 공개 패 시뮬레이터</h2><p>실제 획득 절차를 무작위로 진행한 뒤, 각 인물이 재판에 한 장씩 제출했을 때 로웬이 보게 되는 누적 패입니다.</p></div>
      <button type="button" onClick={() => { setSeed(Math.floor(Math.random() * 2 ** 31)); setCourt(1) }}>새 판 무작위로 뽑기</button>
    </header>
    <div className="court-simulator__controls">
      {[1, 2, 3].map(round => <button type="button" key={round} aria-pressed={court === round} onClick={() => setCourt(round)}><b>제{round}재판</b><span>{round * 7}장 누적</span></button>)}
      <div><span>현재 공개</span><b>{visible.length}장</b>{kindCounts.map(item => <small key={item.kind}>{item.kind === 'rumor' ? '소문' : item.kind === 'testimony' ? '탐문' : item.kind === 'inspection' ? '검시' : '조사'} {item.count}</small>)}</div>
    </div>
    <div className="court-simulator__rounds">
      {result.rounds.slice(0, court).map((entries, roundIndex) => <section key={roundIndex} className={roundIndex + 1 === court ? 'is-current' : ''}>
        <header><div><span>COURT {roundIndex + 1}</span><h3>제{roundIndex + 1}재판에 새로 공개된 카드</h3></div><b>{entries.length}장</b></header>
        <div className="court-simulator__cards">{entries.map(entry => <article key={`${entry.source}-${entry.actor.id}-${entry.card.id}`}>
          <p>{entry.source === 'inspection' ? <><strong>로웬</strong> · 검시 결과</> : <><strong>{entry.actor.name}</strong> · 제출{entry.target && <> → {entry.target.name}</>}</>}<em>{entry.source === 'inspection' ? '검시 기준' : roleLabels[roleByCard.get(entry.card.id) ?? ''] ?? '역할 미지정'}</em></p>
          <CardView card={entry.card} onClick={() => setSelected(entry.card)} />
        </article>)}</div>
      </section>)}
    </div>
    <footer><span>시드 {seed}</span><span>3재판 뒤 남은 비공개 손패: {scenario.characters.map(character => `${character.name} ${result.remainingHands[character.id]}장`).join(' · ')}</span></footer>
    <CardReader card={selected} onClose={() => setSelected(undefined)} />
  </section>
}
