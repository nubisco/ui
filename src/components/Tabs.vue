<template>
  <div :class="rootClasses">
    <div
      ref="listRef"
      class="nb-tabs__list"
      role="tablist"
      :aria-label="ariaLabel || undefined"
      @keydown="onKeydown"
    >
      <button
        v-for="item in items"
        :id="tabId(item.id)"
        :key="item.id"
        :data-tab-id="item.id"
        type="button"
        role="tab"
        :class="[
          'nb-tabs__tab',
          { 'nb-tabs__tab--active': item.id === activeId },
        ]"
        :aria-selected="item.id === activeId"
        :aria-controls="hasPanel(item.id) ? panelId(item.id) : undefined"
        :tabindex="item.id === activeId ? 0 : -1"
        :disabled="isDisabled(item)"
        @click="select(item)"
      >
        <NbIcon
          v-if="item.icon"
          :name="item.icon"
          :size="iconSize"
          class="nb-tabs__icon"
        />
        <span class="nb-tabs__label">{{ item.label }}</span>
        <NbBadge v-if="item.badge != null" size="sm" class="nb-tabs__badge">
          {{ item.badge }}
        </NbBadge>
      </button>
    </div>

    <template v-for="item in items" :key="`panel-${item.id}`">
      <div
        v-if="item.id === activeId && hasPanel(item.id)"
        :id="panelId(item.id)"
        class="nb-tabs__panel"
        role="tabpanel"
        :aria-labelledby="tabId(item.id)"
        tabindex="0"
      >
        <slot :name="item.id" :item="item" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { ETabsSize, ETabsVariant, ITabItem, ITabsProps } from './Tabs.d'
import { useStableId } from '@/composables/useStableId.composable'
import { hasSlotContent } from '@/utils/slotContent.helper'

const props = withDefaults(defineProps<ITabsProps>(), {
  id: undefined,
  ariaLabel: undefined,
  modelValue: undefined,
  variant: ETabsVariant.Line,
  size: ETabsSize.Medium,
  disabled: false,
  fullWidth: false,
})

const emit = defineEmits<{
  'update:modelValue': [id: string]
  change: [id: string, item: ITabItem]
}>()

const slots = useSlots()
const componentInternalId = useStableId(props)
const listRef = ref<HTMLElement | null>(null)

const enabledItems = computed(() => props.items.filter((i) => !isDisabled(i)))

// Uncontrolled fallback, so the bar still works without v-model
const internalId = ref(props.modelValue ?? enabledItems.value[0]?.id)

watch(
  () => props.modelValue,
  (value) => {
    if (value != null) internalId.value = value
  },
)

// An unknown or disabled id would leave no tab selected and no roving tabindex,
// so fall back to the first tab that can actually take focus
const activeId = computed(() => {
  const candidate = props.modelValue ?? internalId.value
  const match = props.items.find((i) => i.id === candidate)
  if (match && !isDisabled(match)) return match.id
  return enabledItems.value[0]?.id
})

const iconSize = computed(() => (props.size === ETabsSize.Large ? 18 : 16))

const rootClasses = computed(() => [
  'nb-tabs',
  `nb-tabs--${props.variant}`,
  `nb-tabs--${props.size}`,
  {
    'nb-tabs--full-width': props.fullWidth,
    'nb-tabs--disabled': props.disabled,
  },
])

function isDisabled(item: ITabItem): boolean {
  return props.disabled || !!item.disabled
}

function tabId(id: string): string {
  return `${componentInternalId}-tab-${id}`
}

function panelId(id: string): string {
  return `${componentInternalId}-panel-${id}`
}

function hasPanel(id: string): boolean {
  return hasSlotContent(slots, id)
}

function select(item: ITabItem): void {
  if (isDisabled(item) || item.id === activeId.value) return
  internalId.value = item.id
  emit('update:modelValue', item.id)
  emit('change', item.id, item)
}

// Matched on the dataset rather than through a selector, so ids carrying
// characters a selector would have to escape still resolve
function focusTab(id: string): void {
  const buttons = listRef.value?.querySelectorAll<HTMLElement>('[data-tab-id]')
  buttons?.forEach((button) => {
    if (button.dataset.tabId === id) button.focus()
  })
}

