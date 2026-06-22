<template>
  <div
    v-if="visible"
    class="nb-blueprint-controls"
    :class="[`nb-blueprint-controls--${position}`, `is-${orientation}`]"
    role="toolbar"
    aria-label="Blueprint controls"
  >
    <div class="nb-blueprint-controls__group">
      <NbButton
        variant="ghost"
        :size="sm"
        icon="magnifying-glass-plus"
        title="Zoom in"
        aria-label="Zoom in"
        @click="bp.zoomIn()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="magnifying-glass-minus"
        title="Zoom out"
        aria-label="Zoom out"
        @click="bp.zoomOut()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="frame-corners"
        title="Fit to view"
        aria-label="Fit to view"
        @click="bp.fitToView()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="crosshair"
        title="Center"
        aria-label="Center"
        @click="bp.centerView()"
      />
      <NbButton
        v-if="autoLayout"
        variant="ghost"
        :size="sm"
        icon="tree-structure"
        title="Auto layout"
        aria-label="Auto layout"
        @click="bp.autoLayout()"
      />
    </div>

    <!-- Alignment cluster: contextual, shown once more than one card is
         selected (those commands act on the selection). -->
    <div v-if="showAlignment" class="nb-blueprint-controls__group">
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-left"
        title="Align left"
        aria-label="Align left"
        @click="bp.alignLeft()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-center-horizontal"
        title="Align horizontal center"
        aria-label="Align horizontal center"
        @click="bp.alignCenter()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-right"
        title="Align right"
        aria-label="Align right"
        @click="bp.alignRight()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-top"
        title="Align top"
        aria-label="Align top"
        @click="bp.alignTop()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-center-vertical"
        title="Align vertical center"
        aria-label="Align vertical center"
        @click="bp.alignMiddle()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-bottom"
        title="Align bottom"
        aria-label="Align bottom"
        @click="bp.alignBottom()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="arrows-out-line-horizontal"
        title="Distribute horizontally"
        aria-label="Distribute horizontally"
        @click="bp.distributeHorizontally()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="arrows-out-line-vertical"
        title="Distribute vertically"
        aria-label="Distribute vertically"
        @click="bp.distributeVertically()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NbButton from './Button.vue'
import { ESizeShort } from '@/types/Size.d'
import { useBlueprint } from '../composables/useBlueprint.composable'
import type { IBlueprintControlsProps } from './BlueprintControls.d'

const sm = ESizeShort.Small

const props = withDefaults(defineProps<IBlueprintControlsProps>(), {
  position: 'bottom-right',
  orientation: 'vertical',
  show: 'always',
  autoLayout: true,
  alignment: true,
})

const bp = useBlueprint()

const visible = computed(() => props.show === 'always' || bp.isEditMode.value)
const showAlignment = computed(
  () => props.alignment && bp.selectedIds.value.size >= 2,
)
</script>

<style scoped lang="scss">
.nb-blueprint-controls {
  position: absolute;
  display: flex;
  gap: 8px;
  padding: 0;
  z-index: 1;

  &.is-vertical {
    flex-direction: column;
  }
  &.is-horizontal {
    flex-direction: row;
  }

  &--top-left {
    top: 12px;
    left: 12px;
  }
  &--top-right {
    top: 12px;
    right: 12px;
  }
  &--bottom-left {
    bottom: 12px;
    left: 12px;
  }
  &--bottom-right {
    bottom: 12px;
    right: 12px;
  }
}

.nb-blueprint-controls__group {
  display: flex;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--nb-c-border);
  border-radius: 10px;
  background: var(--nb-c-layer-1, var(--nb-c-bg));
  box-shadow: 0 4px 16px rgb(0 0 0 / 18%);

  .is-vertical & {
    flex-direction: column;
  }
}
</style>
