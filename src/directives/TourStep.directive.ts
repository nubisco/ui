import type { App, DirectiveBinding } from 'vue'
import { TOUR_STEP_ATTRIBUTE } from '@/utils/tourTarget.helper'

/**
 * `v-nb-tour-step="'sidebar-nav'"` tags an element as a walkthrough target.
 *
 * It is deliberately thin — all it does is stamp `data-nb-tour-step` — so a
 * host that cannot use a directive (server-rendered markup, a third-party
 * component that does not forward directives) can write the attribute by hand
 * and get identical behaviour.
 */
function applyId(el: HTMLElement, binding: DirectiveBinding<unknown>) {
  const id = binding.value
  if (id === undefined || id === null || id === '') {
    el.removeAttribute(TOUR_STEP_ATTRIBUTE)
    return
  }
  el.setAttribute(TOUR_STEP_ATTRIBUTE, String(id))
}

const tourStepDirective = (app: App) => {
  app.directive('nb-tour-step', {
    mounted: applyId,
    updated: applyId,
    unmounted(el: HTMLElement) {
      el.removeAttribute(TOUR_STEP_ATTRIBUTE)
    },
  })
}

export default tourStepDirective
