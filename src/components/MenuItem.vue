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

    <!-- What leads the label: a picture (the person or thing the row names),
         the icon, or whatever the slot puts there. The picture is decorative,
         because the label beside it already names the row. -->
    <slot name="leading">
      <NbAvatar
        v-if="picture !== undefined"
        class="nb-menu-item__icon nb-menu-item__picture"
        :name="label"
        :picture="picture"
        :size="16"
        decorative
      />
      <NbIcon
        v-else-if="icon"
        :name="icon"
        :size="16"
        class="nb-menu-item__icon"
      />
    </slot>

    <span class="nb-menu-item__label" :title="label || undefined">{{
      label
    }}</span>

    <kbd v-if="shortcut" class="nb-menu-item__shortcut">{{ shortcut }}</kbd>

    <slot name="trailing" />
  </li>
</template>

<script setup lang="ts">
import NbIcon from './Icon.vue'
import NbAvatar from './Avatar.vue'
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import type { IMenuItemProps, IMenuContext } from './Menu.d'

const props = withDefaults(defineProps<IMenuItemProps>(), {
  icon: undefined,
  picture: undefined,
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
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;
@use '../styles/logic/touch' as touch;

.nb-menu-item {
  // --nb-menu-item-h base default lives at :root in styles/_theme.scss; the
  // .nb-menu--xs/sm/md/lg variants below override it (state, kept local).
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--nb-menu-item-h);
  padding: 0 12px;
  // Concentric with the menu enclosing it: the menu insets its items by 4px,
  // so an item's corner is the menu's less that inset.
  // 4px of padding plus the container's 1px border.
  @include radius.inset(5px);
  font-size: var(--nb-type-body-compact-size);
  font-weight: 400;
  color: var(--nb-c-text);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background var(--nb-motion-quick);
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
    font-weight: var(--nb-font-weight-semibold, 600);
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

  // A picture is a 16px circle in the icon's place, so rows with and without
  // one keep their labels aligned.
  &__picture {
    inline-size: 16px;
    block-size: 16px;
  }

  &__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__shortcut {
    flex-shrink: 0;
    font-size: var(--nb-type-body-sm-size);
    color: var(--nb-c-text-muted);
    font-family: var(--nb-font-family-sans, sans-serif);
  }
}

// A row is a tap target on a touch phone, so none is shorter than 44px. The
// floor beats the size variants' height without touching them, and a desktop
// keeps its density.
@include bp.phone-touch {
  .nb-menu-item {
    min-block-size: 44px;
  }
}

// The row is already 44px tall there; the mixin keeps the same rule as every
// other control, so a narrow item (an icon row in a toolbar menu) is covered.
.nb-menu-item {
  @include touch.hit-area;
}

// Size variants applied via parent .nb-menu
.nb-menu--xs .nb-menu-item {
  --nb-menu-item-h: 24px;
  padding: 0 12px;
  font-size: var(--nb-type-body-sm-size);
  gap: 6px;
}
.nb-menu--sm .nb-menu-item {
  --nb-menu-item-h: 32px;
  padding: 0 12px;
  font-size: var(--nb-type-body-compact-size);
}
.nb-menu--md .nb-menu-item {
  --nb-menu-item-h: 40px;
}
.nb-menu--lg .nb-menu-item {
  --nb-menu-item-h: 48px;
}
</style>
