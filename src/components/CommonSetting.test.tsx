import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { commonSetting } from '../scenario/load'
import { CommonSetting } from './CommonSetting'

describe('공통 설정', () => {
  it('사건 당일의 상세 통행 취합본을 모두에게 공개한다', () => {
    const html = renderToStaticMarkup(<CommonSetting document={commonSetting} />)

    expect(html).toContain('사건 당일 왕궁 통행 취합본')
    expect(html).toContain('마르타가 왕비전에서 약제실로 이동했다')
    expect(html).toContain('니콜은 카시안의 방에서 답신 첫 줄을 받아 적고')
    expect(html).toContain('이름 부분만 칼로 긁고 물로 문지른 흔적')
    expect(html).toContain('다음 두 줄은 젖은 천으로 문지른 듯 번져')
    expect(html).toContain('“…구두 명령 수령”이라는 눌린 자국')
    expect(html).toContain('22시 58분 로웬의 보안 점검 명령')
    expect(html).toContain('23시 5분 하르트가 서재에서 아드리안을 발견')
  })

  it('모든 플레이어가 알아야 할 사건과 새벽의 시한을 보여준다', () => {
    const html = renderToStaticMarkup(<CommonSetting document={commonSetting} />)

    for (const text of ['왕세자의 죽음', '사건의 밤', '왕좌의 문제', '귀족평의회', '세 번의 재판']) {
      expect(html).toContain(text)
    }
  })

  it('조사로 밝혀야 하는 비밀을 확정 사실로 노출하지 않는다', () => {
    const html = renderToStaticMarkup(<CommonSetting document={commonSetting} />)

    expect(html).not.toContain('카시안의 친부')
    expect(html).not.toContain('독살을 지시')
    expect(html).not.toContain('경비를 철수시킨 사람은 로웬')
  })

  it('개인 진실 공개와 다섯 축 최종 고발 절차를 안내한다', () => {
    const html = renderToStaticMarkup(<CommonSetting document={commonSetting} />)
    expect(html).toContain('개인 진실 I은 첫 조사 전에')
    expect(html).toContain('개인 진실 III')
    expect(html).toContain('사망 구간·다른 위해의 배제·현장 접근·물리적 흔적·알리바이 검증')
    expect(html).toContain('동수이면 경비 책임자이자 조사자인 로웬')
  })
})
