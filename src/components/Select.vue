<template>
  <div ref="rootRef" :class="rootClasses" @keydown="onKeydown">
    <!-- DEFAULT variant -->
    <template v-if="variant === 'default'">
      <slot v-if="$slots.label" name="label" />
      <NbLabel
        v-else-if="label"
        :for="inputId"
        :required="required"
        :disabled="disabled"
        >{{ label }}</NbLabel
      >

      <button
        :id="inputId"
        ref="triggerRef"
        type="button"
        class="nb-select__trigger"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-disabled="disabled || undefined"
        :aria-required="required || undefined"
        :disabled="disabled || undefined"
        @click="toggleDropdown"
        @focus="focused = true"
        @blur="focused = false"
      >
        <span
          :class="[
            'nb-select__value',
            { 'nb-select__value--placeholder': !displayValue },
          ]"
        >
          <slot v-if="displayValue" name="value" :values="selectedValues">{{
            displayValue
          }}</slot>
          <template v-else>{{ placeholder }}</template>
        </span>
        <NbMessage
          v-if="error"
          variant="error"
          :icon-only="true"
          class="nb-select__status-icon"
          >{{ error }}</NbMessage
        >
        <NbMessage
          v-else-if="warning"
          variant="warning"
          :icon-only="true"
          class="nb-select__status-icon"
          >{{ warning }}</NbMessage
        >
        <NbGrid align="center" justify="center" class="nb-select__caret">
          <NbIcon :name="isOpen ? 'caret-up' : 'caret-down'" :size="16" />
        </NbGrid>
      </button>

      <NbMessage v-if="error" variant="error" class="nb-select__message">{{
        error
      }}</NbMessage>
      <NbMessage
        v-else-if="warning"
        variant="warning"
        class="nb-select__message"
        >{{ warning }}</NbMessage
      >
      <NbMessage
        v-else-if="helper"
        variant="helper"
        class="nb-select__message"
        >{{ helper }}</NbMessage
      >
    </template>

    <!-- FLUID variant -->
    <template v-else-if="variant === 'fluid'">
      <button
        :id="inputId"
        ref="triggerRef"
        type="button"
        class="nb-select__trigger"
        role="combobox"
        :aria-expanded="isOpen"
        :aria-haspopup="'listbox'"
        :aria-disabled="disabled || undefined"
        :aria-required="required || undefined"
        :disabled="disabled || undefined"
        @click="toggleDropdown"
        @focus="focused = true"
        @blur="focused = false"
      >
        <NbGrid
          v-if="label || $slots.label"
          dir="row"
          align="center"
          gap="xs"
          class="nb-select__inner-header"
        >
          <slot v-if="$slots.label" name="label" />
          <label v-else class="nb-select__inner-label">
            {{ label }}
            <span v-if="required" class="nb-select__asterisk" aria-hidden="true"
              >*</span
            >
          </label>
          <NbMessage
            v-if="helper && !error && !warning"
            variant="helper"
            :icon-only="true"
            class="nb-select__inner-message"
            >{{ helper }}</NbMessage
          >
        </NbGrid>
        <NbGrid dir="row" align="end" flex class="nb-select__value-row">
          <span
            :class="[
              'nb-select__value',
              { 'nb-select__value--placeholder': !displayValue },
            ]"
          >
            <slot v-if="displayValue" name="value" :values="selectedValues">{{
              displayValue
            }}</slot>
            <template v-else>{{ placeholder }}</template>
          </span>
          <NbGrid align="center" justify="center" class="nb-select__caret">
            <NbIcon :name="isOpen ? 'caret-up' : 'caret-down'" :size="16" />
          </NbGrid>
        </NbGrid>
      </button>

      <NbMessage
        v-if="error"
        variant="error"
        class="nb-select__fluid-message"
        >{{ error }}</NbMessage
      >
      <NbMessage
        v-else-if="warning"
        variant="warning"
        class="nb-select__fluid-message"
        >{{ warning }}</NbMessage
      >
    </template>
  </div>

  <!-- Dropdown teleported to body to escape overflow:hidden parents -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="nb-select__dropdown"
      :style="dropdownStyle"
      role="listbox"
      :aria-multiselectable="multiple || undefined"
    >
      <div
        v-for="(option, idx) in options"
        :key="option.value"
        :class="[
          'nb-select__option',
          {
            'nb-select__option--selected': isSelected(option.value),
            'nb-select__option--highlighted': highlighted === idx,
            'nb-select__option--disabled': option.disabled,
          },
        ]"
        role="option"
        :aria-selected="isSelected(option.value)"
        :aria-disabled="option.disabled || undefined"
        @mouseenter="highlighted = idx"
        @click="selectOption(option)"
      >
        <span
          v-if="multiple"
          class="nb-select__option-check"
          aria-hidden="true"
        >
          <svg
            v-if="isSelected(option.value)"
            viewBox="0 0 10 8"
            fill="none"
            width="10"
            height="8"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="nb-select__option-label">
          <!-- Rich option rows (avatar + name, icon + label) without the
               consumer re-implementing the listbox. -->
          <slot name="option" :option="option">{{ option.label }}</slot>
        </span>
      </div>
      <div v-if="!options || options.length === 0" class="nb-select__empty">
        No options
      </div>
      <div v-if="creatable" class="nb-select__create" @mousedown.prevent>
        <input
          v-model="createValue"
          type="text"
          class="nb-select__create-input"
          :placeholder="createPlaceholder || 'Add new…'"
          @keydown.enter.prevent="handleCreate"
          @keydown.stop
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import NbLabel from './Label.vue'
import NbMessage from './Message.vue'
import NbGrid from './Grid.vue'
import NbIcon from './Icon.vue'
import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from 'vue'
import { ISelectOption, ISelectProps } from './Select'

