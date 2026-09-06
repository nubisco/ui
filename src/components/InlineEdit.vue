<template>
  <input
    v-if="editing"
    :id="id"
    ref="input"
    class="nb-inline-edit__input"
    :class="`nb-inline-edit__input--${size}`"
    :value="modelValue"
    :aria-label="label"
    :placeholder="placeholder"
    @input="onInput"
    @blur="commit"
    @keydown.enter.prevent="commit"
    @keydown.esc.prevent="cancel"
  />
  <button
    v-else
    :id="id"
    type="button"
    class="nb-inline-edit__text"
    :class="[`nb-inline-edit__text--${size}`, { 'is-disabled': disabled }]"
    :aria-label="`${label}: ${modelValue || placeholder || 'empty'}. Press Enter to edit.`"
    :disabled="disabled"
    @click="start"
  >
    <span :class="{ 'nb-inline-edit__placeholder': !modelValue }">
      {{ modelValue || placeholder }}
    </span>
    <NbIcon
      v-if="!disabled"
      class="nb-inline-edit__pencil"
      name="pencil-simple"
      :size="pencilSize"
    />
  </button>
</template>

<script setup lang="ts">
// Presentation-first editing: the value renders as text (wrapping, selectable
// by intent, no field chrome) and becomes an input only while the user is
// actually editing. Enter or blur commits; Escape restores the value the edit
// started from. The parent hears `update:modelValue` live, then one `commit`
// or `cancel` when the edit ends.
import { computed, nextTick, ref } from 'vue'
import type { IInlineEditProps } from './InlineEdit.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<IInlineEditProps>(), {
  placeholder: undefined,
  size: 'md',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  commit: [value: string]
  cancel: []
}>()

const editing = ref(false)
const input = ref<HTMLInputElement | null>(null)
let original = ''

const pencilSize = computed(
  () => ({ md: 14, lg: 16, xl: 18 })[props.size ?? 'md'],
)

function start(): void {
  if (props.disabled) return
  original = props.modelValue
  editing.value = true
  void nextTick(() => {
    input.value?.focus()
    input.value?.select()
  })
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function commit(): void {
  if (!editing.value) return
  editing.value = false
  emit('commit', props.modelValue)
}

function cancel(): void {
  if (!editing.value) return
  editing.value = false
  emit('update:modelValue', original)
  emit('cancel')
}

defineExpose({ start })
</script>

<style scoped lang="scss">
@mixin scale($set) {
  font-family: var(--nb-type-#{$set}-family, var(--nb-font-family-sans));
  font-size: var(--nb-type-#{$set}-size);
  font-weight: var(--nb-type-#{$set}-weight);
  line-height: var(--nb-type-#{$set}-line-height);
  letter-spacing: var(--nb-type-#{$set}-letter-spacing, normal);
}

.nb-inline-edit__text {
  display: inline-flex;
  align-items: baseline;
  gap: calc(var(--nb-base-unit) * 0.75);
  max-width: 100%;
  margin: 0;
  padding: calc(var(--nb-base-unit) * 0.25) calc(var(--nb-base-unit) * 0.75);
  margin-inline-start: calc(var(--nb-base-unit) * -0.75);
  border: 0;
  border-radius: var(--nb-radius-sm);
  background: transparent;
  color: inherit;
  text-align: start;
  cursor: text;

  span {
    overflow-wrap: anywhere;
  }

  .nb-inline-edit__pencil {
    flex: none;
    align-self: center;
    color: var(--nb-c-text-subtle);
    opacity: 0;
    transition: opacity 120ms ease;
  }

  &:hover:not(.is-disabled) {
    background: var(--nb-c-surface-hover);

    .nb-inline-edit__pencil {
      opacity: 1;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring, var(--nb-c-primary));
    outline-offset: 1px;

    .nb-inline-edit__pencil {
      opacity: 1;
    }
  }

  &.is-disabled {
    cursor: default;
  }
}

.nb-inline-edit__placeholder {
  color: var(--nb-c-text-subtle);
}

.nb-inline-edit__input {
  width: 100%;
  margin: 0;
  padding: calc(var(--nb-base-unit) * 0.25) calc(var(--nb-base-unit) * 0.75);
  margin-inline-start: calc(var(--nb-base-unit) * -0.75);
  border: 1px solid var(--nb-c-primary);
  border-radius: var(--nb-radius-sm);
  background: var(--nb-c-surface);
  color: inherit;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px
      color-mix(in srgb, var(--nb-c-primary) 30%, transparent);
  }
}

.nb-inline-edit__text--md,
.nb-inline-edit__input--md {
  @include scale('body-md');
}

.nb-inline-edit__text--lg,
.nb-inline-edit__input--lg {
  @include scale('heading-01');
}

.nb-inline-edit__text--xl,
.nb-inline-edit__input--xl {
  @include scale('heading-02');
}
</style>
