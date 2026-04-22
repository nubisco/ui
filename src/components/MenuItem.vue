<template>
  <li
    ref="itemRef"
    :class="rootClasses"
    :role="computedRole"
    :aria-disabled="disabled || undefined"
    :aria-checked="selectable || radioGroup ? selected : undefined"
    :tabindex="-1"
    @click="onActivate"
    @keydown.enter.prevent="onActivate"
    @keydown.space.prevent="onActivate"
    @mouseenter="$emit('highlight')"
  >
    <NbIcon
      v-if="selectable && selected"
      name="check"
      :size="16"
      class="nb-menu-item__check"
    />
    <span v-else-if="selectable" class="nb-menu-item__check-placeholder" />

    <NbIcon v-if="icon" :name="icon" :size="16" class="nb-menu-item__icon" />

    <span class="nb-menu-item__label">{{ label }}</span>

    <kbd v-if="shortcut" class="nb-menu-item__shortcut">{{ shortcut }}</kbd>

    <slot name="trailing" />
  </li>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import type { IMenuItemProps, IMenuContext } from './Menu.d'

const props = withDefaults(defineProps<IMenuItemProps>(), {
  icon: undefined,
  shortcut: undefined,
  disabled: false,
  danger: false,
  selectable: false,
  selected: false,
  radioGroup: undefined,
})

const emit = defineEmits<{
  select: []
  highlight: []
}>()

const itemRef = ref<HTMLElement | null>(null)
const menuContext = inject<IMenuContext | null>('nb-menu', null)

const computedRole = computed(() => {
  if (props.radioGroup) return 'menuitemradio'
  if (props.selectable) return 'menuitemcheckbox'
  return 'menuitem'
})

const rootClasses = computed(() => [
  'nb-menu-item',
  {
    'nb-menu-item--disabled': props.disabled,
    'nb-menu-item--danger': props.danger,
    'nb-menu-item--selected': props.selected,
  },
])

function onActivate() {
  if (props.disabled) return
  emit('select')
  menuContext?.close()
}

onMounted(() => {
  if (itemRef.value && menuContext) {
    menuContext.registerItem(itemRef.value)
  }
})

onBeforeUnmount(() => {
  if (itemRef.value && menuContext) {
    menuContext.unregisterItem(itemRef.value)
  }
})

defineExpose({ el: itemRef })
</script>

<style lang="scss">
.nb-menu-item {
  --nb-menu-item-h: 40px;

  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--nb-menu-item-h);
  padding: 0 16px;
  font-size: 14px;
  font-weight: 400;
  color: var(--nb-c-text);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background 0.1s;
  outline: none;
  white-space: nowrap;

  &:hover,
  &--highlighted {
    background: var(--nb-c-layer-hover-3);
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }

  &--disabled {
    color: var(--nb-c-text-muted);
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      background: transparent;
    }
  }

  &--danger {
    color: var(--nb-c-danger);

    &:hover,
    &.nb-menu-item--highlighted {
      background: var(--nb-c-danger);
      color: #fff;

      .nb-menu-item__icon,
      .nb-menu-item__shortcut {
        color: #fff;
      }
    }
  }

  &--selected {
    font-weight: 500;
  }

  &__check {
    flex-shrink: 0;
    color: var(--nb-c-primary);
  }

  &__check-placeholder {
    width: 16px;
    flex-shrink: 0;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--nb-c-text-muted);
  }

  &__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__shortcut {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--nb-c-text-muted);
    font-family: var(--nb-font-family-sans, sans-serif);
  }
}

// Size variants applied via parent .nb-menu
.nb-menu--xs .nb-menu-item {
  --nb-menu-item-h: 24px;
  padding: 0 12px;
  font-size: 12px;
  gap: 6px;
}
.nb-menu--sm .nb-menu-item {
  --nb-menu-item-h: 32px;
  padding: 0 12px;
  font-size: 13px;
}
.nb-menu--md .nb-menu-item {
  --nb-menu-item-h: 40px;
}
.nb-menu--lg .nb-menu-item {
  --nb-menu-item-h: 48px;
}
</style>
