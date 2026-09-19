import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Card } from '../domain/types'
import { CardView } from './CardView'

const card: Card = { id: 'secret-id', title: '숨긴 제목', kind: 'memory', text: '숨긴 본문', tags: ['숨긴 태그'] }

describe('카드 앞뒤', () => {
  it('뒷면은 제목·본문·태그·ID를 마크업과 접근성 이름에 남기지 않는다', () => {
    const html = renderToStaticMarkup(<CardView card={card} faceDown backLabel="기억 카드 1 펼치기" />)
    for (const secret of [card.id, card.title, card.text, ...card.tags]) expect(html).not.toContain(secret)
    expect(html).toContain('기억 카드 1 펼치기')
    expect(html).toContain('card--back')
  })

  it('앞면은 본문을 보여주고 설계용 ID는 제외한다', () => {
    const html = renderToStaticMarkup(<CardView card={card} />)
    for (const content of [card.title, card.text, ...card.tags]) expect(html).toContain(content)
    expect(html).not.toContain(card.id)
    expect(html).toContain('<article')
    expect(html).not.toContain('card--back')
  })
})
