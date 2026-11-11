<template>
  <div
    :class="[
      'nb-image-picker',
      {
        'nb-image-picker--filled': hasImage,
        'nb-image-picker--dragging': isDragging,
        'nb-image-picker--loading': loading,
        'nb-image-picker--disabled': disabled,
      },
    ]"
    :style="rootStyle"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <button
      type="button"
      class="nb-image-picker__surface"
      :aria-label="hasImage ? text.replace : text.add"
      :aria-busy="loading || undefined"
      :disabled="disabled || loading"
      @click="openFilePicker"
    >
      <img
        v-if="hasImage"
        class="nb-image-picker__image"
        :src="src"
        :alt="alt"
      />
      <span v-else class="nb-image-picker__empty">
        <NbIcon :name="iconPlus" :size="20" aria-hidden="true" />
        <span class="nb-image-picker__label">{{ text.add }}</span>
      </span>
      <span v-if="isDragging" class="nb-image-picker__drop">{{
        text.drop
      }}</span>
    </button>

    <span v-if="loading" class="nb-image-picker__loading">
      <NbSpinner size="md" decorative />
    </span>

    <!-- A sibling of the surface, not inside it: a button cannot sit in a
         button. It is laid over the corner, and shown while the picker is
         hovered or anything in it has focus, so the keyboard reaches it. -->
    <NbButton
      v-if="hasImage && removable"
      class="nb-image-picker__remove"
      variant="ghost"
      size="xs"
      :icon="iconTrash"
      :label="text.remove"
      tooltip-position="left"
      :disabled="removeDisabled || disabled || loading"
      @click.stop="emit('remove')"
    />

    <input
      ref="inputRef"
      type="file"
      class="nb-image-picker__input"
      tabindex="-1"
      aria-hidden="true"
      :accept="accept"
      :disabled="disabled || loading"
      @change="onInputChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as iconPlus from '@nubisco/ui/icons/plus'
import * as iconTrash from '@nubisco/ui/icons/trash'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import NbSpinner from './Spinner.vue'
import type { IImagePickerProps, TImagePickerRejection } from './ImagePicker.d'
import { useNbStrings } from '@/composables/useNbStrings.composable'

const props = withDefaults(defineProps<IImagePickerProps>(), {
  src: '',
  alt: '',
  label: undefined,
  dropLabel: undefined,
  replaceLabel: undefined,
  removeLabel: undefined,
  accept: 'image/*',
  maxSize: undefined,
  removable: true,
  removeDisabled: false,
  loading: false,
  disabled: false,
  size: '10rem',
  ratio: '1 / 1',
  fit: 'contain',
})

// Every visible word is a prop that wins, with the catalogue behind it.
const strings = useNbStrings()
const text = computed(() => ({
  add: props.label ?? strings.value.imagePickerAdd,
  drop: props.dropLabel ?? strings.value.imagePickerDrop,
  replace: props.replaceLabel ?? strings.value.imagePickerReplace,
  remove: props.removeLabel ?? strings.value.imagePickerRemove,
}))

