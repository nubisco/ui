<template>
  <div
    v-if="visible"
    :id="listId"
    ref="listRef"
    class="nb-suggestion-list"
    :class="`nb-suggestion-list--${placement}`"
    role="listbox"
    :aria-label="label || undefined"
  >
    <div
      v-for="(item, index) in items"
      :id="optionId(index)"
      :key="keyOf(item, index)"
      class="nb-suggestion-list__item"
      :class="{ 'nb-suggestion-list__item--active': index === activeIndex }"
      role="option"
      :aria-selected="index === activeIndex"
      @mousedown.prevent
      @mousemove="activeIndex = index"
      @click="choose(index)"
    >
      <slot
        name="item"
        :item="item"
        :index="index"
        :active="index === activeIndex"
      >
        {{ labelOf(item) }}
      </slot>
    </div>
    <div
      v-if="items.length === 0"
      class="nb-suggestion-list__empty"
      role="presentation"
    >
      <slot name="empty">{{ emptyText }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
/**
 * An autocomplete list for the field it sits under: people for an @mention,
 * keys for a reference, tags for a tag field. The product decides WHEN it
 * opens and WHAT it offers (that is the business: which trigger character,
 * which matches). The list does the part every product used to rewrite: the
 * keyboard, the active row, the empty state and the combobox semantics.
 *
 * Focus never leaves the field. The arrow keys move an active row, which the
 * field announces through `aria-activedescendant`, so a screen reader hears
 * each suggestion while the caret stays where the person is typing.
 */
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from 'vue'
import type { ISuggestionListProps } from './SuggestionList.d'
import { NB_TEXT_INPUT_CONTEXT } from './TextInput.context'
import { useStableId } from '@/composables/useStableId.composable'

const props = withDefaults(defineProps<ISuggestionListProps<T>>(), {
  open: true,
  itemLabel: undefined,
  itemKey: undefined,
  emptyText: '',
  placement: 'bottom',
  label: '',
  for: undefined,
  id: undefined,
})

const emit = defineEmits<{
  select: [item: T, index: number]
  'update:open': [open: boolean]
  close: []
}>()

defineSlots<{
  item?: (scope: { item: T; index: number; active: boolean }) => unknown
  empty?: () => unknown
}>()

const slots = useSlots()
const listId = useStableId({ id: props.id })
const listRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const context = inject(NB_TEXT_INPUT_CONTEXT, null)

const hasEmpty = computed(() => !!props.emptyText || !!slots.empty)
const visible = computed(
  () => props.open && (props.items.length > 0 || hasEmpty.value),
)

function labelOf(item: T): string {
  if (props.itemLabel) return props.itemLabel(item)
  if (item && typeof item === 'object' && 'label' in item)
    return String((item as { label: unknown }).label)
  return String(item)
}

function keyOf(item: T, index: number): string | number {
  if (props.itemKey) return props.itemKey(item, index)
  return labelOf(item)
}

function optionId(index: number) {
  return `${listId}-option-${index}`
}

// The field the person types in. Found through NbTextInput when the list is
// in its #dropdown slot, by id otherwise.
function field(): HTMLInputElement | HTMLTextAreaElement | null {
  if (props.for && typeof document !== 'undefined') {
    const el = document.getElementById(props.for)
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      return el
  }
  return context?.field.value ?? null
}

function close() {
  emit('update:open', false)
  emit('close')
}

function choose(index: number) {
  const item = props.items[index]
  if (item === undefined) return
  emit('select', item, index)
  close()
}

function move(to: number) {
  const count = props.items.length
  if (count === 0) return
  activeIndex.value = (to + count) % count
}

function onKeydown(event: KeyboardEvent) {
  if (!visible.value || event.isComposing) return
  const hasItems = props.items.length > 0
  switch (event.key) {
    case 'ArrowDown':
      if (!hasItems) return
      move(activeIndex.value + 1)
      break
    case 'ArrowUp':
      if (!hasItems) return
      move(activeIndex.value - 1)
      break
    case 'Home':
    case 'End':
      // Home and End belong to the caret unless a modifier asks for the list.
      if (!hasItems || !(event.ctrlKey || event.metaKey)) return
      activeIndex.value = event.key === 'Home' ? 0 : props.items.length - 1
      break
    case 'Enter':
    case 'Tab':
      if (!hasItems) return
      choose(activeIndex.value)
      break
    case 'Escape':
      close()
      // Escape closes the list and nothing else: not the modal or panel the
      // field happens to sit in.
      event.stopPropagation()
      break
    default:
      return
  }
  event.preventDefault()
}

// Leaving the field closes the list. A click on a row does not count as
// leaving, because rows keep the focus in the field on mousedown.
function onBlur() {
  if (props.open) close()
}

// Combobox semantics live on the field, since that is where focus is. Only
// what the list adds is written, and all of it is removed again on the way
// out, so the field is left exactly as NbTextInput rendered it.
const ARIA = [
  'role',
  'aria-autocomplete',
  'aria-expanded',
  'aria-controls',
  'aria-activedescendant',
] as const

// Held as an HTMLElement: the union of input and textarea loses the
// keydown overload of addEventListener.
let bound: HTMLElement | null = null

function syncAria() {
  if (!bound) return
  bound.setAttribute('role', 'combobox')
  bound.setAttribute('aria-autocomplete', 'list')
  bound.setAttribute('aria-expanded', String(visible.value))
  if (visible.value) bound.setAttribute('aria-controls', listId)
  else bound.removeAttribute('aria-controls')
  if (visible.value && props.items.length > 0)
    bound.setAttribute('aria-activedescendant', optionId(activeIndex.value))
  else bound.removeAttribute('aria-activedescendant')
}

function bind() {
  const el = field()
  if (el === bound) return
  unbind()
  if (!el) return
  bound = el
  const target: HTMLElement = el
  // Capture, so the list sees an arrow or Enter before a handler the product
  // put on the same field and can mark it handled (`defaultPrevented`).
  target.addEventListener('keydown', onKeydown, true)
  target.addEventListener('blur', onBlur)
  syncAria()
}

function unbind() {
  if (!bound) return
  bound.removeEventListener('keydown', onKeydown, true)
  bound.removeEventListener('blur', onBlur)
  for (const name of ARIA) bound.removeAttribute(name)
  bound = null
}

function scrollActiveIntoView() {
  const rows = listRef.value?.querySelectorAll<HTMLElement>(
    '.nb-suggestion-list__item',
  )
  rows?.[activeIndex.value]?.scrollIntoView?.({ block: 'nearest' })
}

// A new set of suggestions starts from the top: the old index points at a
// different item now, or past the end.
watch(
  () => props.items,
  () => {
    activeIndex.value = 0
  },
)

watch(
  () => props.open,
  (open) => {
    if (open) activeIndex.value = 0
  },
)

watch([visible, activeIndex, () => props.items.length], async () => {
  syncAria()
  await nextTick()
  scrollActiveIntoView()
})

onMounted(() => {
  bind()
  // The field may render after the list in the same tick (a v-if on both).
  if (!bound) nextTick(bind)
})

onBeforeUnmount(unbind)

defineExpose({
  /** Handle a key from a field the list is not bound to. */
  onKeydown,
  activeIndex,
})
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

.nb-suggestion-list {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 50;
  box-sizing: border-box;
  max-height: 240px;
  padding: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--nb-c-field-bg);
  border: 1px solid var(--nb-c-field-border);
  @include radius.surface(popover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-family: var(--nb-font-family-sans);

  &--bottom {
    top: calc(100% + 4px);
  }

  &--top {
    bottom: calc(100% + 4px);
  }
}

.nb-suggestion-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-size: var(--nb-font-size-13);
  line-height: 1.4;
  color: var(--nb-c-text);
  cursor: pointer;
  // Concentric with the list: its corner, less the 4px padding and 1px border.
  @include radius.inset(5px);

  @include bp.phone-touch {
    box-sizing: border-box;
    min-block-size: 44px;
  }

  &--active {
    background: color-mix(in srgb, var(--nb-c-primary) 12%, transparent);
  }
}

.nb-suggestion-list__empty {
  padding: 8px 10px;
  font-size: var(--nb-font-size-13);
  color: var(--nb-c-text-subtle);
}
</style>
