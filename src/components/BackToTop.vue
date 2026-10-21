<template>
  <!-- Rendered only once the page is scrolled past the threshold, so it is
       never a dead tab stop on the first screen. -->
  <Transition name="nb-back-to-top">
    <div v-if="visible" class="nb-back-to-top">
      <NbButton
        v-nb-tooltip="{ body: label, aria: 'none', position: 'left' }"
        :aria-label="label"
        class="nb-back-to-top__button"
        variant="secondary"
        :icon="iconArrowUp"
        @click="toTop"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as iconArrowUp from '@nubisco/ui/icons/arrow-up'
import NbButton from './Button.vue'
import type { IBackToTopProps } from './BackToTop.d'

const props = withDefaults(defineProps<IBackToTopProps>(), {
  threshold: undefined,
  label: 'Back to top',
})

const visible = ref(false)
let frame = 0

function update(): void {
  frame = 0
  const past = props.threshold ?? window.innerHeight
  visible.value = window.scrollY > past
}

// One read per frame, however fast the page scrolls.
function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(update)
}

/**
 * Back to the top of the page, smoothly unless the visitor asked for reduced
 * motion. Used from the keyboard (a click with no pointer, `detail` 0), focus
 * goes back to the top too: the document's first focusable element, so the
 * next Tab does not continue from a button that has just disappeared at the
 * bottom of the page. A mouse click leaves focus alone.
 */
function toTop(event: MouseEvent): void {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' })
  if (event.detail !== 0) return
  const first = document.querySelector<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  first?.focus({ preventScroll: true })
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<style lang="scss">
@use '../styles/variables/breakpoints' as bp;

.nb-back-to-top {
  position: fixed;
  z-index: var(--nb-zindex-menu);
  inset-inline-end: calc(var(--nb-base-unit) * 3 + env(safe-area-inset-right));
  bottom: calc(var(--nb-base-unit) * 3 + env(safe-area-inset-bottom));
}

.nb-back-to-top .nb-back-to-top__button {
  border-radius: 999px;
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
}

// A thumb target, kept clear of the screen edge and the home indicator.
@include bp.phone-touch {
  .nb-back-to-top {
    inset-inline-end: calc(
      var(--nb-base-unit) * 2 + env(safe-area-inset-right)
    );
    bottom: calc(var(--nb-base-unit) * 2 + env(safe-area-inset-bottom));
  }

  .nb-back-to-top .nb-back-to-top__button {
    min-width: 44px;
    min-height: 44px;
  }
}

.nb-back-to-top-enter-active,
.nb-back-to-top-leave-active {
  transition:
    opacity var(--nb-animation-fast) ease,
    transform var(--nb-animation-fast) ease;
}

.nb-back-to-top-enter-from,
.nb-back-to-top-leave-to {
  opacity: 0;
  transform: translateY(calc(var(--nb-base-unit) * 1));
}

@media (prefers-reduced-motion: reduce) {
  .nb-back-to-top-enter-active,
  .nb-back-to-top-leave-active {
    transition: none;
  }
}
</style>
