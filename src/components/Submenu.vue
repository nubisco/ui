<template>
  <li
    ref="triggerRef"
    class="nb-menu-item nb-submenu-trigger"
    :class="{
      'nb-menu-item--disabled': disabled,
      'nb-menu-item--highlighted': isOpen,
    }"
    role="menuitem"
    :aria-haspopup="'menu'"
    :aria-expanded="isOpen"
    :aria-disabled="disabled || undefined"
    :tabindex="-1"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @keydown.right.prevent="openSubmenu"
    @keydown.left.prevent="closeSubmenu"
    @keydown.escape.prevent="closeSubmenu"
    @click="onActivate"
  >
    <NbIcon v-if="icon" :name="icon" :size="16" class="nb-menu-item__icon" />
    <span class="nb-menu-item__label">{{ label }}</span>
    <NbIcon name="caret-right" :size="14" class="nb-submenu-trigger__caret" />
  </li>

  <Teleport to="body">
    <Transition name="nb-submenu">
      <ul
        v-if="isOpen"
        ref="submenuRef"
        role="menu"
        class="nb-menu nb-submenu"
        :class="[sizeClass]"
        :style="submenuStyle"
        @mouseenter="onSubmenuMouseEnter"
        @mouseleave="onSubmenuMouseLeave"
      >
        <slot />
      </ul>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, inject, nextTick, onBeforeUnmount } from 'vue'
import type { ISubmenuProps, IMenuContext } from './Menu.d'

const props = withDefaults(defineProps<ISubmenuProps>(), {
  icon: undefined,
  disabled: false,
})

const triggerRef = ref<HTMLElement | null>(null)
const submenuRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const menuContext = inject<IMenuContext | null>('nb-menu', null)

let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

const sizeClass = computed(() => {
  const size = menuContext?.size ?? 'md'
  return `nb-menu--${size}`
})

const submenuStyle = ref({
  position: 'fixed' as const,
  top: '0px',
  left: '0px',
  zIndex: 'var(--nb-zindex-menu)',
})

function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const menuWidth = 200 // estimate, will adjust after render
  let left = rect.right
  let top = rect.top

  // Flip to left side if it would overflow the viewport
  if (left + menuWidth > window.innerWidth) {
    left = rect.left - menuWidth
  }

  // Keep within vertical viewport
  if (top + 200 > window.innerHeight) {
    top = Math.max(8, window.innerHeight - 200)
  }

  submenuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 'var(--nb-zindex-menu)',
  }
}

function openSubmenu() {
  if (props.disabled) return
  clearTimers()
  isOpen.value = true
  updatePosition()
  nextTick(() => {
    // Refine position now that submenu is rendered
    if (submenuRef.value && triggerRef.value) {
      const triggerRect = triggerRef.value.getBoundingClientRect()
      const submenuRect = submenuRef.value.getBoundingClientRect()
      let left = triggerRect.right
      if (left + submenuRect.width > window.innerWidth) {
        left = triggerRect.left - submenuRect.width
      }
      let top = triggerRect.top
      if (top + submenuRect.height > window.innerHeight) {
        top = Math.max(8, window.innerHeight - submenuRect.height)
      }
      submenuStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 'var(--nb-zindex-menu)',
      }
    }
  })
}

function closeSubmenu() {
  clearTimers()
  isOpen.value = false
}

function clearTimers() {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function onMouseEnter() {
  clearTimers()
  openTimer = setTimeout(openSubmenu, 150)
}

function onMouseLeave() {
  clearTimers()
  closeTimer = setTimeout(closeSubmenu, 150)
}

function onSubmenuMouseEnter() {
  clearTimers()
}

function onSubmenuMouseLeave() {
  clearTimers()
  closeTimer = setTimeout(closeSubmenu, 150)
}

function onActivate() {
  if (props.disabled) return
  if (isOpen.value) closeSubmenu()
  else openSubmenu()
}

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style lang="scss">
.nb-submenu-trigger {
  &__caret {
    flex-shrink: 0;
    color: var(--nb-c-text-muted);
    margin-left: auto;
  }
}

.nb-submenu {
  // Inherits .nb-menu styles
}

.nb-submenu-enter-active,
.nb-submenu-leave-active {
  transition: opacity 0.12s ease;
}
.nb-submenu-enter-from,
.nb-submenu-leave-to {
  opacity: 0;
}
</style>
