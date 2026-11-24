<template>
  <div
    :class="[
      'nb-code-editor',
      {
        'nb-code-editor--disabled': disabled,
        'nb-code-editor--readonly': readonly,
      },
    ]"
  >
    <NbLabel
      v-if="label"
      :id="labelId"
      :for="fallback ? inputId : undefined"
      :required="required"
      :disabled="disabled"
      @click="focus"
    >
      {{ label }}
    </NbLabel>

    <div
      class="nb-code-editor__field"
      :class="{
        'nb-code-editor__field--focused': focused,
        'nb-code-editor__field--error': !!error,
        'nb-code-editor__field--warning': !error && !!warning,
      }"
      :style="{ height: fallback ? undefined : `${height}px` }"
    >
      <!-- Without Monaco (not installed, or it failed to load) the content is
           still editable, as plain text in the same box. -->
      <textarea
        v-if="fallback"
        :id="inputId"
        v-model="model"
        class="nb-code-editor__fallback"
        :name="name || undefined"
        :rows="rows"
        :placeholder="placeholder || undefined"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="invalid"
        :aria-describedby="describedBy"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
      />
      <div v-else ref="host" class="nb-code-editor__host" />
    </div>

    <NbMessage
      v-if="messageText"
      :id="messageId"
      :key="messageKey"
      :variant="messageVariant"
      :live="messageLive"
      class="nb-code-editor__message"
    >
      {{ messageText }}
    </NbMessage>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import type { ICodeEditorProps } from './CodeEditor.d'
import { useStableId } from '@/composables/useStableId.composable'
import {
  joinDescribedBy,
  useFieldMessage,
} from '@/composables/useFieldMessage.composable'
import { readEditorColors } from '@/utils/codeEditorTheme.helper'

defineOptions({ name: 'NbCodeEditor' })

const props = withDefaults(defineProps<ICodeEditorProps>(), {
  language: 'plaintext',
  rows: 8,
  maxRows: 24,
  lineNumbers: true,
  wrap: true,
  options: undefined,
  label: '',
  helper: '',
  error: '',
  warning: '',
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  id: undefined,
  name: '',
})

const emit = defineEmits<{
  /** Monaco is loaded and the editor is on screen, with the editor instance. */
  ready: [editor: unknown]
}>()

const model = defineModel<string>({ default: '' })

// The content sits 8px inside the box, top and bottom, like the other fields.
// The line height is the code type set's, read on mount, so the box can be
// sized in lines.
const PAD = 8
const line = ref(20)

const inputId = useStableId(props)
const labelId = `${inputId}-label`
const host = ref<HTMLElement | null>(null)
const editor = shallowRef<any>(null)
const fallback = ref(false)
const focused = ref(false)
const contentHeight = ref(0)

const {
  variant: fieldMessageVariant,
  text: messageText,
  messageId,
  invalid,
  live: messageLive,
  key: messageKey,
} = useFieldMessage(props, inputId)
const messageVariant = computed(() => fieldMessageVariant.value ?? 'helper')
const describedBy = computed(() =>
  joinDescribedBy(messageText.value ? messageId.value : undefined),
)

const height = computed(() => {
  const min = props.rows * line.value + PAD * 2
  const max = Math.max(props.maxRows, props.rows) * line.value + PAD * 2
  return Math.min(max, Math.max(min, contentHeight.value))
})

let monaco: any = null
let themeObserver: MutationObserver | null = null
let applyingExternal = false
// One theme name per editor, because two editors can sit in regions painted
// in different modes and Monaco themes are global.
const themeName = `nb-code-editor-${inputId}`

/**
 * Builds the Monaco theme from the tokens as they resolve here, and applies
 * it. Syntax colours come from Monaco's own light or dark theme, which are
 * built for legibility. The editor's chrome comes from the design system.
 */
function applyTheme() {
  if (!monaco || !host.value) return
  const colors = readEditorColors(host.value)
  const dark = isDark(colors['editor.background'])
  monaco.editor.defineTheme(themeName, {
    base: dark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors,
  })
  monaco.editor.setTheme(themeName)
}

function isDark(hex: string | undefined): boolean {
  if (!hex) return document.documentElement.style.colorScheme === 'dark'
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128
}

