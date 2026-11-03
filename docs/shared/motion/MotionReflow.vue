<template>
  <MotionStage>
    <template #title>Reflow</template>
    <div class="reflow">
      <div class="reflow__controls">
        <NbButton size="sm" variant="secondary" @click="reset">Reset</NbButton>
        <span class="reflow__hint"
          >Dismiss a card from the middle of each stack and watch the ones below
          it.</span
        >
      </div>
      <div class="reflow__pair">
        <div class="reflow__cell">
          <TransitionGroup name="naive" tag="div" class="reflow__stack">
            <div v-for="card in naive" :key="card" class="reflow__card">
              <span>{{ card }}</span>
              <button
                type="button"
                class="reflow__close"
                aria-label="Dismiss"
                @click="naive = naive.filter((c) => c !== card)"
              >
                &times;
              </button>
            </div>
          </TransitionGroup>
          <p class="reflow__spec">
            <strong>Leave only.</strong> The departing card fades, and the gap
            closes the instant it is removed from flow: the survivors teleport
            while it is still fading.
          </p>
        </div>
        <div class="reflow__cell">
          <TransitionGroup name="moved" tag="div" class="reflow__stack">
            <div v-for="card in moved" :key="card" class="reflow__card">
              <span>{{ card }}</span>
              <button
                type="button"
                class="reflow__close"
                aria-label="Dismiss"
                @click="moved = moved.filter((c) => c !== card)"
              >
                &times;
              </button>
            </div>
          </TransitionGroup>
          <p class="reflow__spec">
            <strong
              >Leave, plus <code>-move</code> and
              <code>position: absolute</code>.</strong
            >
            The departing card is taken out of flow as it leaves, so the
            survivors slide into the gap on the same step. One event, one
            timing.
          </p>
        </div>
      </div>
    </div>
  </MotionStage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MotionStage from './MotionStage.vue'

const CARDS = [
  'Export finished',
  'Invoice sent',
  'Backup running',
  'New comment',
]
const naive = ref([...CARDS])
const moved = ref([...CARDS])

function reset(): void {
  naive.value = [...CARDS]
  moved.value = [...CARDS]
}
</script>

<style scoped lang="scss">
@use '../../../src/styles/logic/motion' as motion;

.reflow__controls {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  margin-bottom: calc(var(--nb-base-unit) * 2);
}

.reflow__hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.reflow__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--nb-base-unit) * 2);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.reflow__stack {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--nb-base-unit);
  min-height: 196px;
  padding: var(--nb-base-unit);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-2);
}

.reflow__card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--nb-base-unit) calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
  font-size: var(--nb-font-size-12);
}

.reflow__close {
  border: 0;
  background: transparent;
  color: var(--nb-c-text-secondary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: var(--nb-c-text);
  }
}

.reflow__spec {
  margin: var(--nb-base-unit) 0 0;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);

  strong {
    color: var(--nb-c-text);
  }
}

// ── Leave only: the most common TransitionGroup bug ───────────────────────────
.naive-leave-active {
  transition: opacity var(--nb-motion-medium) var(--nb-ease-exit);
}

.naive-leave-to {
  opacity: 0;
}

// ── The fix is two lines: a `-move` class, and the leaver out of flow ─────────
.moved-leave-active,
.moved-move {
  transition:
    opacity var(--nb-motion-medium) var(--nb-ease-standard),
    transform var(--nb-motion-medium) var(--nb-ease-standard);
}

.moved-leave-active {
  position: absolute;
  // The stack is padded, and an absolute child measures from its padding
  // edge, so the leaver keeps its width
  width: calc(100% - 2 * var(--nb-base-unit));
}

.moved-leave-to {
  opacity: 0;
}

@include motion.reduced {
  .moved-move {
    transition: none;
  }
}
</style>
