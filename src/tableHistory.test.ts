import { describe, expect, it } from 'vitest'
import { initialHistory, parseTableHistory, tablePath } from './tableHistory'

const initial = () => initialHistory([{ id: 'deck', x: 4, y: 12, cards: [{ cardId: 'a', faceUp: false }] }])
describe('로컬 테이블 딥링크 기록', () => {
  it('유효한 기록과 마지막 위치를 손실 없이 읽는다', () => {
    const history = initial()
    expect(parseTableHistory(JSON.stringify(history), new Set(['a']))).toEqual(history)
    expect(tablePath('가지/1', 2)).toBe('/table/%EA%B0%80%EC%A7%80%2F1/steps/2')
  })
  it('손상된 JSON과 사라진 카드 참조를 거부한다', () => {
    expect(() => parseTableHistory('{', new Set())).toThrow()
    expect(() => parseTableHistory(JSON.stringify(initial()), new Set())).toThrow()
    expect(() => parseTableHistory('{}', new Set())).toThrow()
  })
  it('중복 카드·가지와 잘못된 기록 위치·좌표를 거부한다', () => {
    const duplicate = initial()
    duplicate.branches[0].snapshots[0].piles[0].cards.push({ cardId: 'a', faceUp: true })
    expect(() => parseTableHistory(JSON.stringify(duplicate), new Set(['a']))).toThrow()
    const wrongStep = initial(); wrongStep.last.step = -1
    expect(() => parseTableHistory(JSON.stringify(wrongStep), new Set(['a']))).toThrow()
    const wrongPosition = initial(); wrongPosition.branches[0].snapshots[0].piles[0].x = 101
    expect(() => parseTableHistory(JSON.stringify(wrongPosition), new Set(['a']))).toThrow()
    const duplicateBranch = initial(); duplicateBranch.branches.push(duplicateBranch.branches[0])
    expect(() => parseTableHistory(JSON.stringify(duplicateBranch), new Set(['a']))).toThrow()
  })
})
