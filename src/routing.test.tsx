// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkbenchRoutes } from './App'
import { characterSettings, commonSetting, issueGroups, scenario } from './scenario/load'
import { sectionId } from './routing'
import { tableStorageKey } from './tableHistory'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
let router: ReturnType<typeof createMemoryRouter>
const query = <T extends HTMLElement = HTMLElement>(selector: string) => host.querySelector<T>(selector)!
const address = () => router.state.location.pathname + router.state.location.search + router.state.location.hash
const click = async (element: HTMLElement) => { await act(async () => { element.click() }) }
const visit = async (path: string) => { await act(async () => { await router.navigate(path) }) }
const mount = async (path: string) => {
  router = createMemoryRouter([{ path: '*', element: <WorkbenchRoutes /> }], { initialEntries: [path] })
  await act(async () => { root.render(<RouterProvider router={router} />) })
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', vi.fn())
  HTMLElement.prototype.scrollIntoView = vi.fn()
  Object.assign(HTMLDialogElement.prototype, { showModal(this: HTMLDialogElement) { this.open = true }, close(this: HTMLDialogElement) { if (!this.open) return; this.open = false; queueMicrotask(() => this.dispatchEvent(new Event('close'))) } })
  localStorage.clear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => { await act(() => root.unmount()); router?.dispose(); host.remove(); vi.unstubAllGlobals() })

