import type { InjectionKey, Ref } from 'vue'
import type { TAccordionAlign, TAccordionSize } from './Accordion.d'

/**
 * What an `NbAccordionItem` needs from the `NbAccordion` around it.
 *
 * Lives in a `.ts` rather than the `.d.ts` beside it because `Symbol()` is a
 * runtime value, matching how the blueprint does it.
 */
export interface IAccordionContext {
  /** Ids currently open. */
  open: Ref<string[]>
  /** Whether more than one item may be open. */
  multiple: Ref<boolean>
  align: Ref<TAccordionAlign>
  size: Ref<TAccordionSize>
  flush: Ref<boolean>
  headingLevel: Ref<number>
  /** Toggle one item, honouring `multiple`. */
  toggle: (id: string) => void
  /** Register an item so the group can drive roving keyboard focus over the
   *  headers in DOM order. Returns an unregister function. */
  register: (id: string, el: () => HTMLElement | null) => () => void
  /** Move focus to the header before or after `id`, wrapping. `to` may also be
   *  an end of the list. */
  focusSibling: (id: string, to: 'prev' | 'next' | 'first' | 'last') => void
}

export const NB_ACCORDION_CONTEXT: InjectionKey<IAccordionContext> = Symbol(
  'NB_ACCORDION_CONTEXT',
)
