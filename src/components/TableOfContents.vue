<template>
  <div
    ref="rootEl"
    :class="['nb-toc', `nb-toc--${variant}`, { 'nb-toc--open': isOpen }]"
    @keydown.esc="onEscape"
  >
    <NbButton
      v-if="!isOpen"
      ref="showButton"
      size="sm"
      variant="ghost"
      icon="list-dashes"
      class="nb-toc__show"
      :aria-label="showLabel"
      :title="showLabel"
      :aria-expanded="false"
      :aria-controls="navId"
      @click="setOpen(true)"
    />
    <div v-else class="nb-toc__body" v-bind="bodyLayerProps">
      <nav :id="navId" class="nb-toc__nav" :aria-label="label">
        <div class="nb-toc__head">
          <span class="nb-toc__title">{{ title }}</span>
          <NbButton
            v-if="canClose"
            size="xs"
            variant="ghost"
            icon="caret-right"
            :aria-label="hideLabel"
            :title="hideLabel"
            :aria-expanded="true"
            :aria-controls="navId"
            @click="setOpen(false)"
          />
        </div>
        <TableOfContentsList :nodes="tree" :active="currentActive" @go="go" />
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NbButton from './Button.vue'
import TableOfContentsList from './TableOfContentsList.vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { prefersReducedMotion } from '@/composables/useReducedMotion.composable'
import type {
  ITableOfContentsItem,
  ITableOfContentsNode,
  ITableOfContentsProps,
} from './TableOfContents.d'

const props = withDefaults(defineProps<ITableOfContentsProps>(), {
  active: undefined,
  open: undefined,
  variant: 'docked',
  collapsible: true,
  title: 'Contents',
  label: 'Table of contents',
  showLabel: 'Show contents',
  hideLabel: 'Hide contents',
  root: null,
  resolveTarget: undefined,
  spy: true,
  offset: 96,
  updateHash: true,
  followHash: false,
})

const emit = defineEmits<{
  /** The section being read changed, from scrolling or from a choice. */
  'update:active': [id: string | null]
  /** The list was shown or hidden. */
  'update:open': [open: boolean]
  /** A section was chosen from the list. */
  navigate: [item: ITableOfContentsItem]
}>()

const navId = `${useStableId({})}-nav`
const rootEl = ref<HTMLElement | null>(null)
const showButton = ref<InstanceType<typeof NbButton> | null>(null)

// The floating form paints its own surface over the page, so it takes the
// overlay layer. The docked form sits on whatever surface the page gives it.
const { layerProps: overlayLayerProps } = useSurfaceLayer({ overlay: true })
const bodyLayerProps = computed(() =>
  props.variant === 'floating' ? overlayLayerProps.value : {},
)

// ─── Open state: controlled when bound, local otherwise ───────────────────
const localOpen = ref(props.variant !== 'floating')
const isOpen = computed(() => props.open ?? localOpen.value)
const canClose = computed(
  () => props.variant === 'floating' || props.collapsible,
)

function setOpen(value: boolean) {
  if (!value && !canClose.value) return
  localOpen.value = value
  emit('update:open', value)
  // Hiding removes the button that had focus. Put focus on the one that
  // replaces it, so a keyboard user is not dropped to the top of the page.
  if (!value) void nextTick(() => focusShowButton())
}

function focusShowButton() {
  const el = (showButton.value as { $el?: HTMLElement } | null)?.$el
  el?.focus()
}

function onEscape(event: KeyboardEvent) {
  if (props.variant !== 'floating' || !isOpen.value) return
  // Handled here, so a page-level Escape handler does not act on the same press.
  event.stopPropagation()
  setOpen(false)
}

watch(
  () => props.variant,
  (variant) => {
    localOpen.value = variant !== 'floating'
  },
)

