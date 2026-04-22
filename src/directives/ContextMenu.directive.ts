import type { App, DirectiveBinding } from 'vue'

type TContextMenuHandler = (position: { x: number; y: number }) => void

type TContextMenuEl = HTMLElement & {
  __nbContextMenuHandler__?: (e: MouseEvent) => void
}

export default function (app: App) {
  app.directive('nb-context-menu', {
    mounted(
      el: TContextMenuEl,
      binding: DirectiveBinding<TContextMenuHandler>,
    ) {
      const handler = (e: MouseEvent) => {
        e.preventDefault()
        if (typeof binding.value === 'function') {
          binding.value({ x: e.clientX, y: e.clientY })
        }
      }
      el.__nbContextMenuHandler__ = handler
      el.addEventListener('contextmenu', handler)
    },

    updated(
      el: TContextMenuEl,
      binding: DirectiveBinding<TContextMenuHandler>,
    ) {
      if (el.__nbContextMenuHandler__) {
        el.removeEventListener('contextmenu', el.__nbContextMenuHandler__)
      }
      const handler = (e: MouseEvent) => {
        e.preventDefault()
        if (typeof binding.value === 'function') {
          binding.value({ x: e.clientX, y: e.clientY })
        }
      }
      el.__nbContextMenuHandler__ = handler
      el.addEventListener('contextmenu', handler)
    },

    unmounted(el: TContextMenuEl) {
      if (el.__nbContextMenuHandler__) {
        el.removeEventListener('contextmenu', el.__nbContextMenuHandler__)
        delete el.__nbContextMenuHandler__
      }
    },
  })
}
