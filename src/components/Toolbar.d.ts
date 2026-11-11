import type { TToolbarSize } from './Toolbar.context'

interface IToolbarProps {
  /**
   * What the toolbar acts on ("Invoice tools", "Formatting"). Required: it
   * is the `aria-label` of the `role="toolbar"` element, which a screen
   * reader announces on the way in.
   */
  label: string
  /**
   * The strip's height, shared by every button in it that has no size of
   * its own: `sm` 32px, `md` 40px, `lg` 48px (the default) and `xl` 64px.
   * Match it to the table row or header the toolbar belongs to.
   */
  size?: TToolbarSize
  /**
   * No gaps, square corners, every button the full height of the strip:
   * Carbon's data table toolbar, with the `end` slot's primary flush in the
   * corner. Off, the buttons keep their corners and an 8px gap.
   */
  flush?: boolean
}

export type { IToolbarProps, TToolbarSize }
