<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import NbIcon from './Icon.vue'

export type TToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface IToastCta {
  label: string
  action: () => void
}

const props = withDefaults(
  defineProps<{
    variant?: TToastVariant
    title?: string
    message: string
    duration?: number
    cta?: IToastCta
  }>(),
  {
    variant: 'info',
    title: undefined,
    duration: 4000,
    cta: undefined,
  },
)

const emit = defineEmits<{ close: [] }>()

const paused = ref(false)

const iconMap: Record<TToastVariant, string> = {
  success: 'check-circle',
  error: 'warning-circle',
  warning: 'warning',
  info: 'info',
}

let timer: ReturnType<typeof setTimeout> | null = null
let remaining = props.duration ?? 0
let startedAt = 0

function startTimer() {
  if (!remaining) return
  startedAt = Date.now()
  timer = setTimeout(() => emit('close'), remaining)
}

function pauseProgress() {
  if (!remaining || paused.value) return
  paused.value = true
  if (timer) clearTimeout(timer)
  remaining -= Date.now() - startedAt
}

function resumeProgress() {
  if (!remaining || !paused.value) return
  paused.value = false
  startTimer()
}

onMounted(startTimer)
onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

watch(
  () => props.duration,
  (val) => {
    if (timer) clearTimeout(timer)
    remaining = val ?? 0
    startTimer()
  },
)
</script>

<template>
  <div
    :class="['nb-toast', `nb-toast--${variant}`]"
    role="alert"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
    @mouseenter="pauseProgress"
    @mouseleave="resumeProgress"
  >
    <div class="nb-toast__icon">
      <NbIcon :name="iconMap[variant!]" :size="16" />
    </div>
    <div class="nb-toast__body">
      <p v-if="title" class="nb-toast__title">{{ title }}</p>
      <p class="nb-toast__message">{{ message }}</p>
      <button
        v-if="cta"
        class="nb-toast__cta"
        @click="
          () => {
            cta && cta.action()
            emit('close')
          }
        "
      >
        {{ cta.label }}
      </button>
    </div>
    <button class="nb-toast__close" aria-label="Close" @click="emit('close')">
      <NbIcon name="x" :size="14" />
    </button>
    <div
      v-if="duration"
      ref="progressRef"
      class="nb-toast__progress"
      :style="{
        animationDuration: `${duration}ms`,
        animationPlayState: paused ? 'paused' : 'running',
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.nb-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--nb-c-bg);
  border: 1px solid var(--nb-c-border);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 280px;
  max-width: 380px;
  overflow: hidden;
  font-family: var(--nb-font-family-sans, sans-serif);

  &--success .nb-toast__icon {
    color: var(--nb-c-success, #4acf7b);
  }
  &--error .nb-toast__icon {
    color: var(--nb-c-danger, #dc2626);
  }
  &--warning .nb-toast__icon {
    color: var(--nb-c-warning, #d97706);
  }
  &--info .nb-toast__icon {
    color: var(--nb-c-primary, #5856a9);
  }

  &--success {
    border-left: 3px solid var(--nb-c-success, #4acf7b);
  }
  &--error {
    border-left: 3px solid var(--nb-c-danger, #dc2626);
  }
  &--warning {
    border-left: 3px solid var(--nb-c-warning, #d97706);
  }
  &--info {
    border-left: 3px solid var(--nb-c-primary, #5856a9);
  }
}

.nb-toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.nb-toast__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nb-toast__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--nb-c-text, #1a1a2e);
  line-height: 1.4;
}

.nb-toast__message {
  margin: 0;
  font-size: 13px;
  color: var(--nb-c-text-muted, #6b7280);
  line-height: 1.5;
}

.nb-toast__cta {
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--nb-c-primary, #5856a9);
  cursor: pointer;
  text-align: left;
  line-height: 1;

  &:hover {
    text-decoration: underline;
  }
}

.nb-toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--nb-c-text-subtle, #9ca3af);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  margin-top: -1px;

  &:hover {
    background: var(--nb-c-bg-soft);
    color: var(--nb-c-text, #1a1a2e);
  }
}

.nb-toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: currentColor;
  opacity: 0.25;
  transform-origin: left;
  animation: nb-toast-progress linear forwards;
}

@keyframes nb-toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