describe('페이지와 세부 상태 딥링크', () => {
  it('다섯 페이지는 실제 링크이며 뒤로/앞으로 이동한다', async () => {
    await mount('/setting')
    const links = [...host.querySelectorAll('.workspace-tabs a')]
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/setting', '/characters', '/table', '/library', '/issues', '/timeline', '/deduction'])
    await click(links[1] as HTMLElement)
    expect(address()).toBe('/characters')
    await act(async () => { await router.navigate(-1) })
    expect(address()).toBe('/setting')
    expect(query('.common-setting')).not.toBeNull()
    await act(async () => { await router.navigate(1) })
    expect(query('.character-settings--locked')).not.toBeNull()
  })

  it('공통 설정 세부 항목과 인물의 관계·목표를 직접 연다', async () => {
    const section = commonSetting.sections.find((item) => item.entries?.length)!
    const id = sectionId(`setting-${section.id}`, section.entries![0].title)
    await mount(`/setting#${encodeURIComponent(id)}`)
    expect(document.getElementById(id)).not.toBeNull()
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
    await visit(`/characters/${characterSettings[0].id}#objective`)
    expect(query('#objective').textContent).toContain(characterSettings[0].objective)
    expect(query('.character-setting__hero h2').textContent).toBe(characterSettings[0].name)
    expect(host.querySelectorAll('.character-setting__hero')).toHaveLength(1)
    expect(host.querySelectorAll('a[href^="#relation-"]').length).toBeGreaterThan(0)
  })

  it('라이브러리의 카드·검색·분류·설계 정보 주소를 복원하고 닫아도 필터를 보존한다', async () => {
    const card = scenario.cards.find((item) => item.kind === 'memory')!
    await mount(`/library/cards/${card.id}?kind=memory&q=${encodeURIComponent(card.title)}&details=1`)
    expect(query('.card-reader[open] h3').textContent).toBe(card.title)
    expect(document.title).toBe(`${card.title} · 왕관재판`)
    expect(query('.card-reader__metadata').hasAttribute('open')).toBe(true)
    expect(query<HTMLInputElement>('.library__search input').value).toBe(card.title)
    await click(query('.card-reader__close'))
    expect(router.state.location.pathname).toBe('/library')
    expect(new URLSearchParams(router.state.location.search).get('q')).toBe(card.title)
    expect(query('.card-reader[open]')).toBeNull()
    await act(async () => { await router.navigate(-1) })
    expect(query('.card-reader[open] h3').textContent).toBe(card.title)
  })

  it('카드 상세 모달을 열고 닫을 때 현재 페이지의 스크롤 위치를 유지한다', async () => {
    const card = scenario.cards.find((item) => item.kind === 'memory')!
    await mount('/library?kind=memory')
    vi.mocked(window.scrollTo).mockClear()
    await click(query(`a[href^="/library/cards/${card.id}"]`))
    expect(query('.card-reader[open] h3').textContent).toBe(card.title)
    expect(window.scrollTo).not.toHaveBeenCalled()
    await click(query('.card-reader__close'))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('뒷면 모드에서 이미 펼친 카드 목록과 묶음을 복원한다', async () => {
    const card = scenario.cards.find((item) => item.kind === 'rumor')!
    await mount(`/library?group=all-rumors&side=back&revealed=${card.id}`)
    expect(host.querySelectorAll('.library-group')).toHaveLength(1)
    expect(host.querySelectorAll('.library .card:not(.card--back)')).toHaveLength(1)
    expect(query('.library .card:not(.card--back)').textContent).toContain(card.title)
    expect(query<HTMLSelectElement>('[aria-label="카드 묶음"]').value).toBe('all-rumors')
  })

  it('쟁점의 특정 정보 조각과 연결 카드를 같은 주소에서 연다', async () => {
    const group = issueGroups.groups[0]
    const fragment = group.fragments[0]
    const cardId = fragment.cardIds[0]
    await mount(`/issues/${group.id}/cards/${cardId}#fragment-${fragment.id}`)
    expect(query('.issue-detail__header h3').textContent).toBe(group.title)
    expect(query('.card-reader[open] h3').textContent).toBe(scenario.cards.find((card) => card.id === cardId)!.title)
    await click(query('.card-reader__close'))
    expect(address()).toBe(`/issues/${group.id}#fragment-${fragment.id}`)
  })

  it.each(['/no-such-page', '/characters/missing', '/library/cards/missing', '/library?group=missing', '/library?profile=missing', '/library?revealed=missing', '/issues/missing', '/table/missing/steps/0', '/table/main/steps/-1', '/table/main/steps/0?inspect=missing'])('잘못된 주소를 다른 데이터로 조용히 바꾸지 않는다: %s', async (path) => {
    await mount(path)
    expect(query('[role="alert"]').textContent).toContain('이 주소를 열 수 없습니다')
    expect(address()).toBe(path)
  })

  it('후보 보기 URL은 배치를 변경하지 않고 취소와 뒤로 가기로 복원한다', async () => {
    await mount('/table/main/steps/0?pile=deck-memory&draw=3')
    expect(host.querySelectorAll('.card-choice .card')).toHaveLength(3)
    expect(query('.table-history summary').textContent).toBe('기록 · 0')
    await click(query('.card-choice header .dialog-actions > button'))
    expect(query('.card-choice')).toBeNull()
    expect(address()).toBe('/table/main/steps/0')
    await act(async () => { await router.navigate(-1) })
    expect(host.querySelectorAll('.card-choice .card')).toHaveLength(3)
  })

  it('한 장 선택은 새 기록·손패 확대 URL로 이어지고 재접속해도 복원한다', async () => {
    await mount('/table/main/steps/0?pile=deck-memory&draw=2')
    const title = query('.card-choice .card h3').textContent
    await click(query('.card-choice .card'))
    expect(router.state.location.pathname).toBe('/table/main/steps/1')
    expect(query('.card-reader[open] h3').textContent).toBe(title)
    expect(new URLSearchParams(router.state.location.search).has('inspect')).toBe(true)
    const deepLink = address()
    expect(localStorage.getItem(tableStorageKey(scenario.meta.id))).toContain('snapshots')
    await visit('/setting')
    await visit(deepLink)
    expect(query('.card-reader[open] h3').textContent).toBe(title)
    await click(query('.card-reader__close'))
    await visit('/table/main/steps/0')
    expect(host.querySelectorAll('.table-piece')).toHaveLength(4)
    await click(query('[data-pile-id="deck-memory"] .card'))
    expect(router.state.location.pathname).not.toContain('/table/main/')
    expect(query('.table-history summary').textContent).toBe('기록 · 1')
    const saved = JSON.parse(localStorage.getItem(tableStorageKey(scenario.meta.id))!)
    expect(saved.branches).toHaveLength(2)
    expect(saved.branches[0].snapshots).toHaveLength(2)
  })

  it('조작법 주소로 바로 열고 닫는다', async () => {
    await mount('/table/main/steps/0?help=1&history=1')
    expect(query('.table-help[open]')).not.toBeNull()
    expect(query('.table-history[open]')).not.toBeNull()
    await click(query('[aria-label="조작법 닫기"]'))
    expect(new URLSearchParams(router.state.location.search).has('help')).toBe(false)
  })

  it('손상된 저장 기록은 경고하고 덮어쓰지 않는다', async () => {
    localStorage.setItem(tableStorageKey(scenario.meta.id), '{broken')
    await mount('/table/main/steps/0')
    expect(query('[role="alert"]').textContent).toContain('기존 저장 데이터는 덮어쓰지 않았습니다')
    expect(localStorage.getItem(tableStorageKey(scenario.meta.id))).toBe('{broken')
    expect(query('.table-surface')).toBeNull()
  })

  it('덱에서 꺼내 드래그하는 임시 카드는 놓기 전 URL에 기록하지 않는다', async () => {
    await mount('/table/main/steps/0')
    const surface = query('.table-surface')
    Object.assign(surface, { setPointerCapture: vi.fn(), hasPointerCapture: () => false, releasePointerCapture: vi.fn() })
    const pointer = async (target: HTMLElement, type: string, x: number, y: number) => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      await act(() => { target.dispatchEvent(event) })
    }
    await pointer(query('[data-pile-id="deck-memory"] .card'), 'pointerdown', 100, 100)
    await pointer(surface, 'pointermove', 300, 400)
    expect(query('.table-piece--dragging')).not.toBeNull()
    expect(new URLSearchParams(router.state.location.search).getAll('selected')).toEqual(['deck-memory'])
    expect(query('[role="alert"]')).toBeNull()
    await pointer(surface, 'pointerup', 300, 400)
    expect(router.state.location.pathname).toBe('/table/main/steps/1')
    expect(host.querySelectorAll('.table-piece')).toHaveLength(5)
    expect(query('.table-piece--selected .card--back')).not.toBeNull()
  })
})
