<template>
  <button
    ref="triggerRef"
    type="button"
    role="menuitem"
    class="nb-menubar-item"
    :class="{ 'nb-menubar-item--active': isActive }"
    :aria-haspopup="'menu'"
    :aria-expanded="isActive"
    @mousedown="onTriggerMousedown"
    @mouseenter="onTriggerHover"
  >
    <slot name="trigger">{{ label }}</slot>
  </button>

  <NbMenu
    ref="menuRef"
    :open="isActive"
    :size="size"
    :min-width="minWidth"
    :max-width="maxWidth"
    @close="onMenuClose"
  >
    <slot />
  </NbMenu>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  inject,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  useId,
} from 'vue'
import type { TMenuItemSize } from './Menu.d'

withDefaults(
  defineProps<{
    label: string
    size?: TMenuItemSize
    minWidth?: number
    maxWidth?: number
  }>(),
  {
    size: 'md',
    minWidth: 160,
    maxWidth: 288,
  },
)

const id = `nb-menubar-item-${useId()}`
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<InstanceType<any> | null>(null)

const menubar = inject<{
  activeMenu: { value: string | null }
  anyOpen: { value: boolean }
  setActiveMenu: (id: string | null) => void
  closeAll: () => void
  registerTrigger: (entry: {
    id: string
    el: HTMLElement
    open: () => void
    close: () => void
  }) => void
  unregisterTrigger: (id: string) => void
} | null>('nb-menubar', null)

const isActive = computed(() => menubar?.activeMenu.value === id)

function openMenu() {
  nextTick(() => {
    if (triggerRef.value && menuRef.value) {
      const rect = triggerRef.value.getBoundingClientRect()
      menuRef.value.setPosition({
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        width: rect.width,
      })
    }
  })
}

function closeMenu() {
  // Handled by NbMenu via the isActive computed
}

function onTriggerMousedown(e: MouseEvent) {
  // Stop propagation so the menu's document-level mousedown handler
  // (onClickOutside) does not see this event and close the menu
  // before we can toggle it.
  e.stopPropagation()
  e.preventDefault()
  if (isActive.value) {
    menubar?.setActiveMenu(null)
  } else {
    menubar?.setActiveMenu(id)
  }
}

function onTriggerHover() {
  if (menubar?.anyOpen.value && !isActive.value) {
    menubar.setActiveMenu(id)
  }
}

function onMenuClose() {
  if (isActive.value) {
    menubar?.setActiveMenu(null)
  }
}

watch(isActive, (val) => {
  if (val) openMenu()
})

onMounted(() => {
  if (triggerRef.value && menubar) {
    menubar.registerTrigger({
      id,
      el: triggerRef.value,
      open: openMenu,
      close: closeMenu,
    })
  }
})

onBeforeUnmount(() => {
  menubar?.unregisterTrigger(id)
})
</script>

<style lang="scss">
.nb-menubar-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 400;
  color: var(--nb-c-text);
  background: transparent;
  border: none;
  cursor: pointer;
  user-select: none;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.1s;
  outline: none;

  &:hover {
    background: var(--nb-c-layer-hover-1);
  }

  &--active {
    background: var(--nb-c-layer-hover-1);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }
}
</style>
