<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :class="classes"
    v-bind="
      interactive
        ? { type: 'button', 'aria-label': say('control') }
        : { role: 'img', 'aria-label': say('mark') }
    "
  >
    <span
      v-if="variant === EAiLabelVariant.Inline"
      class="nb-ai-label--dot"
      aria-hidden="true"
    />
    <span
      v-if="variant === EAiLabelVariant.Inline && say('text')"
      class="nb-ai-label--text"
      aria-hidden="true"
      >{{ say('text') }}</span
    >
    <svg
      v-else
      class="nb-ai-label--glyph"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-hidden="true"
    >
      <path
        d="M 104.301 197.8 L 94.501 162.4 L 53.101 162.4 L 43.501 197.8 L 17.101 197.8 L 56.301 58.2 L 92.701 58.2 L 132.101 197.8 L 104.301 197.8 Z M 74.701 84 L 73.101 84 L 57.701 141 L 90.101 141 L 74.701 84 Z M 150.099 197.8 L 150.099 178.2 L 181.499 178.2 L 181.499 77.8 L 150.099 77.8 L 150.099 58.2 L 238.899 58.2 L 238.899 77.8 L 207.499 77.8 L 207.499 178.2 L 238.899 178.2 L 238.899 197.8 L 150.099 197.8 Z"
        fill="currentColor"
      />
    </svg>
  </component>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import { EAiLabelVariant, EAiLabelSize, type IAiLabelProps } from './AiLabel.d'

const props = withDefaults(defineProps<IAiLabelProps>(), {
  variant: EAiLabelVariant.Default,
  size: EAiLabelSize.Medium,
  static: false,
  label: undefined,
  text: undefined,
})

/**
 * The words the label says, in English. A prop replaces any of them, and
 * every read goes through `say()`, so a strings provider can sit between the
 * prop and this fallback without a change to the props.
 */
const STRINGS = {
  /** Accessible name of the label when it is a button. */
  control: 'AI, show information',
  /** Accessible name of the label when it is a mark. */
  mark: 'Written by AI',
  /** The visible word of the inline variant. */
  text: 'AI',
} as const

function say(key: keyof typeof STRINGS): string {
  if (key === 'text') return props.text ?? STRINGS.text
  return props.label ?? STRINGS[key]
}

const attrs = useAttrs()

/**
 * A button exists because there is something to do. A label with nothing to
 * open and no click listener is a mark, never an inert button: a screen
 * reader would otherwise reach a control that does nothing.
 *
 * `useAttrs()` is not reactive on its own, but a change of listeners
 * re-renders the component, and the template reads this on every render.
 */
const interactive = computed(() => !props.static && !!attrs.onClick)

const classes = computed(() => ({
  'nb-ai-label': true,
  [`nb-ai-label__${props.variant}`]: true,
  [`nb-ai-label__${props.size}`]: true,
  'nb-ai-label__static': !interactive.value,
}))
</script>

<style lang="scss" scoped>
@use '../styles/logic/radius' as radius;

.nb-ai-label {
  --nb-ai-label-box: calc(var(--nb-base-unit) * 4);
  --nb-ai-label-glyph: calc(var(--nb-base-unit) * 2);
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--nb-ai-label-box);
  height: var(--nb-ai-label-box);
  margin: 0;
  padding: 0;
  border: solid 1px var(--nb-c-border);
  background: transparent;
  color: inherit;
  font: inherit;
  vertical-align: middle;
  // A small mark, so it follows the control corner.
  @include radius.standalone(control-sm);

  &--dot {
    flex-shrink: 0;
    width: calc(var(--nb-base-unit) / 2);
    height: calc(var(--nb-base-unit) / 2);
    border-radius: var(--nb-radius-pill);
    background: currentColor;
  }

  &--glyph {
    width: var(--nb-ai-label-glyph);
    height: var(--nb-ai-label-glyph);
  }

  &--text {
    font-weight: var(--nb-type-label-md-weight);
    line-height: 1;
  }

  // 24, 32 and 40px on the base unit, with a glyph half the box.
  &__sm {
    --nb-ai-label-box: calc(var(--nb-base-unit) * 3);
    --nb-ai-label-glyph: calc(var(--nb-base-unit) * 1.5);
  }

  &__lg {
    --nb-ai-label-box: calc(var(--nb-base-unit) * 5);
    --nb-ai-label-glyph: calc(var(--nb-base-unit) * 2.5);
  }

  // Inline: a dot and a word, set in the type it sits beside (12, 14, 16px).
  &__inline {
    gap: calc(var(--nb-base-unit) / 2);
    width: fit-content;
    height: auto;
    padding: calc(var(--nb-base-unit) / 4);
    border: none;
    font-size: var(--nb-font-size-14);

    &.nb-ai-label__sm {
      font-size: var(--nb-font-size-12);
    }

    &.nb-ai-label__lg {
      font-size: var(--nb-font-size-16);
    }

    .nb-ai-label--glyph {
      width: 1.15em;
      height: 1.15em;
    }
  }

  &:not(.nb-ai-label__static) {
    cursor: pointer;

    &:focus-visible {
      outline: solid 2px var(--nb-c-focus-ring);
      outline-offset: 1px;
    }
  }

  &__default:not(.nb-ai-label__static):hover {
    background: var(--nb-c-contrast);
    color: var(--nb-c-surface);
  }

  &__inline:not(.nb-ai-label__static):hover {
    outline: solid 1px var(--nb-c-border);
  }
}
</style>
