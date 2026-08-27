<template>
  <div
    :class="[
      'nb-field',
      `nb-field--${orientation}`,
      `nb-field--align-${align}`,
      `nb-field--control-${control}`,
    ]"
  >
    <slot v-if="$slots.label" name="label" />
    <label
      v-else-if="label"
      class="nb-field__label"
      :for="controlId"
      :title="label"
      >{{ label }}</label
    >

    <div class="nb-field__control">
      <slot :id="controlId" />
    </div>

    <div v-if="hint || $slots.hint" class="nb-field__hint">
      <slot name="hint">{{ hint }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { IFieldProps } from './Field.d'

const props = withDefaults(defineProps<IFieldProps>(), {
  label: undefined,
  hint: undefined,
  orientation: 'row',
  align: 'center',
  control: 'fill',
  labelFor: undefined,
})

// A control the consumer binds via the default slot's `id` gets a proper
// label association for free; consumers who don't bind it still get a
// visible, correctly-styled label.
const autoId = useId()
const controlId = computed(() => props.labelFor ?? autoId)
</script>

<style scoped lang="scss">
// One labeled row. Every field in a container shares --nb-field-label-width,
// so a stack of NbFields lines up on a single spine with no per-field CSS.
.nb-field {
  display: grid;
  grid-template-columns: var(--nb-field-label-width, 8rem) minmax(0, 1fr);
  align-items: center;
  column-gap: var(--nb-field-col-gap, 12px);
  row-gap: 2px;
  min-width: 0;
}

// Top-align the label against a tall control (e.g. a multiline text area).
.nb-field--align-start {
  align-items: start;
}

// Stack: label on its own line above a full-width control. For controls that
// want the whole width, or labels too long to sit beside the control.
.nb-field--stack {
  grid-template-columns: minmax(0, 1fr);
  row-gap: var(--nb-field-label-gap);
}

// Fit: the control hugs its content (e.g. a switch) and the label takes the
// remaining width — so a short toggle label runs wide instead of being
// squeezed into the fixed label column and clipped.
.nb-field--control-fit {
  grid-template-columns: minmax(0, 1fr) auto;
}
.nb-field--control-fit .nb-field__control {
  justify-self: end;
}

// Plain <label> (not NbLabel) so it can ellipsize cleanly; styled to match
// NbLabel's muted, medium-weight look.
.nb-field__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--nb-font-family-sans);
  font-weight: 500;
  font-size: var(--nb-font-size-12, 12px);
  line-height: 1.3;
  color: var(--nb-c-text-muted);
  cursor: default;
  user-select: none;
}

// The control cell. min-width:0 lets a control shrink instead of forcing the
// row wider than its column; the slotted control fills the width.
.nb-field__control {
  min-width: 0;
}

.nb-field__hint {
  grid-column: 2;
  font-size: var(--nb-font-size-11, 11px);
  line-height: 1.3;
  color: var(--nb-c-text-subtle, var(--nb-c-text-muted));
}
.nb-field--stack .nb-field__hint {
  grid-column: 1;
}
</style>
