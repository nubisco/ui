<template>
  <NbGrid
    dir="col"
    :class="[
      'nb-text-input',
      `nb-text-input--${variant}`,
      `nb-text-input--${resolvedSize}`,
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
        :disabled="isDisabled"
      >
        {{ label }}
      </NbLabel>

      <div class="nb-text-input__field-wrapper" :class="wrapperClasses">
        <!-- Padded to where the text would start, so a leading icon lines up
             with the placeholder of the field above it, and the text after it
             moves in by only the icon gap. Rendered only when filled, so a
             field without it does not move. -->
        <div v-if="$slots.leading" class="nb-text-input__leading">
          <slot name="leading" />
        </div>

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
            :aria-invalid="ariaInvalid"
            :aria-describedby="describedBy"
            class="nb-text-input__field--transparent"
            :value="model"
            :placeholder="placeholder"
            :disabled="isDisabled"
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
            :aria-invalid="ariaInvalid"
            :aria-describedby="describedBy"
            type="text"
            class="nb-text-input__field--transparent"
            :value="model"
            :placeholder="placeholder"
            :disabled="isDisabled"
            :readonly="readonly"
            :name="name"
            :maxlength="maxlength"
            spellcheck="false"
            @input="model = ($event.target as HTMLInputElement).value"
            @focus="focused = true"
            @blur="focused = false"
            @keydown.esc="onEscape"
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
            :aria-invalid="ariaInvalid"
            :aria-describedby="describedBy"
            class="nb-text-input__field"
            :placeholder="placeholder"
            :disabled="isDisabled"
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
            :aria-invalid="ariaInvalid"
            :aria-describedby="describedBy"
            class="nb-text-input__field"
            :type="inputType"
            :placeholder="placeholder"
            :disabled="isDisabled"
            :readonly="readonly"
            :required="required"
            :name="name"
            :min="min"
            :max="max"
            :step="step"
            :maxlength="maxlength"
            @focus="focused = true"
            @blur="focused = false"
            @keydown.esc="onEscape"
          />
        </template>

        <slot name="trailing" />

        <!-- An NbAiLabel when AI filled the field: right and vertically
             centred, at the far left of any actions. -->
        <div v-if="$slots.decorator" class="nb-text-input__decorator">
          <slot name="decorator" />
        </div>

        <!-- Actions: buttons rendered inside the field at the trailing edge
             (AI suggest, password toggle, clear, etc.) -->
        <div v-if="$slots.actions" class="nb-text-input__actions">
          <slot name="actions" />
        </div>

        <!-- Built-in controls, last so the reveal toggle sits at the far
             right, where Carbon puts it. They keep the caret in the field
             on a click (mousedown is prevented) and are still tab stops. -->
        <div v-if="showClear || showReveal" class="nb-text-input__controls">
          <NbButton
            v-if="showClear"
            variant="ghost"
            icon="x"
            :size="resolvedSize"
            :label="nbStrings.textInputClear"
            class="nb-text-input__control nb-text-input__clear"
            @mousedown.prevent
            @click="clear"
          />
          <NbButton
            v-if="showReveal"
            variant="ghost"
            :icon="revealed ? 'eye-slash' : 'eye'"
            :size="resolvedSize"
            :label="
              revealed
                ? nbStrings.textInputHidePassword
                : nbStrings.textInputShowPassword
            "
            :disabled="isDisabled"
            class="nb-text-input__control nb-text-input__reveal"
            @mousedown.prevent
            @click="revealed = !revealed"
          />
        </div>
      </div>

      <NbMessage
        v-if="hasMessage"
        :id="messageId"
        :key="messageKey"
        :variant="messageVariant"
        :live="messageLive"
        class="nb-text-input__message"
      >
        {{ messageText }}
      </NbMessage>

      <!-- The count is a reading aid, not a live region: the native maxlength
           already stops input at the limit, and announcing every keystroke
           would drown out the field. -->
      <span v-if="countVisible" class="nb-text-input__count">{{
        countText
      }}</span>

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
            :title="label || undefined"
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
            :id="messageId"
            :key="messageKey"
            :variant="messageVariant"
            :live="messageLive"
            icon-only
            class="nb-text-input__inner-message"
          >
            {{ messageText }}
          </NbMessage>
          <span v-if="countVisible" class="nb-text-input__count">{{
            countText
          }}</span>
        </div>

        <input
          :id="inputId"
          ref="nativeRef"
          v-bind="$attrs"
          v-model="model"
          :aria-invalid="ariaInvalid"
          :aria-describedby="describedBy"
          class="nb-text-input__field"
          :type="type"
          :placeholder="placeholder"
          :disabled="isDisabled"
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

      <slot name="dropdown" />
    </template>
  </NbGrid>
