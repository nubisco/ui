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

const props = withDefaults(defineProps<IMenuProps>(), {
  open: false,
  size: 'md',
  minWidth: 160,
  maxWidth: 288,
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const menuRef = ref<HTMLElement | null>(null)
const highlighted = ref(-1)
const items = reactive<HTMLElement[]>([])

const menuStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${position.top}px`,
  left: `${position.left}px`,
  minWidth: `${props.minWidth}px`,
  maxWidth: `${props.maxWidth}px`,
  zIndex: 'var(--nb-zindex-menu)',
}))

const position = reactive({ top: 0, left: 0 })

function setPosition(rect: {
  top: number
  left: number
  bottom: number
  width: number
}) {
  position.top = rect.bottom
  position.left = rect.left
}

function setPositionXY(x: number, y: number) {
  position.top = y
  position.left = x
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

provide<IMenuContext>('nb-menu', {
  size: props.size,
  close,
  highlightedIndex: highlighted.value,
  registerItem,
  unregisterItem,
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
  const menuItems = getMenuItems()
  if (!menuItems.length) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    e.stopPropagation()
    let next = highlighted.value + 1
    // Skip separators: find next focusable item
    while (
      next < menuItems.length &&
      menuItems[next]?.getAttribute('aria-disabled') === 'true'
    ) {
      next++
    }
    if (next < menuItems.length) focusItem(next)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    e.stopPropagation()
    let prev = highlighted.value - 1
    while (
      prev >= 0 &&
      menuItems[prev]?.getAttribute('aria-disabled') === 'true'
    ) {
      prev--
    }
    if (prev >= 0) focusItem(prev)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    close()
  } else if (e.key === 'Tab') {
    close()
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (menuRef.value && !menuRef.value.contains(target)) {
    close()
  }
}

function adjustPosition() {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  // Flip left if overflowing right
  if (rect.right > window.innerWidth) {
    position.left = Math.max(8, window.innerWidth - rect.width - 8)
  }
  // Flip up if overflowing bottom
  if (rect.bottom > window.innerHeight) {
    position.top = Math.max(8, window.innerHeight - rect.height - 8)
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
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
.nb-menu {
  background: var(--nb-c-layer-3);
  border: 1px solid var(--nb-c-layer-border-3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
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

// Transition
.nb-menu-enter-active,
.nb-menu-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.nb-menu-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.nb-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
