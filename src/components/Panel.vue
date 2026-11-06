<template>
  <div
    class="nb-panel"
    :class="{ 'nb-panel--flat': flat }"
    v-bind="flat ? undefined : layerProps"
  >
    <div v-if="hasHeader" class="nb-panel__header">
      <div class="nb-panel__heading">
        <div v-if="title || $slots.meta" class="nb-panel__title-row">
          <component :is="headingLevel" v-if="title" class="nb-panel__title">
            {{ title }}
          </component>
          <span v-if="$slots.meta" class="nb-panel__meta">
            <slot name="meta" />
          </span>
        </div>
        <p v-if="description" class="nb-panel__description">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="nb-panel__actions">
        <PrimaryActionScope owner="NbPanel">
          <slot name="actions" />
        </PrimaryActionScope>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, useSlots } from 'vue'
import {
  clampLayer,
  NB_LAYER_INJECTION_KEY,
  useSurfaceLayer,
} from '@/composables/useSurfaceLayer.composable'
import type { IPanelProps } from './Panel.d'
import PrimaryActionScope from './PrimaryActionScope.vue'

const props = withDefaults(defineProps<IPanelProps>(), {
  layer: undefined,
  title: undefined,
  description: undefined,
  headingLevel: 'h2',
  flat: false,
})

const slots = useSlots()

// The header renders only when something asks for it, so a panel with no
// title, description, meta or actions is exactly the bare surface it has
// always been.
const hasHeader = computed(
  () => !!props.title || !!props.description || !!slots.meta || !!slots.actions,
)

// Panel paints a surface, so it takes the current layer and pushes everything
// inside it one level deeper. `layer` forces an absolute level when needed.
//
// A flat panel paints nothing, so it does not deepen anything either: its
// contents paint what a sibling of the panel would. It carries no layer class
// and no surface marker, so the DOM probe of a surface inside it looks straight
// through it, and its border reads the `--nb-c-border` of the plane it sits on.
const { level, layerProps } = useSurfaceLayer({
  level: () => props.layer,
  provideContext: false,
})
provide(
  NB_LAYER_INJECTION_KEY,
  computed(() => (props.flat ? level.value : clampLayer(level.value + 1))),
)
</script>

<style lang="scss" scoped>
@use '../styles/logic/radius' as radius;

.nb-panel {
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  padding: calc(var(--nb-base-unit) * 2);
  @include radius.surface(panel);
}

// A tile that is a region of the page rather than a group raised off it: the
// border and the padding stay, the plane it sits on shows through.
.nb-panel--flat {
  background: transparent;
}

// ── Header ──────────────────────────────────────────────────────────────
//
// The title is fixed at heading-01: a product does not pick a panel's heading
// size, so two panels on one page cannot drift apart. One filled button at
// most in the actions, per the emphasis ladder.

.nb-panel__header {
  display: flex;
  align-items: flex-start;
  gap: var(--nb-spacing-16);
  margin-block-end: var(--nb-spacing-16);

  // A header with nothing under it is the whole panel.
  &:last-child {
    margin-block-end: 0;
  }
}

.nb-panel__heading {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.nb-panel__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-4) var(--nb-spacing-8);
}

// Under the header, not bare: a prose stylesheet around the panel (a docs
// page, a CMS body) styles every heading it contains.
.nb-panel__header .nb-panel__title {
  margin: 0;
  min-inline-size: 0;
  font-family: var(--nb-type-heading-01-family);
  font-size: var(--nb-type-heading-01-size);
  font-weight: var(--nb-type-heading-01-weight);
  line-height: var(--nb-type-heading-01-line-height);
  letter-spacing: var(--nb-type-heading-01-letter-spacing);
  color: var(--nb-c-text);
  overflow-wrap: anywhere;
}

.nb-panel__meta {
  display: inline-flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  font-size: var(--nb-type-label-sm-size);
  line-height: var(--nb-type-label-sm-line-height);
  color: var(--nb-c-text-muted);
}

.nb-panel__header .nb-panel__description {
  margin: var(--nb-spacing-4) 0 0;
  max-inline-size: 68ch;
  font-size: var(--nb-type-body-sm-size);
  line-height: var(--nb-type-body-sm-line-height);
  color: var(--nb-c-text-muted);
}

.nb-panel__actions {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--nb-spacing-8);
}
</style>
