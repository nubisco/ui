<template>
  <div
    :class="['nb-file-uploader', { 'nb-file-uploader--disabled': disabled }]"
    v-bind="layerProps"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <p v-if="heading" class="nb-file-uploader__heading">{{ heading }}</p>
    <p v-if="description" class="nb-file-uploader__description">
      {{ description }}
    </p>

    <!-- Drag-over state: replaces the button with a visual drop zone -->
    <div
      v-if="isDragging"
      class="nb-file-uploader__dropzone"
      :class="`nb-file-uploader__dropzone--${variant}`"
    >
      <span class="nb-file-uploader__drop-label">
        Drag and drop files here<br />or click to upload
      </span>
    </div>

    <NbButton
      v-else
      class="nb-file-uploader__btn"
      :variant="variant"
      :disabled="disabled"
      @click.stop="openFilePicker"
    >
      {{ buttonLabel }}
    </NbButton>

    <input
      ref="inputRef"
      type="file"
      class="nb-file-uploader__input"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onFileInputChange"
    />

    <ul v-if="files.length" class="nb-file-uploader__list">
      <li
        v-for="(item, i) in files"
        :key="i"
        class="nb-file-uploader__item"
        :class="{
          'nb-file-uploader__item--error': item.error,
          'nb-file-uploader__item--success': item.status === 'success',
        }"
      >
        <span class="nb-file-uploader__name">{{ item.file.name }}</span>

        <span class="nb-file-uploader__status">
          <NbIcon
            v-if="item.status === 'loading'"
            name="circle-notch"
            class="nb-file-uploader__spinner"
          />
          <NbIcon
            v-else-if="item.status === 'success'"
            name="check-circle-fill"
            class="nb-file-uploader__check"
          />
          <NbIcon
            v-if="item.error"
            name="warning-circle-fill"
            class="nb-file-uploader__warn"
          />
          <button
            v-if="item.status !== 'loading'"
            class="nb-file-uploader__remove"
            type="button"
            :aria-label="`Remove ${item.file.name}`"
            :disabled="disabled"
            @click="removeFile(i)"
          >
            <NbIcon name="x" />
          </button>
        </span>

        <div v-if="item.error" class="nb-file-uploader__error">
          {{ item.error }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { EVariant } from '@/types/Variants.d'
import {
  EFileUploaderStatus,
  IFileItem,
  IFileUploaderProps,
} from './FileUploader.d'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'

const props = withDefaults(defineProps<IFileUploaderProps>(), {
  buttonLabel: 'Add file',
  variant: EVariant.Primary,
  multiple: false,
  disabled: false,
})

// The uploader itself paints nothing, but the file rows it owns paint a surface
// with a transparent border, so they vanish when they land on a container of the
// same layer. Taking the current layer here moves those rows one step deeper.
const { layerProps } = useSurfaceLayer()

const emit = defineEmits<{
  /** Emitted whenever the file list changes. */
  (e: 'change', files: File[]): void
  /** Emitted when a file is removed. */
  (e: 'remove', file: File): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const files = ref<IFileItem[]>([])
const isDragging = ref(false)
let dragCounter = 0

// Turning disabled on mid-drag drops the highlight, or the drop zone would
// stay up with nothing left to receive the file.
watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) return
    dragCounter = 0
    isDragging.value = false
  },
)

// Disabled is enforced here as well as on the elements. The button and the
// input are natively disabled, which already stops a click and the keyboard,
// but a drop lands on the root, which has no native disabled state.
function openFilePicker() {
  if (props.disabled) return
  inputRef.value?.click()
}

function validateFile(file: File): string | undefined {
  if (props.maxSize && file.size > props.maxSize) {
    return `File exceeds size limit.`
  }
  if (props.accept) {
    const exts = props.accept.split(',').map((a) => a.trim().toLowerCase())
    const name = file.name.toLowerCase()
    const matched = exts.some((ext) => {
      if (ext.startsWith('.')) return name.endsWith(ext)
      if (ext.includes('/'))
        return (
          file.type === ext || file.type.startsWith(ext.replaceAll('*', ''))
        )
      return false
    })
    if (!matched) return `File type not accepted.`
  }
}

function addFiles(rawFiles: FileList | File[]) {
  const list = Array.from(rawFiles)
  if (!props.multiple) {
    files.value = []
  }
  for (const file of list) {
    const error = validateFile(file)
    files.value.push({ file, status: EFileUploaderStatus.Idle, error })
  }
  emit(
    'change',
    files.value.filter((f) => !f.error).map((f) => f.file),
  )
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (props.disabled) {
    input.value = ''
    return
  }
  if (input.files?.length) {
    addFiles(input.files)
    input.value = ''
  }
}