// ─── Outline ───────────────────────────────────────────────────────────────
/** The flat items nested by relative depth. */
const tree = computed<ITableOfContentsNode[]>(() => {
  const roots: ITableOfContentsNode[] = []
  const stack: ITableOfContentsNode[] = []
  for (const item of props.items) {
    const node: ITableOfContentsNode = { ...item, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }
    if (stack.length === 0) roots.push(node)
    else stack[stack.length - 1].children.push(node)
    stack.push(node)
  }
  return roots
})

// ─── Active section: controlled when bound, local otherwise ───────────────
const localActive = ref<string | null>(null)
const currentActive = computed(() =>
  props.active !== undefined ? props.active : localActive.value,
)

function setActive(id: string | null) {
  if (id === currentActive.value) return
  localActive.value = id
  emit('update:active', id)
}

function targetFor(item: ITableOfContentsItem, index: number) {
  if (props.resolveTarget) return props.resolveTarget(item, index)
  if (props.root) {
    return props.root.querySelector<HTMLElement>(
      `[id="${item.id.replace(/(["\\])/g, '\\$1')}"]`,
    )
  }
  return typeof document === 'undefined'
    ? null
    : document.getElementById(item.id)
}

// ─── Scroll spy ────────────────────────────────────────────────────────────
type TScroller = HTMLElement | Window

/** Whatever actually scrolls the sections: often an app shell's `<main>`. */
function scrollParent(el: HTMLElement | null): TScroller {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return window
}

/**
 * Which section is being read, given each target's distance from the top of
 * the scroll viewport, in document order.
 *
 * The last section whose heading has scrolled up past `threshold`. At the very
 * bottom of the page the last one on screen wins instead, because a short final
 * section can never scroll far enough to reach the threshold. -1 means the
 * reader is above the first section.
 */
function activeIndex(
  tops: number[],
  threshold: number,
  atBottom: boolean,
  viewportHeight: number,
): number {
  if (atBottom) {
    for (let i = tops.length - 1; i >= 0; i--) {
      if (tops[i] < viewportHeight) return i
    }
  }
  let active = -1
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= threshold) active = i
    else break
  }
  return active
}

let scroller: TScroller | null = null
let frame: number | null = null
let suppressUntil = 0

function measure() {
  frame = null
  if (!props.spy || typeof window === 'undefined') return
  if (Date.now() < suppressUntil) return
  const found = props.items
    .map((item, index) => ({ item, el: targetFor(item, index) }))
    .filter((entry): entry is { item: ITableOfContentsItem; el: HTMLElement } =>
      Boolean(entry.el),
    )
  if (found.length === 0) {
    setActive(null)
    return
  }
  const target = scroller ?? window
  let top = 0
  let height = window.innerHeight
  let scrollTop = window.scrollY
  let scrollHeight = document.documentElement.scrollHeight
  if (target !== window) {
    const el = target as HTMLElement
    top = el.getBoundingClientRect().top
    height = el.clientHeight
    scrollTop = el.scrollTop
    scrollHeight = el.scrollHeight
  }
  const atBottom =
    scrollHeight > height && scrollTop + height >= scrollHeight - 2
  const tops = found.map(({ el }) => el.getBoundingClientRect().top - top)
  const index = activeIndex(tops, props.offset, atBottom, height)
  setActive(index >= 0 ? found[index].item.id : null)
}

function schedule() {
  if (frame !== null) return
  frame =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(measure)
      : (setTimeout(measure, 16) as unknown as number)
}

function attach() {
  detach()
  if (!props.spy || typeof window === 'undefined') return
  const first = props.items
    .map((item, index) => targetFor(item, index))
    .find(Boolean)
  scroller = scrollParent(first ?? props.root ?? rootEl.value)
  scroller.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  schedule()
}

function detach() {
  scroller?.removeEventListener('scroll', schedule)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', schedule)
  }
  scroller = null
}

