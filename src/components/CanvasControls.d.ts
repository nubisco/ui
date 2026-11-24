import type { TToolbarSize } from './Toolbar.context'

/** Where a set of canvas controls floats, inside the canvas it sits on. */
export type TCanvasControlsPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ICanvasControlsProps {
  /**
   * What the controls act on ("Map controls"). The `aria-label` of the
   * `role="toolbar"` element, so a screen reader names the set on the way in.
   */
  label: string
  /** Corner or edge the controls float at. Defaults to `bottom-right`. */
  position?: TCanvasControlsPosition
  /** Stack direction of the groups and of the controls in each group. */
  orientation?: 'horizontal' | 'vertical'
  /**
   * Height of every button inside that has no size of its own, through the
   * toolbar context: `sm` 32px (the default), `md` 40px, `lg` 48px, `xl` 64px.
   */
  size?: TToolbarSize
}

export interface ICanvasControlsGroupProps {
  /**
   * Names the group (`role="group"`) when a set holds more than one, such as
   * "Zoom" and "Align". Leave it out for a single group.
   */
  label?: string
}
