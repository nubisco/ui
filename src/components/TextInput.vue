<template>
  <NbGrid
    dir="col"
    gap="xs"
    :class="[
      'nb-text-input',
      `nb-text-input--${variant}`,
      `nb-text-input--${size}`,
      { 'nb-text-input--multiline': multiline },
    ]"
  >
    <!-- ── DEFAULT variant ───────────────────────────────────── -->
    <template v-if="variant === 'default'">
      <!-- Label row: either a custom #label slot or the built-in NbLabel -->
      <slot v-if="$slots.label" name="label" />
      <NbLabel
        v-else-if="label"
        :for="inputId"
        :required="required"
        :disabled="disabled"
      >
        {{ label }}
      </NbLabel>

      <div class="nb-text-input__field-wrapper" :class="wrapperClasses">
        <slot name="leading" />

        <!-- ░░ OVERLAY MODE (highlight function provided) ░░░░░░░░ -->
        <!-- CSS Grid overlap: mirror and transparent field share the same grid cell,
             guaranteeing identical bounding boxes and pixel-perfect caret alignment. -->
        <div v-if="useOverlay" class="nb-text-input__overlay-wrap">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div
            ref="mirrorRef"
            class="nb-text-input__mirror"
            aria-hidden="true"
            v-html="mirrorHtml"
          />

          <textarea
            v-if="multiline"
            :id="inputId"
            ref="nativeRef"
            v-bind="$attrs"
            class="nb-text-input__field--transparent"
            :value="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :name="name"
            :maxlength="maxlength"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            @input="model = ($event.target as HTMLTextAreaElement).value"
            @focus="focused = true"
            @blur="focused = false"
            @scroll="syncScroll"
          />
          <input
            v-else
            :id="inputId"
            ref="nativeRef"
            v-bind="$attrs"
            type="text"
            class="nb-text-input__field--transparent"
            :value="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :name="name"
            :maxlength="maxlength"
            spellcheck="false"
            @input="model = ($event.target as HTMLInputElement).value"
            @focus="focused = true"
            @blur="focused = false"
          />
        </div>

        <!-- ░░ NORMAL MODE ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ -->
        <template v-else>
          <textarea
            v-if="multiline"
            :id="inputId"
            ref="nativeRef"
            v-bind="$attrs"
            v-model="model"
            class="nb-text-input__field"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :name="name"
            :maxlength="maxlength"
            :rows="rows"
            @focus="focused = true"
            @blur="focused = false"
          />
          <input
            v-else
            :id="inputId"
            ref="nativeRef"
            v-bind="$attrs"
            v-model="model"
            class="nb-text-input__field"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :required="required"
            :name="name"
            :min="min"
            :max="max"
            :step="step"
            :maxlength="maxlength"
            @focus="focused = true"
            @blur="focused = false"
          />
        </template>

        <slot name="trailing" />

        <!-- Actions: buttons rendered inside the field at the trailing edge
             (AI suggest, password toggle, clear, etc.) -->
        <div v-if="$slots.actions" class="nb-text-input__actions">
          <slot name="actions" />
        </div>
      </div>

      <NbMessage
        v-if="hasMessage"
        :variant="messageVariant"
        class="nb-text-input__message"
      >
        {{ messageText }}
      </NbMessage>

      <!-- Dropdowns / popovers anchored to the component root -->
      <slot name="dropdown" />
    </template>

    <!-- ── FLUID variant ─────────────────────────────────────── -->
    <template v-else-if="variant === 'fluid'">
      <div class="nb-text-input__field-wrapper" :class="wrapperClasses">
        <div v-if="label || $slots.label" class="nb-text-input__inner-header">
          <slot v-if="$slots.label" name="label" />
          <label
            v-else
            :for="inputId"
            class="nb-text-input__inner-label"
            :class="{ 'nb-text-input__inner-label--required': required }"
          >
            {{ label }}
            <span
              v-if="required"
              class="nb-text-input__asterisk"
              aria-hidden="true"
              >*</span
            >
          </label>
          <NbMessage
            v-if="hasMessage"
            :variant="messageVariant"
            icon-only
            class="nb-text-input__inner-message"
          >
            {{ messageText }}
          </NbMessage>
        </div>

        <input
          :id="inputId"
          ref="nativeRef"
          v-bind="$attrs"
          v-model="model"
          class="nb-text-input__field"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :name="name"
          :min="min"
          :max="max"
          :step="step"
          :maxlength="maxlength"
          @focus="focused = true"
          @blur="focused = false"
        />
      </div>
    </template>
  </NbGrid>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import type { IReadableFieldComponent } from '@/types/Props.d'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'

