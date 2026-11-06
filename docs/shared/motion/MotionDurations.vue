<template>
  <MotionStage>
    <template #title>Duration</template>
    <div class="durations">
      <div class="durations__controls">
        <NbButton size="sm" variant="secondary" @click="atEnd = !atEnd">
          {{ atEnd ? 'Play back' : 'Play' }}
        </NbButton>
        <span class="durations__hint"
          >Every dot travels the same distance. Only the step differs.</span
        >
      </div>
      <div
        v-for="step in STEPS"
        :key="step.token"
        class="durations__row"
        :class="{ 'durations__row--end': atEnd }"
      >
        <div class="durations__label">
          <code>--nb-motion-{{ step.token }}</code>
          <span class="durations__ms">{{ label(step.ms) }}</span>
        </div>
        <div class="durations__cell">
          <div class="durations__track">
            <span
              class="durations__dot"
              :style="{
                transitionDuration: `var(--nb-motion-${step.token})`,
              }"
            />
          </div>
          <div class="durations__moves">{{ step.moves }}</div>
        </div>
      </div>
      <div class="durations__row durations__row--loop">
        <div class="durations__label">
          <code>A loop</code>
          <span class="durations__ms">{{ label(900) }}</span>
        </div>
        <div class="durations__cell durations__cell--loop">
          <div class="durations__track durations__track--loop">
            <span class="durations__arc" />
          </div>
          <div class="durations__moves">
            Loops only, and linear. Never a transition.
          </div>
        </div>
      </div>
    </div>
  </MotionStage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MotionStage from './MotionStage.vue'
import { motionDemo, SLOW_FACTOR, STEPS } from './motionDemo'

const atEnd = ref(false)

function label(ms: number): string {
  return motionDemo.slow ? `${ms}ms, slowed to ${ms * SLOW_FACTOR}` : `${ms}ms`
}
</script>

<style scoped lang="scss">
@use '../../../src/styles/logic/motion' as motion;

.durations {
  display: grid;
  gap: calc(var(--nb-base-unit) * 1.5);
}

.durations__controls {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  margin-bottom: var(--nb-base-unit);
}

.durations__hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.durations__row {
  display: grid;
  grid-template-columns: minmax(9rem, 11rem) 1fr;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 2);

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: calc(var(--nb-base-unit) * 0.5);
  }
}

.durations__cell {
  display: grid;
  gap: 4px;
}

.durations__cell--loop {
  grid-template-columns: 48px 1fr;
  align-items: center;
}

.durations__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--nb-font-size-12);

  code {
    font-size: var(--nb-font-size-12);
  }
}

.durations__ms {
  color: var(--nb-c-text-secondary);
}

.durations__moves {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.durations__track {
  position: relative;
  height: 24px;
  border-radius: 12px;
  background: var(--nb-c-layer-2);
}

.durations__dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--nb-c-primary);
  // The dot is on screen before and after, so the standard curve
  transition: left var(--nb-motion-medium) var(--nb-ease-standard);
}

.durations__row--end .durations__dot {
  left: calc(100% - 22px);
}

.durations__track--loop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  background: transparent;
}

.durations__arc {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid var(--nb-c-layer-3, var(--nb-c-border));
  border-top-color: var(--nb-c-primary);
  animation: durations-spin var(--durations-loop, 900ms) linear infinite;
}

@keyframes durations-spin {
  to {
    transform: rotate(360deg);
  }
}

@include motion.reduced {
  .durations__dot {
    transition: none;
  }

  // Fallback 1: a tint loop in place of a travel loop
  .durations__arc {
    border-top-color: var(--nb-c-primary);
    border-color: var(--nb-c-primary);
    animation: durations-breathe var(--durations-loop, 900ms) ease-in-out
      infinite;
  }
}

@keyframes durations-breathe {
  50% {
    opacity: 0.35;
  }
}
</style>
