import { Icon } from './Icon'
import { Link, NavLink } from 'react-router'
import type { ComponentProps } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'choice'
export type ButtonSize = 'regular' | 'compact'

/** Native button semantics, including refs, popovers, pressed state and menu roles. */
export function Button({ variant = 'secondary', size = 'regular', className = '', type = 'button', ...props }: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button {...props} type={type} className={`ui-button ${className}`} data-variant={variant} data-size={size} />
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input {...props} className={`ui-field ${className}`} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select {...props} className={`ui-field ${className}`} />
}

/** Route navigation keeps link semantics and shares the control appearance. */
export function ActionLink({ variant = 'secondary', size = 'regular', className = '', ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link {...props} className={`ui-button ${className}`} data-variant={variant} data-size={size} />
}

export function NavigationLink({ className = '', ...props }: Omit<ComponentProps<typeof NavLink>, 'className'> & { className?: string }) {
  return <NavLink {...props} className={`ui-button ${className}`} data-variant="ghost" data-size="compact" />
}

/** Same control appearance for in-page navigation, retaining native anchors. */
export function Anchor({ variant = 'secondary', size = 'regular', className = '', ...props }: ComponentProps<'a'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <a {...props} className={`ui-button ${className}`} data-variant={variant} data-size={size} />
}

/** Native disclosure semantics; the caller owns optional URL-backed open state. */
export function Disclosure({ className = '', ...props }: ComponentProps<'details'>) {
  return <details {...props} className={`ui-disclosure ${className}`} />
}

export function DisclosureSummary({ className = '', children, ...props }: ComponentProps<'summary'>) {
  return <summary {...props} className={`ui-disclosure__summary ${className}`}><Icon name="chevronRight" className="ui-disclosure__chevron" /><span>{children}</span></summary>
}
