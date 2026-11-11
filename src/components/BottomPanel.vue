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

      <div
        class="nb-bottom-panel__header-right"
        role="group"
        :aria-label="nbStrings.bottomPanelSize"
      >
        <!-- Icon-only ghost NbButtons at xs, the size that fits the 28px
             header, with the size the panel is at marked `pressed`. -->
        <NbButton
          v-for="control in sizeControls"
          :key="control.size"
          class="nb-bottom-panel__size-btn"
          variant="ghost"
          size="xs"
          :icon="control.icon"
          :label="control.label"
          :pressed="currentSize === control.size"
          @click="setSize(control.size)"
        />
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div v-if="currentSize !== 'collapsed'" class="nb-bottom-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import * as iconMinus from '@nubisco/ui/icons/minus'
import * as iconCornersIn from '@nubisco/ui/icons/corners-in'
import * as iconSquareHalfBottom from '@nubisco/ui/icons/square-half-bottom'
import * as iconCornersOut from '@nubisco/ui/icons/corners-out'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { computed } from 'vue'
import type { TIconSource } from '@/types/Glyph.d'
import type { TBottomPanelSize, IBottomPanelProps } from './BottomPanel.d'
import NbButton from './Button.vue'

const nbStrings = useNbStrings()

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

/*
 * The four sizes as data: one NbButton in a loop instead of four hand-drawn
 * 12px SVGs that had no focus ring and were named by `title` alone. Glyph
 * modules, because names in script are invisible to the compile-time plugin.
 */
const sizeControls = computed<
  { size: TBottomPanelSize; icon: TIconSource; label: string }[]
>(() => [
  {
    size: 'collapsed',
    icon: iconMinus,
    label: nbStrings.value.bottomPanelMinimize,
  },
  {
    size: 'default',
    icon: iconCornersIn,
    label: nbStrings.value.bottomPanelDefault,
  },
  {
    size: 'half',
    icon: iconSquareHalfBottom,
    label: nbStrings.value.bottomPanelHalf,
  },
  {
    size: 'full',
    icon: iconCornersOut,
    label: nbStrings.value.bottomPanelMaximize,
  },
])

function setSize(size: TBottomPanelSize) {
  currentSize.value = size
}

defineExpose({ setSize })
</script>

<style scoped lang="scss">
.nb-bottom-panel {
  // --nb-bottom-panel-* defaults live at :root in styles/_theme.scss so consumer
  // apps can override them on :root without fighting scoped-style specificity.
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
  font-size: var(--nb-type-body-sm-size);
  font-weight: var(--nb-font-weight-semibold, 600);
  color: var(--nb-c-text-muted);
  white-space: nowrap;
}

.nb-bottom-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

// NbButton draws the size controls. The row only has to keep them whole.
.nb-bottom-panel__size-btn {
  flex-shrink: 0;
}

.nb-bottom-panel__content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}
</style>