// ─── Navigation ────────────────────────────────────────────────────────────
/**
 * Scroll to a section, highlight it, and move focus to it.
 *
 * Focus moves so a keyboard or screen reader user carries on reading from the
 * section. Not inside an editable region, where focusing the heading element
 * would not put the caret in it.
 */
function go(
  item: ITableOfContentsItem | string,
  opts: { instant?: boolean } = {},
) {
  const id = typeof item === 'string' ? item : item.id
  const index = props.items.findIndex((entry) => entry.id === id)
  if (index < 0) return
  const entry = props.items[index]
  const el = targetFor(entry, index)
  if (!el) return

  const instant = opts.instant || prefersReducedMotion()
  el.scrollIntoView?.({ behavior: instant ? 'auto' : 'smooth', block: 'start' })
  setActive(id)
  // Smooth scrolling passes other sections on the way. Hold the highlight on
  // the chosen one until it has arrived.
  suppressUntil = instant ? 0 : Date.now() + 700

  if (props.updateHash) {
    try {
      const { pathname, search } = window.location
      window.history.replaceState(
        window.history.state,
        '',
        `${pathname}${search}#${id}`,
      )
    } catch {
      // An address bar that cannot be written is not a reason not to scroll.
    }
  }

  if (!el.closest('[contenteditable="true"]')) {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }

  if (props.variant === 'floating') {
    localOpen.value = false
    emit('update:open', false)
  }
  emit('navigate', entry)
}

let hashHandled = false

function goToAddressHash() {
  if (!props.followHash || hashHandled || typeof window === 'undefined') return
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (!id) {
    hashHandled = true
    return
  }
  const index = props.items.findIndex((entry) => entry.id === id)
  // Not a section, or not rendered yet: wait for the items to change.
  if (index < 0 || !targetFor(props.items[index], index)) return
  hashHandled = true
  go(id, { instant: true })
}

// Targets usually render after the items that describe them. Re-measure after
// the items change rather than when they change.
watch(
  () => props.items,
  () =>
    void nextTick(() => {
      attach()
      goToAddressHash()
    }),
  { flush: 'post', deep: true },
)
watch(
  () => [props.root, props.spy] as const,
  () => void nextTick(attach),
  { flush: 'post' },
)

onMounted(() => {
  attach()
  void nextTick(goToAddressHash)
})

onBeforeUnmount(() => {
  detach()
  if (frame !== null) {
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    clearTimeout(frame)
  }
})

defineExpose({
  /** Scroll to a section by id, as a click on its link does. */
  go,
  /** Re-read the scroll position now, for hosts that move content themselves. */
  measure,
})
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-toc {
  inline-size: 100%;
}

.nb-toc__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nb-base-unit);
  padding-inline-start: var(--nb-base-unit);
  margin-block-end: calc(var(--nb-base-unit) * 0.5);
}

.nb-toc__title {
  color: var(--nb-c-text-subtle);
  font-family: var(--nb-type-label-sm-family);
  font-size: var(--nb-type-label-sm-size);
  font-weight: var(--nb-type-label-sm-weight);
  line-height: var(--nb-type-label-sm-line-height);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.nb-toc__nav {
  // A long outline scrolls inside the contents instead of running off the
  // bottom of the screen, where a sticky container would strand it.
  max-block-size: var(--nb-toc-max-height, calc(100dvh - 12rem));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.nb-toc__show {
  display: flex;
  margin-inline-start: auto;
}

// The narrow form: a button in the corner that opens onto a surface. The host
// places the component (for example absolutely, at the top right of the page).
.nb-toc--floating {
  inline-size: auto;

  .nb-toc__body {
    inline-size: min(
      var(--nb-toc-floating-width, 18rem),
      calc(100vw - calc(var(--nb-base-unit) * 4))
    );
    padding: var(--nb-base-unit);
    background: var(--nb-c-surface);
    border: 1px solid var(--nb-c-border);
    @include radius.surface(popover);
    box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
      var(--nb-c-scrim);
  }
}
</style>
