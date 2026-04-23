<template>
  <div class="nb-shell-panel" :class="currentSize">
    <!-- ═══ HEADER ═══ -->
    <div class="nb-shell-panel__header">
      <div class="nb-shell-panel__header-left">
        <span v-if="title" class="nb-shell-panel__title">{{ title }}</span>
        <slot name="title" />
      </div>

      <div class="nb-shell-panel__header-center">
        <div class="nb-shell-panel__toolbar">
          <slot name="toolbar" />
        </div>
      </div>

      <div class="nb-shell-panel__header-right">
        <slot name="controls">
          <!-- Minimize -->
          <button
            class="nb-shell-panel__size-btn"
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
          <!-- Default (share space) -->
          <button
            class="nb-shell-panel__size-btn"
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
          <!-- Maximize -->
          <button
            class="nb-shell-panel__size-btn"
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
        </slot>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div v-if="currentSize !== 'collapsed'" class="nb-shell-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TShellPanelSize, IShellPanelProps } from './ShellPanel.d'

const props = withDefaults(defineProps<IShellPanelProps>(), {
  size: 'default',
  title: '',
})

const emit = defineEmits<{
  'update:size': [size: TShellPanelSize]
}>()

const currentSize = computed({
  get: () => props.size,
  set: (v) => emit('update:size', v),
})

function setSize(size: TShellPanelSize) {
  currentSize.value = size
}

defineExpose({ setSize })
</script>

<style scoped lang="scss">
.nb-shell-panel {
  --nb-shell-panel-header-height: 28px;
  --nb-shell-panel-gap: 1px;

  display: flex;
  flex-direction: column;
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  border-radius: 2px;
  margin: var(--nb-shell-panel-gap);
  min-height: 0;
  overflow: hidden;

  // ── Size states ──────────────────────────────────────────────────────────
  //
  // collapsed: header only, does not grow
  // default:   flex: 1, shares space equally with siblings
  // full:      flex: 1, sibling panels collapse (see unscoped rule below)

  &.collapsed {
    flex: 0 0 auto;
  }

  &.default {
    flex: 1 1 0%;
  }

  &.full {
    flex: 1 1 0%;
  }
}

.nb-shell-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nb-shell-panel-header-height);
  padding: 0 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--nb-c-border);
  gap: 8px;
}

.nb-shell-panel__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.nb-shell-panel__header-center {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.nb-shell-panel__header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nb-shell-panel__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--nb-c-text-muted);
  white-space: nowrap;
}

.nb-shell-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nb-shell-panel__size-btn {
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

.nb-shell-panel__content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}
</style>

<!-- ── Unscoped: sibling coordination ─────────────────────────────────────
     When any panel in a container is maximized (.full), all sibling panels
     that are NOT .full collapse to header-only. This works regardless of
     what the parent container is — any flex parent will do. -->
<style lang="scss">
:has(> .nb-shell-panel.full) > .nb-shell-panel:not(.full) {
  flex: 0 0 auto !important;

  > .nb-shell-panel__content {
    display: none !important;
  }
}
</style>
