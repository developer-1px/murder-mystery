// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  window.history.replaceState({}, '', '/')
  localStorage.clear()
  vi.stubGlobal('scrollTo', vi.fn())
  Object.assign(HTMLDialogElement.prototype, {
    showModal(this: HTMLDialogElement) { this.open = true },
    close(this: HTMLDialogElement) { this.open = false },
  })
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(() => root.render(<App />))
})

afterEach(async () => {
  await act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('작업 공간 메뉴', () => {
  it('기존 카드 테이블에서 공통 설정으로 이동한다', async () => {
    expect(host.querySelector('.table-surface')).not.toBeNull()

    const settingButton = [...host.querySelectorAll('a')]
      .find((button) => button.textContent === '공통 설정')!
    await act(() => settingButton.click())

    expect(settingButton.classList.contains('active')).toBe(true)
    expect(host.querySelector('.common-setting h2')?.textContent).toBe('왕세자의 죽음')
    expect(host.querySelector('.table-surface')).toBeNull()
  })
})