// Ensure $attrs (class, style, event listeners, native attrs) flow to the native element
defineOptions({ inheritAttrs: false })

export interface ITextInputProps extends IReadableFieldComponent {
  /** Native input type forwarded to the `<input>` element. */
  type?: string
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: number
  /** Render a <textarea> instead of <input> */
  multiline?: boolean
  /** Initial row count (multiline only, without highlight) */
  rows?: number
  /**
   * Syntax-highlight function. Receives the raw text value, must return an HTML string.
   * When provided, an overlay mirror is rendered below the (transparent) input/textarea
   * so the highlights show through. The highlight span styles must be supplied by the consumer.
   *
   * @example
   * :highlight="(t) => t.replace(/(\{[^}]+\})/g, '<span class=\"hl-var\">$1</span>')"
   */
  highlight?: (text: string) => string
}

const props = withDefaults(defineProps<ITextInputProps>(), {
  variant: 'default',
  size: 'md',
  type: 'text',
  label: '',
  placeholder: '',
  helper: '',
  error: '',
  warning: '',
  disabled: false,
  readonly: false,
  required: false,
  id: undefined,
  name: '',
  min: undefined,
  max: undefined,
  step: undefined,
  maxlength: undefined,
  multiline: false,
  rows: 3,
  highlight: undefined,
})

const model = defineModel<string>({ default: '' })

const nativeRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const mirrorRef = ref<HTMLDivElement | null>(null)

// Expose the native element so consumers (e.g. TranslationEditor) can access
// selectionStart, setSelectionRange, focus, blur, etc.
defineExpose({
  focus: () => nativeRef.value?.focus(),
  blur: () => nativeRef.value?.blur(),
  nativeEl: nativeRef,
})

const focused = ref(false)

// Stable generated ID per instance
const autoId = `nb-input-${useId()}`
const inputId = computed(() => props.id ?? autoId)

// Overlay mode: active when a highlight function is provided
const useOverlay = computed(() => !!props.highlight)

// The mirror div HTML: trailing newline prevents the container collapsing on the last line
const mirrorHtml = computed(() => {
  if (!props.highlight) return ''
  const text = String(model.value ?? '')
  const highlighted = props.highlight(text)
  return highlighted + '\n'
})

// Keep mirror scroll in sync with the textarea scroll
function syncScroll() {
  if (mirrorRef.value && nativeRef.value) {
    mirrorRef.value.scrollTop = nativeRef.value.scrollTop
  }
}

watch(mirrorHtml, () => nextTick(syncScroll))

const messageVariant = computed(() => {
  if (props.error) return 'error'
  if (props.warning) return 'warning'
  return 'helper'
})

const messageText = computed(
  () => props.error ?? props.warning ?? props.helper ?? '',
)
const hasMessage = computed(() => !!messageText.value)

const wrapperClasses = computed(() => ({
  'nb-text-input__field-wrapper--focused': focused.value,
  'nb-text-input__field-wrapper--error': !!props.error,
  'nb-text-input__field-wrapper--warning': !props.error && !!props.warning,
  'nb-text-input__field-wrapper--disabled': props.disabled,
  'nb-text-input__field-wrapper--readonly': props.readonly,
  'nb-text-input__field-wrapper--overlay': useOverlay.value,
  'nb-text-input__field-wrapper--multiline': props.multiline,
}))
</script>

