import { inject, onBeforeUnmount, watch, type Ref } from 'vue'
import type { IMenuContext } from '../components/Menu.d'

/**
 * Tells an enclosing NbMenu that a popover drawn outside it still belongs to
 * it.
 *
 * NbSelect's list and NbDatePicker's calendar are teleported to the body, so
 * they are not inside the menu's element. A menu that holds a form (a filter
 * panel, a quick edit) took a press on one of their options as a press
 * outside, closed on mousedown, and unmounted the field before the click
 * that picks the option ever arrived: the pick was lost. NbSubmenu already
 * registers its list this way. Outside a menu this does nothing.
 */
export function useMenuSurface(el: Ref<HTMLElement | null>): void {
  const menu = inject<IMenuContext | null>('nb-menu', null)
  if (!menu) return
  watch(el, (next, previous) => {
    if (previous) menu.unregisterSurface(previous)
    if (next) menu.registerSurface(next)
  })
  onBeforeUnmount(() => {
    if (el.value) menu.unregisterSurface(el.value)
  })
}
