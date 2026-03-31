<template>
  <Teleport to="body">
    <Transition name="nb-modal">
      <div v-if="open" class="nb-modal--overlay" @click.self="onOverlayClick">
        <div
          class="nb-modal--content"
          role="dialog"
          aria-modal="true"
          :style="{ maxWidth: sizes[size] }"
          @click.stop
        >
          <header v-if="$slots.header || title" class="nb-modal--header">
            <span class="nb-modal--title">
              <slot name="header">{{ title }}</slot>
            </span>
            <button
              class="nb-modal--close"
              aria-label="Close"
              @click="emit('close')"
            >
              <NbIcon name="x" />
            </button>
          </header>
          <main class="nb-modal--body">
            <slot />
          </main>
          <NbGrid
            is="footer"
            v-if="$slots.footer"
            justify="end"
            class="nb-modal--footer"
            distributed
          >
            <slot name="footer" />
          </NbGrid>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { ESizeShort } from '@/types/Size.d'
import type { IModalProps } from './Modal.d'

const props = withDefaults(defineProps<IModalProps>(), {
  title: undefined,
  open: false,
  size: ESizeShort.Medium,
  closeOnOverlay: true,
})

const emit = defineEmits<{ close: [] }>()

const sizes = { sm: '400px', md: '520px', lg: '720px', xl: '960px' }

function onOverlayClick() {
  if (props.closeOnOverlay) emit('close')
}

// Trap focus / prevent body scroll
watch(
  () => props.open,
  (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped lang="scss">
.nb-modal--overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--nb-z-modal, 301);
  padding: 20px;
}

.nb-modal--content {
  background: var(--nb-c-bg, var(--nb-c-surface));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  --parent-radius: 8px;
}

.nb-modal--header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.nb-modal--title {
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--nb-c-text, #1a1a2e);
}

.nb-modal--close {
  width: calc(var(--nb-base-unit) * 7);
  height: calc(var(--nb-base-unit) * 7);
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;

  &:hover {
    background: var(--nb-c-bg-soft);
    color: var(--nb-c-text);
  }
}

.nb-modal--body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: var(--nb-c-text, #1a1a2e);
}

.nb-modal--footer {
  :deep(> :only-child) {
    max-width: 50%;
  }
}

/* Transitions */
.nb-modal-enter-active,
.nb-modal-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
  .nb-modal--content {
    transition:
      opacity 0.2s,
      transform 0.2s;
  }
}
.nb-modal-enter-from {
  opacity: 0;
  .nb-modal--content {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
.nb-modal-leave-to {
  opacity: 0;
  .nb-modal--content {
    transform: scale(0.96) translateY(-8px);
    opacity: 0;
  }
}
</style>
