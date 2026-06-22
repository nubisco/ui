/** Corner a floating blueprint chrome element docks to. */
export type TBlueprintChromePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface IBlueprintControlsProps {
  /** Corner the toolbar floats in. */
  position?: TBlueprintChromePosition
  /** Stack direction. */
  orientation?: 'horizontal' | 'vertical'
  /** When to show the toolbar: always, or only while the blueprint is in edit
   *  mode (`editable` prop / `isEditMode`). */
  show?: 'always' | 'edit'
  /** Show the auto-layout button. */
  autoLayout?: boolean
  /** Show the alignment/distribution cluster (appears when 2+ cards are
   *  selected). */
  alignment?: boolean
}
