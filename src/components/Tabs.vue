<template>
  <div ref="rootRef" :class="rootClasses">
    <div
      ref="listRef"
      class="nb-tabs__list"
      :class="{
        'nb-tabs__list--fade-start': scrolls && fadeStart,
        'nb-tabs__list--fade-end': scrolls && fadeEnd,
      }"
      role="tablist"
      :aria-label="ariaLabel || undefined"
      @keydown="onKeydown"
      @scroll.passive="updateFades"
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
      <span
        v-if="indicator"
        class="nb-tabs__indicator"
        aria-hidden="true"
        :style="{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
        }"
      />
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
import NbIcon from './Icon.vue'
import NbBadge from './Badge.vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from 'vue'
import { ETabsSize, ETabsVariant, ITabItem, ITabsProps } from './Tabs.d'
import { useStableId } from '@/composables/useStableId.composable'
import { hasSlotContent } from '@/utils/slotContent.helper'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'

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
    // Only while the tabs do not fit, so a bar that fits renders as it did
    'nb-tabs--overflow': overflowing.value,
    // Only once the active mark has been measured, so a bar without layout
    // keeps the active tab's own underline or fill
    'nb-tabs--indicator': indicator.value !== null,
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
function findTab(id: string | undefined): HTMLElement | undefined {
  const buttons = listRef.value?.querySelectorAll<HTMLElement>('[data-tab-id]')
  return [...(buttons ?? [])].find((button) => button.dataset.tabId === id)
}

function focusTab(id: string): void {
  findTab(id)?.focus()
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

// ── A bar that scrolls ───────────────────────────────────────────────────────
//
// When the tabs do not fit, the bar scrolls sideways instead of running past
// its container's edge. That is always the case on a phone, and at any width
// once the tabs are wider than the space they have (a side panel, a split
// view, simply many tabs). The tab that is active then has to be brought into
// view by us: a tab chosen on load, or by an arrow key, may sit past the edge.
// scrollLeft is set on the list directly, never through scrollIntoView, which
// also scrolls every scrollable ancestor (the page, a shell region) to line
// the tab up.
const { phone } = usePhoneLayout()
const rootRef = ref<HTMLElement | null>(null)
const overflowing = ref(false)
const scrolls = computed(() => phone.value || overflowing.value)

// Measured against the root, not the list: a contained bar sizes itself to
// its tabs, so its own scrollWidth never exceeds its own width. The list's
// content width is the same whether or not it scrolls, so switching modes
// cannot flip the answer back.
function measureOverflow(): void {
  const root = rootRef.value
  const list = listRef.value
  if (!root || !list) return
  overflowing.value = list.scrollWidth > root.clientWidth + 1
}

const fadeStart = ref(false)
const fadeEnd = ref(false)

// The width of the edge fade, which is also the margin kept around a tab
// brought into view, so it never lands under the fade.
const FADE_PX = 24

function updateFades(): void {
  const list = listRef.value
  if (!scrolls.value || !list) return
  const max = list.scrollWidth - list.clientWidth
  fadeStart.value = list.scrollLeft > 1
  fadeEnd.value = list.scrollLeft < max - 1
}

function revealActive(): void {
  const list = listRef.value
  if (!scrolls.value || !list) return
  const tab = findTab(activeId.value)
  if (tab) {
    const listRect = list.getBoundingClientRect()
    const tabRect = tab.getBoundingClientRect()
    const start = tabRect.left - listRect.left + list.scrollLeft
    const end = start + tabRect.width
    // The mark is a child of the list too, so the ends are the tabs' own
    const siblings = [...list.querySelectorAll<HTMLElement>('[data-tab-id]')]
    const first = tab === siblings[0]
    const last = tab === siblings[siblings.length - 1]
    if (start < list.scrollLeft + (first ? 0 : FADE_PX))
      list.scrollLeft = Math.max(0, first ? 0 : start - FADE_PX)
    else if (end > list.scrollLeft + list.clientWidth - (last ? 0 : FADE_PX))
      list.scrollLeft = end - list.clientWidth + (last ? 0 : FADE_PX)
  }
  updateFades()
}

// ── The active mark slides ───────────────────────────────────────────────────
//
// The underline of the line variant and the filled block of the contained one
// are one element placed under the active tab, so choosing another tab moves
// it there instead of switching one mark off and the next on. It is measured
// from the active tab, which means it exists only while the bar has a layout:
// hidden, or in a DOM without one, the active tab keeps its own underline or
// fill and nothing is lost. Offsets are read against the list, which is the
// offset parent, so a scrolled bar needs no correction: the mark scrolls with
// the tabs it sits under.
const indicator = ref<{ left: number; width: number } | null>(null)

function measureIndicator(): void {
  const tab = findTab(activeId.value)
  const width = tab?.offsetWidth ?? 0
  if (!tab || width === 0) {
    indicator.value = null
    return
  }
  const left = tab.offsetLeft
  const current = indicator.value
  if (current && current.left === left && current.width === width) return
  indicator.value = { left, width }
}

watch([activeId, scrolls], () =>
  nextTick(() => {
    revealActive()
    measureIndicator()
  }),
)

function onResize(): void {
  measureOverflow()
  revealActive()
  measureIndicator()
}

// The root and each tab, never the list: the list's own box changes when it
// starts to scroll, and observing it would answer its own question.
let observer: ResizeObserver | null = null
function observeSizes(): void {
  if (!observer || !rootRef.value || !listRef.value) return
  observer.disconnect()
  observer.observe(rootRef.value)
  listRef.value
    .querySelectorAll<HTMLElement>('[data-tab-id]')
    .forEach((tab) => observer?.observe(tab))
}

watch(
  () => props.items,
  () =>
    nextTick(() => {
      observeSizes()
      onResize()
    }),
  { deep: true },
)

onMounted(() => {
  measureOverflow()
  revealActive()
  measureIndicator()
  window.addEventListener('resize', onResize, { passive: true })
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onResize)
    observeSizes()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  observer?.disconnect()
  observer = null
})

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
@use '../styles/logic/radius' as radius;
@use '../styles/logic/motion' as motion;
@use '../styles/variables/breakpoints' as bp;
@use '../styles/logic/touch' as touch;

