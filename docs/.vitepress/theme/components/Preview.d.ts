export enum PreviewDirection {
  Row = 'row',
  Column = 'col',
}

// ─── Base ─────────────────────────────────────────────────────────────────────

interface PreviewPropBase {
  /** Prop name as it appears on the target component. Used as the key in v-bind. */
  name: string
  /** Human-readable column header. Falls back to `name` when omitted. */
  label?: string
  /** One-liner shown in the component placeholder if availabel */
  placeholder?: string
}

// ─── Concrete variants ────────────────────────────────────────────────────────

/** Renders a text input. Use for any string prop. */
export interface PreviewPropString extends PreviewPropBase {
  type: 'string'
  default?: string
}

/** Renders a text input. Use for CSS color props (hex, rgb, var(…)). */
export interface PreviewPropColor extends PreviewPropBase {
  type: 'color'
  default?: string
}

/** Renders a toggle switch. Use for boolean props. */
export interface PreviewPropBoolean extends PreviewPropBase {
  type: 'boolean'
  default?: boolean
}

/** Renders a number stepper. Use for numeric props. */
export interface PreviewPropNumber extends PreviewPropBase {
  type: 'number'
  default?: number
  min?: number
  max?: number
  step?: number
}

/** Renders a number with a slider. Use for numeric props. */
export interface PreviewPropSlider extends PreviewPropBase {
  type: 'slider'
  default?: number
  min?: number
  max?: number
  step?: number
}

/** Renders a single-select dropdown. Use for props that accept one value from a fixed set. */
export interface PreviewPropSingle extends PreviewPropBase {
  type: 'single'
  /** The list of valid values for this prop. */
  options: Array<{ value: string | number; label: string }>
  default?: string | number
  /** Whether the dropdown shows a clear option. Defaults to true. */
  allowClear?: boolean
}

/** Renders a multi-select dropdown. Use for array props that accept multiple values from a fixed set. */
export interface PreviewPropMulti extends PreviewPropBase {
  type: 'multi'
  /** The list of valid values for this prop. */
  options: Array<{ value: string | number; label: string }>
  default?: Array<string | number>
  /** Whether the dropdown shows a clear option. Defaults to true. */
  allowClear?: boolean
}

// ─── Union ────────────────────────────────────────────────────────────────────

/**
 * One entry in the `availableProps` array passed to `<Preview>`.
 * Use this type to annotate `availableProps` in doc pages so that editors
 * and LLMs understand exactly which fields are required per control type.
 *
 * @example
 * ```ts
 * import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'
 *
 * const availableProps: PreviewPropDef[] = [
 *   { name: 'variant', type: 'single', default: 'primary',
 *     options: [{ value: 'primary', label: 'primary' }, { value: 'secondary', label: 'secondary' }] },
 *   { name: 'disabled', type: 'boolean', default: false },
 *   { name: 'label', type: 'string', default: 'Click me' },
 * ]
 * ```
 */
export type PreviewPropDef =
  | PreviewPropString
  | PreviewPropColor
  | PreviewPropBoolean
  | PreviewPropNumber
  | PreviewPropSlider
  | PreviewPropSingle
  | PreviewPropMulti

// ─── Preview component props ───────────────────────────────────────────────────

export interface PreviewProps {
  demo?: boolean
  themeable?: boolean
  backgroundColor?: string | null
  dir?: PreviewDirection
  raw?: boolean
  constrained?: boolean
  props?: PreviewPropDef[]
  styleGrid?: boolean
  propsPosition?: 'top' | 'bottom'
}
