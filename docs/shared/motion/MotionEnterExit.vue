<template>
  <MotionStage>
    <template #title>Enter and exit</template>
    <div class="enter-exit">
      <div class="enter-exit__controls">
        <NbButton size="sm" variant="secondary" @click="open = !open">
          {{ open ? 'Close both' : 'Open both' }}
        </NbButton>
        <span class="enter-exit__hint"
          >Same click, two ways of answering it. Close them and watch which one
          gets out of the way.</span
        >
      </div>
      <div class="enter-exit__pair">
        <div class="enter-exit__cell">
          <div class="enter-exit__area">
            <Transition name="ours">
              <div v-if="open" class="enter-exit__card">
                <strong>This library</strong>
                <span>In: medium, enter. Out: short, exit.</span>
              </div>
            </Transition>
          </div>
          <dl class="enter-exit__spec">
            <dt>In</dt>
            <dd>
              <code>medium</code> on <code>enter</code>, from scale 0.96 and 8px
              below
            </dd>
            <dt>Out</dt>
            <dd>
              <code>short</code> on <code>exit</code>, to scale 0.98 and 4px
              below
            </dd>
          </dl>
        </div>
        <div class="enter-exit__cell">
          <div class="enter-exit__area">
            <Transition name="symmetric">
              <div v-if="open" class="enter-exit__card enter-exit__card--wrong">
                <strong>The common mistake</strong>
                <span>Same curve and step both ways, and a zoom.</span>
              </div>
            </Transition>
          </div>
          <dl class="enter-exit__spec">
            <dt>In</dt>
            <dd>
              <code>medium</code> on <code>ease-in-out</code>, from scale 0.8
              and 40px below
            </dd>
            <dt>Out</dt>
            <dd>The same, reversed. It changes its mind on the way out.</dd>
          </dl>
        </div>
      </div>
    </div>
  </MotionStage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MotionStage from './MotionStage.vue'

const open = ref(true)
</script>

<style scoped lang="scss">
@use '../../../src/styles/logic/motion' as motion;

.enter-exit__controls {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  margin-bottom: calc(var(--nb-base-unit) * 2);
}

.enter-exit__hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.enter-exit__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--nb-base-unit) * 2);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.enter-exit__area {
  display: grid;
  place-items: center;
  height: 140px;
  overflow: hidden;
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-2);
}

.enter-exit__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(100% - 32px, 260px);
  padding: calc(var(--nb-base-unit) * 1.5) calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  font-size: var(--nb-font-size-12);

  span {
    color: var(--nb-c-text-secondary);
  }
}

.enter-exit__spec {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px calc(var(--nb-base-unit) * 1.5);
  margin: var(--nb-base-unit) 0 0;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);

  dt {
    font-weight: 600;
    color: var(--nb-c-text);
  }

  dd {
    margin: 0;
  }
}

// ── As the library writes it: two rules, two steps, two curves ────────────────
.ours-enter-active {
  transition:
    opacity var(--nb-motion-medium) var(--nb-ease-enter),
    transform var(--nb-motion-medium) var(--nb-ease-enter);
}

.ours-leave-active {
  transition:
    opacity var(--nb-motion-short) var(--nb-ease-exit),
    transform var(--nb-motion-short) var(--nb-ease-exit);
}

.ours-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.ours-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}

// ── The mistake: one rule for both directions, and far too much travel ────────
.symmetric-enter-active,
.symmetric-leave-active {
  transition:
    opacity var(--nb-motion-medium) ease-in-out,
    transform var(--nb-motion-medium) ease-in-out;
}

.symmetric-enter-from,
.symmetric-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.8);
}

@include motion.reduced {
  .ours-enter-from,
  .ours-leave-to,
  .symmetric-enter-from,
  .symmetric-leave-to {
    transform: none;
  }
}
</style>