</template>

<script setup lang="ts">
import NbGrid from './Grid.vue'
import {
  computed,
  nextTick,
  provide,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue'
import type { IReadableFieldComponent } from '@/types/Props.d'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbButton from './Button.vue'
import { NB_TEXT_INPUT_CONTEXT } from './TextInput.context'
import { useInputGroupField } from './InputGroup.context'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { useStableId } from '@/composables/useStableId.composable'
import {
  joinDescribedBy,
  useFieldMessage,
} from '@/composables/useFieldMessage.composable'

// Ensure $attrs (class, style, event listeners, native attrs) flow to the native element
defineOptions({ inheritAttrs: false })

export interface ITextInputProps extends IReadableFieldComponent {
  /** Native input type forwarded to the `<input>` element. */
  type?: string
  min?: string | number
  max?: string | number
  step?: string | number
  maxlength?: number
  /**
   * Shows how many characters are used out of `maxlength` (`12/200`). Has no
   * effect without `maxlength`.
   */
  showCount?: boolean
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
  /**
   * Shows a clear button (`x`) at the trailing edge while the field has a
   * value. It empties the field, emits `clear` and keeps focus in the field.
   * Escape does the same from the keyboard. Single-line only.
   */
  clearable?: boolean
  /**
   * With `type="password"`, shows an eye button at the far right that shows
   * and hides the characters. Its name ("Show password", "Hide password")
   * comes from the string catalogue. Single-line only.
   */
  revealable?: boolean
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
  showCount: false,
  multiline: false,
  rows: 3,
  highlight: undefined,
  clearable: false,
  revealable: false,
})

const emit = defineEmits<{
  /** The field was emptied by its clear button or by Escape. */
  clear: []
}>()

const model = defineModel<string>({ default: '' })

const nbStrings = useNbStrings()
const countVisible = computed(
  () => props.showCount && typeof props.maxlength === 'number',
)
// String length, not code points: it is the unit the native maxlength counts.
const countText = computed(() =>
  nbStrings.value.textInputCount(
    (model.value ?? '').length,
    props.maxlength ?? 0,
  ),
)

const nativeRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const mirrorRef = ref<HTMLDivElement | null>(null)

// Expose the native element so consumers (e.g. TranslationEditor) can access
// selectionStart, setSelectionRange, focus, blur, etc.
defineExpose({
  focus: () => nativeRef.value?.focus(),
  blur: () => nativeRef.value?.blur(),
  nativeEl: nativeRef,
})

// What the #dropdown slot can reach: NbSuggestionList listens to this field.
provide(NB_TEXT_INPUT_CONTEXT, { field: nativeRef })

const focused = ref(false)

// ─── Clear and reveal ──────────────────────────────────────
const showClear = computed(
  () =>
    props.clearable &&
    !props.multiline &&
    !isDisabled.value &&
    !props.readonly &&
    !!model.value,
)
const showReveal = computed(
  () => props.revealable && !props.multiline && props.type === 'password',
)
const revealed = ref(false)
// Revealing swaps the native type, and only for a password: any other type
// is left exactly as the caller set it.
const inputType = computed(() =>
  showReveal.value && revealed.value ? 'text' : props.type,
)

