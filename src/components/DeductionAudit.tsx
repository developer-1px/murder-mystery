import { useState } from 'react'
import { Link } from 'react-router'
import type { DeductionAuditDocument, MemoryStagesDocument, NpcGroupsDocument, ReleasePlanDocument, Scenario } from '../domain/types'
import { cardKinds } from './cardKinds'
import { segment } from '../routing'

export function countInquiryOutcomes(document: DeductionAuditDocument, npcGroups: NpcGroupsDocument) {
  let total = 0
  let passing = 0
  const visit = (index: number, omitted: Set<string>) => {
    if (index < npcGroups.npcs.length) {
      for (const cardId of npcGroups.npcs[index].cardIds) { omitted.add(cardId); visit(index + 1, omitted); omitted.delete(cardId) }
      return
    }
    total++
    if (document.culprit.axes.every((axis) => axis.paths.some((path) => path.every((id) => !omitted.has(id))))) passing++
  }
  visit(0, new Set())
  return { passing, total }
}

export function countRoundAxes(document: DeductionAuditDocument, releasePlan: ReleasePlanDocument, memoryStages: MemoryStagesDocument) {
  const available = new Set<string>()
  return releasePlan.rounds.map((round, index) => {
    round.cardIds.forEach((id) => available.add(id))
    memoryStages.stages.slice(0, index + 2).forEach((stage) => stage?.cardIds.forEach((id) => available.add(id)))
    const axes = document.culprit.axes.filter((axis) => axis.paths.some((path) => path.every((id) => available.has(id))))
    return { round: round.round, title: round.title, axes: axes.map((axis) => axis.id), total: document.culprit.axes.length }
  })
}

export function minimumCardsToBreak(paths: string[][]) {
  const cardIds = [...new Set(paths.flat())]
  for (let size = 1; size <= cardIds.length; size++) {
    const search = (start: number, removed: Set<string>): boolean => {
      if (removed.size === size) return paths.every((path) => path.some((id) => removed.has(id)))
      for (let index = start; index < cardIds.length; index++) {
        removed.add(cardIds[index])
        if (search(index + 1, removed)) return true
        removed.delete(cardIds[index])
      }
      return false
    }
    if (search(0, new Set())) return size
  }
  return cardIds.length
}

export function findDistinctAxisAssignment(document: DeductionAuditDocument, scenario: Scenario, omittedIds = new Set<string>()) {
  const byId = new Map(scenario.cards.map((card) => [card.id, card]))
  let best: { cardIds: string[]; kinds: number } = { cardIds: [], kinds: 0 }
  const visit = (axisIndex: number, chosen: string[]) => {
    if (axisIndex === document.culprit.axes.length) {
      const kinds = new Set(chosen.map((id) => byId.get(id)?.kind).filter(Boolean)).size
      if (chosen.length > best.cardIds.length || kinds > best.kinds) best = { cardIds: [...chosen], kinds }
      return
    }
    for (const id of document.culprit.axes[axisIndex].cardIds) {
      if (chosen.includes(id) || omittedIds.has(id)) continue
      chosen.push(id)
      visit(axisIndex + 1, chosen)
      chosen.pop()
    }
  }
  visit(0, [])
  return best
}

