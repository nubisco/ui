interface IFieldProps {
  /** Label text. Omit and use the `#label` slot for a custom label. */
  label?: string
  /** Helper text shown under the control, muted. */
  hint?: string
  /**
   * `row` (default): label sits beside the control, sharing the container's
   * label-column spine so every field lines up. `stack`: label on its own
   * line above a full-width control.
   */
  orientation?: 'row' | 'stack'
  /**
   * Vertical alignment of the label against the control. `center` (default)
   * suits single-line controls; `start` top-aligns the label against a tall
   * control such as a multiline text area.
   */
  align?: 'center' | 'start'
  /**
   * `fill` (default): the control fills the value column so every field's
   * value shares one right edge. `fit`: the control shrinks to its content and
   * the label takes the remaining width — for a small control such as a switch,
   * so its short label can run wide instead of being clipped to the column.
   */
  control?: 'fill' | 'fit'
  /**
   * Id of the control the label points at. Defaults to an auto-generated id
   * that is also exposed to the default slot as `{ id }` — bind it to the
   * control for a proper label/control association.
   */
  labelFor?: string
}

export { IFieldProps }
