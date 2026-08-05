/** Background pattern NbBlueprintBackground paints. `'grid'` is a ruled grid
 *  with heavier major lines every few cells, `'lines'` a plain ruled grid,
 *  `'dots'` a dot grid, `'none'` nothing (renders no element). */
export type TBlueprintBackgroundVariant = 'grid' | 'dots' | 'lines' | 'none'

/**
 * Props for `NbBlueprintBackground`, the drop-in canvas backdrop for an
 * `NbBlueprint`. Place it in the blueprint's `#background` slot; it reads the
 * camera from `useBlueprint()` and pans/zooms with the scene, so it needs no
 * wiring from the host. Every visual is themeable per-instance through these
 * props (which map to CSS custom properties), or globally via the
 * `--nb-blueprint-grid-*` custom properties.
 */
export interface IBlueprintBackgroundProps {
  /** Pattern to paint. Default `'dots'`. */
  variant?: TBlueprintBackgroundVariant
  /** Line/dot colour. Any CSS colour. Defaults to
   *  `--nb-blueprint-grid-color`, then the theme border colour. */
  color?: string
  /** Cell spacing in canvas px (the minor grid pitch). Default `24`. */
  gap?: number
  /** Line/dot thickness in px. Default `1`. */
  thickness?: number
  /** Colour of the heavier major lines in the `'grid'` variant. Defaults to
   *  `color`. */
  secondaryColor?: string
  /** Spacing of the major lines in the `'grid'` variant, canvas px. Defaults to
   *  `gap * 5`. */
  secondaryGap?: number
}
