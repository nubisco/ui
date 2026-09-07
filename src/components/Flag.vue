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
import { computed } from 'vue'
import { ESizePixel, IFlagProps } from './Flag.d'
import { useStableId } from '@/composables/useStableId.composable'
import { getRegisteredFlag } from '@/composables/flagRegistry'
import {
  glyphNameOf,
  pickWeight,
  resolveFromCatalog,
} from '@/composables/glyphCatalog.composable'

const props = withDefaults(defineProps<IFlagProps>(), {
  name: undefined,
  flag: undefined,
  size: ESizePixel.Medium,
  clickable: false,
})

const emit = defineEmits(['click'])

/** The country code, when one was given as a string rather than a module. */
const source = computed(() => props.flag ?? props.name)

/**
 * The country code: given directly, or read back off the module when the
 * compile-time plugin substituted one, so the identity class is the same
 * either way.
 */
const flagName = computed(() => {
  const code =
    typeof source.value === 'string' ? source.value : glyphNameOf(source.value)
  return code?.replaceAll('_', '-').toLowerCase()
})

/** A flag module passed directly, through either `flag` or `name`. */
const flagModule = computed(() =>
  typeof source.value === 'string' ? undefined : source.value,
)

const componentInternalId = useStableId({ name: flagName.value })

const classes = computed(() => {
  return {
    'nb-flag': true,
    ...(flagName.value && { [`nb-flag--${flagName.value}`]: true }),
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
  // An explicitly supplied module wins: the bundler linked exactly this flag.
  if (flagModule.value) return pickWeight(flagModule.value)

  const name =
    typeof source.value === 'string'
      ? source.value.replaceAll('_', '-').toLowerCase()
      : undefined
  if (!name) return undefined

  // Then the app-level registry, which is also how an app declares the
  // bounded set of flags it knows it will need without loading everything.
  const custom = getRegisteredFlag(name)
  if (custom) return custom

  // Finally the full catalogue, which throws if it was never loaded. A country
  // selector is the case that legitimately needs it.
  const fromCatalog = resolveFromCatalog('flag', name)
  if (!fromCatalog && import.meta.env?.DEV) {
    console.error(
      `[@nubisco/ui] <NbFlag> found no flag named "${name}" in the loaded catalogue.`,
    )
  }
  return fromCatalog
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