function clear() {
  model.value = ''
  emit('clear')
  nativeRef.value?.focus()
}

/*
 * Escape clears a clearable field, as Carbon's search does. It is stopped
 * only when it cleared something, so an Escape on an empty field still
 * reaches the dialog or menu around it.
 */
function onEscape(event: KeyboardEvent) {
  if (!showClear.value) return
  event.stopPropagation()
  clear()
}

// Positional on purpose: two forms on one page can share a field name, and
// a name-derived id would then collide and break the label's `for`.
const autoId = useStableId({})
// Inside an NbInputGroup the group's size, disabled state and message win,
// and the first field takes the id the group's label points at.
const group = useInputGroupField(props, autoId)
const inputId = group.id
const resolvedSize = group.size
const isDisabled = group.disabled

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

// Error, then warning, then helper. Every message prop defaults to '', so
// the composable falls through on empty rather than on null.
const {
  variant: fieldMessageVariant,
  text: messageText,
  messageId,
  invalid,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, inputId)
const messageVariant = computed(() => fieldMessageVariant.value ?? 'helper')
const hasMessage = computed(() => !!messageText.value)

const attrs = useAttrs()
const describedBy = computed(() =>
  joinDescribedBy(
    attrs['aria-describedby'] as string | undefined,
    messageId.value,
    group.describedBy.value,
  ),
)
const ariaInvalid = computed(
  () => invalid.value ?? (group.status.value === 'error' ? 'true' : undefined),
)
const hasError = computed(() => !!props.error || group.status.value === 'error')
const hasWarning = computed(
  () =>
    !hasError.value && (!!props.warning || group.status.value === 'warning'),
)

const slots = useSlots()

const wrapperClasses = computed(() => ({
  'nb-text-input__field-wrapper--focused': focused.value,
  'nb-text-input__field-wrapper--error': hasError.value,
  'nb-text-input__field-wrapper--warning': hasWarning.value,
  'nb-text-input__field-wrapper--disabled': isDisabled.value,
  'nb-text-input__field-wrapper--readonly': props.readonly,
  'nb-text-input__field-wrapper--overlay': useOverlay.value,
  'nb-text-input__field-wrapper--multiline': props.multiline,
  'nb-text-input__field-wrapper--leading': !!slots.leading,
}))
</script>

<style scoped lang="scss">
@use '../styles/logic/touch' as touch;
@use '../styles/logic/field' as field;

