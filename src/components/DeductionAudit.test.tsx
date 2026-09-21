// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import Ajv2020 from 'ajv/dist/2020'
import { deductionAudit, memoryStages, npcGroups, releasePlan, scenario } from '../scenario/load'
import deductionAuditSchema from '../../schemas/deduction-audit.schema.json'
import { countInquiryOutcomes, countRoundAxes, DeductionAudit, findDistinctAxisAssignment, minimumCardsToBreak } from './DeductionAudit'

describe('추리 건전성 검증', () => {
  it('검증 문서 스키마와 카드 참조가 유효하다', () => {
    const validate = new Ajv2020({ allErrors: true }).compile(deductionAuditSchema)
    expect(validate(deductionAudit), JSON.stringify(validate.errors)).toBe(true)
    const ids = new Set(scenario.cards.map((card) => card.id))
    const references = [...deductionAudit.alibis.flatMap((item) => item.cardIds), ...deductionAudit.culprit.axes.flatMap((axis) => axis.paths.flat())]
    for (const id of references) expect(ids.has(id), id).toBe(true)
  })

  it('모든 알리바이와 범인 특정 축은 카드 한 장보다 많은 조각을 요구한다', () => {
    expect(deductionAudit.alibis.every((item) => item.minimumRequired > 1 && item.cardIds.length >= item.minimumRequired)).toBe(true)
    expect(deductionAudit.culprit.axes.every((axis) => axis.paths.length > 1 && axis.paths.every((path) => path.length > 1))).toBe(true)
    expect(deductionAudit.culprit.axes.every((axis) => new Set(axis.cardIds.map((id) => scenario.cards.find((card) => card.id === id)?.kind)).size >= 2)).toBe(true)
    const sourceOf = (id: string) => {
      if (deductionAudit.sourceOverrides?.[id]) return deductionAudit.sourceOverrides[id]
      const card = scenario.cards.find((item) => item.id === id)!
      if (card.kind === 'memory') return `character:${card.initialOwnerId}`
      if (card.kind === 'testimony') return `npc:${npcGroups.npcs.find((npc) => npc.cardIds.includes(id))?.id}`
      return `${card.kind}:${id}`
    }
    expect(deductionAudit.culprit.axes.every((axis) => axis.paths.every((path) => new Set(path.map(sourceOf)).size >= 2))).toBe(true)
    expect(deductionAudit.culprit.axes.every((axis) => minimumCardsToBreak(axis.paths) >= 2)).toBe(true)
    const finalAssignment = findDistinctAxisAssignment(deductionAudit, scenario)
    expect(finalAssignment.cardIds).toHaveLength(5)
    expect(finalAssignment.kinds).toBeGreaterThanOrEqual(3)
    for (const omittedId of deductionAudit.culprit.axes.flatMap((axis) => axis.cardIds)) {
      const withoutOne = findDistinctAxisAssignment(deductionAudit, scenario, new Set([omittedId]))
      expect(withoutOne.cardIds, omittedId).toHaveLength(5)
      expect(withoutOne.kinds, omittedId).toBeGreaterThanOrEqual(3)
    }
    const culpritIds = [...new Set(deductionAudit.culprit.axes.flatMap((axis) => axis.cardIds))]
    for (const omitted of culpritIds) expect(deductionAudit.culprit.axes.every((axis) => axis.paths.some((path) => path.every((id) => id !== omitted)))).toBe(true)
    const isabel = deductionAudit.alibis.find((item) => item.characterId === 'isabel')!
    expect(isabel.conditional).toBe(true)
    expect(isabel.requiredCardIds).toContain('memory.cassian-isabel-truth')
    expect(deductionAudit.alibis.map((item) => item.characterId).sort()).toEqual(['cassian', 'isabel', 'queen', 'rowen', 'seraphine'])
    expect(deductionAudit.alibis.filter((item) => item.conditional).map((item) => item.characterId)).toEqual(['isabel'])
    const isabelAlibi = deductionAudit.alibis.find((item) => item.characterId === 'isabel')!
    expect(isabelAlibi.requiredCardIds).toEqual(['memory.cassian-isabel-truth'])
    expect(isabelAlibi.cardIds).not.toContain('memory.isabel-alive')
    expect(countInquiryOutcomes(deductionAudit, npcGroups)).toEqual({ passing: 4096, total: 4096 })
    expect(countRoundAxes(deductionAudit, releasePlan, memoryStages).map((round) => round.axes.length)).toEqual([0, 4, 5])
  })

  it('검증 화면에 카시안 공개 조건과 다섯 추리 축을 표시한다', () => {
    const html = renderToStaticMarkup(<MemoryRouter><DeductionAudit scenario={scenario} document={deductionAudit} npcGroups={npcGroups} releasePlan={releasePlan} memoryStages={memoryStages} /></MemoryRouter>)
    expect(html).toContain('공개 알리바이 없음 · 카시안의 공개가 필요')
    expect(html).toContain('카시안 공개 시 성립')
    for (const axis of deductionAudit.culprit.axes) expect(html).toContain(axis.label)
    expect(html).toContain('어느 카드 한 장도 이 결론을 단독으로 만들지 않습니다.')
    expect(html).toContain('단독 결론</dt><dd>0개')
    expect(html).toContain('누락 참조</dt><dd>0개')
    expect(html).toContain('탐문 누락 조합</dt><dd>4096/4096')
    expect(html).toContain('종류별 획득</dt><dd>18/24 · 75%')
    expect(html).toContain('서로 다른 최종 카드</dt><dd>5/5 · 4종류')
    expect(html).toContain('0/5축')
    expect(html).toContain('4/5축')
    expect(html).toContain('5/5축')
    expect(html.match(/붕괴까지 최소 2장 누락/g)).toHaveLength(5)
  })
})
