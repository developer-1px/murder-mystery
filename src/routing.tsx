import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useInRouterContext, useLocation, useNavigate } from 'react-router'

export const segment = encodeURIComponent
export const sectionId = (prefix: string, title: string) => `${prefix}-${title.trim().replace(/\s+/g, '-')}`
export function href(path: string, query: URLSearchParams, hash = '') {
  return path + (query.size ? `?${query}` : '') + hash
}

export function useQueryState() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const update = (patch: Record<string, string | string[] | null>, replace = false) => {
    const next = new URLSearchParams(location.search)
    for (const [key, value] of Object.entries(patch)) {
      next.delete(key)
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item))
      else if (value !== null && value !== '') next.set(key, value)
    }
    const to = href(location.pathname, next, location.hash)
    if (to !== location.pathname + location.search + location.hash) void navigate(to, { replace })
  }
  return { params, update }
}

export function SectionLink({ id, children }: { id: string; children: ReactNode }) {
  return <a className="section-link" href={`#${segment(id)}`}>{children}<span aria-hidden="true" /></a>
}

export function MissingRoute({ message = '존재하지 않는 페이지 주소입니다.', to = '/table', label = '카드 테이블로' }: { message?: string; to?: string; label?: string }) {
  return <section className="route-not-found" role="alert"><h2>이 주소를 열 수 없습니다</h2><p>{message}</p><Link to={to}>{label}</Link></section>
}

function RouteCopyButton() {
  const location = useLocation()
  const [copied, setCopied] = useState<string>()
  const address = location.pathname + location.search + location.hash
  return <div className="route-tools">
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(new URL(address, window.location.origin).href); setCopied(address) }
      catch { setCopied('failed') }
    }}>{copied === address ? '복사됨 ✓' : '현재 화면 링크 복사'}</button>
    <span role="status">{copied === 'failed' ? '주소창의 URL을 복사해 주세요.' : ''}</span>
  </div>
}

export function CopyLinkButton() {
  return useInRouterContext() ? <RouteCopyButton /> : null
}

export function RouteTools() {
  const location = useLocation()
  const previousLocation = useRef<{ pathname: string; hash: string } | undefined>(undefined)
  useEffect(() => {
    const overlayRoot = (pathname: string) => pathname
      .replace(/^(\/library)\/cards\/[^/]+$/, '$1')
      .replace(/^(\/issues\/[^/]+)\/cards\/[^/]+$/, '$1')
      .replace(/^(\/timeline)\/cards\/[^/]+$/, '$1')
    const previous = previousLocation.current
    const keepsPagePosition = previous && overlayRoot(previous.pathname) === overlayRoot(location.pathname) && previous.hash === location.hash
    previousLocation.current = { pathname: location.pathname, hash: location.hash }
    if (keepsPagePosition) return
    if (location.hash) {
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' }) } catch { /* 잘못된 인코딩은 콘텐츠를 바꾸지 않는다. */ }
    } else window.scrollTo?.(0, 0)
  }, [location.pathname, location.hash])
  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      const heading = (document.querySelector('dialog[open] h3, dialog[open] h2') ?? document.querySelector('main h2'))?.textContent
      document.title = heading ? `${heading} · 왕관재판` : '카드 테이블 · 왕관재판'
    })
    return () => { active = false }
  }, [location.pathname, location.search])
  return <CopyLinkButton />
}
