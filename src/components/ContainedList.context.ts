import type { InjectionKey, Ref } from 'vue'

/**
 * The list's `wrap`, read by each `NbContainedListItem` as its default. An
 * item outside a list reads nothing and keeps one line per title.
 */
export const NB_CONTAINED_LIST_WRAP: InjectionKey<Ref<boolean>> = Symbol(
  'nb-contained-list-wrap',
)
