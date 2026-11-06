import type { InjectionKey } from 'vue'

/**
 * A header's actions slot, as seen by the buttons inside it.
 *
 * The emphasis ladder allows one filled primary button per header: the page
 * header's one, or a panel header's one. A filled `primary` NbButton inside a
 * slot that provides this registers itself on mount and unregisters on
 * unmount, so the header can count them without scanning the DOM. The header
 * warns in development when it counts two.
 */
export interface IPrimaryActionScope {
  /** Count one filled primary button. Returns the function that uncounts it. */
  register: () => () => void
}

export const NB_PRIMARY_ACTION_SCOPE: InjectionKey<IPrimaryActionScope | null> =
  Symbol.for('@nubisco/ui:primary-action-scope')