const emit = defineEmits<{
  /** A file was chosen or dropped and passed the type and size checks. */
  pick: [file: File]
  /** The remove button was pressed. The consumer deletes, then clears `src`. */
  remove: []
  /** A file was turned away. The consumer says why, in its own words. */
  reject: [payload: { file: File; reason: TImagePickerRejection }]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
let dragCounter = 0

const hasImage = computed(() => !!props.src)
const blocked = computed(() => props.disabled || props.loading)

const rootStyle = computed(() => ({
  '--nb-image-picker-size':
    typeof props.size === 'number' ? `${props.size}px` : props.size,
  '--nb-image-picker-ratio': props.ratio,
  '--nb-image-picker-fit': props.fit,
}))

// Going disabled or loading mid-drag drops the highlight, or it would stay
// up with nothing left to receive the file.
watch(blocked, (now) => {
  if (!now) return
  dragCounter = 0
  isDragging.value = false
})

function openFilePicker() {
  if (blocked.value) return
  inputRef.value?.click()
}

/** The same reading of `accept` that `<input accept>` makes, for a dropped file. */
function acceptsType(file: File): boolean {
  const rules = props.accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (rules.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return rules.some((rule) => {
    if (rule.startsWith('.')) return name.endsWith(rule)
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
    return type === rule
  })
}

function take(file: File) {
  if (!acceptsType(file)) return emit('reject', { file, reason: 'type' })
  if (props.maxSize && file.size > props.maxSize)
    return emit('reject', { file, reason: 'size' })
  emit('pick', file)
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Cleared so choosing the same file again still fires `change`.
  input.value = ''
  if (file && !blocked.value) take(file)
}

function onDragEnter() {
  if (blocked.value) return
  dragCounter++
  isDragging.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragging.value = false
  }
}

// Still cancelled while blocked: an uncancelled drop makes the browser open the
// file in place of the page. A `none` effect shows the not-allowed cursor.
function onDragOver(event: DragEvent) {
  if (blocked.value && event.dataTransfer)
    event.dataTransfer.dropEffect = 'none'
}

function onDrop(event: DragEvent) {
  dragCounter = 0
  isDragging.value = false
  if (blocked.value) return
  const file = event.dataTransfer?.files?.[0]
  if (file) take(file)
}

defineExpose({ open: openFilePicker })
</script>

<style lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/logic/focus' as focus;
@use '../styles/variables/breakpoints' as bp;

.nb-image-picker {
  position: relative;
  display: block;
  inline-size: var(--nb-image-picker-size, 10rem);
  max-inline-size: 100%;

  &__surface {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    aspect-ratio: var(--nb-image-picker-ratio, 1 / 1);
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    font: inherit;
    color: var(--nb-c-text-subtle);
    background: var(--nb-c-field-bg);
    border: 1px solid var(--nb-c-field-border);
    @include radius.standalone(control);
    transition:
      border-color var(--nb-motion-short) ease,
      background var(--nb-motion-short) ease;

    &:hover:not(:disabled) {
      border-color: var(--nb-c-primary);
    }

    &:focus-visible {
      @include focus.ring;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  // Empty, the box is an invitation: dashed, like a drop target.
  &:not(&--filled) &__surface {
    border-style: dashed;
    border-color: var(--nb-c-component-plain-border);
  }

  &--dragging &__surface {
    border-style: solid;
    border-color: var(--nb-c-primary);
    background: color-mix(
      in srgb,
      var(--nb-c-primary) 8%,
      var(--nb-c-field-bg)
    );
  }

  &--disabled {
    opacity: 0.5;
  }

  &__image {
    inline-size: 100%;
    block-size: 100%;
    object-fit: var(--nb-image-picker-fit, contain);
    // A logo is not told to stretch, and not to fill a corner it has no
    // content in either.
    padding: 0;
    pointer-events: none;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px;
    text-align: center;
    font-size: var(--nb-type-body-compact-size);
    line-height: var(--nb-type-body-compact-line-height);
  }

  &__drop {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    text-align: center;
    font-size: var(--nb-type-heading-compact-size);
    font-weight: var(--nb-font-weight-semibold, 600);
    color: var(--nb-c-text);
    background: color-mix(
      in srgb,
      var(--nb-c-primary) 14%,
      var(--nb-c-field-bg)
    );
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--nb-c-field-bg) 70%, transparent);
    @include radius.standalone(control);
  }

  // Top right, over the image. On its own plate so it reads on any logo.
  &__remove {
    position: absolute;
    inset-block-start: 6px;
    inset-inline-end: 6px;
    opacity: 0;
    background: var(--nb-c-surface);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.18);
    transition: opacity var(--nb-motion-short) ease;
  }

  &:hover &__remove,
  &:focus-within &__remove,
  &__remove:focus-visible {
    opacity: 1;
  }

  // No hover on a touch screen: the control is always there.
  @media (hover: none) {
    &__remove {
      opacity: 1;
    }
  }

  @include bp.phone-touch {
    // The plate is a fingertip target on a phone.
    &__remove {
      inset-block-start: 4px;
      inset-inline-end: 4px;
    }
  }

  // Visually hidden, still a real file input the button opens.
  &__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    border: 0;
  }
}
</style>