<style scoped lang="scss">
.nb-text-input {
  font-family: var(--nb-font-family-sans);
  --field-h: var(--nb-field-height-md);

  &--sm {
    --field-h: var(--nb-field-height-sm);
  }
  &--md {
    --field-h: var(--nb-field-height-md);
  }
  &--lg {
    --field-h: var(--nb-field-height-lg);
  }

  // ─── Field wrapper ────────────────────────────────────────
  &__field-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--nb-c-field-bg);
    // Always 1px border: never changes width, so no layout shift on focus
    border-bottom: 1px solid var(--nb-c-field-border);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &--focused {
      outline: 2px solid var(--nb-c-primary);
      outline-offset: -2px;
    }

    &--error {
      border-bottom-color: var(--nb-c-danger);
      box-shadow: inset 0 -1px 0 0 var(--nb-c-danger);
    }

    &--warning {
      border-bottom-color: var(--nb-c-warning);
      box-shadow: inset 0 -1px 0 0 var(--nb-c-warning);
    }

    &--disabled {
      opacity: var(--nb-field-disabled-opacity);
      cursor: not-allowed;
    }

    &--readonly {
      background: transparent;
    }

    &--multiline {
      align-items: stretch;
    }
  }

  // ─── Native input / textarea (normal mode) ────────────────
  &__field {
    flex: 1;
    min-width: 0;
    height: var(--field-h);
    padding: 0 var(--nb-field-padding-h);
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: var(--nb-field-font-size);
    font-weight: 400;
    color: var(--nb-c-text);
    line-height: var(--nb-field-line-height);

    &::placeholder {
      color: var(--nb-c-text-subtle);
    }
    &:disabled {
      cursor: not-allowed;
    }
    &:read-only {
      cursor: default;
    }
  }

  // ─── Overlay wrap: CSS Grid overlap ─────────────────────
  // Mirror and transparent input share the SAME grid cell, which guarantees
  // identical bounding boxes, padding, and line-height → caret aligns perfectly.
  &__overlay-wrap {
    flex: 1;
    min-width: 0;
    display: grid;
  }

  &__mirror,
  &__field--transparent {
    grid-area: 1 / 1; // overlap in the same grid cell
    font-family: inherit;
    font-size: var(--nb-field-font-size);
    font-weight: 400;
    line-height: var(--nb-field-line-height);
    word-break: break-word;
    overflow-wrap: break-word;
  }

  &__mirror {
    color: var(--nb-c-text);
    pointer-events: none;
    user-select: none;
    overflow: hidden;
  }

  &__field--transparent {
    background: transparent;
    color: transparent;
    caret-color: var(--nb-c-text);
    border: none;
    outline: none;
    resize: none;
    overflow: hidden;
    z-index: 1; // caret must sit above mirror
    width: 100%; // fill grid cell
  }

  // Single-line overlay: fixed height, text centred via line-height trick
  &:not(.nb-text-input--multiline) {
    .nb-text-input__mirror,
    .nb-text-input__field--transparent {
      height: var(--field-h);
      padding: 0 var(--nb-field-padding-h);
      // line-height = height centres single-line text identically in mirror and input
      line-height: var(--field-h);
      white-space: pre;
      overflow: hidden;
    }
  }

  // Multiline overlay + non-overlay textarea
  &--multiline {
    .nb-text-input__field-wrapper {
      align-items: stretch;
    }

    // Overlay: padding top/bottom, height driven by mirror content
    .nb-text-input__mirror,
    .nb-text-input__field--transparent {
      padding: 8px var(--nb-field-padding-h);
      white-space: pre-wrap;
      min-height: 80px;
      overflow-y: auto;
    }

    // Normal (non-overlay) textarea
    .nb-text-input__field {
      height: auto;
      min-height: 80px;
      padding: 8px var(--nb-field-padding-h);
      resize: vertical;
      overflow: auto;
    }
  }

  // Buttons rendered inside the field at the trailing edge (AI suggest, eye, clear…)
  &__actions {
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
    flex-shrink: 0;
    z-index: 2; // above the transparent overlay input
  }

  // ─── Bottom message ───────────────────────────────────────
  &__message {
    font-size: var(--nb-font-size-12);
  }

  // ─── DEFAULT variant ──────────────────────────────────────
  &--default {
    position: relative; // anchor for #dropdown slot
  }

  // ─── FLUID variant ────────────────────────────────────────
  &--fluid {
    .nb-text-input__field-wrapper {
      box-sizing: border-box;
      flex: 1;
      flex-direction: column;
      align-items: stretch;
      justify-content: space-between;
      min-height: calc(var(--nb-base-unit) * 8);
      padding-top: 8px;
    }

    .nb-text-input__inner-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 var(--nb-field-padding-h);
      margin-bottom: 4px;
    }

    .nb-text-input__inner-label {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
      min-width: 0;
      font-size: var(--nb-font-size-12);
      font-weight: 500;
      color: var(--nb-c-text-muted);
      letter-spacing: 0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: default;
      user-select: none;
    }

    .nb-text-input__asterisk {
      color: var(--nb-c-danger);
    }

    .nb-text-input__field {
      height: auto;
      flex: 1;
      padding: 0 var(--nb-field-padding-h) 10px;
      font-size: var(--nb-font-size-14);
    }
  }
}
</style>