.nb-text-input {
  font-family: var(--nb-font-family-sans);
  gap: var(--nb-field-label-gap);
  --field-h: var(--nb-field-height-md);
  // A field fills and shrinks to its container; it never forces the container
  // wider. Without this a multiline field's textarea uses its intrinsic
  // (cols-based) width and overflows a narrow cell (e.g. in an inspector).
  min-width: 0;

  &--xs {
    --field-h: var(--nb-field-height-xs);
    --nb-field-font-size: var(--nb-type-body-compact-size);
  }
  &--sm {
    --field-h: var(--nb-field-height-sm);
  }
  &--md {
    --field-h: var(--nb-field-height-md);
  }
  &--lg {
    --field-h: var(--nb-field-height-lg);
  }

  /*
   * Where the text starts. The field's own inline padding, unless a leading
   * slot takes that place: then the slot carries the field padding (so its
   * icon sits where text would start) and the text follows it by the icon
   * gap, the same 8px the trailing decorator keeps on its side.
   */
  --nb-text-input-pad-start: var(--nb-field-padding-h);

  &__field-wrapper--leading {
    --nb-text-input-pad-start: var(--nb-base-unit);
  }

  &__leading {
    display: flex;
    align-items: center;
    align-self: stretch;
    flex-shrink: 0;
    padding-inline-start: var(--nb-field-padding-h);
    color: var(--nb-c-text-muted);
    z-index: 2; // above the transparent overlay input
  }

  // A multiline field's icon belongs to the first line, not the middle of
  // the box: it sits in a first-line-tall row at the textarea's top padding.
  &--multiline &__leading {
    align-self: flex-start;
    box-sizing: content-box;
    padding-block-start: 8px;
    height: calc(var(--nb-field-font-size) * var(--nb-field-line-height));
  }

  .nb-text-input__field-wrapper--disabled &__leading {
    color: var(--nb-c-text-placeholder);
  }

  // ─── Field wrapper ────────────────────────────────────────
  &__field-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--nb-c-field-bg);
    /*
     * Square draws one bottom rule; rounded draws the whole box.
     *
     * A capsule cannot be described by an underline, so the appearance
     * setting supplies the side borders and the radius together. Both default
     * to zero, so nothing changes for anyone who has not opted into rounded.
     */
    /*
     * One colour for all four sides, and the WIDTH decides which are drawn.
     *
     * The colour must not be aliased through a second token set by the
     * appearance block. That block lives on `<html>`, so `var()` inside it
     * substitutes there, against the palette in force at the root, and the
     * resolved value then inherits down unchanged. A page that switches mode
     * on a wrapper rather than on `<html>` (which is how the documentation
     * previews and any per-region dark area work) therefore got LIGHT sides
     * and a DARK bottom rule on the same field. Naming the token here instead
     * resolves it against the element's own palette, so all four edges always
     * agree.
     */
    border: var(--nb-field-border-width, 0) solid var(--nb-c-field-border);
    // Always 1px, and the only edge square draws.
    border-bottom: 1px solid var(--nb-c-field-border);
    @include field.radius;
    transition:
      border-color var(--nb-motion-short),
      box-shadow var(--nb-motion-short);

    &--focused {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }

    &--error {
      /*
       * `border-color` sets all four sides, but only the sides that have a
       * width can show: square draws none, so the state reads on the bottom
       * rule alone; rounded draws all four, so the state rings the capsule.
       * One rule, both idioms.
       */
      border-color: var(--nb-c-danger);
      box-shadow: inset 0 calc(-1px * var(--nb-field-status-emphasis, 1)) 0 0
        var(--nb-c-danger);
    }

    &--warning {
      /*
       * `border-color` sets all four sides, but only the sides that have a
       * width can show: square draws none, so the state reads on the bottom
       * rule alone; rounded draws all four, so the state rings the capsule.
       * One rule, both idioms.
       */
      border-color: var(--nb-c-warning);
      box-shadow: inset 0 calc(-1px * var(--nb-field-status-emphasis, 1)) 0 0
        var(--nb-c-warning);
    }

    /*
     * Disabled is a fill as well as an opacity, so "you cannot type here"
     * does not rest on a 0.45 alpha alone. The fallback is the enabled fill,
     * which leaves the historic look untouched for anyone not on a preset.
     */
    &--disabled {
      background: var(--nb-c-field-bg-disabled, var(--nb-c-field-bg));
      /*
       * The rule dims too. In a dark theme every candidate fill sits within
       * 1.2:1 of every other, so a fill alone cannot carry
       * enabled-versus-disabled there and the border has to.
       *
       * `border-color`, not `border-bottom-color`: square draws one edge and
       * rounded draws four, and a disabled capsule with three live edges and
       * one dimmed one reads as a defect rather than as a state.
       */
      border-color: var(--nb-c-field-border-disabled, var(--nb-c-field-border));
      opacity: var(--nb-field-disabled-opacity);
      cursor: not-allowed;
    }

    /*
     * Read-only is text that happens to live in a form: no fill, and a
     * quieter underline. It keeps the underline rather than losing it, so the
     * value still reads as a field rather than as loose prose.
     */
    &--readonly {
      background: transparent;
      // All four edges, for the same reason disabled uses all four.
      border-color: var(--nb-c-field-border-readonly, var(--nb-c-field-border));
    }

    &--multiline {
      border-radius: var(--nb-field-radius-multiline, 0);
      align-items: stretch;
      min-width: 0;
      max-width: 100%;
    }
  }

  // A multiline field's textarea fills its wrapper rather than using its
  // intrinsic cols-based width, so it never overflows a narrow container.
  &--multiline &__field {
    width: 100%;
    max-width: 100%;
  }

  /*
   * The single-line field's own height: the field height less the wrapper's
   * top border and its 1px bottom rule, so the whole box is exactly
   * --field-h, as NbSelect, NbNumberInput and NbButton are. It used to be the
   * field height plus the borders, which left a text input 1px taller than a
   * select beside it (2px under rounded) and their bottom rules out of line.
   */
  --nb-text-input-inner-h: calc(
    var(--field-h) - 1px - var(--nb-field-border-width, 0px)
  );

  // ─── Native input / textarea (normal mode) ────────────────
  &__field {
    flex: 1;
    min-width: 0;
    height: var(--nb-text-input-inner-h);
    padding-block: 0;
    padding-inline: var(--nb-text-input-pad-start) var(--nb-field-padding-h);
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: var(--nb-field-font-size);
    // Below 16px iOS zooms the page in when the field takes focus, and leaves
    // it zoomed. Input and textarea alike.
    @include touch.touch-field-text;
    font-weight: 400;
    color: var(--nb-c-text);
    line-height: var(--nb-field-line-height);

    &::placeholder {
      color: var(--nb-c-text-placeholder);
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
    // Both halves of the overlay grow together, or the caret drifts off the
    // mirrored text.
    @include touch.touch-field-text;
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
      height: var(--nb-text-input-inner-h);
      padding-block: 0;
      padding-inline: var(--nb-text-input-pad-start) var(--nb-field-padding-h);
      // line-height = height centres single-line text identically in mirror and input
      line-height: var(--nb-text-input-inner-h);
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
      padding-block: 8px;
      padding-inline: var(--nb-text-input-pad-start) var(--nb-field-padding-h);
      white-space: pre-wrap;
      min-height: 80px;
      overflow-y: auto;
    }

    // Normal (non-overlay) textarea
    .nb-text-input__field {
      height: auto;
      min-height: 80px;
      padding-block: 8px;
      padding-inline: var(--nb-text-input-pad-start) var(--nb-field-padding-h);
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

  /*
   * The built-in clear and reveal buttons: NbButtons, ghost and icon-only,
   * the field's size, each a square of the field's inner height so the box
   * does not grow. They bring the shared hover, focus ring and tooltip.
   */
  &__controls {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    z-index: 2; // above the transparent overlay input
  }

  &__controls &__control {
    width: var(--nb-text-input-inner-h);
    height: var(--nb-text-input-inner-h);
  }

  // The AI label slot, beside the trailing actions.
  &__decorator {
    display: flex;
    align-items: center;
    padding-inline-start: 8px;
    flex-shrink: 0;
    z-index: 2; // above the transparent overlay input
  }

  // ─── Bottom message ───────────────────────────────────────
  &__message {
    font-size: var(--nb-type-body-sm-size);
  }

  &__count {
    align-self: flex-end;
    flex-shrink: 0;
    font-size: var(--nb-type-helper-text-size);
    line-height: var(--nb-type-helper-text-line-height);
    color: var(--nb-c-text-muted);
    font-variant-numeric: tabular-nums;
  }

  // ─── DEFAULT variant ──────────────────────────────────────
  &--default,
  &--fluid {
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
      font-size: var(--nb-type-body-sm-size);
      font-weight: var(--nb-font-weight-semibold, 600);
      color: var(--nb-c-text-muted);
      letter-spacing: var(--nb-type-body-sm-letter-spacing);
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
      font-size: var(--nb-type-body-compact-size);
      @include touch.touch-field-text;
    }
  }
}
</style>
