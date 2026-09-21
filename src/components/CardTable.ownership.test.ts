import { readFileSync, existsSync } from 'node:fs'
import { expect, it } from 'vitest'

it('게임 테이블은 카드 UX 정본을 우회하지 않는다', () => {
  const source = readFileSync(new URL('./PlayTablePage.tsx', import.meta.url), 'utf8')
  expect(source).toContain("from './CardTable'")
  expect(source).toContain('<CardTable ')
  expect(source).toContain('<CardReader ')
  for (const displaced of ['function CardDetail', 'function Deck(', 'play-choice-card', 'play-hand-card', 'onPointerDown=', 'onPointerMove=', 'layoutId=', 'showModal(']) expect(source).not.toContain(displaced)
  expect(existsSync(new URL('./CardChoice.tsx', import.meta.url))).toBe(false)
})
