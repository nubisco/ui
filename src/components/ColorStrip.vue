<template>
  <div
    :class="['nb-color-strip-wrapper', `nb-color-strip-wrapper--${variant}`]"
  >
    <!-- DEFAULT variant: label above via NbLabel -->
    <template v-if="variant === 'default'">
      <slot v-if="$slots.label" name="label" />
      <NbLabel v-else-if="label" :for="colorStripId" :disabled="false">
        {{ label }}
      </NbLabel>
    </template>

    <!-- FLUID variant: label inside the field box -->
    <div
      v-if="variant === 'fluid' && (label || $slots.label)"
      class="nb-color-strip-wrapper__inner-header"
    >
      <slot v-if="$slots.label" name="label" />
      <label v-else class="nb-color-strip-wrapper__inner-label">{{
        label
      }}</label>
    </div>

    <!-- Strip (always rendered) -->
    <NbGrid
      :id="colorStripId"
      dir="row"
      gap="xs"
      :class="classes"
      :shrink="false"
      :style="stripStyle"
    >
      <NbGrid
        is="button"
        v-for="option in optionsToRender"
        :key="`option-${option.id || option.value}`"
        align="center"
        justify="center"
        :class="buttonClasses(option)"
        :style="buttonStyle(option)"
        :disabled="option.disabled"
        @click="!onlyView && selectOption(option.value)"
      >
        <NbIcon
          v-if="!onlyView && isSelected(option.value) && !isNullOption(option)"
          name="check-light"
          :color="getContrastingColor(option)"
        />
        <NbIcon
          v-if="isNullOption(option)"
          name="empty"
          :weight="getNullOptionWeight(option)"
        />
      </NbGrid>
    </NbGrid>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useId } from 'vue'
import { IColorStripProps, IOption } from './ColorStrip'

const props = withDefaults(defineProps<IColorStripProps>(), {
  options: () => ['#DCDCDC', '#C0C0C0', '#808080'],
  onlyView: false,
  allowMultiple: false,
  wrap: false,
  showNull: false,
  label: undefined,
  id: undefined,
  variant: 'default',
})

const autoId = `nb-color-strip-${useId()}`
const colorStripId = computed(() => props.id ?? autoId)

const model = defineModel<any>({
  set: (val) => val,
})

const normalizedOptions = computed<IOption[]>(() => {
  return props.options.map((item) => {
    if (typeof item === 'string') {
      return {
        value: item,
        color: item,
      }
    } else {
      return {
        ...item,
        color: item.color || '#FFFFFF',
        value: item.value !== undefined ? item.value : item.color,
      }
    }
  })
})

const nullOption: IOption = {
  id: 'null-option',
  value: null as unknown as string | number,
  color: 'transparent',
  label: 'None',
}

const hasNullState = ref(model.value == null)

watch(
  () => model.value,
  (value) => {
    if (value == null) {
      hasNullState.value = true
    }
  },
)

const shouldShowNullOption = computed(() => {
  if (props.allowMultiple) return false

  return props.showNull || hasNullState.value
})

const optionsToRender = computed<IOption[]>(() => {
  if (shouldShowNullOption.value) {
    return [nullOption, ...normalizedOptions.value]
  }

  return normalizedOptions.value
})

const COLOR_DIAMETER_PX = 30
const WRAP_GAP_PX = 8

const stripStyle = computed(() => {
  if (!props.wrap) {
    return {
      maxWidth: 'none',
      flexWrap: 'nowrap',
    }
  }

  const colorCount = optionsToRender.value.length
  if (colorCount <= 0) return undefined

  const columns = Math.ceil(Math.sqrt(colorCount))
  const maxWidth = columns * COLOR_DIAMETER_PX + (columns - 1) * WRAP_GAP_PX

  return {
    maxWidth: `${maxWidth}px`,
    flexWrap: 'wrap',
  }
})

const classes = computed(() => ({
  'nb-color-strip': true,
  'only-view': props.onlyView,
}))

const isSelected = (value: string | number | null | undefined) => {
  if (props.onlyView) return false

  if (value === null) {
    return model.value == null
  }

  if (value === undefined) return false

  if (props.allowMultiple) {
    return Array.isArray(model.value) && model.value.includes(value)
  } else {
    return model.value === value
  }
}