// The scrolling bar, emitted twice: under the phone query with `$when` empty,
// which gives exactly the selectors the phone has always had, and under
// `.nb-tabs--overflow` for a bar that does not fit at any width.
@mixin scrolling-bar($when: '') {
  $r: &;

  @at-root #{$when} #{$r}__list {
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  @at-root #{$when} #{$r}__list--fade-start {
    mask-image: linear-gradient(to right, transparent, #000 24px);
  }

  @at-root #{$when} #{$r}__list--fade-end {
    mask-image: linear-gradient(to left, transparent, #000 24px);
  }

  @at-root #{$when} #{$r}__list--fade-start#{$r}__list--fade-end {
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 24px,
      #000 calc(100% - 24px),
      transparent
    );
  }

  @at-root #{$when} #{$r}__tab {
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  // A scrolling box clips at its padding edge, which would cut off the 2px
  // the line tabs hang over the list's rule, and the active underline with
  // it. The rule is drawn inside the list instead, where the tabs cover it
  // exactly as they cover the border on desktop.
  @at-root #{$r}--line#{$when} #{$r}__list {
    border-bottom: 0;
    box-shadow: inset 0 -2px 0 var(--nb-c-border);
  }

  @at-root #{$r}--line#{$when} #{$r}__tab {
    margin-bottom: 0;
  }

  @at-root #{$r}--line#{$when} #{$r}__indicator {
    bottom: 0;
  }
}