export function DeductionAudit({ scenario, document, npcGroups, releasePlan, memoryStages }: { scenario: Scenario; document: DeductionAuditDocument; npcGroups: NpcGroupsDocument; releasePlan: ReleasePlanDocument; memoryStages: MemoryStagesDocument }) {
  const [omittedId, setOmittedId] = useState('')
  const byId = new Map(scenario.cards.map((card) => [card.id, card]))
  const available = (ids: string[]) => ids.filter((id) => id !== omittedId)
  const passes = (set: { cardIds: string[]; minimumRequired?: number; requiredCardIds?: string[]; paths?: string[][] }) => {
    if (set.paths) return set.paths.some((path) => path.every((id) => id !== omittedId))
    return available(set.cardIds).length >= (set.minimumRequired ?? 0) && (set.requiredCardIds ?? []).every((id) => id !== omittedId)
  }
  const culprit = scenario.characters.find((character) => character.id === document.culprit.characterId)!
  const allAuditIds = [...new Set([...document.alibis.flatMap((item) => item.cardIds), ...document.culprit.axes.flatMap((axis) => axis.cardIds)])]
  const culpritPasses = document.culprit.axes.every(passes)
  const missingReferences = allAuditIds.filter((id) => !byId.has(id))
  const survivesRemoval = allAuditIds.filter((removedId) => document.culprit.axes.every((axis) => axis.paths.some((path) => path.every((id) => id !== removedId)))).length
  const soloConclusions = document.alibis.filter((item) => item.minimumRequired <= 1).length + document.culprit.axes.filter((axis) => axis.paths.some((path) => path.length <= 1)).length
  const inquiryOutcomes = countInquiryOutcomes(document, npcGroups)
  const roundAxes = countRoundAxes(document, releasePlan, memoryStages)
  const distinctAssignment = findDistinctAxisAssignment(document, scenario, new Set(omittedId ? [omittedId] : []))
  const acquiredPerKind = npcGroups.npcs.length * releasePlan.rounds.length
  const commonPoolSize = scenario.cards.filter((card) => card.kind === 'testimony').length
  const sourceOf = (id: string) => {
    if (document.sourceOverrides?.[id]) return document.sourceOverrides[id]
    const card = byId.get(id)
    if (card?.kind === 'memory') return `character:${card.initialOwnerId}`
    if (card?.kind === 'testimony') return `npc:${npcGroups.npcs.find((npc) => npc.cardIds.includes(id))?.id ?? id}`
    return `${card?.kind ?? 'missing'}:${id}`
  }

  const CardLinks = ({ ids }: { ids: string[] }) => <div className="deduction-cards">{ids.map((id) => {
    const card = byId.get(id)
    return card && <Link className={id === omittedId ? 'omitted' : ''} to={`/library/cards/${segment(id)}`} key={id}><span>{cardKinds[card.kind].label}</span>{card.title}</Link>
  })}</div>

  return <section className="deduction-audit">
    <header className="deduction-audit__header"><span className="eyebrow">DESIGNER ONLY · 추리 건전성</span><h2>알리바이와 범인 특정 검증</h2><p>{document.description}</p><dl><div><dt>단독 결론</dt><dd>{soloConclusions}개</dd></div><div><dt>누락 참조</dt><dd>{missingReferences.length}개</dd></div><div><dt>종류별 획득</dt><dd>{acquiredPerKind}/{commonPoolSize} · {Math.round(acquiredPerKind / commonPoolSize * 100)}%</dd></div><div><dt>서로 다른 최종 카드</dt><dd>{distinctAssignment.cardIds.length}/5 · {distinctAssignment.kinds}종류</dd></div><div><dt>한 장 제거 내성</dt><dd>{survivesRemoval}/{allAuditIds.length}</dd></div><div><dt>탐문 누락 조합</dt><dd>{inquiryOutcomes.passing}/{inquiryOutcomes.total}</dd></div></dl></header>
    <label className="deduction-omit">카드 한 장 제거 시험 <select value={omittedId} onChange={(event) => setOmittedId(event.target.value)}><option value="">제거하지 않음</option>{allAuditIds.map((id) => <option value={id} key={id}>{byId.get(id)?.title ?? id}</option>)}</select></label>
    <section className="deduction-pacing" aria-label="회차별 추리 완성도">{roundAxes.map((round) => <div key={round.round}><span>{round.round}회차 · {round.title}</span><strong>{round.axes.length}/{round.total}축</strong><small>{round.axes.length === round.total ? '최종 특정 가능' : `${round.total - round.axes.length}축 미완성`}</small></div>)}</section>
    <section className="deduction-section"><h3>범인 외 다섯 인물의 알리바이</h3><div className="alibi-grid">{document.alibis.map((alibi) => {
      const character = scenario.characters.find((item) => item.id === alibi.characterId)!
      const valid = passes(alibi)
      return <article className={valid ? 'audit-pass' : 'audit-fail'} key={alibi.characterId}><header><div><strong>{character.name}</strong><span>{alibi.label}</span></div><b>{valid ? alibi.conditional ? '카시안 공개 시 성립' : '성립' : '붕괴'}</b></header><p>{alibi.note}</p><small>{available(alibi.cardIds).length}/{alibi.minimumRequired}개 이상 필요 · 카드 한 장만으로는 성립하지 않음</small><CardLinks ids={alibi.cardIds} /></article>
    })}</div></section>
    <section className="deduction-section"><h3>{culprit.name} 특정의 다섯 축</h3><div className="deduction-axes">{document.culprit.axes.map((axis, index) => {
      const valid = passes(axis)
      const workingPaths = axis.paths.filter((path) => path.every((id) => id !== omittedId)).length
      const kinds = new Set(axis.cardIds.map((id) => byId.get(id)?.kind).filter(Boolean)).size
      const minimumSources = Math.min(...axis.paths.map((path) => new Set(path.map(sourceOf)).size))
      const breakSize = minimumCardsToBreak(axis.paths)
      return <article className={valid ? 'audit-pass' : 'audit-fail'} key={axis.id}><span>{String(index + 1).padStart(2, '0')}</span><div><header><strong>{axis.label}</strong><b>{valid ? '충족' : '부족'}</b></header><small>대체 경로 {workingPaths}/{axis.paths.length}개 작동 · 카드 종류 {kinds}개 · 독립 출처 최소 {minimumSources}개 · 붕괴까지 최소 {breakSize}장 누락</small><CardLinks ids={axis.cardIds} /></div></article>
    })}</div><div className={`deduction-verdict ${culpritPasses ? 'audit-pass' : 'audit-fail'}`}><span>{culpritPasses ? '모든 축이 연결됨' : '현재 조각으로 특정 불가'}</span><strong>{culpritPasses ? document.culprit.conclusion : '빠진 축을 보강해야 합니다.'}</strong><small>어느 카드 한 장도 이 결론을 단독으로 만들지 않습니다.</small></div></section>
  </section>
}
