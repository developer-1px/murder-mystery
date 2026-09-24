// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { characterSettings } from '../scenario/load'
import { CharacterSettings } from './CharacterSettings'
import { MemoryRouter, Route, Routes } from 'react-router'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(() => root.render(<MemoryRouter initialEntries={['/characters']}><Routes><Route path="/characters/:characterId?" element={<CharacterSettings settings={characterSettings} />} /></Routes></MemoryRouter>))
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('비공개 인물 설정서', () => {
  it('선택 전에는 어떤 인물의 비밀도 보여주지 않는다', () => {
    expect(host.textContent).toContain('자신이 맡은 인물만 선택하십시오')
    expect(host.textContent).not.toContain('당신은 분노하여 독살을 명령')
    expect(host.textContent).not.toContain('카시안은 당신의 친아들')
  })

  it('선택한 한 인물의 설정만 보여주고 다시 닫는다', async () => {
    const queen = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('엘레노라 왕비'))!
    await act(() => queen.click())

    expect(host.textContent).toContain('당신은 분노하여 독살을 명령')
    expect(host.textContent).not.toContain('카시안은 당신의 친아들')

    const close = [...host.querySelectorAll('a')].find((button) => button.textContent === '설정서 닫기')!
    await act(() => close.click())
    expect(host.textContent).not.toContain('당신은 분노하여 독살을 명령')
  })

  it('베네딕트는 입을 막아 제압한 뒤 상태를 확인하지 않고 떠난 것으로 기억한다', async () => {
    const benedict = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('베네딕트 재상'))!
    await act(() => benedict.click())

    expect(host.textContent).toContain('한 손으로 그의 입을 막고 다른 팔로 몸을 눌렀다')
    expect(host.textContent).toContain('맥박과 호흡을 제대로 확인하지 않았다')
    expect(host.textContent).not.toContain('그의 목을 눌렀다')
    expect(host.textContent).toContain('카시안은 선왕과 엘레노라 사이에서 태어난 왕자라고 당신은 믿고 있다')
    expect(host.textContent).not.toContain('카시안은 당신의 친아들')
    expect(host.textContent).toContain('왕국이 새벽을 왕 없이 맞게 하지 마라')
  })

  it('로웬은 은폐 뒤 뜻밖에 수사 책임자가 되어 자신의 거짓 기록을 수사한다', async () => {
    const rowen = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('로웬 근위대장'))!
    await act(() => rowen.click())

    expect(host.textContent).toContain('마구간의 말 대여표, 성문의 종 시각, 의무실 접수부')
    expect(host.textContent).toContain('병사는 복직했고 상관은 지휘권을 잃었다')
    expect(host.textContent).toContain('다른 사람이 정식 조사를 맡을 것이라고 생각')
    expect(host.textContent).toContain('임시 수사 책임자로 지명')
    expect(host.textContent).toContain('완전한 범행 서사')
    expect(host.textContent).toContain('다른 누구와 마찬가지로 확인 전에는 범인이라고 단정할 수 없다')
    expect(host.textContent).not.toContain('베네딕트가 당신의 은폐')
    expect(host.textContent).not.toContain('사람을 부르지 않은 채 나왔다')
  })

  it('카시안은 비밀 만남을 공개해야 이사벨의 알리바이를 증명할 수 있다', async () => {
    const cassian = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('카시안 왕자'))!
    await act(() => cassian.click())

    expect(host.textContent).toContain('당신이 나가려 할 때 아드리안은 분명히 ‘꺼져’라고 말했다')
    expect(host.textContent).toContain('이사벨은 22시 39분부터 22시 52분까지 당신과 함께 있었다')
    expect(host.textContent).toContain('비밀 만남을 밝혀 알리바이를 증명할지')
    expect(host.textContent).not.toContain('혹시 자신이 형을 죽인 것인가')
  })

  it('이사벨에게 카시안의 왕비와 아이의 계승이라는 서로 다른 승리 경로를 보여준다', async () => {
    const isabel = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('이사벨 왕세자비'))!
    await act(() => isabel.click())

    expect(host.textContent).toContain('카시안이 즉위하고 당신과 아이를 공식 보호한다')
    expect(host.textContent).toContain('카시안이 제외되고 당신의 아이가 후계자로 인정된다')
    expect(host.textContent).toContain('카시안에게 결단을 요구한다')
    expect(host.textContent).toContain('아이를 위한 자리를 요구한다')
    expect(host.textContent).toContain('카시안에게 자신과 아이를 두고 어떤 선택을 할 것인지 공개적으로 묻는다')
    expect(host.textContent).not.toContain('아이의 계승권을 청원한다')
    expect(host.textContent).not.toContain('카시안이 즉위할 경우')
  })
})
