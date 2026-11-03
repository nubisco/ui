<template>
  <MotionStage>
    <template #title>Easing</template>
    <div class="curves">
      <div class="curves__controls">
        <NbButton size="sm" variant="secondary" @click="atEnd = !atEnd">
          {{ atEnd ? 'Play back' : 'Play' }}
        </NbButton>
        <span class="curves__hint"
          >The same distance on the <code>long</code> step, so the shape of each
          curve is visible. Linear is here for contrast only.</span
        >
      </div>
      <div
        v-for="curve in curves"
        :key="curve.token"
        class="curves__row"
        :class="{ 'curves__row--end': atEnd }"
      >
        <svg
          class="curves__plot"
          :viewBox="`-4 -4 ${SIZE + 8} ${SIZE + 8}`"
          aria-hidden="true"
        >
          <path class="curves__diagonal" :d="`M0,${SIZE} L${SIZE},0`" />
          <path class="curves__curve" :d="curvePath(curve.points, SIZE)" />
        </svg>
        <div class="curves__label">
          <code>{{ curve.name }}</code>
          <span class="curves__role">{{ curve.role }}</span>
          <span class="curves__value">{{ curve.value }}</span>
        </div>
        <div class="curves__track">
          <span
            class="curves__dot"
            :style="{ transitionTimingFunction: curve.value }"
          />
        </div>
      </div>
    </div>
  </MotionStage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MotionStage from './MotionStage.vue'
import { CURVES, curvePath, type IMotionCurve } from './motionDemo'

const SIZE = 56
const atEnd = ref(false)

interface IRow extends IMotionCurve {
  name: string
}

const curves: IRow[] = [
  ...CURVES.map((c) => ({ ...c, name: `--nb-ease-${c.token}` })),
  {
    token: 'linear',
    name: 'linear',
    value: 'cubic-bezier(0, 0, 1, 1)',
    points: [0, 0, 1, 1],
    role: 'Loops only. A discrete object moving this way looks wrong.',
  },
]
</script>

<style scoped lang="scss">
@use '../../../src/styles/logic/motion' as motion;

.curves {
  display: grid;
  gap: calc(var(--nb-base-unit) * 1.5);
}

.curves__controls {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  margin-bottom: var(--nb-base-unit);
}

.curves__hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.curves__row {
  display: grid;
  grid-template-columns: 64px minmax(10rem, 16rem) 1fr;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 2);

  @media (max-width: 720px) {
    grid-template-columns: 64px 1fr;

    .curves__track {
      grid-column: 1 / -1;
    }
  }
}

.curves__plot {
  width: 64px;
  height: 64px;
}

.curves__diagonal {
  fill: none;
  stroke: var(--nb-c-border);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.curves__curve {
  fill: none;
  stroke: var(--nb-c-primary);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.curves__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--nb-font-size-12);

  code {
    font-size: var(--nb-font-size-12);
  }
}

.curves__role {
  color: var(--nb-c-text);
}

.curves__value {
  color: var(--nb-c-text-secondary);
}

.curves__track {
  position: relative;
  height: 24px;
  border-radius: 12px;
  background: var(--nb-c-layer-2);
}

.curves__dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--nb-c-primary);
  transition: left var(--nb-motion-long);
}

.curves__row--end .curves__dot {
  left: calc(100% - 22px);
}

@include motion.reduced {
  .curves__dot {
    transition: none;
  }
}
</style>
