import { describe, expect, it } from 'vitest'
import { tableShortcut } from './tableInput'

describe('테이블 단축키', () => {
  it('입력 중이거나 IME 조합 중에는 동작하지 않는다', () => {
    expect(tableShortcut({ code: 'KeyF', key: 'f' }, true)).toBeNull()
    expect(tableShortcut({ code: 'KeyF', key: 'Process', isComposing: true })).toBeNull()
  })
  it('브라우저 단축키를 가로채지 않는다', () => {
    for (const code of ['KeyR', 'KeyF', 'KeyL']) expect(tableShortcut({ code, key: '', metaKey: true })).toBeNull()
    expect(tableShortcut({ code: 'Digit1', key: '!', shiftKey: true })).toBeNull()
    expect(tableShortcut({ code: 'KeyF', key: 'ƒ', altKey: true })).toBeNull()
  })
  it('Windows/Mac 되돌리기와 다시 하기를 구분한다', () => {
    expect(tableShortcut({ code: 'KeyZ', key: 'z', ctrlKey: true })).toBe('undo')
    expect(tableShortcut({ code: 'KeyZ', key: 'z', metaKey: true, shiftKey: true })).toBe('redo')
    expect(tableShortcut({ code: 'KeyY', key: 'y', ctrlKey: true })).toBe('redo')
  })
  it('확대와 뒤집기를 분리하고 한글 배열의 물리 키도 지원한다', () => {
    expect(tableShortcut({ code: 'Space', key: ' ' })).toBe('inspect')
    expect(tableShortcut({ code: 'AltLeft', key: 'Alt', altKey: true })).toBe('inspect')
    expect(tableShortcut({ code: 'KeyF', key: 'ㄹ' })).toBe('flip')
    expect(tableShortcut({ code: 'Digit3', key: '3' })).toBe(3)
    expect(tableShortcut({ code: 'F10', key: 'F10', shiftKey: true })).toBe('menu')
  })
})
