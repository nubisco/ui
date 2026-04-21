<template>
  <NbGrid
    is="button"
    align="center"
    v-bind="{ ...(variant === EAiLabelVariant.Inline && { gap: 'sm' }) }"
    justify="center"
    :class="classes"
  >
    <div v-if="variant === EAiLabelVariant.Inline" class="nb-ai-label--dot" />
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <path
        d="M 104.301 197.8 L 94.501 162.4 L 53.101 162.4 L 43.501 197.8 L 17.101 197.8 L 56.301 58.2 L 92.701 58.2 L 132.101 197.8 L 104.301 197.8 Z M 74.701 84 L 73.101 84 L 57.701 141 L 90.101 141 L 74.701 84 Z M 150.099 197.8 L 150.099 178.2 L 181.499 178.2 L 181.499 77.8 L 150.099 77.8 L 150.099 58.2 L 238.899 58.2 L 238.899 77.8 L 207.499 77.8 L 207.499 178.2 L 238.899 178.2 L 238.899 197.8 L 150.099 197.8 Z"
        fill="currentColor"
      />
    </svg>
  </NbGrid>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { EAiLabelVariant, EAiLabelSize, IAiLabelProps } from './AiLabel.d'

const props = withDefaults(defineProps<IAiLabelProps>(), {
  variant: EAiLabelVariant.Default,
  size: EAiLabelSize.Medium,
})

const classes = computed(() => {
  return {
    'nb-ai-label': true,
    [`nb-ai-label__${props.variant}`]: true,
    [`nb-ai-label__${props.size}`]: true,
  }
})
</script>

<style lang="scss" scoped>
.nb-ai-label {
  width: calc(var(--nb-base-unit) * 4);
  height: calc(var(--nb-base-unit) * 4);
  border: solid 1px var(--nb-c-border);
  &--dot {
    width: var(--nb-base-unit);
    height: var(--nb-base-unit);
    background: var(--nb-c-contrast);
  }
  svg {
    width: calc(var(--nb-base-unit) * 2);
    height: calc(var(--nb-base-unit) * 2);
  }
  &__default {
    &:hover {
      background: var(--nb-c-contrast);
      color: var(--nb-c-surface);
      cursor: pointer;
    }
    &:focus {
      outline: solid 2px var(--nb-c-primary);
      outline-offset: -2px;
    }
  }
  &__inline {
    border: none;
    height: calc(var(--nb-base-unit) * 2);
    width: fit-content;
    padding: calc(var(--nb-base-unit) / 4);
    position: relative;

    svg {
      width: calc(var(--nb-base-unit) * 2);
      height: calc(var(--nb-base-unit) * 2);
    }
    &:hover {
      outline: solid 1px var(--nb-c-border);
      cursor: pointer;
    }
    &:focus {
      outline: solid 2px var(--nb-c-primary);
    }
  }
  &__default {
  }

  &__small {
  }

  &__large {
  }
}
</style>
