<template>
  <!-- PixiJS scene canvas. Sits behind the interactive DOM overlay and draws
       the grid, wires, flow, and (while panning/zooming or at far zoom) the
       natively-painted cards. pointer-events: none so the root container
       still receives canvas-level gestures (marquee, pan). -->
  <canvas ref="canvasRef" class="nb-blueprint-pixi__canvas" />

  <!-- Interactive DOM overlay. Carries the real cards (the `#card` slot) and
       the transparent wire hit-regions, so every existing NbBlueprint
       interaction (drag, marquee, wire hover/menu) works unchanged. It is
       camera-transformed to stay aligned with the Pixi scene, and hidden
       (visibility) during gestures / far zoom, when Pixi shows the scene. -->
  <div
    ref="overlayRef"
    class="nb-blueprint__canvas nb-blueprint-pixi__overlay"
    :style="overlayStyle"
  >
    <svg class="nb-blueprint__wires">
      <!-- Visible wires are normally drawn by Pixi; before the scene is ready
           we draw them here so wires never flash missing on the swap. -->
      <template v-if="!pixiReady">
        <path
          v-for="(wire, i) in wires"
          :key="`w-${i}`"
          :d="wire.path"
          fill="none"
          :stroke="wire.color"
          stroke-width="1.5"
          class="nb-blueprint__wire"
          :class="{
            'nb-blueprint__wire--inactive': wire.conn.active === false,
          }"
          pointer-events="none"
        />
      </template>
      <!-- Transparent hit-regions for wire interaction (always DOM). -->
      <path
        v-for="(wire, i) in wires"
        :key="`h-${i}`"
        :d="wire.path"
        fill="none"
        stroke="transparent"
        stroke-width="14"
        class="nb-blueprint__wire-hitregion"
        :data-wire-index="i"
        @mousedown="emit('wire-mousedown', $event, wire.conn)"
        @contextmenu.prevent="emit('wire-contextmenu', $event, wire.conn)"
        @mousemove="emit('wire-mousemove', $event, wire.conn)"
        @mouseleave="emit('wire-mouseleave', wire.conn)"
      />
      <!-- Active wire being dragged from a port (interaction-time, DOM). -->
      <path
        v-if="dragWire"
        :d="dragWire"
        fill="none"
        stroke="var(--nb-c-primary)"
        stroke-width="2"
        stroke-dasharray="6 3"
        opacity="0.6"
      />
    </svg>

    <template v-if="windowed">
      <div
        v-for="card in visibleCards"
        :key="card.id"
        class="nb-blueprint__card-wrapper"
        :style="{
          position: 'absolute',
          left: `${card.x}px`,
          top: `${card.y}px`,
        }"
      >
        <slot name="card" :card="card" />
      </div>
    </template>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { IBlueprintConnection } from './Blueprint.types'
import type { IBlueprintRendererProps } from './Blueprint.renderer'
import type { PixiScene as PixiSceneType } from './blueprint-pixi/pixi-scene'
import type { TCardLod } from './blueprint-pixi/card-paint'

// Below this zoom the DOM cards are hidden and Pixi paints them: they are too
// small to read or interact with precisely, so the cheap painted tier wins.
const DOM_ZOOM_MIN = 0.5

const props = defineProps<IBlueprintRendererProps>()

const emit = defineEmits<{
  'wire-mousedown': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-contextmenu': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-mousemove': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-mouseleave': [conn: IBlueprintConnection]
  /** PixiJS could not initialise (WebGL/context failure). NbBlueprint falls
   *  back to the DOM renderer. */
  unavailable: [reason: unknown]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const overlayRef = ref<HTMLDivElement>()
const pixiReady = ref(false)

let scene: PixiSceneType | null = null
let resizeObserver: ResizeObserver | undefined

// The DOM overlay (real cards) is shown at rest and readable zoom; hidden
// during gestures and far zoom, when Pixi shows the scene. The overlay
// transform tracks the camera at all times so port positions stay correct
// for NbBlueprint's wire computation even while hidden (cheap: a transform
// on a hidden layer is not composited).
// In legacy (non-windowed) mode the host owns arbitrary card DOM that Pixi
// cannot paint, so the DOM overlay stays visible at all times (Pixi only
// accelerates the grid and wires there). In windowed mode Pixi paints the
// visible cards, so the DOM overlay can hide during gestures / at far zoom.
const domVisible = computed(
  () =>
    !props.windowed || (!props.isTransforming && props.zoom >= DOM_ZOOM_MIN),
)
const cardLod = computed<TCardLod>(() =>
  props.zoom >= DOM_ZOOM_MIN ? 'full' : 'box',
)

const overlayStyle = computed(() => ({
  transform: `translate(${props.panX}px, ${props.panY}px) scale(${props.zoom})`,
  transformOrigin: '0 0',
  visibility: domVisible.value ? ('visible' as const) : ('hidden' as const),
}))

function sizeOf(): { width: number; height: number } {
  const host = canvasRef.value?.parentElement
  return {
    width: host?.clientWidth ?? 0,
    height: host?.clientHeight ?? 0,
  }
}

async function initScene(): Promise<void> {
  const canvas = canvasRef.value
  const overlay = overlayRef.value
  if (!canvas || !overlay) return
  try {
    const [Pixi, { PixiScene }] = await Promise.all([
      import('pixi.js'),
      import('./blueprint-pixi/pixi-scene'),
    ])
    const { width, height } = sizeOf()
    const created = await PixiScene.create(Pixi, {
      canvas,
      el: overlay,
      width,
      height,
      resolution: window.devicePixelRatio || 1,
      background: props.background,
    })
    // Component may have unmounted during the async init.
    if (!canvasRef.value) {
      created.destroy()
      return
    }
    scene = created
    pushAll()
    pixiReady.value = true
    observeResize()
  } catch (reason) {
    emit('unavailable', reason)
  }
}

/** Push the full current scene state (used on first ready). */
function pushAll(): void {
  if (!scene) return
  scene.setCamera(props.panX, props.panY, props.zoom)
  scene.setWires(props.wires, props.shouldFlow)
  scene.setCards(props.visibleCards, cardLod.value)
  scene.setCardLayerVisible(!domVisible.value)
}

function observeResize(): void {
  const host = canvasRef.value?.parentElement
  if (!host) return
  resizeObserver = new ResizeObserver(() => {
    if (!scene) return
    const { width, height } = sizeOf()
    scene.resize(width, height, window.devicePixelRatio || 1)
  })
  resizeObserver.observe(host)
}

watch(
  () => [props.panX, props.panY, props.zoom] as const,
  ([x, y, z]) => scene?.setCamera(x, y, z),
)
watch(
  () => props.wires,
  (w) => scene?.setWires(w, props.shouldFlow),
)
watch([() => props.visibleCards, cardLod], ([cards, lod]) =>
  scene?.setCards(cards, lod),
)
watch(domVisible, (v) => scene?.setCardLayerVisible(!v))
watch(
  () => props.background,
  (bg) => scene?.setBackground(bg),
)

onMounted(initScene)
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  scene?.destroy()
  scene = null
})
</script>

<style scoped lang="scss">
.nb-blueprint-pixi__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.nb-blueprint__canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.nb-blueprint__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

.nb-blueprint__wire {
  pointer-events: none;
  opacity: 0.55;

  &--inactive {
    opacity: 0.25;
  }
}

.nb-blueprint__wire-hitregion {
  pointer-events: stroke;
  cursor: pointer;
}
</style>
