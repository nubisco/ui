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
      <slot :id="controlId" :describedby="hasHint ? hintId : undefined" />
    </div>

    <div v-if="hasHint" :id="hintId" class="nb-field__hint">
      <slot name="hint">{{ hint }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
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

// The hint has its own id, handed to the default slot as `describedby`, so a
// control bound with `:aria-describedby="describedby"` has its hint read
// with it. Undefined when there is no hint, so nothing points at nothing.
const slots = useSlots()
const hasHint = computed(() => !!props.hint || !!slots.hint)
const hintId = computed(() => `${controlId.value}-hint`)
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
  // Rows keep their own height when a parent stretches the field, e.g. a grid
  // row where the neighbour has a hint and this field has none. Without it the
  // spare height was shared out between the rows, and the label and control
  // sat lower than the field beside them.
  align-content: start;
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
// NbLabel: the label type set, muted.
.nb-field__label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--nb-type-label-family);
  font-size: var(--nb-type-label-size);
  font-weight: var(--nb-type-label-weight);
  line-height: var(--nb-type-label-line-height);
  letter-spacing: var(--nb-type-label-letter-spacing);
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
  font-size: var(--nb-type-helper-text-size);
  line-height: var(--nb-type-helper-text-line-height);
  letter-spacing: var(--nb-type-helper-text-letter-spacing);
  color: var(--nb-c-text-subtle, var(--nb-c-text-muted));
}
.nb-field--stack .nb-field__hint {
  grid-column: 1;
}
</style>
