import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronRight, ChevronUp, Copy, Crown, History, Info, LockKeyhole, Moon, Pause, Play, Redo2, Search, Shield, Undo2, X, ZoomIn } from 'lucide-react'

/** Approved SVG set. Only imported icons are bundled; no remote icon requests. */
const icons = {
  arrowDown: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, arrowUp: ArrowUp,
  arrowUpRight: ArrowUpRight, check: Check, chevronDown: ChevronDown,
  chevronRight: ChevronRight, chevronUp: ChevronUp, copy: Copy, crown: Crown,
  history: History, info: Info, lock: LockKeyhole, moon: Moon, pause: Pause,
  play: Play, redo: Redo2, search: Search, shield: Shield, undo: Undo2,
  close: X, zoomIn: ZoomIn,
} as const
export type IconName = keyof typeof icons
export const iconNames = Object.keys(icons) as IconName[]

/** Label the button for icon-only actions. Adjacent-text icons remain decorative. */
export function Icon({ name, size = 18, label, className = '' }: { name: IconName; size?: number | string; label?: string; className?: string }) {
  const Glyph = icons[name]
  return <Glyph size={size} strokeWidth={1.75} className={`ui-icon ${className}`} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} focusable="false" />
}
