<template>
  <nb-grid dir="col" class="color-steps-generator">
    <!-- Color Name Display -->
    <nb-grid
      v-if="colorName"
      class="color-name-display"
      align="center"
      justify="center"
      gap="sm"
    >
      <span class="color-name-label">Color Name:</span>
      <pre class="color-name-value">{{ colorName }}</pre>
    </nb-grid>

    <!-- Color Palette Section -->
    <nb-grid class="color-palette" gap="xs" align="center">
      <nb-grid
        v-for="(colorSample, index) in sortedColors"
        :key="`colorSample-${index}`"
        dir="col"
        align="center"
        gap="xs"
        class="color-swatch"
        @click="selectColor(index)"
      >
        <nb-grid
          class="color-swatch-inner"
          align="center"
          justify="center"
          :style="{
            backgroundColor: `#${colorSample.original}`,
            color: `#${colorSample.a11y}`,
          }"
        >
          <span v-if="index === selectedColorIndex" class="checkmark">✓</span>
        </nb-grid>
        <span
          class="color-label"
          :class="{ 'base-color-label': index === baseColorIndex }"
        >
          {{ index }}
        </span>
      </nb-grid>
    </nb-grid>

    <!-- Large Color Preview Section -->
    <nb-grid
      class="color-preview"
      align="center"
      justify="center"
      :style="{
        backgroundColor: `#${selectedColor.original}`,
        color: `#${selectedColor.a11y}`,
      }"
      @click="openColorPicker"
    >
      <input
        ref="colorPicker"
        v-model="colorModel"
        type="color"
        class="hidden-color-picker"
      />
      <nb-grid dir="col" align="center" gap="xs">
        <span class="hex-value"
          >#{{ selectedColor.original.toUpperCase() }}</span
        >
        <span class="preview-text">Click to change color</span>
      </nb-grid>
    </nb-grid>
  </nb-grid>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useColor } from '../composables/useColor'

const { getColorName, makeShades } = useColor()

const colorModel = ref('#214da6')
const colorName = ref('')
const selectedColorIndex = ref(null)
const colorPicker = ref(null)

const computedColours = computed(() => {
  const result = makeShades(colorModel.value.replace('#', ''))
  return result
})

// Sort colors from darkest to lightest (900 to 50)
const sortedColors = computed(() => {
  const colors = computedColours.value.all
  const sortedKeys = Object.keys(colors).sort(
    (a, b) => parseInt(b) - parseInt(a),
  )
  const sorted = {}
  sortedKeys.forEach((key) => {
    sorted[key] = colors[key]
  })
  return sorted
})

// Find the base color index
const baseColorIndex = computed(() => {
  return computedColours.value.default
})

// Get the currently selected color object
const selectedColor = computed(() => {
  if (selectedColorIndex.value !== null) {
    return computedColours.value.all[selectedColorIndex.value]
  }
  return computedColours.value.all[computedColours.value.default]
})

// Initialize selected color to base color
watch(
  () => computedColours.value.default,
  (newDefault) => {
    if (selectedColorIndex.value === null) {
      selectedColorIndex.value = newDefault
    }
  },
  { immediate: true },
)

// Select a color from the palette
const selectColor = (colorIndex) => {
  selectedColorIndex.value = colorIndex
}

// Open the color picker
const openColorPicker = () => {
  colorPicker.value?.click()
}

watch(
  () => colorModel.value,
  async (value) => {
    colorName.value = await getColorName(value)
    // Reset selected color to base when main color changes
    selectedColorIndex.value = computedColours.value.default
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.color-steps-generator {
  gap: var(--nb-base-unit);

  .color-name-display {
    background-color: var(--vp-c-bg-soft);
    padding: var(--nb-base-unit);
    border-radius: var(--nb-base-unit);
    border: 1px solid var(--vp-c-border);

    .color-name-label {
      font-size: 14px;
      color: var(--vp-c-text-2);
      font-weight: 500;
    }

    .color-name-value {
      font-size: 16px;
      color: var(--vp-c-text-1);
      font-weight: 600;
      margin: 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
  }

  .color-palette {
    background-color: var(--vp-c-bg-soft);
    padding: var(--nb-base-unit);
    border-radius: var(--nb-base-unit);
    flex-wrap: wrap;
    justify-content: center;
    border: 1px solid var(--vp-c-border);

    .color-swatch {
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .color-swatch-inner {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 16px;
        font-weight: 500;
        transition: all 0.2s ease;
        border: 2px solid transparent;
        position: relative;

        .checkmark {
          font-size: 18px;
          font-weight: bold;
        }
      }

      .color-label {
        font-size: 12px;
        color: var(--vp-c-text-2);
        font-weight: 500;
        margin-top: 4px;
        transition: all 0.2s ease;

        &.base-color-label {
          font-weight: 600;
          color: var(--vp-c-text-1);
        }
      }

      // Default shade highlighting - make it circular
      &:has(.base-color-label) {
        .color-swatch-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
        }

        .color-label {
          font-weight: 600;
          color: var(--vp-c-brand-1);
        }
      }
    }
  }

  .color-preview {
    min-height: 200px;
    border-radius: var(--nb-base-unit);
    font-size: 18px;
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    padding: var(--nb-base-unit);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .hidden-color-picker {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .hex-value {
      font-size: 24px;
      font-weight: 700;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      letter-spacing: 1px;
      user-select: all;
      cursor: text;
    }

    .preview-text {
      opacity: 0.8;
      transition: opacity 0.2s ease;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      font-size: 14px;
    }

    &:hover .preview-text {
      opacity: 1;
    }
  }
}
</style>