const props = withDefaults(defineProps<ISelectProps>(), {
  modelValue: null,
  options: () => [],
  multiple: false,
  creatable: false,
  createPlaceholder: '',
  variant: 'default',
  size: 'md',
  label: '',
  placeholder: 'Select…',
  helper: '',
  error: '',
  warning: '',
  disabled: false,
  required: false,
  id: undefined,
  name: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | Array<string | number> | null]
  change: [value: string | number | Array<string | number> | null]
  create: [value: string]
}>()

const createValue = ref('')

function handleCreate() {
  const val = createValue.value.trim()
  if (!val) return
  emit('create', val)
  createValue.value = ''
}

const isOpen = ref(false)
const focused = ref(false)
const highlighted = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({
  position: 'fixed' as const,
  top: '0px',
  left: '0px',
  width: '0px',
  zIndex: '9999',
})

const autoId = `nb-select-${useId()}`
const inputId = computed(() => props.id ?? autoId)

const selectedValues = computed<Array<string | number>>(() => {
  if (props.modelValue == null) return []
  return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
})

const displayValue = computed(() => {
  if (selectedValues.value.length === 0) return ''
  const opts = props.options ?? []
  if (props.multiple) {
    if (selectedValues.value.length === 1) {
      return (
        opts.find((o) => o.value === selectedValues.value[0])?.label ??
        String(selectedValues.value[0])
      )
    }
    if (selectedValues.value.length === 2) {
      return selectedValues.value
        .map((v) => opts.find((o) => o.value === v)?.label ?? String(v))
        .join(', ')
    }
    return `${selectedValues.value.length} selected`
  }
  return (
    opts.find((o) => o.value === selectedValues.value[0])?.label ??
    String(selectedValues.value[0])
  )
})

function isSelected(value: string | number) {
  return selectedValues.value.includes(value)
}