function describe() {
  // Monaco's own textarea carries the keyboard focus, so that is where the
  // field's description belongs.
  const input = host.value?.querySelector('textarea')
  if (!input) return
  if (describedBy.value)
    input.setAttribute('aria-describedby', describedBy.value)
  else input.removeAttribute('aria-describedby')
  if (invalid.value) input.setAttribute('aria-invalid', invalid.value)
  else input.removeAttribute('aria-invalid')
  if (props.required) input.setAttribute('aria-required', 'true')
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  try {
    monaco = await import('monaco-editor')
  } catch (reason) {
    console.warn(
      `[NubiscoUI] NbCodeEditor: monaco-editor is unavailable (${
        reason instanceof Error ? reason.message : 'not installed'
      }); showing a plain text field.`,
    )
    fallback.value = true
    return
  }
  if (!host.value) return

  applyTheme()
  // Monaco takes numbers, so the code type set is read off the host, which
  // the stylesheet sets in it.
  const type = getComputedStyle(host.value)
  line.value = parseFloat(type.lineHeight) || line.value
  editor.value = monaco.editor.create(host.value, {
    value: model.value,
    language: props.language,
    theme: themeName,
    readOnly: props.readonly || props.disabled,
    domReadOnly: props.disabled,
    lineNumbers: props.lineNumbers ? 'on' : 'off',
    wordWrap: props.wrap ? 'on' : 'off',
    placeholder: props.placeholder || undefined,
    ariaLabel: props.label || undefined,
    fontFamily: type.fontFamily,
    fontSize: parseFloat(type.fontSize) || 13,
    lineHeight: line.value,
    padding: { top: PAD, bottom: PAD },
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    overviewRulerLanes: 0,
    renderLineHighlight: 'line',
    stickyScroll: { enabled: false },
    tabSize: 2,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    ...props.options,
  })

  editor.value.onDidChangeModelContent(() => {
    if (applyingExternal) return
    model.value = editor.value.getValue()
  })
  editor.value.onDidContentSizeChange((e: { contentHeight: number }) => {
    contentHeight.value = e.contentHeight
  })
  editor.value.onDidFocusEditorText(() => (focused.value = true))
  editor.value.onDidBlurEditorText(() => (focused.value = false))
  contentHeight.value = editor.value.getContentHeight()
  describe()

  // The mode and the dark surfaces are attributes and styles on <html>, so a
  // change to either repaints the editor to match.
  themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', 'data-nb-dark-surfaces'],
  })

  emit('ready', editor.value)
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  editor.value?.getModel()?.dispose()
  editor.value?.dispose()
  editor.value = null
})

watch(model, (value) => {
  const instance = editor.value
  if (!instance || instance.getValue() === value) return
  applyingExternal = true
  // An edit, not setValue, so the person's undo history survives a value
  // that arrives from outside.
  instance.executeEdits('nb-code-editor', [
    { range: instance.getModel().getFullModelRange(), text: value ?? '' },
  ])
  instance.pushUndoStop()
  applyingExternal = false
})

watch(
  () => props.language,
  (language) => {
    const instance = editor.value
    if (instance) monaco.editor.setModelLanguage(instance.getModel(), language)
  },
)

watch(
  () => [props.readonly, props.disabled, props.lineNumbers, props.wrap],
  () =>
    editor.value?.updateOptions({
      readOnly: props.readonly || props.disabled,
      domReadOnly: props.disabled,
      lineNumbers: props.lineNumbers ? 'on' : 'off',
      wordWrap: props.wrap ? 'on' : 'off',
    }),
)

watch(
  () => [describedBy.value, invalid.value],
  () => describe(),
)

/** Puts the caret in the editor. */
function focus() {
  if (editor.value) editor.value.focus()
  else (document.getElementById(inputId) as HTMLTextAreaElement | null)?.focus()
}

/**
 * Formats the content with the language's formatter, where Monaco has one
 * (JSON, CSS, HTML, JavaScript, TypeScript). Does nothing for the others.
 */
async function format() {
  await editor.value?.getAction('editor.action.formatDocument')?.run()
}

defineExpose({ focus, format, editor })
</script>

<style scoped lang="scss">
@use '../styles/logic/field' as field;

.nb-code-editor {
  display: flex;
  flex-direction: column;
  gap: var(--nb-field-label-gap);
  min-width: 0;
  font-family: var(--nb-font-family-sans);

  &__field {
    position: relative;
    min-width: 0;
    background: var(--nb-c-field-bg);
    border: var(--nb-field-border-width, 0) solid var(--nb-c-field-border);
    border-bottom: 1px solid var(--nb-c-field-border);
    @include field.radius;
    overflow: hidden;
    transition: border-color var(--nb-motion-short);

    &--focused {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }

    &--error {
      border-color: var(--nb-c-text-error);
    }

    &--warning {
      border-color: var(--nb-c-text-warning);
    }
  }

  &__host,
  &__fallback {
    font-family: var(--nb-type-code-md-family);
    font-size: var(--nb-type-code-md-size);
    font-weight: var(--nb-type-code-md-weight);
    line-height: var(--nb-type-code-md-line-height);
  }

  &__host {
    width: 100%;
    height: 100%;
  }

  &__fallback {
    display: block;
    box-sizing: border-box;
    width: 100%;
    min-height: 80px;
    padding: 8px var(--nb-field-padding-h);
    border: 0;
    background: transparent;
    color: var(--nb-c-text);
    resize: vertical;

    &:focus {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }
  }

  &--disabled &__field {
    background: var(--nb-c-field-bg-disabled);
    border-color: var(--nb-c-field-border-disabled);
    opacity: 0.6;
  }

  &--readonly &__field {
    border-bottom-color: var(--nb-c-field-border-readonly);
  }

  &__message {
    font-size: var(--nb-type-body-sm-size);
  }
}
</style>
