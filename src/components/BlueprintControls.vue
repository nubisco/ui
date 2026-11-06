<template>
  <div
    v-if="visible"
    class="nb-blueprint-controls"
    :class="[`nb-blueprint-controls--${position}`, `is-${orientation}`]"
    role="toolbar"
    :aria-label="nbStrings.blueprintControls"
  >
    <div class="nb-blueprint-controls__group">
      <NbButton
        variant="ghost"
        :size="sm"
        icon="magnifying-glass-plus"
        :title="nbStrings.blueprintZoomIn"
        :aria-label="nbStrings.blueprintZoomIn"
        @click="bp.zoomIn()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="magnifying-glass-minus"
        :title="nbStrings.blueprintZoomOut"
        :aria-label="nbStrings.blueprintZoomOut"
        @click="bp.zoomOut()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="frame-corners"
        :title="nbStrings.blueprintFitToView"
        :aria-label="nbStrings.blueprintFitToView"
        @click="bp.fitToView()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="crosshair"
        :title="nbStrings.blueprintCenter"
        :aria-label="nbStrings.blueprintCenter"
        @click="bp.centerView()"
      />
      <NbButton
        v-if="autoLayout"
        variant="ghost"
        :size="sm"
        icon="tree-structure"
        :title="nbStrings.blueprintAutoLayout"
        :aria-label="nbStrings.blueprintAutoLayout"
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
        :title="nbStrings.blueprintAlignLeft"
        :aria-label="nbStrings.blueprintAlignLeft"
        @click="bp.alignLeft()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-center-horizontal"
        :title="nbStrings.blueprintAlignHorizontalCenter"
        :aria-label="nbStrings.blueprintAlignHorizontalCenter"
        @click="bp.alignCenter()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-right"
        :title="nbStrings.blueprintAlignRight"
        :aria-label="nbStrings.blueprintAlignRight"
        @click="bp.alignRight()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-top"
        :title="nbStrings.blueprintAlignTop"
        :aria-label="nbStrings.blueprintAlignTop"
        @click="bp.alignTop()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-center-vertical"
        :title="nbStrings.blueprintAlignVerticalCenter"
        :aria-label="nbStrings.blueprintAlignVerticalCenter"
        @click="bp.alignMiddle()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="align-bottom"
        :title="nbStrings.blueprintAlignBottom"
        :aria-label="nbStrings.blueprintAlignBottom"
        @click="bp.alignBottom()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="arrows-out-line-horizontal"
        :title="nbStrings.blueprintDistributeHorizontally"
        :aria-label="nbStrings.blueprintDistributeHorizontally"
        @click="bp.distributeHorizontally()"
      />
      <NbButton
        variant="ghost"
        :size="sm"
        icon="arrows-out-line-vertical"
        :title="nbStrings.blueprintDistributeVertically"
        :aria-label="nbStrings.blueprintDistributeVertically"
        @click="bp.distributeVertically()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { computed } from 'vue'
import NbButton from './Button.vue'
import { ESizeShort } from '@/types/Size.d'
import { useBlueprint } from '../composables/useBlueprint.composable'
import type { IBlueprintControlsProps } from './BlueprintControls.d'

const nbStrings = useNbStrings()

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
