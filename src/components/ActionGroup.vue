<template>
  <div class="nb-action-group">
    <template v-if="!folded">
      <NbButton
        v-for="item in items"
        :key="item.id"
        :variant="variantOf(item)"
        :outlined="item.outlined"
        :size="size"
        :disabled="item.disabled"
        :loading="item.loading"
        :icon="item.icon"
        :aria-pressed="item.pressed"
        @click="choose(item)"
        >{{ item.label }}</NbButton
      >
    </template>
    <template v-else>
      <template v-for="item in visible" :key="item.id">
        <!-- Two branches because NbButton decides it is icon-only from the
             absence of a default slot, and an empty slot is still a slot. -->
        <NbButton
          v-if="iconOnly(item)"
          :variant="variantOf(item)"
          :outlined="item.outlined"
          :size="size"
          :disabled="item.disabled"
          :loading="item.loading"
          :icon="item.icon"
          :aria-label="item.label"
          :aria-pressed="item.pressed"
          @click="choose(item)"
        />
        <NbButton
          v-else
          :variant="variantOf(item)"
          :outlined="item.outlined"
          :size="size"
          :disabled="item.disabled"
          :loading="item.loading"
          :icon="item.icon"
          :aria-pressed="item.pressed"
          @click="choose(item)"
          >{{ item.label }}</NbButton
        >
      </template>
      <NbButton
        v-if="hasOverflow"
        ref="triggerRef"
        class="nb-action-group__more"
        variant="ghost"
        :size="size"
        icon="dots-three"
        :aria-label="overflowLabel"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @mousedown="onTriggerPress"
        @click="toggleMenu"
      />
      <NbMenu
        v-if="hasOverflow"
        ref="menuRef"
        :open="menuOpen"
        @update:open="onMenuOpen"
      >
        <NbMenuItem
          v-for="item in hidden"
          :key="item.id"
          :label="item.label"
          :icon="item.icon"
          :disabled="item.disabled || item.loading"
          :danger="item.danger"
          :selectable="item.pressed !== undefined"
          :selected="item.pressed"
          @select="choose(item)"
        />
        <slot name="menu" />
      </NbMenu>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useSlots } from 'vue'
import NbButton from './Button.vue'
import NbMenu from './Menu.vue'
import NbMenuItem from './MenuItem.vue'
import type { IActionGroupItem, IActionGroupProps } from './ActionGroup.d'
import type { TButtonVariant } from './Button.d'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { hasSlotContent } from '@/utils/slotContent.helper'

const props = withDefaults(defineProps<IActionGroupProps>(), {
  size: 'sm',
  overflow: 'never',
  overflowLabel: 'More actions',
  phoneVisible: 1,
})

const emit = defineEmits<{ select: [id: string] }>()

const slots = useSlots()
const { phone } = usePhoneLayout()

/**
 * Folded means some actions live in the overflow menu. `'never'` is checked
 * first, so a group that never opted in renders the plain buttons whatever
 * the viewport says, which is what keeps the desktop byte for byte the same.
 */
const folded = computed(() => {
  if (props.overflow === 'never') return false
  if (props.overflow === 'always') return true
  return phone.value
})

/**
 * The actions that stay on screen when folded: the first `phoneVisible`
 * flagged primary, or the first ones when the product flagged none. The rest
 * keep their reading order in the menu.
 */
const visible = computed<IActionGroupItem[]>(() => {
  const count = Math.max(0, props.phoneVisible)
  const primary = props.items.filter((item) => item.priority === 'primary')
  return (primary.length ? primary : props.items).slice(0, count)
})

const hidden = computed<IActionGroupItem[]>(() =>
  props.items.filter((item) => !visible.value.includes(item)),
)

// No trigger for a menu with nothing in it.
const hasOverflow = computed(
  () => hidden.value.length > 0 || hasSlotContent(slots, 'menu'),
)

/**
 * On a phone the visible actions drop their text to fit a 360px topbar, and
 * the label becomes the accessible name. An action without an icon would be an
 * empty square, so it keeps its label.
 */
function iconOnly(item: IActionGroupItem): boolean {
  return phone.value && !!item.icon
}

function variantOf(item: IActionGroupItem): TButtonVariant | undefined {
  return item.variant ?? (item.danger ? 'danger' : undefined)
}

function choose(item: IActionGroupItem) {
  if (item.disabled || item.loading) return
  item.onSelect?.()
  emit('select', item.id)
}

const menuOpen = ref(false)
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
  pressedWhileOpen = menuOpen.value
}

function toggleMenu() {
  if (pressedWhileOpen || menuOpen.value) {
    pressedWhileOpen = false
    menuOpen.value = false
    return
  }
  // Positioned before it opens, so the menu's own clamp, which runs on the
  // frame it opens, sees the final position and keeps it on screen.
  const rect = triggerEl()?.getBoundingClientRect()
  if (rect) menuRef.value?.setPosition(rect)
  menuOpen.value = true
}

function onMenuOpen(open: boolean) {
  menuOpen.value = open
  if (open) return
  // Focus goes back to the trigger when the menu took it, so the next Tab
  // continues from where the user was rather than from the top of the page.
  const active = document.activeElement
  if (!active || active === document.body || !active.isConnected) {
    void nextTick(() => triggerEl()?.focus())
  }
}
</script>

<style lang="scss">
// `display: contents`, so the buttons are flex children of whatever holds the
// group (a topbar, a panel header) and take its gap, exactly as the same
// buttons placed there by hand would.
.nb-action-group {
  display: contents;
}
</style>
