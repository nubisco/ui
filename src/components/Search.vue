<template>
  <div
    ref="rootRef"
    role="search"
    :class="[
      'nb-search',
      `nb-search--${size}`,
      {
        'nb-search--expandable': expandable,
        'nb-search--expanded': isOpen,
      },
    ]"
    @focusout="onFocusOut"
    @keydown.capture="onKeydownCapture"
  >
    <NbButton
      v-if="!isOpen"
      ref="toggleRef"
      variant="ghost"
      icon="magnifying-glass"
      :size="size"
      :label="resolvedLabel"
      :disabled="disabled"
      class="nb-search__toggle"
      @focus="onToggleFocus"
      @click="expand"
    />
    <NbTextInput
      v-else
      :id="id"
      ref="fieldRef"
      v-model="model"
      type="search"
      enterkeyhint="search"
      clearable
      :size="size"
      :name="name"
      :disabled="disabled"
      :placeholder="resolvedPlaceholder"
      :aria-label="resolvedLabel"
      @clear="emit('clear')"
      @keydown.enter="emit('search', model)"
    >
      <template #leading>
        <NbIcon
          name="magnifying-glass"
          :size="16"
          class="nb-search__icon"
          aria-hidden="true"
        />
      </template>
    </NbTextInput>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import NbTextInput from './TextInput.vue'
import type { ISearchProps } from './Search.d'
import { useNbStrings } from '@/composables/useNbStrings.composable'

const props = withDefaults(defineProps<ISearchProps>(), {
  label: undefined,
  placeholder: undefined,
  size: 'md',
  expandable: false,
  disabled: false,
  id: undefined,
  name: '',
})

const emit = defineEmits<{
  /** The query was cleared, by the clear button or by Escape. */
  clear: []
  /** Enter was pressed in the field. */
  search: [query: string]
}>()

const model = defineModel<string>({ default: '' })
/** Only meaningful with `expandable`: whether the field is open. */
const expanded = defineModel<boolean>('expanded', { default: false })

const nbStrings = useNbStrings()
const resolvedLabel = computed(() => props.label ?? nbStrings.value.searchLabel)
const resolvedPlaceholder = computed(
  () => props.placeholder ?? nbStrings.value.searchPlaceholder,
)

// A search that is not expandable is always open. An expandable one also
// stays open while it holds a query, so a filter in force is never hidden
// behind a bare icon.
const isOpen = computed(
  () => !props.expandable || expanded.value || !!model.value,
)

const rootRef = ref<HTMLElement | null>(null)
const toggleRef = ref<{ $el: HTMLElement } | null>(null)
const fieldRef = ref<{ focus: () => void } | null>(null)

// Set while focus is being handed back to the toggle after a collapse, so
// that focus does not open the field again straight away.
let returningFocus = false

function expand() {
  if (props.disabled || isOpen.value) return
  expanded.value = true
  void nextTick(() => fieldRef.value?.focus())
}

function onToggleFocus() {
  if (returningFocus) {
    returningFocus = false
    return
  }
  expand()
}

function collapse(refocus: boolean) {
  if (!props.expandable) return
  expanded.value = false
  if (!refocus) return
  returningFocus = true
  void nextTick(() => {
    const el = toggleRef.value?.$el
    if (el) el.focus()
    else returningFocus = false
  })
}

/*
 * Escape on an expandable search clears the query and folds the field away
 * in one press, and focus lands on the button it folded into. Handled on the
 * way down, before the field's own Escape (which only clears), and stopped
 * there, so a dialog the search sits in does not close on the same key.
 * A search that is not expandable leaves Escape to the field.
 */
function onKeydownCapture(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !props.expandable || !isOpen.value) return
  event.preventDefault()
  event.stopPropagation()
  if (model.value) {
    model.value = ''
    emit('clear')
  }
  collapse(true)
}

// Folds an empty expandable search when focus leaves it altogether: not when
// it moves to the clear button inside it.
function onFocusOut(event: FocusEvent) {
  if (!props.expandable || model.value) return
  const next = event.relatedTarget as Node | null
  if (next && rootRef.value?.contains(next)) return
  collapse(false)
}

defineExpose({
  focus: () => (isOpen.value ? fieldRef.value?.focus() : expand()),
})
</script>

<style scoped lang="scss">
/*
 * No outer margin, and the full width it is given, so a search sits flush in
 * a toolbar, a table header or an NbInputGroup. Collapsed, it is exactly the
 * square button and nothing more.
 */
.nb-search {
  display: flex;
  min-width: 0;
  width: 100%;

  &--expandable:not(&--expanded) {
    display: inline-flex;
    width: auto;
    flex: 0 0 auto;
  }

  &--expanded {
    flex: 1 1 auto;
  }

  > :deep(.nb-text-input) {
    flex: 1 1 auto;
  }

  // The glass sits where the field's start padding was, and the text starts
  // one unit after it.
  &__icon {
    flex-shrink: 0;
    margin-inline-start: calc(var(--nb-base-unit) * 1.5);
    color: var(--nb-c-text-muted);
    pointer-events: none;
  }

  :deep(.nb-text-input__field) {
    padding-inline-start: var(--nb-base-unit);
  }

  // The browser's own clear and decoration: the field draws its own clear
  // button, and two of them side by side is one too many.
  :deep(input[type='search']::-webkit-search-cancel-button),
  :deep(input[type='search']::-webkit-search-decoration) {
    -webkit-appearance: none;
    appearance: none;
  }
}
</style>
