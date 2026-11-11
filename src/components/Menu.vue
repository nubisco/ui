<template>
  <Teleport to="body">
    <Transition name="nb-menu">
      <ul
        v-if="open"
        ref="menuRef"
        role="menu"
        :class="['nb-menu', `nb-menu--${size}`]"
        :style="menuStyle"
        @keydown="onKeydown"
      >
        <slot />
      </ul>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  provide,
  nextTick,
  onBeforeUnmount,
  reactive,
} from 'vue'
import type { IMenuProps, IMenuContext } from './Menu.d'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { openModalSurfaces } from '@/composables/useFocusTrap.composable'
import { NB_TOOLBAR } from './Toolbar.context'

const props = withDefaults(defineProps<IMenuProps>(), {
  open: false,
  size: 'md',
  minWidth: 160,
  maxWidth: 288,
  align: 'start',
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const menuRef = ref<HTMLElement | null>(null)
const highlighted = ref(-1)
const items = reactive<HTMLElement[]>([])

const { phone } = usePhoneLayout()

// On a phone a 288px menu can be most of the screen and a 160px floor can be
// wider than the room left beside its trigger, so both widths stop 8px short
// of each edge. A desktop keeps the plain pixel values it always had.
function capWidth(px: number): string {
  return phone.value ? `min(${px}px, calc(100vw - 16px))` : `${px}px`
}

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${position.top}px`,
  left: `${position.left}px`,
  minWidth: capWidth(props.minWidth),
  maxWidth: capWidth(props.maxWidth),
  // A phone shows the inspector as a sheet over the page (the shell puts it
  // at 250) and every dialog as a sheet, so a menu opened from either has to
  // clear both: the tier the library keeps for dropdowns inside a modal.
  zIndex: phone.value
    ? 'var(--nb-zindex-modal-dropdown)'
    : 'var(--nb-zindex-menu)',
}))

const position = reactive({ top: 0, left: 0 })

/**
 * The trigger the menu was placed against, kept so the clamp can do more
 * than push the menu back on screen. With it, `align: 'end'` lines the
 * menu's right edge up with the trigger's (which needs the menu's own width,
 * only known once it renders), and a menu with no room below opens above
 * the trigger instead of being shoved up over it. A menu placed at a point
 * (`setPositionXY`, a context menu) has no trigger, and is only clamped.
 */
let anchor: {
  top: number
  bottom: number
  left: number
  right: number
} | null = null

function setPosition(rect: {
  top: number
  left: number
  bottom: number
  width: number
  right?: number
}) {
  anchor = {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right ?? rect.left + rect.width,
  }
  position.top = rect.bottom
  position.left = rect.left
  reclampIfOpen()
}

function setPositionXY(x: number, y: number) {
  anchor = null
  position.top = y
  position.left = x
  reclampIfOpen()
}

/**
 * The open watcher clamps the menu onto the screen once, on the frame it
 * opens. A caller that positions the menu after that (open first, then
 * measure the trigger) bypassed the clamp, and the menu hung off the right
 * edge: on a phone most of it, on a desktop whenever the trigger sat near
 * that edge. A position set while open is clamped too.
 */
function reclampIfOpen() {
  if (props.open) nextTick(adjustPosition)
}

function close() {
  emit('close')
  emit('update:open', false)
}

function registerItem(el: HTMLElement): number {
  if (!items.includes(el)) {
    items.push(el)
  }
  return items.indexOf(el)
}

function unregisterItem(el: HTMLElement) {
  const idx = items.indexOf(el)
  if (idx >= 0) items.splice(idx, 1)
}

// Submenu lists, teleported out of this element. Not reactive: only read when
// a press has to be classified as inside or outside.
const surfaces = new Set<HTMLElement>()

function registerSurface(el: HTMLElement) {
  surfaces.add(el)
}

function unregisterSurface(el: HTMLElement) {
  surfaces.delete(el)
}

// A menu opened from a toolbar is not part of the toolbar: a button in a
// form inside the menu keeps its own size rather than the toolbar's.
provide(NB_TOOLBAR, null)

provide<IMenuContext>('nb-menu', {
  size: props.size,
  close,
  highlightedIndex: highlighted.value,
  registerItem,
  unregisterItem,
  registerSurface,
  unregisterSurface,
})

function getMenuItems(): HTMLElement[] {
  if (!menuRef.value) return []
  return Array.from(
    menuRef.value.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ).filter((el) => !el.closest('.nb-submenu'))
}

function focusItem(index: number) {
  const menuItems = getMenuItems()
  if (index >= 0 && index < menuItems.length) {
    highlighted.value = index
    menuItems[index].focus()
  }
}

function onKeydown(e: KeyboardEvent) {
  // Escape closes any menu, including one that holds a form rather than
  // items (a filter panel, a quick edit), which the early return below used
  // to leave open. A field that spent the Escape closing its own list or
  // calendar has prevented it, and that press is not also the menu's.
  if (e.key === 'Escape') {
    if (e.defaultPrevented) return
    e.preventDefault()
    e.stopPropagation()
    close()
    return
  }

  const menuItems = getMenuItems()
  if (!menuItems.length) return

  // Start from the focused item when there is one. Focus can arrive without
  // an arrow key: a submenu hands it back to its trigger when it closes.
  const focused = menuItems.indexOf(document.activeElement as HTMLElement)
  if (focused >= 0) highlighted.value = focused

  const enabled = (i: number) =>
    menuItems[i]?.getAttribute('aria-disabled') !== 'true'

  /** The next enabled item from `from` in `step`, wrapping; -1 if none. */
  function seek(from: number, step: 1 | -1): number {
    for (let n = 1; n <= menuItems.length; n++) {
      const i = (from + step * n + menuItems.length * n) % menuItems.length
      if (enabled(i)) return i
    }
    return -1
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    // Wraps from the last item to the first, as the WAI-ARIA menu does.
    const next = seek(highlighted.value, 1)
    if (next >= 0) focusItem(next)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    const start = highlighted.value < 0 ? 0 : highlighted.value
    const prev = seek(start, -1)
    if (prev >= 0) focusItem(prev)
  } else if (e.key === 'Home') {
    e.preventDefault()
    e.stopPropagation()
    const first = seek(-1, 1)
    if (first >= 0) focusItem(first)
  } else if (e.key === 'End') {
    e.preventDefault()
    e.stopPropagation()
    const last = seek(menuItems.length, -1)
    if (last >= 0) focusItem(last)
  } else if (e.key === 'Tab') {
    close()
  } else if (
    e.key.length === 1 &&
    e.key !== ' ' &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    // A field inside the menu (a filter, a quick edit) takes its own letters.
    !(e.target as HTMLElement).closest('input, textarea, [contenteditable]')
  ) {
    // First-letter typeahead: the next enabled item whose label starts with
    // the key, wrapping, so pressing it again walks the matches.
    const key = e.key.toLowerCase()
    for (let n = 1; n <= menuItems.length; n++) {
      const i = (highlighted.value + n + menuItems.length) % menuItems.length
      const label = (menuItems[i].textContent ?? '').trim().toLowerCase()
      if (enabled(i) && label.startsWith(key)) {
        e.preventDefault()
        e.stopPropagation()
        focusItem(i)
        break
      }
    }
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (!menuRef.value || menuRef.value.contains(target)) return
  // Pressing an item in a submenu used to count as outside: the menu closed on
  // mousedown, the submenu unmounted before mouseup, and the click, which is
  // what selects the item, never happened.
  for (const surface of surfaces) {
    if (surface.contains(target)) return
  }
  close()
}

function adjustPosition() {
  if (!menuRef.value) return
  const el = menuRef.value
  // Measured at its natural height: a max-height left over from the last
  // opening would hide how much room the menu really needs.
  el.style.maxHeight = ''
  const rect = el.getBoundingClientRect()

  if (anchor && props.align === 'end') {
    position.left = anchor.right - rect.width
  } else if (anchor) {
    position.left = anchor.left
  }
  // Keep it on screen horizontally, 8px from either edge.
  if (position.left + rect.width > window.innerWidth - 8) {
    position.left = window.innerWidth - rect.width - 8
  }
  position.left = Math.max(8, position.left)

  // Vertically: below the trigger when it fits, above it when it does not
  // and there is more room there, and pinned to the bottom edge otherwise.
  if (position.top + rect.height > window.innerHeight - 8) {
    const roomAbove = anchor ? anchor.top - 8 : 0
    const roomBelow = window.innerHeight - 8 - position.top
    if (anchor && rect.height <= roomAbove) {
      position.top = anchor.top - rect.height
    } else if (anchor && roomAbove > roomBelow) {
      position.top = 8
    } else if (!anchor) {
      position.top = Math.max(8, window.innerHeight - rect.height - 8)
    }
  }
  // Whatever is left over scrolls inside the menu: it never extends past the
  // viewport, and when it opened upwards it never covers its trigger.
  const limit =
    anchor && position.top < anchor.top ? anchor.top : window.innerHeight - 8
  el.style.maxHeight = `${Math.max(0, limit - position.top)}px`
}

/*
 * Focus goes back to whatever opened the menu when it closes. Without this the
 * list unmounted under the focused item and focus fell to <body>, so a
 * keyboard user who picked an action started again from the top of the page.
 *
 * Two cases leave focus alone. If it has already gone somewhere real (a press
 * outside landed on another control), taking it back would undo what the
 * user just did. And if a modal surface is open and the opener is not inside
 * it, restoring would pull focus out of the dialog's trap. Submenus hand
 * focus to their own trigger in this menu, so only this, the root, restores.
 */
let opener: HTMLElement | null = null

function captureOpener() {
  opener =
    document.activeElement instanceof HTMLElement &&
    document.activeElement !== document.body
      ? document.activeElement
      : null
}

function focusIsOurs(el: Element | null): boolean {
  if (!el || el === document.body) return true
  if (!el.isConnected) return true
  if (menuRef.value?.contains(el)) return true
  for (const surface of surfaces) if (surface.contains(el)) return true
  return false
}

function restoreFocus() {
  const target = opener
  opener = null
  if (!target?.isConnected) return
  const modals = openModalSurfaces()
  const top = modals[modals.length - 1]
  if (top && !top.contains(target)) return
  if (!focusIsOurs(document.activeElement)) return
  target.focus()
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      captureOpener()
      highlighted.value = -1
      document.addEventListener('mousedown', onClickOutside)
      nextTick(() => {
        adjustPosition()
        // Focus first item
        const menuItems = getMenuItems()
        if (menuItems.length > 0) {
          focusItem(0)
        }
      })
    } else {
      highlighted.value = -1
      document.removeEventListener('mousedown', onClickOutside)
      restoreFocus()
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})

defineExpose({
  setPosition,
  setPositionXY,
  close,
  el: menuRef,
})
</script>

<style lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;

.nb-menu {
  // Teleported to body but previously had no z-index at all, so any
  // positioned page element (sticky column headers, shell chrome) painted
  // over it. The scale already reserves a tier for menus; wear it.
  z-index: var(--nb-zindex-menu);

  background: var(--nb-c-layer-3);
  border: 1px solid var(--nb-c-layer-border-3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  // Teleported to <body>, so it inherits the appearance attribute from the
  // document and establishes its own outer corner rather than deriving one
  // from whatever it was opened from.
  @include radius.surface(popover);
  // Inset on all four sides, not just top and bottom: a highlighted item is a
  // rounded row floating inside the menu's corner rather than a band running
  // into it, which is what makes the first and last item look right.
  padding: 4px;
  margin: 0;
  list-style: none;
  max-height: 50vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  outline: none;

  // Ensure teleported menu is above other content
  &:focus {
    outline: none;
  }
}

// Arrives from its trigger (enter curve, quick) and fades away (exit curve,
// micro): a popover that slides back out is a popover the eye follows away
// from the thing the person is about to do next.
@include motion.popover(nb-menu);
</style>
