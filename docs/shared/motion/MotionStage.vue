<template>
  <div class="motion-stage" :style="slowTokens">
    <div class="motion-stage__bar">
      <span class="motion-stage__title"><slot name="title" /></span>
      <NbSwitch
        v-model="motionDemo.slow"
        size="sm"
        :label="`Slow motion, ${SLOW_FACTOR}x`"
      />
    </div>
    <div class="motion-stage__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * A stage for a motion demo.
 *
 * It carries the slow-motion switch, which is shared by every stage on the
 * page, and when that switch is on it scales the duration tokens for
 * everything inside, the library's own components included. That is both
 * how a reader gets to see a 70ms tint and the one way a product would
 * retune motion: by setting the tokens, never by editing a component.
 */
import { motionDemo, slowTokens, SLOW_FACTOR } from './motionDemo'
</script>

<style scoped>
.motion-stage {
  width: 100%;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
  overflow: hidden;
}

.motion-stage__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nb-base-unit);
  padding: calc(var(--nb-base-unit) * 1) calc(var(--nb-base-unit) * 1.5);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-layer-2);
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.motion-stage__title {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.motion-stage__body {
  padding: calc(var(--nb-base-unit) * 2);
}
</style>