// Arrow keys move and activate in one step (automatic activation), which is the
// WAI-ARIA recommendation when switching panels is cheap
function move(offset: number): void {
  const list = enabledItems.value
  if (!list.length) return
  const current = list.findIndex((i) => i.id === activeId.value)
  const next = list[(current + offset + list.length) % list.length]
  select(next)
  focusTab(next.id)
}

function jump(item: ITabItem | undefined): void {
  if (!item) return
  select(item)
  focusTab(item.id)
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowRight':
      move(1)
      break
    case 'ArrowLeft':
      move(-1)
      break
    case 'Home':
      jump(enabledItems.value[0])
      break
    case 'End':
      jump(enabledItems.value[enabledItems.value.length - 1])
      break
    default:
      return
  }
  event.preventDefault()
}
</script>

<style scoped lang="scss">
.nb-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: var(--nb-font-family-sans);

  // ── Bar ───────────────────────────────────────────────────────────────────────
  &__list {
    display: flex;
    align-items: stretch;
  }

  &--full-width &__list &__tab {
    flex: 1 1 0;
    justify-content: center;
  }

  // ── Tab ───────────────────────────────────────────────────────────────────────
  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: var(--nb-tabs-height);
    padding: 0 var(--nb-tabs-padding-h);
    border: 0;
    background: transparent;
    color: var(--nb-c-text-muted);
    font-family: inherit;
    font-size: var(--nb-tabs-font-size);
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      color 0.15s,
      background 0.15s,
      border-color 0.15s;

    &:hover:not(:disabled) {
      color: var(--nb-c-text);
    }

    &:focus-visible {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: -2px;
    }

    &:disabled {
      color: var(--nb-c-component-disabled);
      cursor: not-allowed;
    }
  }

  &__icon {
    flex-shrink: 0;
  }

  &__badge {
    flex-shrink: 0;
  }

  // ── Sizes ─────────────────────────────────────────────────────────────────────
  &--sm {
    --nb-tabs-height: calc(var(--nb-base-unit) * 4); // 32px
    --nb-tabs-padding-h: calc(var(--nb-base-unit) * 1.5); // 12px
    --nb-tabs-font-size: var(--nb-font-size-12);
  }

  &--md {
    --nb-tabs-height: calc(var(--nb-base-unit) * 5); // 40px
    --nb-tabs-padding-h: calc(var(--nb-base-unit) * 2); // 16px
    --nb-tabs-font-size: var(--nb-font-size-14);
  }

  &--lg {
    --nb-tabs-height: calc(var(--nb-base-unit) * 6); // 48px
    --nb-tabs-padding-h: calc(var(--nb-base-unit) * 2.5); // 20px
    --nb-tabs-font-size: var(--nb-font-size-16);
  }

  // ── Line variant: text tabs riding a rule, active underlined in primary ──────
  &--line &__list {
    border-bottom: 2px solid var(--nb-c-border);
  }

  &--line &__tab {
    // The active underline replaces this rule rather than stacking on it
    margin-bottom: -2px;
    border-bottom: 2px solid transparent;
  }

  &--line &__tab--active {
    color: var(--nb-c-primary);
    border-bottom-color: var(--nb-c-primary);
    font-weight: 600;
  }

  // ── Contained variant: segmented control, active block filled ────────────────
  &--contained &__list {
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--nb-c-border);
    border-radius: 8px;
    background: var(--nb-c-bg-soft);
    align-self: flex-start;
  }

  &--contained.nb-tabs--full-width &__list {
    align-self: stretch;
  }

  &--contained &__tab {
    height: calc(var(--nb-tabs-height) - 8px);
    border-radius: 6px;
  }

  &--contained &__tab--active {
    background: var(--nb-c-primary);
    color: var(--nb-c-white);
    font-weight: 600;
  }

  &--contained &__tab--active:hover:not(:disabled) {
    color: var(--nb-c-white);
  }

  // ── Panel ─────────────────────────────────────────────────────────────────────
  &__panel {
    padding-top: calc(var(--nb-base-unit) * 2);

    &:focus-visible {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: 2px;
    }
  }
}
</style>