.nb-tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: var(--nb-font-family-sans);

  // ── Bar ───────────────────────────────────────────────────────────────────────
  &__list {
    position: relative;
    // The sliding mark sits at z-index -1, which this keeps inside the list,
    // above its own background
    isolation: isolate;
    display: flex;
    align-items: stretch;
  }

  // ── The active mark ───────────────────────────────────────────────────────────
  // One element under the active tab, moved there on the medium step. It is
  // on screen before and after, so the standard curve. The tab's own mark is
  // cleared while this one exists, further down in each variant.
  &__indicator {
    position: absolute;
    left: 0;
    z-index: -1;
    pointer-events: none;
    background: var(--nb-c-primary);
    transition:
      transform var(--nb-motion-medium) var(--nb-ease-standard),
      width var(--nb-motion-medium) var(--nb-ease-standard);
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
    font-weight: var(--nb-font-weight-semibold, 600);
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition:
      color var(--nb-motion-short),
      background var(--nb-motion-short),
      border-color var(--nb-motion-short);

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
    --nb-tabs-font-size: var(--nb-type-body-sm-size);
  }

  &--md {
    --nb-tabs-height: calc(var(--nb-base-unit) * 5); // 40px
    --nb-tabs-padding-h: calc(var(--nb-base-unit) * 2); // 16px
    --nb-tabs-font-size: var(--nb-type-body-compact-size);
  }

  &--lg {
    --nb-tabs-height: calc(var(--nb-base-unit) * 6); // 48px
    --nb-tabs-padding-h: calc(var(--nb-base-unit) * 2.5); // 20px
    --nb-tabs-font-size: var(--nb-type-body-lg-size);
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

  // Hangs the same 2px over the list's rule as the tabs do
  &--line &__indicator {
    bottom: -2px;
    height: 2px;
  }

  &--line.nb-tabs--indicator &__tab--active {
    border-bottom-color: transparent;
  }

  // ── Contained variant: segmented control, active block filled ────────────────
  &--contained &__list {
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--nb-c-border);
    @include radius.surface(panel);
    background: var(--nb-c-bg-soft);
    align-self: flex-start;
  }

  &--contained.nb-tabs--full-width &__list {
    align-self: stretch;
  }

  &--contained &__tab {
    height: calc(var(--nb-tabs-height) - 8px);
    /*
     * Concentric with the list that encloses it. The list is 2px of padding
     * plus a 1px border, so the tab's border-box sits 3px inside the list's:
     * inner = outer - 3px. The hand-picked 6px against the list's 8px was a
     * 1px mismatch, which is exactly the pinch a shared corner shows.
     */
    @include radius.inset(3px);
  }

  &--contained &__tab--active {
    background: var(--nb-c-primary);
    color: var(--nb-c-white);
    font-weight: 600;
  }

  &--contained &__tab--active:hover:not(:disabled) {
    color: var(--nb-c-white);
  }

  // The list's 2px of padding, so the block covers exactly the tab's box
  &--contained &__indicator {
    top: 2px;
    bottom: 2px;
    @include radius.inset(3px);
  }

  &--contained.nb-tabs--indicator &__tab--active {
    background: transparent;
  }

  // ── The bar scrolls sideways when the tabs do not fit ────────────────────────
  // More tabs than fit used to run off the edge with no way to reach them. The
  // bar scrolls instead, without a visible scrollbar, and an edge fades out on
  // whichever side there is more to see. Always on a phone, and at any width
  // while the tabs are wider than their container (`--overflow`, measured).
  @include bp.phone {
    @include scrolling-bar;
  }

  @include scrolling-bar('.nb-tabs--overflow');

  // A fingertip tall on a phone touch screen, the `sm` size included.
  @include bp.phone-touch {
    &__tab {
      min-block-size: 44px;
    }
  }

  // And at least 44px wide: a one-letter or icon-only tab is narrower.
  &__tab {
    @include touch.hit-area;
  }

  // The mark lands where it would have slid to
  @include motion.reduced {
    &__indicator {
      transition: none;
    }
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
