interface KeyInput {
  code: string
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  isComposing?: boolean
}

export type TableShortcut = 'inspect' | 'flip' | 'shuffle' | 'group' | 'selectAll' | 'undo' | 'redo' | 'cancel' | 'menu' | 'help' | 'left' | 'right' | 'up' | 'down' | number

export function tableShortcut(event: KeyInput, editing = false): TableShortcut | null {
  if (editing || event.isComposing) return null
  if (event.key === 'Escape') return 'cancel'
  if (event.ctrlKey || event.metaKey) {
    if (event.altKey) return null
    if (event.code === 'KeyZ') return event.shiftKey ? 'redo' : 'undo'
    if (event.code === 'KeyY') return 'redo'
    if (event.code === 'KeyA') return 'selectAll'
    return null
  }
  if (event.code === 'AltLeft' || event.code === 'AltRight' || event.code === 'Space') return 'inspect'
  if (event.altKey) return null
  if (event.key === 'ContextMenu' || (event.shiftKey && event.code === 'F10')) return 'menu'
  if (event.key === '?') return 'help'
  if (!event.shiftKey && /^Digit[1-3]$/.test(event.code)) return Number(event.code.slice(-1))
  const keys: Record<string, TableShortcut> = { KeyF: 'flip', KeyR: 'shuffle', KeyG: 'group', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
  return keys[event.code] ?? null
}

export const tableHelp = [
  ['뒷면 클릭 · 1', '한 장을 펼쳐 내 손패로 가져오기'],
  ['2 · 3', '2장 / 3장을 펼쳐 보고 한 장 고르기'],
  ['Shift+클릭 · 덱 이름 클릭', '선택 추가/해제 · 덱 전체 선택'],
  ['선택하지 않은 덱 드래그', '맨 위 한 장 꺼내 이동'],
  ['선택한 덱/카드 드래그', '선택한 묶음 전체 이동'],
  ['빈 곳 드래그 · Ctrl/⌘+A', '박스 선택 · 모두 선택'],
  ['손패에 마우스 올리기', '같은 카드가 커집니다. 그대로 잡아 끌 수 있습니다'],
  ['손패 안에서 드래그 · ← / →', '손패 순서 바꾸기'],
  ['손패 밖으로 드래그 · 테이블에 놓기', '테이블에 자유롭게 내려놓기'],
  ['앞면 더블클릭', '카드를 크게 읽기'],
  ['Space / Alt 누르는 동안', '현재 면 잠깐 확대 — 뒷면은 그대로'],
  ['우클릭 · Shift+F10', '대상 조작 메뉴'],
  ['F · R · G', '뒤집기 · 섞기 · 선택한 묶음 쌓기'],
  ['Ctrl/⌘+Z · Ctrl/⌘+Shift+Z', '되돌리기 · 다시 하기'],
  ['Esc', '드래그 취소 · 메뉴 닫기 · 선택 해제'],
  ['방향키', '선택한 카드 조금씩 이동'],
] as const