function onDragEnter() {
  if (props.disabled) return
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

// The drag events are still cancelled while disabled, because an uncancelled
// drop makes the browser open the file in place of the page. A `none` drop
// effect shows the not-allowed cursor and the drop never fires.
function onDragOver(event: DragEvent) {
  if (props.disabled && event.dataTransfer) {
    event.dataTransfer.dropEffect = 'none'
  }
}

function onDrop(event: DragEvent) {
  dragCounter = 0
  isDragging.value = false
  if (props.disabled) return
  const dropped = event.dataTransfer?.files
  if (dropped?.length) addFiles(dropped)
}

function removeFile(index: number) {
  if (props.disabled) return
  const removed = files.value[index]
  files.value.splice(index, 1)
  emit('remove', removed.file)
  emit(
    'change',
    files.value.filter((f) => !f.error).map((f) => f.file),
  )
}

/** Programmatically set file status (useful after async upload). */
function setFileStatus(
  index: number,
  status: IFileItem['status'],
  error?: string,
) {
  if (files.value[index]) {
    files.value[index].status = status
    files.value[index].error = error
  }
}

defineExpose({ files, setFileStatus })
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
// The drop label is text on the page, not on a fill: see logic/_ink.scss.
@use '../styles/logic/ink' as ink;

.nb-file-uploader {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__heading {
    margin: 0;
    font-weight: 600;
    font-size: 1rem;
    color: var(--nb-c-text);
  }

  &__description {
    margin: 0;
    font-size: 0.875rem;
    color: var(--nb-c-text-muted);
    border-left: 3px solid var(--nb-c-border);
    padding-left: 0.75rem;
    line-height: 1.5;
  }

  &__input {
    display: none;
  }

  &__btn {
    align-self: flex-start;
  }

  // Drop zone: shown only while dragging (v-if controlled)
  &__dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    border: 2px dashed var(--nb-c-border);
    @include radius.surface(panel);
    cursor: pointer;
    text-align: center;
    transition:
      border-color 0.15s,
      background 0.15s;

    &--primary {
      background: color-mix(in srgb, var(--nb-c-primary) 6%, transparent);
      border-color: color-mix(in srgb, var(--nb-c-primary) 60%, transparent);
      .nb-file-uploader__drop-label {
        color: ink.ink(primary);
      }
    }
    &--secondary {
      background: color-mix(in srgb, var(--nb-c-secondary) 6%, transparent);
      border-color: color-mix(in srgb, var(--nb-c-secondary) 60%, transparent);
      .nb-file-uploader__drop-label {
        color: ink.ink(secondary);
      }
    }
    &--danger {
      background: color-mix(in srgb, var(--nb-c-danger) 6%, transparent);
      border-color: color-mix(in srgb, var(--nb-c-danger) 60%, transparent);
      .nb-file-uploader__drop-label {
        color: ink.ink(danger);
      }
    }
    &--success {
      background: color-mix(in srgb, var(--nb-c-success) 6%, transparent);
      border-color: color-mix(in srgb, var(--nb-c-success) 60%, transparent);
      .nb-file-uploader__drop-label {
        color: ink.ink(success);
      }
    }
    &--warning {
      background: color-mix(in srgb, var(--nb-c-warning) 6%, transparent);
      border-color: color-mix(in srgb, var(--nb-c-warning) 60%, transparent);
      .nb-file-uploader__drop-label {
        color: ink.ink(warning);
      }
    }
  }

  &__drop-label {
    font-size: 0.9rem;
    line-height: 1.6;
    pointer-events: none;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__item {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    align-items: center;
    background: var(--nb-c-surface);
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 0.6rem 0.875rem;
    font-size: 0.9rem;
    color: var(--nb-c-text);
    transition: border-color 0.15s;

    &--error {
      border-color: var(--nb-c-danger);
    }
  }

  &__name {
    grid-column: 1;
    grid-row: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 0.5rem;
  }

  &__status {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__error {
    grid-column: 1 / -1;
    grid-row: 2;
    font-size: 0.8125rem;
    color: var(--nb-c-danger);
    padding-top: 0.35rem;
    border-top: 1px solid var(--nb-c-border);
    margin-top: 0.35rem;
  }

  &__remove {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--nb-c-text-muted);
    display: flex;
    align-items: center;
    line-height: 1;

    &:hover:not(:disabled) {
      color: var(--nb-c-text);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  // Disabled dims what the button does not dim itself, at the opacity every
  // other disabled field uses. The button carries its own disabled look, so it
  // is left out here rather than dimmed twice.
  &--disabled &__heading,
  &--disabled &__description,
  &--disabled &__list {
    opacity: var(--nb-field-disabled-opacity, 0.45);
  }

  &__spinner {
    animation: nb-spin 0.8s linear infinite;
    color: var(--nb-c-primary);
  }

  &__check {
    color: var(--nb-c-primary);
  }

  &__warn {
    color: var(--nb-c-danger);
  }
}

@keyframes nb-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
