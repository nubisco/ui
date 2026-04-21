<template>
  <div class="nb-bottom-panel" :class="currentSize">
    <!-- ═══ HEADER ═══ -->
    <div class="nb-bottom-panel__header">
      <div class="nb-bottom-panel__header-left">
        <span v-if="title" class="nb-bottom-panel__title">{{ title }}</span>
        <slot name="title" />
      </div>

      <div class="nb-bottom-panel__header-center">
        <!-- Teleport target: child components inject toolbar buttons here -->
        <div ref="toolbarTarget" class="nb-bottom-panel__toolbar">
          <slot name="toolbar" />
        </div>
      </div>

      <div class="nb-bottom-panel__header-right">
        <!-- Size controls -->
        <button
          class="nb-bottom-panel__size-btn"
          :class="{ active: currentSize === 'collapsed' }"
          title="Minimize"
          @click="setSize('collapsed')"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line
              x1="2"
              y1="10"
              x2="10"
              y2="10"
              stroke="currentColor"
              stroke-width="1.5"
            />
          </svg>
        </button>
        <button
          class="nb-bottom-panel__size-btn"
          :class="{ active: currentSize === 'default' }"
          title="Default"
          @click="setSize('default')"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="5"
              width="10"
              height="6"
              rx="1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
        </button>
        <button
          class="nb-bottom-panel__size-btn"
          :class="{ active: currentSize === 'half' }"
          title="Half"
          @click="setSize('half')"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="3"
              width="10"
              height="8"
              rx="1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
        </button>
        <button
          class="nb-bottom-panel__size-btn"
          :class="{ active: currentSize === 'full' }"
          title="Maximize"
          @click="setSize('full')"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              rx="1"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
            />
            <line
              x1="1"
              y1="3.5"
              x2="11"
              y2="3.5"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div v-if="currentSize !== 'collapsed'" class="nb-bottom-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TBottomPanelSize, IBottomPanelProps } from './BottomPanel.d'

const props = withDefaults(defineProps<IBottomPanelProps>(), {
  size: 'default',
  title: '',
})

const emit = defineEmits<{
  'update:size': [size: TBottomPanelSize]
}>()

const currentSize = computed({
  get: () => props.size,
  set: (v) => emit('update:size', v),
})

function setSize(size: TBottomPanelSize) {
  currentSize.value = size
}

defineExpose({ setSize })
</script>

<style scoped lang="scss">
.nb-bottom-panel {
  --nb-bottom-panel-header-height: 28px;
  --nb-bottom-panel-bg: var(--nb-c-layer-0, var(--nb-c-bg));
  --nb-bottom-panel-border: var(--nb-c-border);

  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--nb-bottom-panel-bg);
  border-top: 1px solid var(--nb-bottom-panel-border);

  &.collapsed {
    height: var(--nb-bottom-panel-header-height);
  }
  &.default {
    height: 30vh;
    min-height: 80px;
  }
  &.half {
    height: 50vh;
  }
  &.full {
    flex: 1 0 0%;
  }
}

.nb-bottom-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nb-bottom-panel-header-height);
  padding: 0 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--nb-bottom-panel-border);
  gap: 8px;
}

.nb-bottom-panel__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.nb-bottom-panel__header-center {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.nb-bottom-panel__header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nb-bottom-panel__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--nb-c-text-muted);
  white-space: nowrap;
}

.nb-bottom-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nb-bottom-panel__size-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.1s,
    color 0.1s;

  &:hover {
    background: var(--nb-c-surface-hover, rgba(255, 255, 255, 0.08));
    color: var(--nb-c-text);
  }

  &.active {
    background: var(--nb-c-surface-hover, rgba(255, 255, 255, 0.12));
    color: var(--nb-c-text);
  }
}

.nb-bottom-panel__content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}
</style>
