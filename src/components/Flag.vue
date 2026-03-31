<template>
  <i
    :class="classes"
    :style="styles"
    v-bind="attributes"
    @click="!clickable ? undefined : emit('click', $event)"
  >
    <component
      :is="flagComponent"
      v-if="flagComponent"
      :aria-hidden="true"
      :width="attributes.width"
      :height="attributes.height"
      :style="styles"
    />
  </i>
</template>

<script setup lang="ts">
// @ts-expect-error virtual module provided by flags vite plugin
import flags from 'virtual:flags'
import { computed } from 'vue'
import kebab2camel from '@/utils/kebab2camel.helper'
import { ESizePixel, IFlagProps } from './Flag.d'
import { useStableId } from '@/composables/useStableId.composable'

const props = withDefaults(defineProps<IFlagProps>(), {
  name: undefined,
  size: ESizePixel.Medium,
  clickable: false,
})

const emit = defineEmits(['click'])

const componentInternalId = useStableId(props)

const classes = computed(() => {
  return {
    'nb-flag': true,
    ...(props.name && { [`nb-flag--${props.name}`]: true }),
    [`nb-flag--${props.size}`]:
      typeof props.size === 'string' && ['sm', 'md', 'lg'].includes(props.size),
    'box-clickable': props.clickable,
  }
})

const styles = computed(() => {
  return {
    ...(typeof props.size === 'number' && {
      maxWidth: `${props.size}px`,
      maxHeight: `${props.size}px`,
      height: `${props.size}px`,
      width: `${props.size}px`,
    }),
    ...(typeof props.size === 'string' &&
      !['sm', 'md', 'lg'].includes(props.size) && {
        maxWidth: props.size,
        maxHeight: props.size,
        height: props.size,
        width: props.size,
      }),
  }
})

const attributes = computed(() => {
  const flagSize =
    typeof props.size === 'number'
      ? props.size
      : (ESizePixel as unknown as Record<string, number>)[
          String(props.size).toUpperCase()
        ] || ESizePixel.Medium

  return {
    ...{ id: componentInternalId },
    ...(props.size && {
      width: `${flagSize}px`,
      height: `${flagSize}px`,
    }),
    ...(props.clickable && { role: 'button' }),
  }
})

const flagComponent = computed(() => {
  return flags[kebab2camel(`f-${props.name.replaceAll('_', '-')}`)]
})
</script>

<style lang="scss" scoped>
.nb-flag {
  display: flex;
  line-height: 1em;
  position: relative;
  height: fit-content;

  &:not(.box-clickable) {
    pointer-events: none;
  }

  &--lg {
    max-width: 32px;
    max-height: 32px;
    width: 32px;
  }
  &--md {
    max-width: 20px;
    max-height: 20px;
    width: 20px;
  }
  &--sm {
    max-width: 16px;
    max-height: 16px;
    width: 16px;
  }
}
</style>
