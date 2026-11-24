<template>
  <NbCanvasControls
    v-if="visible"
    class="nb-blueprint-controls"
    :class="[`nb-blueprint-controls--${position}`, `is-${orientation}`]"
    :label="nbStrings.blueprintControls"
    :position="position"
    :orientation="orientation"
  >
    <NbCanvasControlsGroup class="nb-blueprint-controls__group">
      <NbButton
        variant="ghost"
        icon="magnifying-glass-plus"
        :label="nbStrings.blueprintZoomIn"
        @click="bp.zoomIn()"
      />
      <NbButton
        variant="ghost"
        icon="magnifying-glass-minus"
        :label="nbStrings.blueprintZoomOut"
        @click="bp.zoomOut()"
      />
      <NbButton
        variant="ghost"
        icon="frame-corners"
        :label="nbStrings.blueprintFitToView"
        @click="bp.fitToView()"
      />
      <NbButton
        variant="ghost"
        icon="crosshair"
        :label="nbStrings.blueprintCenter"
        @click="bp.centerView()"
      />
      <NbButton
        v-if="autoLayout && !isReadonly"
        variant="ghost"
        icon="tree-structure"
        :label="nbStrings.blueprintAutoLayout"
        @click="bp.autoLayout()"
      />
    </NbCanvasControlsGroup>

    <!-- Alignment cluster: contextual, shown once more than one card is
         selected (those commands act on the selection). -->
    <NbCanvasControlsGroup
      v-if="showAlignment"
      class="nb-blueprint-controls__group"
    >
      <NbButton
        variant="ghost"
        icon="align-left"
        :label="nbStrings.blueprintAlignLeft"
        @click="bp.alignLeft()"
      />
      <NbButton
        variant="ghost"
        icon="align-center-horizontal"
        :label="nbStrings.blueprintAlignHorizontalCenter"
        @click="bp.alignCenter()"
      />
      <NbButton
        variant="ghost"
        icon="align-right"
        :label="nbStrings.blueprintAlignRight"
        @click="bp.alignRight()"
      />
      <NbButton
        variant="ghost"
        icon="align-top"
        :label="nbStrings.blueprintAlignTop"
        @click="bp.alignTop()"
      />
      <NbButton
        variant="ghost"
        icon="align-center-vertical"
        :label="nbStrings.blueprintAlignVerticalCenter"
        @click="bp.alignMiddle()"
      />
      <NbButton
        variant="ghost"
        icon="align-bottom"
        :label="nbStrings.blueprintAlignBottom"
        @click="bp.alignBottom()"
      />
      <NbButton
        variant="ghost"
        icon="arrows-out-line-horizontal"
        :label="nbStrings.blueprintDistributeHorizontally"
        @click="bp.distributeHorizontally()"
      />
      <NbButton
        variant="ghost"
        icon="arrows-out-line-vertical"
        :label="nbStrings.blueprintDistributeVertically"
        @click="bp.distributeVertically()"
      />
    </NbCanvasControlsGroup>
  </NbCanvasControls>
</template>

<script setup lang="ts">
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { computed } from 'vue'
import NbButton from './Button.vue'
import NbCanvasControls from './CanvasControls.vue'
import NbCanvasControlsGroup from './CanvasControlsGroup.vue'
import { useBlueprint } from '../composables/useBlueprint.composable'
import type { IBlueprintControlsProps } from './BlueprintControls.d'

const nbStrings = useNbStrings()

const props = withDefaults(defineProps<IBlueprintControlsProps>(), {
  position: 'bottom-right',
  orientation: 'vertical',
  show: 'always',
  autoLayout: true,
  alignment: true,
})

const bp = useBlueprint()

const visible = computed(() => props.show === 'always' || bp.isEditMode.value)
// A read-only canvas refuses every layout change, so the buttons that would
// ask for one are not offered at all rather than shown and ignored.
const isReadonly = computed(() => !!bp.isReadonly?.value)
const showAlignment = computed(
  () => props.alignment && !isReadonly.value && bp.selectedIds.value.size >= 2,
)
</script>
