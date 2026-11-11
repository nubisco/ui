import type { InjectionKey, Ref } from 'vue'

/** The heights a toolbar comes in: 32, 40, 48 and 64px, as Carbon's. */
export type TToolbarSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * An NbToolbar, as seen by the controls inside it.
 *
 * The toolbar has one height and every button in it takes that height, so a
 * strip of tools lines up with the table row or panel header it belongs to
 * without each button being given a size by hand. NbButton reads `size` when
 * it was not given one of its own. `flush` tells it to drop its corners and
 * fill the strip edge to edge, which is what puts the last button flush in
 * the toolbar's corner.
 *
 * NbMenu provides `null` under it, so a button inside a menu opened from a
 * toolbar is sized as an ordinary button again.
 */
export interface IToolbarContext {
  size: Readonly<Ref<TToolbarSize>>
  flush: Readonly<Ref<boolean>>
}

export const NB_TOOLBAR: InjectionKey<IToolbarContext | null> = Symbol.for(
  '@nubisco/ui:toolbar',
)
