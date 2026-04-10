<template>
  <!-- SVG filter definition — invisible, just hosts the feDisplacementMap -->
  <svg
    v-if="supported"
    aria-hidden="true"
    style="
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      pointer-events: none;
    "
  >
    <defs>
      <filter
        :id="filterId"
        color-interpolation-filters="sRGB"
        :x="0"
        :y="0"
        :width="1"
        :height="1"
      >
        <feImage
          v-if="mapDataUrl"
          :href="mapDataUrl"
          :width="width"
          :height="height"
          x="0"
          y="0"
          result="displacement_map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="displacement_map"
          :scale="mapScale"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>

  <!-- Glass surface -->
  <div
    class="nb-liquid-glass"
    :class="[
      `nb-liquid-glass--${shape}`,
      { 'nb-liquid-glass--unsupported': !supported },
    ]"
    :style="glassStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from 'vue'
import { buildDisplacementMap, type TGlassShape } from './displacement'

interface IProps {
  /** Pixel width of the glass surface */
  width: number
  /** Pixel height of the glass surface */
  height: number
  /** Surface profile */
  shape?: TGlassShape
  /** Index of refraction (glass medium). Typical glass: 1.5 */
  ior?: number
  /** Border radius override (CSS value). Defaults to 50% for circle/squircle. */
  borderRadius?: string
}

const props = withDefaults(defineProps<IProps>(), {
  shape: 'squircle',
  ior: 1.5,
  borderRadius: undefined,
})

// Unique filter ID so multiple instances on the same page don't collide
const uid = useId()
const filterId = `nb-lg-${uid}`

const mapDataUrl = ref<string | null>(null)
const mapScale = ref(0)

// Chrome is currently the only browser that supports SVG filters as backdrop-filter
const supported = ref(false)

function detectSupport(): boolean {
  if (typeof CSS === 'undefined') return false
  // The CSS.supports check can't test SVG filter URLs directly;
  // we rely on the webkit prefix being absent only on Chromium.
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') &&
    /Chrome/.test(navigator.userAgent)
  )
}

function rebuild() {
  if (!supported.value) return
  const { dataUrl, scale } = buildDisplacementMap({
    width: props.width,
    height: props.height,
    shape: props.shape,
    ior: props.ior,
  })
  mapDataUrl.value = dataUrl
  mapScale.value = scale
}

onMounted(() => {
  supported.value = detectSupport()
  rebuild()
})

onBeforeUnmount(() => {
  mapDataUrl.value = null
})

// Rebuild when props that affect the displacement map change
watch(() => [props.width, props.height, props.shape, props.ior], rebuild)

const defaultBorderRadius = computed(() => {
  if (props.borderRadius) return props.borderRadius
  // Circular shapes get 50%, pill-like shapes get the shorter dimension
  switch (props.shape) {
    case 'circle':
      return '50%'
    case 'squircle':
      return '38%'
    case 'concave':
      return '50%'
    case 'lip':
      return `${Math.round(Math.min(props.width, props.height) * 0.15)}px`
    default:
      return '50%'
  }
})

const glassStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  borderRadius: defaultBorderRadius.value,
  ...(supported.value && mapDataUrl.value
    ? { backdropFilter: `url(#${filterId})` }
    : {}),
}))
</script>

<style lang="scss" scoped>
.nb-liquid-glass {
  position: relative;
  overflow: hidden;
  isolation: isolate;

  // Subtle rim: a thin inset highlight to sell the glass edge
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: radial-gradient(
      ellipse at 30% 25%,
      rgba(255, 255, 255, 0.18) 0%,
      transparent 60%
    );
    pointer-events: none;
    z-index: 1;
  }

  // Specular highlight — small bright spot near the top-left
  &::after {
    content: '';
    position: absolute;
    top: 8%;
    left: 12%;
    width: 35%;
    height: 22%;
    border-radius: 50%;
    background: radial-gradient(
      ellipse,
      rgba(255, 255, 255, 0.45) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 2;
    filter: blur(4px);
  }

  // Slot content sits above the glass overlays
  :deep(> *) {
    position: relative;
    z-index: 3;
  }

  // Non-Chrome fallback: frosted glass via standard backdrop-filter blur
  &--unsupported {
    backdrop-filter: blur(12px) saturate(1.4);
    background: rgba(255, 255, 255, 0.12);
  }
}
</style>
