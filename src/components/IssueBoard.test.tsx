// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { issueGroups, scenario } from '../scenario/load'
import { IssueBoard } from './IssueBoard'
import { MemoryRouter, Route, Routes } from 'react-router'

let root: Root
let host: HTMLDivElement

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) { this.open = true },
    close(this: HTMLDialogElement) { this.open = false },
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(() => root.render(<MemoryRouter initialEntries={['/issues']}><Routes><Route path="/issues/:groupId?" element={<IssueBoard scenario={scenario} document={issueGroups} />} /></Routes></MemoryRouter>))
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('쟁점 연결 보기', () => {
  it('선택한 쟁점의 정보 조각과 연결 카드를 함께 보여준다', async () => {
    expect(host.textContent).toContain('독과 술병의 이동')
    expect(host.textContent).toContain('약제가 반출되었다')
    expect(host.textContent).toContain('약제 반출 장부')

    const next = [...host.querySelectorAll('a')].find((button) => button.textContent?.includes('로웬과 비워진 경비'))!
    await act(() => next.click())

    expect(next.getAttribute('aria-current')).toBe('page')
    expect(host.textContent).toContain('서재 근무일지에는 덧쓴 흔적이 있다')
    expect(host.textContent).toContain('근무일지 밑의 흡묵지')
    expect(host.textContent).not.toContain('약제가 반출되었다')
  })
})
