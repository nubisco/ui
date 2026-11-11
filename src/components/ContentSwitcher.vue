<template>
  <div
    ref="rootRef"
    :class="[
      'nb-content-switcher',
      `nb-content-switcher--${size}`,
      { 'nb-content-switcher--icon-only': iconOnly },
    ]"
    role="radiogroup"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <template v-for="item in items" :key="item.id">
      <!-- Two branches because NbButton decides it is icon-only from the
           absence of a default slot, and an empty slot is still a slot. -->
      <NbButton
        v-if="iconOnly && item.icon"
        :class="itemClass(item)"
        variant="ghost"
        :size="size"
        :icon="item.icon"
        :label="item.label"
        :disabled="item.disabled"
        role="radio"
        :aria-checked="item.id === modelValue"
        :tabindex="tabStop === item.id ? 0 : -1"
        :data-id="item.id"
        @click="select(item)"
      />
      <NbButton
        v-else
        :class="itemClass(item)"
        variant="ghost"
        :size="size"
        :icon="item.icon"
        :disabled="item.disabled"
        role="radio"
        :aria-checked="item.id === modelValue"
        :tabindex="tabStop === item.id ? 0 : -1"
        :data-id="item.id"
        @click="select(item)"
        >{{ item.label }}</NbButton
      >
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import NbButton from './Button.vue'
import type {
  IContentSwitcherItem,
  IContentSwitcherProps,
} from './ContentSwitcher.d'

const props = withDefaults(defineProps<IContentSwitcherProps>(), {
  modelValue: undefined,
  iconOnly: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const rootRef = ref<HTMLElement | null>(null)

const enabled = computed(() => props.items.filter((item) => !item.disabled))

/*
 * A radio group is one tab stop: the selected option holds it, or the first
 * enabled one while nothing is selected. Tab moves past the group, and the
 * arrow keys move the choice, as in any group of radio buttons.
 */
const tabStop = computed(() => {
  const selected = enabled.value.find((item) => item.id === props.modelValue)
  return (selected ?? enabled.value[0])?.id
})

function itemClass(item: IContentSwitcherItem) {
  return [
    'nb-content-switcher__item',
    { 'nb-content-switcher__item--selected': item.id === props.modelValue },
  ]
}

function select(item: IContentSwitcherItem) {
  if (item.disabled || item.id === props.modelValue) return
  emit('update:modelValue', item.id)
}

function focusItem(id: string) {
  void nextTick(() => {
    const options = rootRef.value?.querySelectorAll<HTMLElement>('[data-id]')
    Array.from(options ?? [])
      .find((el) => el.dataset.id === id)
      ?.focus()
  })
}

/*
 * Radio semantics, not a tab list: the arrows select as they move (there is
 * no separate activation), they wrap, and they skip disabled options. Home
 * and End go to the first and last.
 */
function onKeydown(event: KeyboardEvent) {
  const list = enabled.value
  if (!list.length) return
  const current = list.findIndex((item) => item.id === tabStop.value)
  let next = -1
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    next = (current + 1) % list.length
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    next = (current - 1 + list.length) % list.length
  } else if (event.key === 'Home') {
    next = 0
  } else if (event.key === 'End') {
    next = list.length - 1
  }
  if (next < 0) return
  event.preventDefault()
  select(list[next])
  focusItem(list[next].id)
}
</script>

<style lang="scss">
@use '../styles/logic/radius' as radius;

/*
 * Carbon's content switcher: a row of equal options in one outlined box,
 * the selected one filled with the inverse surface. Three classes on the
 * item rules, to outrank NbButton's own ghost styling.
 */
.nb-content-switcher {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--nb-c-border-inverse);
  @include radius.standalone(control);
  overflow: hidden;

  .nb-content-switcher__item.nb-button {
    flex: 1 1 0;
    justify-content: center;
    border-radius: 0;
    color: var(--nb-c-text-muted);

    & + .nb-content-switcher__item {
      border-inline-start: 1px solid var(--nb-c-border);
    }

    &:hover:not(:disabled) {
      color: var(--nb-c-text);
    }
  }

  .nb-content-switcher__item--selected.nb-button {
    background: var(--nb-c-bg-inverse);
    color: var(--nb-c-text-inverse);

    &:hover:not(:disabled) {
      background: var(--nb-c-bg-inverse);
      color: var(--nb-c-text-inverse);
    }

    // The divider beside the selected option disappears into its fill.
    & + .nb-content-switcher__item {
      border-inline-start-color: transparent;
    }
  }

  // An item with an icon and text keeps them together, centred.
  &:not(&--icon-only) .nb-content-switcher__item.nb-button {
    --nb-button-pad-end: var(--nb-spacing-16);
    --nb-button-icon-gap: var(--nb-spacing-8);
  }

  @media (forced-colors: active) {
    .nb-content-switcher__item--selected.nb-button {
      forced-color-adjust: none;
      background: Highlight;
      color: HighlightText;
    }
  }
}
</style>