function selectOption(option: ISelectOption) {
  if (option.disabled) return
  let next: string | number | Array<string | number> | null
  if (props.multiple) {
    const arr = [...selectedValues.value]
    const idx = arr.indexOf(option.value)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(option.value)
    next = arr
  } else {
    next = option.value
    closeDropdown()
  }
  emit('update:modelValue', next)
  emit('change', next)
}

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()

  // Flip above the trigger when the list genuinely does not fit below and
  // there is more room above (a select near the bottom of the viewport, e.g.
  // the page-size control in a table footer). Height is 0 on the very first
  // call because the dropdown has not rendered yet; openDropdown re-runs this
  // on nextTick, which lands before paint, so there is no visible jump.
  const dropdownHeight = dropdownRef.value?.offsetHeight ?? 0
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const dropUp =
    dropdownHeight > 0 && spaceBelow < dropdownHeight && spaceAbove > spaceBelow

  dropdownStyle.value = {
    position: 'fixed',
    top: dropUp ? `${rect.top - dropdownHeight}px` : `${rect.bottom}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

function openDropdown() {
  if (props.disabled) return
  isOpen.value = true
  updateDropdownPosition()
  const opts = props.options ?? []
  highlighted.value =
    selectedValues.value.length > 0
      ? Math.max(
          0,
          opts.findIndex((o) => o.value === selectedValues.value[0]),
        )
      : -1
  // Re-measure once the list exists so a near-the-bottom select can flip up.
  nextTick(() => {
    updateDropdownPosition()
    scrollToHighlighted()
  })
}

function closeDropdown() {
  isOpen.value = false
  highlighted.value = -1
}

function toggleDropdown() {
  if (isOpen.value) closeDropdown()
  else openDropdown()
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const inRoot = rootRef.value?.contains(target) ?? false
  const inDropdown = dropdownRef.value?.contains(target) ?? false
  if (!inRoot && !inDropdown) closeDropdown()
}

function onScrollOrResize() {
  if (isOpen.value) updateDropdownPosition()
}

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
  } else {
    document.removeEventListener('mousedown', onClickOutside)
    window.removeEventListener('scroll', onScrollOrResize, true)
    window.removeEventListener('resize', onScrollOrResize)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

function onKeydown(e: KeyboardEvent) {
  const opts = props.options ?? []
  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
    return
  }
  if (e.key === 'Escape') {
    closeDropdown()
    e.preventDefault()
  } else if (e.key === 'Tab') {
    closeDropdown()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlighted.value = Math.min(highlighted.value + 1, opts.length - 1)
    scrollToHighlighted()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted.value = Math.max(highlighted.value - 1, 0)
    scrollToHighlighted()
  } else if ((e.key === 'Enter' || e.key === ' ') && highlighted.value >= 0) {
    e.preventDefault()
    selectOption(opts[highlighted.value])
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    if (!dropdownRef.value || highlighted.value < 0) return
    const item =
      dropdownRef.value.querySelectorAll<HTMLElement>('.nb-select__option')[
        highlighted.value
      ]
    item?.scrollIntoView({ block: 'nearest' })
  })
}

const rootClasses = computed(() => [
  'nb-select',
  `nb-select--${props.variant}`,
  `nb-select--${props.size}`,
  {
    'nb-select--open': isOpen.value,
    'nb-select--focused': focused.value && !isOpen.value,
    'nb-select--error': !!props.error,
    'nb-select--warning': !props.error && !!props.warning,
    'nb-select--multiple': props.multiple,
  },
])

defineExpose({
  open: openDropdown,
  close: closeDropdown,
})
</script>

<style lang="scss">
@use '../styles/logic/radius' as radius;

// Dropdown is teleported to body: cannot use scoped styles
.nb-select__dropdown {
  background: var(--nb-c-field-bg);
  border: 1px solid var(--nb-c-field-border);
  // Teleported to <body>: its own outer surface, not a derivative of the
  // trigger it was opened from.
  @include radius.surface(popover);
  // Inset on all four sides so a highlighted row floats inside the list's
  // corner instead of running into it.
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.nb-select__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 400;
  color: var(--nb-c-text);
  cursor: pointer;
  position: relative;
  transition: background 0.1s;
  // Concentric with the list: its corner, less the 4px it insets its rows by.
  // 4px of padding plus the container's 1px border.
  @include radius.inset(5px);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: var(--nb-c-component-plain-border);
  }

  &:last-child::after {
    display: none;
  }

  &--highlighted {
    background: color-mix(in srgb, var(--nb-c-primary) 8%, transparent);
  }

  &--selected {
    background: var(--nb-c-primary);
    color: var(--nb-c-surface);
    font-weight: 500;

    .nb-select__option-check {
      color: var(--nb-c-surface);
    }
  }

  &--selected.nb-select__option--highlighted {
    background: color-mix(in srgb, var(--nb-c-primary) 85%, var(--nb-c-black));
  }

  &--disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.nb-select__option-check {
  width: 14px;
  flex-shrink: 0;
  color: var(--nb-c-primary);
  display: flex;
  align-items: center;
}

.nb-select__option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-select__empty {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--nb-c-text-subtle);
  text-align: center;
}

.nb-select__create {
  border-top: 1px solid var(--nb-c-component-plain-border);
  padding: 8px 12px;
}

.nb-select__create-input {
  width: 100%;
  background: transparent;
  border: 1px dashed var(--nb-c-component-plain-border);
  border-radius: 4px;
  padding: 6px 10px;
  font: inherit;
  font-size: 13px;
  color: var(--nb-c-text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;

  &::placeholder {
    color: var(--nb-c-text-subtle);
  }

  &:focus {
    border-color: var(--nb-c-primary);
    border-style: solid;
  }
}

.nb-select {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--nb-field-label-gap);
  font-family: var(--nb-font-family-sans, sans-serif);
  --field-h: var(--nb-field-height-md);

  &--xs {
    --field-h: var(--nb-field-height-xs);
    --nb-field-font-size: var(--nb-font-size-13);
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

  &__trigger {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: var(--field-h);
    padding: 0 var(--nb-field-padding-h);
    gap: 8px;
    background: var(--nb-c-field-bg);
    // Same treatment as NbTextInput, so a select and a field on one row keep
    // the same silhouette under either appearance.
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
    border-radius: var(--nb-field-radius, 0);
    cursor: pointer;
    user-select: none;
    font: inherit;
    text-align: left;
    appearance: none;
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      background 0.15s;
    outline: none;
    box-sizing: border-box;

    &:hover:not(:disabled) {
      background: color-mix(
        in srgb,
        var(--nb-c-field-border) 15%,
        var(--nb-c-field-bg)
      );
      // The whole edge warms on hover, so a capsule does not light up
      // along one arc only.
      border-color: color-mix(
        in srgb,
        var(--nb-c-primary) 50%,
        var(--nb-c-field-border)
      );
    }

    &:disabled {
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
  }

  &--focused &__trigger {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }

  &--open &__trigger {
    outline: none;
  }

  &--error &__trigger {
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

  &--warning &__trigger {
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

  &__value {
    flex: 1;
    min-width: 0;
    font-size: var(--nb-c-field-font-size);
    font-weight: 400;
    line-height: 1.5;
    color: var(--nb-c-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--placeholder {
      color: var(--nb-c-text-subtle);
    }
  }

  &__status-icon {
    flex-shrink: 0;
    .nb-message__tooltip {
      z-index: calc(var(--nb-zindex-tooltip, 401) + 1);
    }
  }

  &__caret {
    flex-shrink: 0;
    color: var(--nb-c-field-border);
    transition: color 0.15s;

    .nb-select--open & {
      color: var(--nb-c-primary);
    }
    .nb-select--error & {
      color: var(--nb-c-danger);
    }
    .nb-select--warning & {
      color: var(--nb-c-warning);
    }
  }

  &__message,
  &__fluid-message {
    font-size: var(--nb-font-size-12);
  }

  &--fluid {
    .nb-select__trigger {
      flex: 1;
      flex-direction: column;
      align-items: stretch;
      justify-content: space-between;
      height: auto;
      min-height: calc(var(--nb-base-unit) * 8);
      padding: calc(var(--nb-base-unit) * 1) 0 0;
      gap: 0;
    }

    .nb-select__inner-header {
      padding: 0 var(--nb-field-padding-h);
      margin-bottom: 4px;
    }

    .nb-select__inner-label {
      flex: 1;
      min-width: 0;
      font-size: var(--nb-font-size-12);
      font-weight: 500;
      color: var(--nb-c-text-muted);
      letter-spacing: 0.02em;
      cursor: default;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nb-select__asterisk {
      color: var(--nb-c-danger);
    }

    .nb-select__inner-message {
      flex-shrink: 0;
    }

    .nb-select__value-row {
      padding: 0 0 10px;
    }

    .nb-select__value {
      flex: 1;
      padding: 0 var(--nb-field-padding-h);
      font-size: var(--nb-font-size-14);
    }

    .nb-select__caret {
      position: static;
      width: auto;
      height: auto;
      padding: 0 var(--nb-field-padding-h);
    }
  }
}
</style>
