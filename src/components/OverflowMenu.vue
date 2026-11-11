<template>
  <span class="nb-overflow-menu">
    <NbButton
      ref="triggerRef"
      class="nb-overflow-menu__trigger"
      variant="ghost"
      :size="size"
      :icon="icon"
      :label="triggerLabel"
      :tooltip-position="tooltipPosition"
      :disabled="disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @mousedown="onTriggerPress"
      @click="toggle"
      @keydown="onTriggerKeydown"
    />
    <NbMenu
      ref="menuRef"
      :open="isOpen"
      :size="menuSize"
      :align="align"
      @update:open="onMenuOpen"
    >
      <NbMenuItem
        v-for="item in items"
        :key="item.id"
        :label="item.label"
        :icon="item.icon"
        :disabled="item.disabled || item.loading"
        :danger="item.danger"
        :selectable="item.pressed !== undefined"
        :selected="item.pressed"
        @select="choose(item)"
      />
      <slot />
    </NbMenu>
  </span>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import NbButton from './Button.vue'
import NbMenu from './Menu.vue'
import NbMenuItem from './MenuItem.vue'
import type { IActionGroupItem } from './ActionGroup.d'
import type { TMenuItemSize } from './Menu.d'
import type { IOverflowMenuProps } from './OverflowMenu.d'
import { NB_TOOLBAR } from './Toolbar.context'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import * as iconDotsThree from '@nubisco/ui/icons/dots-three'

const props = withDefaults(defineProps<IOverflowMenuProps>(), {
  items: () => [],
  label: undefined,
  // The glyph module, not the name: a default the build cannot see in the
  // template would ship no artwork.
  icon: () => iconDotsThree,
  size: undefined,
  align: 'end',
  disabled: false,
  tooltipPosition: 'bottom',
})

const emit = defineEmits<{
  /** An item from `items` was chosen. Carries its `id`. */
  select: [id: string]
  /** The menu opened or closed. */
  'update:open': [open: boolean]
}>()

const nbStrings = useNbStrings()
const toolbar = inject(NB_TOOLBAR, null)

const triggerLabel = computed(
  () => props.label ?? nbStrings.value.overflowMenuLabel,
)

/*
 * Carbon sizes the rows to the trigger, so the menu reads as part of the
 * control it came from. The menu's scale stops at 48px: a 64px trigger
 * (an xl toolbar) opens 48px rows, which is still a comfortable target.
 */
const menuSize = computed<TMenuItemSize>(() => {
  const size = props.size ?? toolbar?.size.value ?? 'md'
  if (size === 'xxs' || size === 'xs') return 'xs'
  if (size === 'sm' || size === 'md') return size
  return 'lg'
})

const isOpen = ref(false)
const menuRef = ref<InstanceType<typeof NbMenu> | null>(null)
const triggerRef = ref<InstanceType<typeof NbButton> | null>(null)

function triggerEl(): HTMLElement | null {
  return (triggerRef.value?.$el as HTMLElement | undefined) ?? null
}

// The menu closes itself on any mousedown outside it, and the trigger is
// outside it. Without this, pressing the trigger of an open menu closed it on
// mousedown and the click that followed opened it again.
let pressedWhileOpen = false

function onTriggerPress() {
  pressedWhileOpen = isOpen.value
}

function open() {
  if (props.disabled || isOpen.value) return
  // Positioned before it opens, so the menu's own clamp, which runs on the
  // frame it opens, sees the final position and keeps it on screen.
  const rect = triggerEl()?.getBoundingClientRect()
  if (rect) menuRef.value?.setPosition(rect)
  isOpen.value = true
  emit('update:open', true)
}

function close() {
  if (!isOpen.value) return
  isOpen.value = false
  emit('update:open', false)
}

function toggle() {
  if (pressedWhileOpen || isOpen.value) {
    pressedWhileOpen = false
    close()
    return
  }
  open()
}

// Enter and Space open it through the button's own click. ArrowDown opens it
// too, as on a menu button, and the menu puts focus on its first row.
function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown') return
  event.preventDefault()
  open()
}

function onMenuOpen(next: boolean) {
  if (next) return
  close()
  // NbMenu hands focus back to whatever had it when it opened. A trigger
  // pressed with a mouse is not always focused by the browser (Safari never
  // focuses a button on click), so when focus has fallen to the page it goes
  // to the trigger, and the next Tab continues from where the user was.
  const active = document.activeElement
  if (!active || active === document.body || !active.isConnected) {
    void nextTick(() => triggerEl()?.focus())
  }
}

function choose(item: IActionGroupItem) {
  if (item.disabled || item.loading) return
  item.onSelect?.()
  emit('select', item.id)
}

defineExpose({ open, close, isOpen })
</script>

<style lang="scss">
// `display: contents`: the trigger is the only thing on screen (the menu is
// teleported), so it is a flex child of whatever holds it, a toolbar or a
// table cell, exactly as a button placed there would be.
.nb-overflow-menu {
  display: contents;
}
</style>
