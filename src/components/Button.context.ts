import type { InjectionKey } from 'vue'

/**
 * Where a labelled button puts its label.
 *
 * `start` is the Carbon anatomy, and the default: the label at the left edge,
 * the icon pinned to the right, and room kept for an icon whether or not
 * there is one. It is right for an app, where buttons line up with the
 * fields, rows and panels around them.
 *
 * `center` is for a website: a call to action stands alone in a hero or a
 * card, nothing lines up with its left edge, and an empty icon slot reads as
 * a label pushed off centre. The label is centred, the padding is even, and
 * an icon follows the label rather than sitting at the far edge.
 */
export type TButtonAlign = 'start' | 'center'

/** What every NbButton in the app does unless it says otherwise. */
export interface IButtonDefaults {
  align?: TButtonAlign
}

export const NB_BUTTON_DEFAULTS: InjectionKey<IButtonDefaults> = Symbol.for(
  '@nubisco/ui:button-defaults',
)
