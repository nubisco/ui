<template>
  <div
    ref="root"
    class="nb-video"
    :class="[`nb-video--${fit}`, { 'nb-video--playing': playing }]"
    :style="ratio ? { aspectRatio: ratio } : undefined"
  >
    <!-- No src until the video is wanted: the poster is the first paint, and
         a video below the fold costs nothing until it is near. -->
    <video
      ref="video"
      class="nb-video__media"
      :poster="poster"
      :src="source || undefined"
      :loop="loop"
      :aria-label="label || undefined"
      :aria-hidden="label ? undefined : 'true'"
      :width="width"
      :height="height"
      muted
      playsinline
      preload="none"
      disablepictureinpicture
      @playing="playing = true"
      @pause="playing = false"
      @ended="playing = false"
    />
    <NbButton
      class="nb-video__toggle"
      variant="secondary"
      size="sm"
      :icon="playing ? iconPause : iconPlay"
      :aria-label="playing ? pauseLabel : playLabel"
      @click="toggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import * as iconPlay from '@nubisco/ui/icons/play'
import * as iconPause from '@nubisco/ui/icons/pause'
import NbButton from './Button.vue'
import type { IVideoProps } from './Video.d'

const props = withDefaults(defineProps<IVideoProps>(), {
  mobileSrc: undefined,
  mobileBreakpoint: 768,
  label: undefined,
  width: undefined,
  height: undefined,
  fit: 'cover',
  loop: true,
  playLabel: 'Play video',
  pauseLabel: 'Pause video',
})

const root = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const source = ref('')
const playing = ref(false)

const ratio = computed(() =>
  props.width && props.height ? `${props.width} / ${props.height}` : undefined,
)

/**
 * Whether the video may start by itself: never under reduced motion, never
 * when the visitor asked to save data. Either way the poster stays, with the
 * play control to start it on request.
 */
function mayAutoplay(): boolean {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData
  return !reduce && !saveData
}

function pickSource(): string {
  const narrow = window.matchMedia?.(
    `(max-width: ${props.mobileBreakpoint - 0.02}px)`,
  ).matches
  return narrow && props.mobileSrc ? props.mobileSrc : props.src
}

// The visitor pressed pause: the video stays paused when it scrolls back in.
let heldByVisitor = false
let visible = false
let observer: IntersectionObserver | null = null

async function play(): Promise<void> {
  const el = video.value
  if (!el) return
  if (!source.value) {
    source.value = pickSource()
    // The src reaches the element on the next render. Playing before it does
    // is refused (there is nothing to play), silently, which left the first
    // play of every video to the next time it scrolled into view.
    await nextTick()
  }
  // `muted` as an attribute is not reflected on hydration in every browser,
  // and autoplay policies read the property.
  el.muted = true
  try {
    await el.play()
  } catch {
    // Refused (a power-saving mode, a policy): the poster and the play control
    // stay, which is the reduced-motion experience.
  }
}

function toggle(): void {
  const el = video.value
  if (!el) return
  if (playing.value) {
    heldByVisitor = true
    el.pause()
  } else {
    heldByVisitor = false
    void play()
  }
}

onMounted(() => {
  const auto = mayAutoplay()
  if (typeof IntersectionObserver === 'undefined') {
    if (auto) void play()
    return
  }
  // Plays while on screen and pauses off it, so a page with several loops
  // only ever decodes the ones being looked at.
  observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (visible && auto && !heldByVisitor) void play()
      else if (!visible && playing.value) video.value?.pause()
    },
    { rootMargin: '200px 0px' },
  )
  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

defineExpose({ playing, toggle })
</script>

<style lang="scss">
@use '../styles/variables/breakpoints' as bp;

.nb-video {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.nb-video__media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nb-video--contain .nb-video__media {
  object-fit: contain;
}

// Small and quiet in the corner, as Apple's pages do: there to stop the
// motion (WCAG 2.2.2), not to compete with the picture.
.nb-video .nb-video__toggle {
  position: absolute;
  inset-inline-end: calc(var(--nb-base-unit) * 1.5);
  bottom: calc(var(--nb-base-unit) * 1.5);
  border-radius: 999px;
  opacity: 0.85;
}

.nb-video .nb-video__toggle:hover,
.nb-video .nb-video__toggle:focus-visible {
  opacity: 1;
}

@include bp.phone-touch {
  .nb-video .nb-video__toggle {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
