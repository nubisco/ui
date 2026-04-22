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
}

export interface IMenuItemProps {
  /** Phosphor icon name */
  icon?: string
  /** Display label */
  label: string
  /** Keyboard shortcut display text (e.g. "Cmd+C"), display only */
  shortcut?: string
  /** Disables the item */
  disabled?: boolean
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
  icon?: string
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
}
