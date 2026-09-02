<template>
  <component
    :is="tag"
    class="nb-card"
    :class="{
      'nb-card--interactive': isInteractive,
      'nb-card--selected': selected,
      'nb-card--disabled': disabled,
    }"
    v-bind="attrs"
    @click="onClick"
    @keydown="onKeydown"
  >
    <div v-if="icon || $slots.icon" class="nb-card__icon">
      <slot name="icon">
        <NbIcon :name="icon!" :size="20" aria-hidden="true" />
      </slot>
    </div>

    <div class="nb-card__head">
      <span class="nb-card__title">
        <slot name="title">{{ title }}</slot>
      </span>
      <span v-if="subtitle || $slots.subtitle" class="nb-card__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </span>
    </div>

    <div v-if="$slots.default" class="nb-card__body">
      <slot />
    </div>

    <!-- Pushed to the bottom by the body's `flex: 1`, so a row of cards with
         different amounts of description still lines its footers up. That is
         the thing hand-rolled card grids most often get wrong. -->
    <div v-if="$slots.footer" class="nb-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ICardProps } from './CardGrid.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<ICardProps>(), {
  title: '',
  subtitle: '',
  icon: undefined,
  href: undefined,
  target: undefined,
  clickable: false,
  selected: false,
  disabled: false,
})

const emit = defineEmits<{ select: [] }>()

// A card that navigates is a link, a card that acts is a button, and a card
// that does neither is a div. Picking the element from the behaviour is what
// gives each case the right keyboard and the right browser affordances without
// the consumer having to ask for them.
const isLink = computed(() => !!props.href && !props.disabled)
const isInteractive = computed(
  () => (isLink.value || props.clickable) && !props.disabled,
)
const tag = computed(() =>
  isLink.value ? 'a' : props.clickable ? 'div' : 'div',
)

const attrs = computed(() => {
  if (isLink.value)
    return {
      href: props.href,
      target: props.target,
      rel: props.target === '_blank' ? 'noopener' : undefined,
    }
  if (props.clickable && !props.disabled)
    return {
      role: 'button',
      tabindex: 0,
      'aria-pressed': props.selected ? true : undefined,
    }
  return {}
})

function onClick() {
  if (!props.clickable || props.disabled || isLink.value) return
  emit('select')
}

function onKeydown(event: KeyboardEvent) {
  if (!props.clickable || props.disabled || isLink.value) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('select')
}
</script>

<style scoped lang="scss">
.nb-card {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-4);
  padding: var(--nb-spacing-16);
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-xs);
  color: inherit;
  text-decoration: none;
  // Cards in a grid are stretched to the row's height by default; this is what
  // lets the footer sit on the bottom edge rather than under the description.
  height: 100%;
}

.nb-card--interactive {
  cursor: pointer;
  transition:
    background 70ms linear,
    border-color 70ms linear;

  &:hover {
    background: var(--nb-c-surface-hover);
    border-color: var(--nb-c-layer-border-2);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-card--selected {
  border-color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

.nb-card--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.nb-card__icon {
  display: flex;
  align-items: center;
  color: var(--nb-c-text-subtle);
  margin-bottom: var(--nb-spacing-4);
}

.nb-card__head {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-2);
  min-width: 0;
}

.nb-card__title {
  font-size: var(--nb-font-size-14);
  font-weight: var(--nb-font-weight-semibold, 600);
  line-height: 1.3;
  color: var(--nb-c-text);
  overflow-wrap: anywhere;
}

.nb-card__subtitle {
  font-size: var(--nb-font-size-12);
  line-height: 1.4;
  color: var(--nb-c-text-subtle);
}

.nb-card__body {
  flex: 1 1 auto;
  margin-top: var(--nb-spacing-8);
  font-size: var(--nb-font-size-12);
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

.nb-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4);
  margin-top: var(--nb-spacing-12);
}

@media (prefers-reduced-motion: reduce) {
  .nb-card--interactive {
    transition: none;
  }
}
</style>
