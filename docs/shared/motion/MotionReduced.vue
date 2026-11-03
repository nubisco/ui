<template>
  <div class="reduced" :class="{ 'reduced--on': reduced }">
    <div class="reduced__bar">
      <NbSwitch
        v-model="reduced"
        size="sm"
        label="Simulate prefers-reduced-motion: reduce"
      />
      <span class="reduced__hint"
        >The demos below are written the way the components are. Your operating
        system's own setting applies to them too.</span
      >
    </div>
    <div class="reduced__grid">
      <div class="reduced__tile">
        <div class="reduced__area">
          <span class="reduced__spinner" />
        </div>
        <p class="reduced__spec">
          <strong>1. A tint loop for a travel loop.</strong> The arc stops
          turning and becomes a ring that breathes. It still says "working".
        </p>
      </div>
      <div class="reduced__tile">
        <div class="reduced__area reduced__area--popover">
          <NbButton size="sm" variant="secondary" @click="shown = !shown">
            {{ shown ? 'Hide' : 'Show' }}
          </NbButton>
          <Transition name="pop">
            <div v-if="shown" class="reduced__popover">Saved to drafts</div>
          </Transition>
        </div>
        <p class="reduced__spec">
          <strong>2. Keep the fade, drop the travel.</strong> The popover no
          longer rises 4px, and it is still seen to arrive.
        </p>
      </div>
      <div class="reduced__tile">
        <div class="reduced__area">
          <div class="reduced__countdown">
            <span class="reduced__countdown-bar" />
          </div>
        </div>
        <p class="reduced__spec">
          <strong>3. Change the timing function, keep the animation.</strong>
          How much time is left is data. The countdown steps instead of
          sweeping.
        </p>
      </div>
      <div class="reduced__tile">
        <div class="reduced__area reduced__area--rail">
          <div
            class="reduced__rail"
            :class="{ 'reduced__rail--narrow': narrow }"
          >
            <span class="reduced__rail-row" v-for="n in 3" :key="n">
              <span class="reduced__rail-icon" />
              <span class="reduced__rail-label">Item {{ n }}</span>
            </span>
          </div>
          <NbButton size="sm" variant="secondary" @click="narrow = !narrow">
            {{ narrow ? 'Expand' : 'Collapse' }}
          </NbButton>
        </div>
        <p class="reduced__spec">
          <strong>4. Cancel outright.</strong> The rail reaches the same width
          either way, so the still frame says everything the motion said.
        </p>
      </div>
      <div class="reduced__tile reduced__tile--wrong">
        <div class="reduced__area">
          <span class="reduced__spinner reduced__spinner--blanket" />
        </div>
        <p class="reduced__spec">
          <strong>What a blanket rule does.</strong>
          <code>animation: none</code> freezes the same spinner into a static
          arc, which reads as a hung interface. The feedback is gone.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const reduced = ref(false)
const shown = ref(true)
const narrow = ref(false)
</script>

<style scoped lang="scss">
@use '../../../src/styles/logic/motion' as motion;

.reduced {
  width: 100%;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
  overflow: hidden;
}

.reduced__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-base-unit) calc(var(--nb-base-unit) * 2);
  padding: var(--nb-base-unit) calc(var(--nb-base-unit) * 1.5);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-layer-2);
}

.reduced__hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);
}

.reduced__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  padding: calc(var(--nb-base-unit) * 2);
}

.reduced__area {
  position: relative;
  display: grid;
  place-items: center;
  height: 120px;
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-2);
}

.reduced__area--popover,
.reduced__area--rail {
  gap: var(--nb-base-unit);
  align-content: center;
}

.reduced__spec {
  margin: var(--nb-base-unit) 0 0;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-secondary);

  strong {
    color: var(--nb-c-text);
  }
}

.reduced__tile--wrong .reduced__area {
  outline: 1px dashed var(--nb-c-danger, #c0392b);
  outline-offset: -1px;
}

// ── 1. Spinner ────────────────────────────────────────────────────────────────
.reduced__spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid var(--nb-c-border);
  border-top-color: var(--nb-c-primary);
  animation: reduced-spin 900ms linear infinite;
}

@keyframes reduced-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes reduced-breathe {
  50% {
    opacity: 0.35;
  }
}

// ── 2. Popover ────────────────────────────────────────────────────────────────
.reduced__popover {
  padding: 6px 10px;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-sm, 4px);
  background: var(--nb-c-layer-1);
  box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
  font-size: var(--nb-font-size-12);
}

.pop-enter-active {
  transition:
    opacity var(--nb-motion-quick) var(--nb-ease-enter),
    transform var(--nb-motion-quick) var(--nb-ease-enter);
}

.pop-leave-active {
  transition: opacity var(--nb-motion-micro) var(--nb-ease-exit);
}

.pop-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.pop-leave-to {
  opacity: 0;
}

// ── 3. Countdown ──────────────────────────────────────────────────────────────
.reduced__countdown {
  width: 70%;
  height: 4px;
  border-radius: 2px;
  background: var(--nb-c-border);
  overflow: hidden;
}

.reduced__countdown-bar {
  display: block;
  height: 100%;
  background: var(--nb-c-primary);
  transform-origin: left;
  animation: reduced-countdown 6s linear infinite;
}

@keyframes reduced-countdown {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

// ── 4. Rail ───────────────────────────────────────────────────────────────────
.reduced__rail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 140px;
  padding: 6px;
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
  border: 1px solid var(--nb-c-border);
  overflow: hidden;
  transition: width var(--nb-motion-medium) var(--nb-ease-standard);
}

.reduced__rail--narrow {
  width: 36px;
}

.reduced__rail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
}

.reduced__rail-icon {
  flex: 0 0 auto;
  width: 22px;
  height: 20px;
  border-radius: 4px;
  background: var(--nb-c-primary);
  opacity: 0.6;
}

.reduced__rail-label {
  font-size: var(--nb-font-size-12);
  white-space: nowrap;
  transition: opacity var(--nb-motion-quick) var(--nb-ease-standard);
}

.reduced__rail--narrow .reduced__rail-label {
  opacity: 0;
}

// ── Under the preference, simulated or real ───────────────────────────────────
// The same four rules twice: once for the switch above, once for the media
// query, so the demo answers the reader's own setting as well.
@mixin fallbacks {
  .reduced__spinner {
    border-color: var(--nb-c-primary);
    animation: reduced-breathe 1200ms ease-in-out infinite;
  }

  .reduced__spinner--blanket {
    animation: none;
    border-color: var(--nb-c-border);
    border-top-color: var(--nb-c-primary);
  }

  .pop-enter-from {
    transform: none;
  }

  .reduced__countdown-bar {
    animation-timing-function: steps(8, end);
  }

  .reduced__rail {
    transition: none;
  }
}

.reduced--on {
  @include fallbacks;
}

@include motion.reduced {
  .reduced {
    @include fallbacks;
  }
}
</style>
