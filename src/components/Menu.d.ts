import type { TIconSource } from '@/types/Glyph.d'
export type TMenuItemSize = 'xs' | 'sm' | 'md' | 'lg'

export interface IMenuProps {
  /** Controls visibility of the menu */
  open?: boolean
  /** Item height: xs=24, sm=32, md=40, lg=48 */
  size?: TMenuItemSize
  /** Minimum width in px */
  minWidth?: number
  /** Maximum width in px */
  maxWidth?: number
  /**
   * Which edge of the trigger the menu lines up with when it is placed with
   * `setPosition`. `'start'` (the default) puts its left edge under the
   * trigger's left edge, `'end'` its right edge under the trigger's right
   * edge, for a trigger at the end of a row (an overflow menu in a table
   * row or a toolbar corner). Either way it is kept on screen, and it opens
   * above the trigger when there is no room below.
   */
  align?: TMenuAlign
}

export type TMenuAlign = 'start' | 'end'

export interface IMenuItemProps {
  /** Phosphor icon name */
  icon?: TIconSource
  /**
   * A picture drawn in the icon's place, as a small round `NbAvatar`: the face
   * of the person or the logo of the thing the row names. `null` draws the
   * label's initials there, so a list where only some rows carry a picture
   * still lines up. Takes the place of `icon` when set.
   */
  picture?: string | null
  /** Display label */
  label: string
  /** Keyboard shortcut display text (e.g. "Cmd+C"), display only */
  shortcut?: string
  /** Disables the item */
  disabled?: boolean
  /**
   * Why the item is disabled ("Paid invoices cannot be deleted"). Printed
   * as a muted second line under the label and named as the item's
   * description (`aria-describedby`), and the arrow keys still stop on the
   * item, so it explains itself on a pointer, a touch screen, a keyboard and
   * a screen reader alike. It still cannot be chosen. Read only while
   * `disabled`: a disabled item without one is skipped by the arrow keys,
   * as before.
   */
  disabledReason?: string
  /** Renders with danger/destructive styling */
  danger?: boolean
  /** Makes this a checkbox-style selectable item */
  selectable?: boolean
  /** Whether selectable item is checked */
  selected?: boolean
  /** Radio group name, makes item part of a radio group */
  radioGroup?: string
}

export interface ISubmenuProps {
  /** Phosphor icon name */
  icon?: TIconSource
  /** Display label */
  label: string
  /** Disables the submenu trigger */
  disabled?: boolean
}

export interface IMenuBarProps {
  /** Optional max-width constraint */
  maxWidth?: string
}

export interface IMenuContext {
  size: TMenuItemSize
  close: () => void
  highlightedIndex: number
  registerItem: (el: HTMLElement) => number
  unregisterItem: (el: HTMLElement) => void
  /**
   * A submenu's list is teleported to `<body>`, outside the menu element, so
   * the menu is told about it. A press inside a registered surface is not an
   * outside press and does not close the menu.
   */
  registerSurface: (el: HTMLElement) => void
  unregisterSurface: (el: HTMLElement) => void
}