const buttonClasses = (option: IOption) => ({
  'nb-color-strip-color': true,
  'nb-color-strip-color-null': isNullOption(option),
  selected: !props.onlyView && isSelected(option.value),
})

const buttonStyle = (option: IOption) => {
  if (isNullOption(option)) return undefined

  return {
    backgroundColor: option.color,
  }
}

const isNullOption = (option: IOption) => option.id === 'null-option'

const getNullOptionWeight = (option: IOption): any => {
  return isSelected(option.value) ? 'duotone' : 'regular'
}

const selectOption = (value: string | number | null | undefined) => {
  if (value === undefined) return

  if (!props.allowMultiple && value === null) {
    model.value = null
    return
  }

  if (props.allowMultiple) {
    const current = Array.isArray(model.value) ? model.value.slice() : []
    const index = current.indexOf(value)
    if (index !== -1) {
      current.splice(index, 1)
    } else {
      current.push(value)
    }
    model.value = current
  } else {
    model.value = value
  }
}

// Utility function to get contrast color
function getContrastingColor(option: string | IOption): string {
  const color = typeof option === 'string' ? option : option.color
  const resolvedColor =
    color && color.startsWith('var(')
      ? getComputedStyle(document.documentElement)
          .getPropertyValue(color.slice(4, -1).trim())
          .trim()
      : color

  const { r, g, b } = hexToRgb(resolvedColor || '#FFFFFF')
  // Calculate luminance according to WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'black' : 'white'
}

function hexToRgb(hex: string) {
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(cleanHex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}
</script>

<style lang="scss" scoped>
$nb-color-diameter: 30px;

.nb-color-strip-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;

  // ── Fluid variant ──────────────────────────────────────────────────────────
  &--fluid {
    justify-content: space-between;
    gap: 0;
    background: var(--nb-c-field-bg);
    border-bottom: 1px solid var(--nb-c-field-border);
    padding-top: 8px;
    min-height: calc(var(--nb-base-unit) * 8);

    .nb-color-strip {
      padding: 0 var(--nb-field-padding-h) 6px;
    }
  }
}

// ── Fluid inner header ────────────────────────────────────────────────────────
.nb-color-strip-wrapper__inner-header {
  display: flex;
  align-items: center;
  padding: 0 var(--nb-field-padding-h);
  margin-bottom: 4px;
}

.nb-color-strip-wrapper__inner-label {
  flex: 1;
  min-width: 0;
  font-family: var(--nb-font-family-sans);
  font-size: var(--nb-font-size-12);
  font-weight: 500;
  color: var(--nb-c-text-muted);
  letter-spacing: 0.02em;
  cursor: default;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Strip ─────────────────────────────────────────────────────────────────────
.nb-color-strip {
  display: flex;
  flex-wrap: wrap;
  max-width: calc(#{$nb-color-diameter} * 8 + 8px * 7);

  :deep(button) {
    position: relative;
    width: $nb-color-diameter;
    height: $nb-color-diameter;
    border: 1px solid transparent;
    cursor: pointer;
    padding: 0;
    transition:
      border 0.2s,
      box-shadow 0.2s;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &:focus,
    &:focus-visible,
    &.selected {
      border: 1px solid var(--nb-c-surface);
      outline: 0;

      &:before {
        content: '';
        position: absolute;
        top: calc(var(--nb-base-unit) / -2);
        left: calc(var(--nb-base-unit) / -2);
        right: calc(var(--nb-base-unit) / -2);
        bottom: calc(var(--nb-base-unit) / -2);
        border: 2px solid var(--nb-c-primary);
      }
    }

    &.nb-color-strip-color-null {
      border-color: var(--nb-c-primary);
      color: var(--nb-c-primary);
    }
  }
}

.only-view {
  :deep(button) {
    cursor: initial;

    &:focus,
    &:focus-visible,
    &.selected {
      border-color: transparent;
      outline: initial;

      &:before {
        content: none;
      }
    }
  }
}
</style>
