<template>
  <div
    class="nb-chip-group"
    :class="`nb-chip-group--${size}`"
    role="radiogroup"
    :aria-label="label"
    @keydown="onKeydown"
  >
    <button
      v-for="(item, index) in items"
      :key="item.value"
      ref="chips"
      type="button"
      role="radio"
      class="nb-chip-group__chip"
      :class="{ 'nb-chip-group__chip--selected': item.value === modelValue }"
      :aria-checked="item.value === modelValue"
      :disabled="item.disabled"
      :tabindex="index === tabStop ? 0 : -1"
      @click="choose(item)"
    >
      <NbIcon
        v-if="item.icon"
        :name="item.icon"
        :size="16"
        class="nb-chip-group__icon"
        aria-hidden="true"
      />
      <span class="nb-chip-group__label">{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * A single choice drawn as a row of chips: "All products / Docs / Guides".
 *
 * For a filter or a scope that sits beside what it filters (a search field,
 * a list), where tabs would claim the content below belongs to each choice
 * and a select would hide the options behind a click. It is a radio group,
 * because that is what one-of-several is: one tab stop for the whole row,
 * the arrow keys move and choose, and a screen reader hears "radio, 2 of 6,
 * checked". The row wraps rather than scrolls, so every choice stays in view
 * on a phone.
 */
import { computed, ref } from 'vue'
import type { IChipGroupItem, IChipGroupProps } from './ChipGroup.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IChipGroupProps>(), {
  modelValue: null,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const chips = ref<HTMLButtonElement[]>([])

// The chip that takes Tab: the chosen one, or the first that can be chosen.
const tabStop = computed(() => {
  const chosen = props.items.findIndex(
    (item) => item.value === props.modelValue && !item.disabled,
  )
  if (chosen !== -1) return chosen
  return props.items.findIndex((item) => !item.disabled)
})

function choose(item: IChipGroupItem) {
  if (item.disabled || item.value === props.modelValue) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
}

function onKeydown(event: KeyboardEvent) {
  const enabled = props.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.disabled)
  if (enabled.length === 0) return

  const current = Math.max(
    0,
    enabled.findIndex(
      ({ index }) => chips.value[index] === document.activeElement,
    ),
  )
  // Right moves forward in reading order, so it moves back in a
  // right-to-left document.
  const rtl =
    !!chips.value[0] && getComputedStyle(chips.value[0]).direction === 'rtl'
  const forward = rtl ? -1 : 1
  const steps: Record<string, number> = {
    ArrowRight: forward,
    ArrowLeft: -forward,
    ArrowDown: 1,
    ArrowUp: -1,
  }

  let next: number
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = enabled.length - 1
  else if (event.key in steps)
    next = (current + steps[event.key] + enabled.length) % enabled.length
  else return

  event.preventDefault()
  const target = enabled[next]
  chips.value[target.index]?.focus()
  choose(target.item)
}
</script>

<style scoped lang="scss">
@use '../styles/logic/focus' as focus;
@use '../styles/logic/touch' as touch;
@use '../styles/logic/motion' as motion;

.nb-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nb-base-unit);
}

.nb-chip-group__chip {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 0.5);
  box-sizing: border-box;
  height: calc(var(--nb-base-unit) * 4);
  padding-inline: calc(var(--nb-base-unit) * 1.5);
  // A chip is a pill under every appearance: the shape is what tells it apart
  // from a button beside it.
  border-radius: 9999px;
  border: 1px solid var(--nb-c-border);
  background: transparent;
  color: var(--nb-c-text-muted);
  font: inherit;
  font-size: var(--nb-type-body-compact-size);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--nb-motion-short),
    color var(--nb-motion-short),
    border-color var(--nb-motion-short);
  @include touch.hit-area;

  &:hover:not(:disabled) {
    background: var(--nb-c-surface-hover);
    color: var(--nb-c-text);
  }

  &:focus-visible {
    @include focus.ring;
  }

  &:disabled {
    cursor: not-allowed;
    color: color-mix(in srgb, var(--nb-c-contrast) 40%, transparent);
    border-color: var(--nb-c-component-disabled);
  }

  // Chosen: the high-contrast pair, the same treatment the base button uses,
  // so it reads as on at a glance without borrowing the brand colour.
  &--selected,
  &--selected:hover:not(:disabled) {
    background: var(--nb-c-contrast);
    border-color: var(--nb-c-contrast);
    color: var(--nb-c-surface);
  }
}

.nb-chip-group--sm .nb-chip-group__chip {
  height: calc(var(--nb-base-unit) * 3);
  padding-inline: var(--nb-base-unit);
  font-size: var(--nb-type-body-sm-size);
}

@include motion.reduced {
  .nb-chip-group__chip {
    transition: none;
  }
}
</style>
