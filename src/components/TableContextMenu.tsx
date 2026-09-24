import { Button } from '../design-system/controls'
import { useLayoutEffect, useRef, useState } from 'react'

export interface TableMenuItem {
  label: string
  shortcut?: string
  disabled?: boolean
  run: () => void
}

export function TableContextMenu({ x, y, items, onClose }: { x: number; y: number; items: TableMenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })
  useLayoutEffect(() => {
    const menu = ref.current!
    const bounds = menu.getBoundingClientRect()
    setPosition({ x: Math.max(8, Math.min(x, innerWidth - bounds.width - 8)), y: Math.max(8, Math.min(y, innerHeight - bounds.height - 8)) })
    menu.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [x, y])

  return <div className="table-menu-layer" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }} onContextMenu={(event) => { event.preventDefault(); onClose() }}>
    <div ref={ref} role="menu" aria-label="카드 조작" className="table-menu ui-panel" data-elevation="floating" style={{ left: position.x, top: position.y }} onKeyDown={(event) => {
      const buttons = [...ref.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') onClose()
    }}>
      {items.map((item) => <Button variant="ghost" type="button" role="menuitem" tabIndex={-1} aria-disabled={item.disabled || undefined} key={item.label} onClick={() => { if (!item.disabled) { onClose(); item.run() } }}>
        <span>{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}
      </Button>)}
    </div>
  </div>
}
