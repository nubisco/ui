<template>
  <!-- Grid background. Camera-transformed so it pans/zooms with the
       scene. Default transform-origin (centre) is intentional: the tiled
       pattern reads the same regardless of pan. -->
  <div
    v-if="background !== 'none'"
    class="nb-blueprint__grid"
    :class="`nb-blueprint__grid--${background}`"
    :style="gridStyle"
  />

  <!-- Panned + zoomed canvas: the scene root. -->
  <div class="nb-blueprint__canvas" :style="canvasStyle">
    <!-- Wire SVG layer.
         One <g> per wire so the visible stroke and its invisible 14px
         hit-region stay siblings. The hit-region catches pointer events;
         the visible stroke is decorative (pointer-events: none). -->
    <svg class="nb-blueprint__wires">
      <g v-for="(wire, i) in wires" :key="i" class="nb-blueprint__wire-group">
        <path
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
        <path
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
      </g>
      <!-- Animated flow overlay for each wire. Visibility comes from
           `shouldFlow` so every animateConnections mode shares one rule. -->
      <path
        v-for="(wire, i) in wires"
        v-show="shouldFlow(wire.conn)"
        :key="`flow-${i}`"
        :d="wire.path"
        fill="none"
        :stroke="wire.color"
        stroke-width="1.5"
        stroke-dasharray="4 8"
        class="nb-blueprint__wire-flow"
        pointer-events="none"
      />
      <!-- Active wire being dragged from a port. -->
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

    <!-- Card layer.
         Windowed API: NbBlueprint owns the data-driven v-for and the
         absolute position wrappers, mounting only `visibleCards`, and the
         host renders each card through the forwarded `#card` scoped slot.
         The wrapper is a direct child of the canvas so NbBlueprint's
         position-mutation filter and get/setCardPosition keep working.
         Legacy API: render the forwarded default slot verbatim; the host
         owns layout and there is no windowing. -->
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
import { computed } from 'vue'
import type { IBlueprintConnection } from './Blueprint.types'
import type { IBlueprintRendererProps } from './Blueprint.renderer'

const props = defineProps<IBlueprintRendererProps>()

const emit = defineEmits<{
  'wire-mousedown': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-contextmenu': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-mousemove': [event: MouseEvent, conn: IBlueprintConnection]
  'wire-mouseleave': [conn: IBlueprintConnection]
}>()

const transform = computed(
  () => `translate(${props.panX}px, ${props.panY}px) scale(${props.zoom})`,
)
const willChange = computed(() =>
  props.isTransforming ? 'transform' : undefined,
)

const gridStyle = computed(() => ({
  transform: transform.value,
  willChange: willChange.value,
}))

const canvasStyle = computed(() => ({
  transform: transform.value,
  transformOrigin: '0 0',
  willChange: willChange.value,
}))
</script>

<style scoped lang="scss">
.nb-blueprint__grid {
  --nb-blueprint-grid-gap: 24px;
  --_grid-color: var(--nb-blueprint-grid-color, var(--nb-c-border));

  position: absolute;
  inset: -2000px;
  background-size: var(--nb-blueprint-grid-gap) var(--nb-blueprint-grid-gap);
  pointer-events: none;
  opacity: 0.4;
  mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    #000 40%,
    transparent 100%
  );

  &--dots {
    background-image: radial-gradient(
      circle,
      var(--_grid-color) 1px,
      transparent 1px
    );
  }

  &--lines {
    background-image:
      linear-gradient(to right, var(--_grid-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--_grid-color) 1px, transparent 1px);
  }
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
  // Visible stroke is decorative only; the sibling hit-region path
  // catches all pointer events, so hover styling lives there.
  pointer-events: none;
  opacity: 0.55;
  transition: opacity 0.15s;

  // Inactive wires stay visible but dim, no flow.
  &--inactive {
    opacity: 0.25;
  }
}

.nb-blueprint__wire-hitregion {
  // Generous 14px transparent stroke makes the wire easy to grab while
  // the visible wire stays skinny.
  pointer-events: stroke;
  cursor: pointer;

  // When the hit-region is hovered, the visible wire (next sibling in
  // source order) bumps its width / opacity for tactile feedback.
  &:hover + .nb-blueprint__wire {
    opacity: 0.85;
    stroke-width: 3;
  }
}

.nb-blueprint__wire-flow {
  opacity: 0.55;
  animation: nb-wire-flow 2.4s linear infinite;
}

@keyframes nb-wire-flow {
  to {
    stroke-dashoffset: -24;
  }
}
</style>
