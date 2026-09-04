<template>
  <div ref="rootRef" class="nb-notification-center">
    <!-- Replacing the bell must not cost the focus model. `triggerProps`
         carries the id, the dialog relationship and the expanded state a host
         cannot derive, and `setTriggerRef` is how the panel finds its way back
         on Escape. Both are bound below on the default trigger too, so the
         documented slot path and the built-in path are the same path. -->
    <slot
      name="trigger"
      :open="isOpen"
      :toggle="toggle"
      :show="show"
      :close="close"
      :unread-count="unreadCount"
      :badge="badgeText"
      :panel-id="panelId"
      :trigger-props="triggerProps"
      :set-trigger-ref="setTriggerRef"
    >
      <button
        :ref="setTriggerRef"
        type="button"
        class="nb-notification-center__trigger"
        :class="{ 'nb-notification-center__trigger--active': isOpen }"
        v-bind="triggerProps"
        @click="toggle"
      >
        <NbIcon :name="icon" :size="18" />
        <!-- The number is decoration: the same count is already in the
             button's accessible name, uncapped, so a reader hears "142
             unread" where the badge only has room for "99+". -->
        <span
          v-if="unreadCount > 0"
          class="nb-notification-center__badge"
          aria-hidden="true"
          >{{ badgeText }}</span
        >
      </button>
    </slot>

    <Teleport to="body">
      <Transition name="nb-notification-center-pop">
        <div
          v-if="isOpen"
          :id="panelId"
          ref="panelRef"
          class="nb-notification-center__panel"
          :class="panelClass"
          :style="panelStyle"
          role="dialog"
          tabindex="-1"
          :aria-labelledby="titleId"
          :aria-describedby="describedBy"
          :aria-busy="loading ? 'true' : undefined"
          @keydown="onPanelKeydown"
          @focusin="onPanelFocusIn"
        >
          <div class="nb-notification-center__header">
            <h2 :id="titleId" class="nb-notification-center__title">
              {{ label }}
            </h2>
            <!-- Additions go here and cost nothing. A filter field, a
                 settings link: anything a host wants BESIDE the mark-all
                 control rather than instead of it. #header-actions is the
                 replacement slot and it is a deliberate trade. -->
            <slot
              name="header-start"
              :close="close"
              :unread-count="unreadCount"
            />
            <slot
              name="header-actions"
              :close="close"
              :unread-count="unreadCount"
              :mark-all-read="onMarkAll"
              :mark-all-pending="markAllPending"
              :mark-all-props="markAllProps"
              :mark-all-text="
                markAllPending ? markAllPendingLabel : markAllLabel
              "
            >
              <!-- Pending is aria-disabled, not disabled: the user pressed
                   this button, so it has focus, and a `disabled` attribute
                   would drop that focus to <body> mid-request. The click is
                   ignored in the handler instead. -->
              <button
                v-if="showMarkAll"
                class="nb-notification-center__mark-all"
                v-bind="markAllProps"
              >
                <NbSpinner
                  v-if="markAllPending"
                  size="xs"
                  tone="inherit"
                  decorative
                />
                {{ markAllPending ? markAllPendingLabel : markAllLabel }}
              </button>
            </slot>
          </div>

          <!-- The button's own label change is not reliably announced, and a
               request that fails has to be able to say so. One region, empty
               until there is something to say. -->
          <span class="nb-notification-center__sr" role="status">{{
            markAllPending ? markAllPendingLabel : ''
          }}</span>

          <!-- Loading and empty are two different answers and never share an
               element. A fetch that has not finished must not read as "you
               have nothing". -->
          <!-- A refresh that failed with rows already loaded. The rows below
               are still the user's notifications, so they stay; this strip is
               the whole of the correction. role="status" and not "alert":
               nothing was lost and nothing is urgent. -->
          <div
            v-if="showStaleError"
            :id="errorId"
            class="nb-notification-center__stale"
            role="status"
          >
            <NbIcon name="warning-circle" :size="14" aria-hidden="true" />
            <span class="nb-notification-center__stale-text">{{
              errorStaleLabel
            }}</span>
            <button
              v-if="showRetry"
              type="button"
              class="nb-notification-center__retry"
              @click="onRetry"
            >
              {{ retryLabel }}
            </button>
          </div>

          <div
            v-if="panelState === 'loading'"
            class="nb-notification-center__loading"
            role="status"
            :style="listStyle"
          >
            <span class="nb-notification-center__sr">{{ loadingLabel }}</span>
            <!-- One announcement for the whole region, from the wrapper above.
                 A silent NbSkeleton is aria-hidden, so three placeholder rows
                 do not announce themselves three times. -->
            <NbSkeleton
              v-for="n in 3"
              :key="n"
              variant="text"
              type="body-sm"
              :lines="2"
              last-line-width="60%"
            />
          </div>

          <!-- role="list" is not redundant. Every row in this list carries
               `list-style: none`, and WebKit drops list semantics from a list
               styled that way, so VoiceOver never says "list, 12 items". The
               same explicit role is on NbReorderList for the same reason. -->
          <!-- The request failed and there is nothing to fall back on. This is
               NOT the empty state with different words: NbEmptyState is told
               kind="error", the action offered is retry and never "create
               your first", and role="alert" means a reader hears about it
               without hunting for it. -->
          <div
            v-else-if="panelState === 'error'"
            :id="errorId"
            class="nb-notification-center__error"
            role="alert"
          >
            <slot name="error" :retry="onRetry">
              <NbEmptyState
                size="sm"
                kind="error"
                :title="errorTitle"
                :description="errorDescription"
              >
                <template v-if="showRetry" #actions>
                  <NbButton size="sm" variant="secondary" @click="onRetry">
                    {{ retryLabel }}
                  </NbButton>
                </template>
              </NbEmptyState>
            </slot>
          </div>

          <!-- `tabindex` is 0 only when the list holds nothing focusable,
               which is what a feed of inert rows is. A scrolling region a
               keyboard cannot reach is content a keyboard user cannot read,
               so the region itself becomes the tab stop. With even one
               activatable row the arrows already reach everything and the
               attribute is dropped, because a second tab stop in front of
               the rows would be noise. -->
          <ul
            v-else-if="panelState === 'list'"
            ref="listRef"
            class="nb-notification-center__list"
            role="list"
            :tabindex="listTabIndex"
            :style="listStyle"
            @click="onSlotActivate"
            @keydown="onSlotActivate"
          >
            <slot :close="close" :items="items">
              <NbNotificationCenterItem
                v-for="item in items"
                :key="item.id"
                :title="item.title"
                :body="item.body"
                :time="item.time"
                :time-label="item.timeLabel"
                :read="item.read"
                :variant="item.variant ?? 'neutral'"
                :icon="item.icon"
                :href="item.href"
                :interactive="item.interactive ?? interactive"
                :locale="locale"
                :unread-label="unreadLabel"
                :read-label="readLabel"
                @select="onSelect(item, $event)"
              />
            </slot>
          </ul>

          <div
            v-else-if="panelState === 'empty'"
            class="nb-notification-center__empty"
          >
            <slot name="empty">
              <NbEmptyState
                size="sm"
                :icon="icon"
                :title="emptyTitle"
                :description="emptyDescription"
              />
            </slot>
          </div>

          <div v-if="$slots.footer" class="nb-notification-center__footer">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts">
import type { IAnchorRect, IAnchorSize } from '@/utils/anchorPosition.helper'
import type {
  IPanelPlacement,
  IPanelPlacementOptions,
} from './NotificationCenter.d'

// Types live in the sibling NotificationCenter.d.ts, the way 59 of the
// library's components declare theirs. They are re-exported here so an import
// aimed at the .vue keeps resolving.
export type {
  INotificationItem,
  INotificationTriggerProps,
  INotificationMarkAllProps,
  INotificationCenterProps,
} from './NotificationCenter.d'
export type { IPanelPlacement, IPanelPlacementOptions }

// ── One panel at a time ─────────────────────────────────────────────────
// Two bells in one shell is a plausible composition: a product centre and an
// account centre, or a tenant-scoped one beside a platform one. Two OPEN
// bells is not. They overlap, each cycles Tab within itself, each binds its
// own document listeners, and the one underneath is unreachable. So the
// module keeps the open ones and a panel that opens dismisses the others.
// Module scope rather than app scope, because "the page" is the thing they
// collide on and two Vue apps in one page still share this bundle.
//
// A host that fully controls `open` and ignores `update:open` can still force
// two open at once. That is its decision to make; the centre says so and does
// not fight it.
const openPanels = new Set<() => void>()

// ── Placement, as arithmetic ────────────────────────────────────────────
// Exported and pure, so the flip and the clamps are unit-testable without a
// layout engine, which is the whole argument behind utils/anchorPosition.
// That helper is not used directly here because it centres the surface on the
// anchor's cross axis, and a notification panel is 360px wide hanging off a
// 32px bell: it has to align to a trigger EDGE, or it sits half off screen on
// every topbar in the fleet. If `placeAnchored` ever grows an `align` option,
// this function should collapse into a call to it.

/** Space kept between the trigger and the panel. */
const GAP = 8
/** Smallest gap kept between the panel and a viewport edge. */
const EDGE = 8
/** Height the header and the optional footer are assumed to want, deducted
 *  from the space available before the list is allowed to fill it. */
const PANEL_CHROME = 96
/** Below this the list is not worth scrolling, so it stops shrinking and the
 *  panel is allowed to be the thing that overflows instead. */
const MIN_LIST = 88
/** Opening downwards is the norm. The panel only flips when what is left
 *  below is genuinely unusable AND the space above is better. */
const CRAMPED = 200

export function placeNotificationPanel(
  anchor: IAnchorRect,
  { align, width, maxHeight, viewport }: IPanelPlacementOptions,
): IPanelPlacement {
  const edgeAligned =
    align === 'start' ? anchor.left : anchor.left + anchor.width - width
  const left = Math.min(
    Math.max(edgeAligned, EDGE),
    Math.max(EDGE, viewport.width - width - EDGE),
  )

  const bottom = anchor.top + anchor.height
  const below = viewport.height - bottom - GAP - EDGE
  const above = anchor.top - GAP - EDGE
  const side: 'top' | 'bottom' =
    below < CRAMPED && above > below ? 'top' : 'bottom'

  const available = Math.max(MIN_LIST, side === 'top' ? above : below)
  const maxListHeight = Math.max(
    MIN_LIST,
    Math.min(maxHeight, available - PANEL_CHROME),
  )
  const height = Math.min(maxHeight + PANEL_CHROME, available)

  return {
    top:
      side === 'top' ? Math.max(EDGE, anchor.top - GAP - height) : bottom + GAP,
    left,
    side,
    maxListHeight,
  }
}

/**
 * Whether any part of the trigger is still on screen. A panel is fixed to the
 * viewport, so once the bell it belongs to has scrolled away the panel is
 * floating over content it has nothing to do with, and the honest thing is to
 * let go of it.
 */
export function isAnchorInViewport(
  anchor: IAnchorRect,
  viewport: IAnchorSize,
): boolean {
  return (
    anchor.left <= viewport.width &&
    anchor.left + anchor.width >= 0 &&
    anchor.top <= viewport.height &&
    anchor.top + anchor.height >= 0
  )
}
</script>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue'
import NbButton from './Button.vue'
import NbEmptyState from './EmptyState.vue'
import NbIcon from './Icon.vue'
import NbNotificationCenterItem from './NotificationCenterItem.vue'
import NbSkeleton from './Skeleton.vue'
import NbSpinner from './Spinner.vue'
import type {
  INotificationCenterProps,
  INotificationItem,
  INotificationMarkAllProps,
  INotificationTriggerProps,
} from './NotificationCenter.d'

const props = withDefaults(defineProps<INotificationCenterProps>(), {
  items: () => [],
  unreadCount: undefined,
  itemCount: undefined,
  open: undefined,
  label: 'Notifications',
  markAllLabel: 'Mark all as read',
  markAllPendingLabel: 'Marking all as read',
  markAllPending: false,
  emptyTitle: 'No notifications',
  emptyDescription: 'New activity shows up here.',
  loadingLabel: 'Loading notifications',
  loading: false,
  error: false,
  errorTitle: 'Could not load notifications',
  errorDescription: 'The request failed. Nothing has been lost.',
  errorStaleLabel: 'These may be out of date.',
  retryLabel: 'Try again',
  showRetry: true,
  maxCount: 99,
  width: 360,
  maxHeight: 384,
  align: 'end',
  showMarkAll: true,
  interactive: true,
  closeOnSelect: true,
  closeOnNavigate: true,
  disabled: false,
  icon: 'bell',
  locale: undefined,
  unreadLabel: 'Unread',
  readLabel: 'Read',
  formatUnread: (count: number) =>
    count === 1 ? '1 unread' : `${count} unread`,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  open: []
  close: []
  /** A row was activated. The payload is the item behind it, or `null` when
   *  the row came from the default slot and the centre never saw an item
   *  object: slotted rows are matched by their `data-nb-notification-item`
   *  attribute, so the host still gets one event per activation. */
  select: [item: INotificationItem | null, event: Event]
  /** The user asked for everything to be marked read. The centre owns no
   *  data, so the host does the marking, and sets `markAllPending` while it
   *  is doing it. */
  'mark-all-read': []
  /** The user asked for the failed request to be tried again. The centre owns
   *  no data and does no fetching, so this is the whole of its part in it. */
  retry: []
}>()

const slots = useSlots()

const uid = useId()
const panelId = `nb-notification-center-${uid}`
const titleId = `${panelId}-title`
const triggerId = `${panelId}-trigger`
const errorId = `${panelId}-error`

const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const internalOpen = ref(false)
const isOpen = computed(() =>
  props.open === undefined ? internalOpen.value : props.open,
)

const unreadCount = computed(() => {
  if (typeof props.unreadCount === 'number') {
    return Math.max(0, props.unreadCount)
  }
  return props.items.filter((item) => !item.read).length
})

const badgeText = computed(() =>
  unreadCount.value > props.maxCount
    ? `${props.maxCount}+`
    : String(unreadCount.value),
)

const triggerName = computed(() =>
  unreadCount.value > 0
    ? `${props.label}, ${props.formatUnread(unreadCount.value)}`
    : props.label,
)

// ── How many rows the panel believes it has ─────────────────────────────
// `undefined` means "not known", which is a real answer and not a zero. It
// happens on exactly one path: the host filled the default slot and did not
// say how many rows it put in it. The centre renders that slot, it does not
// read it, so counting the result would mean either walking VNodes outside a
// render (Vue drops the dependency tracking and warns) or measuring the DOM
// a frame late. Neither is a count. So the host supplies one, and when it
// does not, the panel says so out loud in dev and falls back to the reading
// that cannot hide a failure.
//
// The earlier version of this returned `true` for "a default slot exists",
// which made `#empty` unreachable and quietly demoted `error` to a stale-data
// note over an empty list. That is the audit finding this component was built
// to end, one configuration over.
const rowCount = computed<number | undefined>(() => {
  if (typeof props.itemCount === 'number') return Math.max(0, props.itemCount)
  if (slots.default) return undefined
  return props.items.length
})

const hasContent = computed(() => (rowCount.value ?? 0) > 0)

// ── Which of the four answers the panel is giving ───────────────────────
// A request that has not finished, a request that failed, a result with rows
// and a result with none are four different things and each gets its own
// branch. They are computed in one place, and each is the negation of the
// others, so no future edit can make two of them true at once. The audit
// behind this component found an app with one `.empty-text` element serving
// both loading and empty, which is how a failed fetch came to read as "no
// contacts yet".
type TPanelState = 'loading' | 'error' | 'list' | 'empty'

const panelState = computed<TPanelState>(() => {
  if (props.loading) return 'loading'
  const count = rowCount.value
  // Failure wins an unknown count. The alternative, assuming the slot has
  // rows, is precisely the bug: a request that failed rendering as content.
  // Better to show an error over rows that might have been there than to
  // hide a failure behind rows that might not be.
  if (props.error && (count === undefined || count === 0)) return 'error'
  if (count === undefined || count > 0) return 'list'
  return 'empty'
})

// A refresh that failed over rows already on screen. The rows stay: stale
// notifications beat no notifications, and throwing away what the user was
// reading to show them an error is a worse answer than saying so above it.
// This needs a KNOWN, non-zero count: with an unknown one `panelState` has
// already chosen the error region and the two must never both render.
const showStaleError = computed(
  () =>
    props.error &&
    !props.loading &&
    panelState.value === 'list' &&
    hasContent.value,
)

// The slot path without `itemCount` is a working configuration with one hole
// in it: `#empty` cannot render, because nothing can tell an empty feed from
// a slot the host chose not to fill. Say so once, in dev, at the moment it
// could matter.
const warnedNoCount = ref(false)
watch(
  () => [isOpen.value, Boolean(slots.default), props.itemCount] as const,
  ([open, slotted, count]) => {
    if (!import.meta.env?.DEV || warnedNoCount.value) return
    if (!open || !slotted || typeof count === 'number') return
    warnedNoCount.value = true
    console.warn(
      '[NbNotificationCenter] the default slot is in use without `itemCount`, so the centre cannot tell an empty feed from a slot you left unfilled. The `#empty` state will not render, and `error` resolves to the full error region rather than the stale-data strip. Pass :item-count="rows.length" alongside :unread-count.',
    )
  },
  { immediate: true },
)

function onRetry() {
  emit('retry')
}

// ── The trigger, whoever renders it ─────────────────────────────────────
// Everything the default bell binds, as an object, because the `#trigger`
// slot is a documented API and a host cannot invent `panelId`. Without this
// a replacement trigger cannot state that it owns a dialog, cannot say
// whether that dialog is open, and cannot point at it.
const triggerProps = computed<INotificationTriggerProps>(() => ({
  id: triggerId,
  'aria-haspopup': 'dialog',
  'aria-expanded': isOpen.value ? 'true' : 'false',
  'aria-controls': isOpen.value ? panelId : undefined,
  // A default, not a mandate. Bind your own after the spread to replace it.
  'aria-label': triggerName.value,
  disabled: props.disabled || undefined,
}))

// Everything the built-in mark-all button binds, as one object, so a host
// that replaces the header with #header-actions can spread it onto its own
// control instead of re-deriving the pending rules. Pending is aria-disabled,
// not disabled: the user pressed this button, so it has focus, and a
// `disabled` attribute would drop that focus to <body> mid-request. The
// second click is swallowed in the handler instead.
const markAllProps = computed<INotificationMarkAllProps>(() => ({
  type: 'button',
  disabled: unreadCount.value === 0 && !props.markAllPending,
  'aria-disabled': props.markAllPending ? 'true' : undefined,
  'aria-busy': props.markAllPending ? 'true' : undefined,
  onClick: onMarkAll,
}))

// The error text describes the dialog, so the dialog points at it. Without
// this the generated id was decoration: an id minted for an association that
// nothing made. The two error branches are mutually exclusive (the stale
// strip needs rows, the error region needs none) so only one exists at a
// time and the id is never ambiguous.
const describedBy = computed(() =>
  showStaleError.value || panelState.value === 'error' ? errorId : undefined,
)

/**
 * Template-ref setter for a slotted trigger, so focus restoration works
 * through the slot and not only for the bell this component renders itself.
 * Accepts a component instance as well as an element, because the natural
 * thing for a host to reach for is `<NbButton :ref="setTriggerRef">`.
 */
function setTriggerRef(value: Element | { $el?: unknown } | null): void {
  if (!value) {
    triggerRef.value = null
    return
  }
  const el =
    value instanceof HTMLElement
      ? value
      : ((value as { $el?: unknown }).$el as HTMLElement | undefined)
  triggerRef.value = el instanceof HTMLElement ? el : null
}

// ── Placement ───────────────────────────────────────────────────────────
// The panel is teleported because every shell that hosts a bell clips its
// topbar, and it is positioned from the trigger's viewport rect, the same way
// NbUserMenu places its panel. The arithmetic itself lives in the exported
// `placeNotificationPanel` above, where a test can reach it.
const placement = ref<IPanelPlacement>({
  top: 0,
  left: 0,
  side: 'bottom',
  maxListHeight: props.maxHeight,
})

function viewport(): IAnchorSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

function position() {
  const anchor = rootRef.value?.getBoundingClientRect()
  if (!anchor) return
  placement.value = placeNotificationPanel(anchor, {
    align: props.align,
    width: props.width,
    maxHeight: props.maxHeight,
    viewport: viewport(),
  })
}

const panelStyle = computed(() => ({
  top: `${Math.round(placement.value.top)}px`,
  left: `${Math.round(placement.value.left)}px`,
  width: `${props.width}px`,
}))

// The header and footer stay put; only the list scrolls, so a long feed never
// pushes "Mark all as read" off the bottom of the screen.
const listStyle = computed(() => ({
  maxHeight: `${Math.round(placement.value.maxListHeight)}px`,
}))

const panelClass = computed(() => ({
  'nb-notification-center__panel--start': props.align === 'start',
  'nb-notification-center__panel--above': placement.value.side === 'top',
}))

// ── Open and close ──────────────────────────────────────────────────────
function setOpen(value: boolean) {
  if (props.open === undefined) internalOpen.value = value
  emit('update:open', value)
}

// Named `show` rather than `open`, because `open` is a prop here and a method
// of the same name would be ambiguous at every call site.
function show() {
  if (props.disabled || isOpen.value) return
  position()
  setOpen(true)
  emit('open')
}

function close(options: { restoreFocus?: boolean } = {}) {
  if (!isOpen.value) return
  const inside = panelRef.value?.contains(document.activeElement)
  setOpen(false)
  emit('close')
  // Focus goes back to the trigger only when it was inside the panel. A
  // click elsewhere on the page has already chosen where focus belongs, and
  // yanking it back to the bell would undo the user's own action.
  if (options.restoreFocus ?? inside) {
    nextTick(restoreTriggerFocus)
  }
}

/**
 * Put focus back where the panel was opened from.
 *
 * `triggerRef` is only populated when this component rendered the bell
 * itself. A host using the `#trigger` slot without `setTriggerRef` leaves it
 * null, and focusing null strands the user on <body>: WCAG 2.4.3 Focus Order
 * failed, and a keyboard user has to tab from the top of the document to get
 * back to where they were. So when there is no known trigger, focus the first
 * focusable thing the host put inside our own root, which is the trigger in
 * every composition that is not deliberately perverse.
 */
function restoreTriggerFocus() {
  const known = triggerRef.value
  if (known?.isConnected) {
    known.focus()
    return
  }
  const fallback = rootRef.value?.querySelector<HTMLElement>(FOCUSABLE)
  fallback?.focus()
}

function toggle() {
  if (isOpen.value) close({ restoreFocus: true })
  else show()
}

// ── Roving focus through the rows ───────────────────────────────────────
const activeIndex = ref(0)

/**
 * What this component is willing to treat as a row you can act on.
 *
 * `data-nb-notification-item` says "this is a notification row"; it does not
 * make one. The panel hands a row a tabindex and turns Enter into a `select`,
 * and doing that to an element with no role produces a control with no name,
 * role or value: WCAG 4.1.2, and the exact bug this component shipped with
 * when `interactive: false` still left a focusable, clickable `<div>` behind.
 * So the browser has to already agree that the element is a control, either
 * natively or through an explicit role.
 */
const ROW_ROLES = new Set(['button', 'link', 'menuitem', 'option'])

function isRowControl(el: HTMLElement): boolean {
  if (el.tagName === 'BUTTON') return !el.hasAttribute('disabled')
  if (el.tagName === 'A') return el.hasAttribute('href')
  const role = el.getAttribute('role')
  return role !== null && ROW_ROLES.has(role)
}

// One warning per element, so a panel that reopens twenty times does not
// print the same complaint twenty times.
const warned = new WeakSet<HTMLElement>()

function warnNotAControl(el: HTMLElement) {
  if (!import.meta.env?.DEV || warned.has(el)) return
  warned.add(el)
  console.warn(
    `[NbNotificationCenter] <${el.tagName.toLowerCase()} data-nb-notification-item> is not a control, so it was left out of the keyboard order and will not emit "select". Render the row as a <button>, give it an href, or add role="button" and your own key handling. If the row is meant to be read and not pressed, drop the attribute: that is what interactive: false does.`,
  )
}

function rows(): HTMLElement[] {
  if (!panelRef.value) return []
  const marked = Array.from(
    panelRef.value.querySelectorAll<HTMLElement>('[data-nb-notification-item]'),
  )
  return marked.filter((el) => {
    if (isRowControl(el)) return true
    warnNotAControl(el)
    return false
  })
}

/**
 * The list is a tab stop only when it contains nothing focusable of its own.
 * A feed rendered with `interactive: false` is exactly that: rows worth
 * reading, none worth pressing, inside a box that scrolls. Without this, a
 * keyboard user could open the panel and never reach anything past the fold.
 */
const listTabIndex = ref<number | undefined>(undefined)

function syncListTabStop(all: HTMLElement[]) {
  const list = listRef.value
  listTabIndex.value =
    list && list.childElementCount > 0 && all.length === 0 ? 0 : undefined
}

// One tab stop for the whole list: Tab reaches it, arrows move within it.
// Without this a panel of forty notifications is forty tab stops between the
// bell and the footer link.
function syncRoving(index: number) {
  const all = rows()
  syncListTabStop(all)
  if (!all.length) return
  activeIndex.value = Math.min(Math.max(index, 0), all.length - 1)
  all.forEach((el, i) => {
    el.setAttribute('tabindex', i === activeIndex.value ? '0' : '-1')
  })
}

function focusRow(index: number) {
  const all = rows()
  if (!all.length) return false
  const next = Math.min(Math.max(index, 0), all.length - 1)
  syncRoving(next)
  all[next]?.focus()
  return true
}

function onPanelFocusIn(event: FocusEvent) {
  const target = (event.target as HTMLElement | null)?.closest(
    '[data-nb-notification-item]',
  )
  if (!target) return
  const index = rows().indexOf(target as HTMLElement)
  if (index >= 0) syncRoving(index)
}

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'

/**
 * A field inside the panel owns its own arrow keys: ArrowUp in a text input
 * goes to the start of the line, ArrowDown in a <select> picks the next
 * option, and the documented composition for this component is a filter field
 * in `#header-actions`. Stealing those keys to move a roving index is the kind
 * of bug that only shows up once somebody puts a real search box in the slot.
 */
const FIELD =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"]'

function inField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return Boolean(el?.closest?.(FIELD))
}

function onPanelKeydown(event: KeyboardEvent) {
  const all = rows()
  const current = (event.target as HTMLElement | null)?.closest(
    '[data-nb-notification-item]',
  )
  const index = current ? all.indexOf(current as HTMLElement) : -1

  // Escape is the exception: it dismisses from anywhere in the panel,
  // including from a field, because that is what every other surface in the
  // library does and what a user expects of a dismissible panel. Unless
  // something nearer the user already answered it: see `escapeIsOurs`.
  if (event.key === 'Escape') {
    if (!escapeIsOurs(event)) return
    event.preventDefault()
    event.stopPropagation()
    close({ restoreFocus: true })
    return
  }

  if (event.key === 'Tab') {
    exitOnTabEdge(event)
    return
  }

  if (inField(event.target)) return

  switch (event.key) {
    case 'ArrowDown':
      // preventDefault only when the key is actually being used, so a panel
      // with nothing to move through still scrolls.
      if (focusRow(index < 0 ? 0 : index + 1)) event.preventDefault()
      break
    case 'ArrowUp':
      if (focusRow(index < 0 ? all.length - 1 : index - 1))
        event.preventDefault()
      break
    case 'Home':
      if (index >= 0) {
        event.preventDefault()
        focusRow(0)
      }
      break
    case 'End':
      if (index >= 0) {
        event.preventDefault()
        focusRow(all.length - 1)
      }
      break
    default:
      break
  }
}

/**
 * Whether an Escape keypress is this panel's to answer.
 *
 * A row action or a `#footer` link can open something that is itself
 * dismissible: NbModal, NbConfirm, a teleported listbox. Those surfaces are
 * nearer the user than the centre is, so their Escape is theirs, and the
 * centre must not swallow the same keystroke to dismiss itself underneath
 * them. Two tests, because the library's overlays are split between the two:
 *
 *  - `defaultPrevented`, for anything that consumed the key outright, and
 *  - a containment test against `[aria-modal="true"]`, which is how NbModal
 *    and NbConfirm mark themselves (Modal.vue's own `isTopmost` reads the
 *    same attribute) and which they do NOT preventDefault on.
 */
function escapeIsOurs(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return false
  const from = (event.target as HTMLElement | null) ?? document.activeElement
  const modal = (from as HTMLElement | null)?.closest?.('[aria-modal="true"]')
  if (modal && modal !== panelRef.value) return false
  return true
}

// The panel is not modal: the page behind it stays live, there is no scrim
// and nothing behind it is inert. A dialog like that must not trap Tab, so
// this does not; the earlier version cycled focus inside the panel, which
// meant a keyboard user could reach the bell and then only leave by Escape
// while a screen reader's virtual cursor read the page behind it freely.
// APG's rule for a non-modal dialog is that Tab moves out of it, and moving
// out dismisses it.
//
// Where "out" is takes one correction: the panel is teleported to the end of
// <body>, so the browser's own next stop after it is nothing near the bell.
// So the two edges are handled explicitly. Forward off the last control goes
// to whatever follows the trigger in the page; backward off the first goes to
// the trigger itself. Both close the panel. Everything between the edges is
// left entirely alone.
function exitOnTabEdge(event: KeyboardEvent) {
  const panel = panelRef.value
  if (!panel) return
  // No visibility filtering here on purpose: the panel is position: fixed, so
  // offsetParent is null for everything inside it and a check on it would
  // silently empty this list.
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
  const active = document.activeElement as HTMLElement | null
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const atStart =
    !focusable.length || active === first || !panel.contains(active)
  const atEnd = !focusable.length || active === last

  if (event.shiftKey ? !atStart : !atEnd) return

  event.preventDefault()
  const next = event.shiftKey ? triggerRef.value : afterTrigger()
  close({ restoreFocus: false })
  nextTick(() => {
    if (next?.isConnected) next.focus()
    else restoreTriggerFocus()
  })
}

/** The page's own next tab stop after the trigger, ignoring the panel. */
function afterTrigger(): HTMLElement | null {
  const trigger = triggerRef.value
  if (!trigger) return null
  const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE))
    .filter((el) => !panelRef.value?.contains(el))
    .filter((el) => el.tabIndex >= 0)
  const index = all.indexOf(trigger)
  if (index < 0) return null
  return all[index + 1] ?? null
}

function onSelect(item: INotificationItem, event: Event) {
  emit('select', item, event)
  if (props.closeOnSelect) close({ restoreFocus: false })
}

/**
 * Rows the host rendered into the default slot do not emit `select`, because
 * they are the host's own markup. They are still notification rows, so their
 * activation is forwarded with a null item: one event contract whichever way
 * the rows were supplied. Only bound while there IS a default slot, so the
 * v-for rows above never emit twice.
 */
function onSlotActivate(event: Event) {
  if (!slots.default) return
  const row = (event.target as HTMLElement | null)?.closest(
    '[data-nb-notification-item]',
  )
  if (!row) return
  // A slotted row gets the same answer an item row gets: if it is not a
  // control, the centre does not pretend it is one.
  if (!isRowControl(row as HTMLElement)) {
    warnNotAControl(row as HTMLElement)
    return
  }

  if (event.type === 'keydown') {
    const key = (event as KeyboardEvent).key
    if (key !== 'Enter' && key !== ' ') return
    // A button or a link turns both keys into a click of its own; acting here
    // as well would emit the same activation twice.
    if (row.tagName === 'BUTTON' || row.tagName === 'A') return
    event.preventDefault()
  }

  emit('select', null, event)
  if (props.closeOnSelect) close({ restoreFocus: false })
}

function onMarkAll() {
  // aria-disabled, so the click still arrives. Swallow it rather than firing
  // a second request the host has no way to cancel.
  if (props.markAllPending) return
  emit('mark-all-read')
}

// ── Document-level dismissal ────────────────────────────────────────────
function onPointerDown(event: MouseEvent) {
  const target = event.target as Node
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return
  }
  close({ restoreFocus: false })
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  // Escape from inside the panel is the panel's own handler's business.
  if (panelRef.value?.contains(document.activeElement)) return
  // Escape that belongs to a surface layered over us is not ours to act on.
  // Without this, an NbConfirm opened from a row action and the centre behind
  // it both went away on one keystroke.
  if (!escapeIsOurs(event)) return
  // Escape from anywhere else still dismisses, because a panel opened
  // programmatically leaves focus where it was and the user must be able to
  // get rid of it. But focus is NOT dragged back to the bell here. The
  // realistic source of this keystroke is a nested overlay opened from a row
  // action or from #footer (NbModal, NbConfirm, a teleported NbSelect
  // listbox) whose own Escape handler is dismissing it in the same tick:
  // moving focus to the trigger would teleport the user out of what they
  // were doing. The only case where the bell should get focus back is the
  // case where it already has it, which costs nothing.
  const focusInRoot = rootRef.value?.contains(document.activeElement) ?? false
  close({ restoreFocus: focusInRoot })
}

// A capture-phase scroll listener fires for every scrolling ancestor on the
// page, and every one of those events used to cost a getBoundingClientRect
// and a full placement recompute on the same frame the browser was already
// scrolling. One frame, one measurement: the rect is read inside the rAF,
// which is also the only place it is worth reading.
let repositionFrame = 0

function onReposition() {
  if (!isOpen.value || repositionFrame) return
  repositionFrame = requestAnimationFrame(() => {
    repositionFrame = 0
    reposition()
  })
}

function cancelReposition() {
  if (!repositionFrame) return
  cancelAnimationFrame(repositionFrame)
  repositionFrame = 0
}

function reposition() {
  if (!isOpen.value) return
  const anchor = rootRef.value?.getBoundingClientRect()
  // The trigger has scrolled out of the viewport. Repositioning would pin the
  // panel to an edge and leave it hovering over unrelated content, so it is
  // dismissed instead. Focus is left alone: the user is somewhere else.
  if (anchor && !isAnchorInViewport(anchor, viewport())) {
    close({ restoreFocus: false })
    return
  }
  position()
}

// A panel anchored to a shell topbar survives a client-side navigation, which
// means yesterday's notifications sit on top of today's page. popstate covers
// back and forward, hashchange covers hash routers, and the Navigation API,
// where the browser has it, covers the pushState calls a router makes that
// fire no event of their own.
function onNavigate() {
  if (props.closeOnNavigate) close({ restoreFocus: false })
}

interface INavigationLike {
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

function navigationApi(): INavigationLike | undefined {
  return (window as unknown as { navigation?: INavigationLike }).navigation
}

function bind() {
  document.addEventListener('mousedown', onPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
  window.addEventListener('resize', onReposition)
  window.addEventListener('scroll', onReposition, true)
  window.addEventListener('popstate', onNavigate)
  window.addEventListener('hashchange', onNavigate)
  navigationApi()?.addEventListener('navigate', onNavigate)
}

function unbind() {
  cancelReposition()
  document.removeEventListener('mousedown', onPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
  window.removeEventListener('resize', onReposition)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('popstate', onNavigate)
  window.removeEventListener('hashchange', onNavigate)
  navigationApi()?.removeEventListener('navigate', onNavigate)
}

// This instance's entry in the module-level set of open panels. Identity
// matters (it is what the set is keyed by) so it is created once.
const dismissForAnother = () => close({ restoreFocus: false })

watch(isOpen, (value) => {
  if (value) {
    // Second bell opening dismisses the first. Focus is not moved: the user
    // is on the trigger they just pressed, and dragging them to the other
    // bell would be the very theft this component refuses elsewhere.
    for (const dismiss of [...openPanels]) {
      if (dismiss !== dismissForAnother) dismiss()
    }
    openPanels.add(dismissForAnother)
    bind()
    nextTick(() => {
      position()
      // Also settles whether the list itself needs to be a tab stop, which is
      // the case when every row in it is inert.
      syncRoving(0)
      // Focus lands on the first row you can act on, so a keyboard user is
      // already in the list. With nothing pressable, it lands on the panel,
      // and the reader announces the dialog title and then whatever is in it:
      // the empty state, the failure, or a feed of rows that are text.
      if (!focusRow(0)) panelRef.value?.focus()
    })
  } else {
    openPanels.delete(dismissForAnother)
    unbind()
    activeIndex.value = 0
  }
})

// A row can disappear underneath the roving index when the host refetches,
// and the panel can swap the whole list out for placeholders and back again
// while it stays open. Both change what is focusable inside it, so both
// re-run the roving index and the list's own tab stop.
watch(
  () => [props.items.length, panelState.value],
  () => {
    if (isOpen.value) nextTick(() => syncRoving(activeIndex.value))
  },
)

onBeforeUnmount(() => {
  unbind()
  openPanels.delete(dismissForAnother)
  // The panel is teleported, so its node is not a child of anything this
  // component owns. Vue removes it when the leave transition ends; a
  // component unmounted mid-leave has nothing left to run that removal, and
  // in an environment with no transition events at all (jsdom, and a browser
  // tab that never fires transitionend because the panel was display:none)
  // the node would be stranded in <body>. Cheap to be sure.
  const node = panelRef.value
  if (node?.isConnected) node.remove()
})

defineExpose({ show, close, toggle, isOpen, unreadCount })
</script>

<style lang="scss">
.nb-notification-center {
  position: relative;
  display: inline-flex;
}

.nb-notification-center__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  background: none;
  color: var(--nb-c-text-muted);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--nb-c-layer-hover-1);
    color: var(--nb-c-text);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &--active {
    background: var(--nb-c-layer-hover-1);
    color: var(--nb-c-text);
  }
}

.nb-notification-center__badge {
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 15px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--nb-c-danger);
  color: var(--nb-c-danger-a11y);
  font-size: var(--nb-font-size-9);
  font-weight: var(--nb-font-weight-bold);
  line-height: 15px;
  text-align: center;
}

.nb-notification-center__panel {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--nb-c-layer-3);
  border: 1px solid var(--nb-c-layer-border-3);
  // The library's panel elevation, byte for byte what NbUserMenu uses, but
  // behind an override so a dark or a high-contrast theme can replace it
  // without a :deep() from outside. There is no shadow token in
  // src/styles/_tokens.scss to point at yet; when there is, this default
  // becomes a var() and nothing else changes.
  box-shadow: var(
    --nb-notification-center-shadow,
    0 12px 32px rgba(0, 0, 0, 0.18)
  );
  z-index: var(--nb-zindex-menu);
  max-width: calc(100vw - 16px);
  outline: none;
}

// The panel is teleported to <body>, so it only inherits the theme when the
// class sits above it, which is where the library's own consumers put it
// (html or body). Setting --nb-notification-center-shadow anywhere that
// reaches <body> overrides this without a :deep() from outside.
.dark .nb-notification-center__panel {
  --nb-notification-center-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.nb-notification-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nb-spacing-8);
  padding: var(--nb-spacing-10) var(--nb-spacing-12);
  border-bottom: 1px solid var(--nb-c-layer-border-3);
}

.nb-notification-center__title {
  margin: 0;
  font-size: var(--nb-font-size-13);
  font-weight: var(--nb-font-weight-semibold);
  color: var(--nb-c-text);
}

.nb-notification-center__mark-all {
  display: inline-flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  border: 0;
  background: none;
  padding: 2px 4px;
  font-family: inherit;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-primary);
  cursor: pointer;

  &:hover:not(:disabled):not([aria-disabled='true']) {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }

  &:disabled,
  &[aria-disabled='true'] {
    color: var(--nb-c-text-subtle);
    cursor: default;
    text-decoration: none;
  }
}

.nb-notification-center__list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.nb-notification-center__empty,
.nb-notification-center__error {
  padding: var(--nb-spacing-16) var(--nb-spacing-12);
}

// The stale strip sits above rows that are still worth reading, so it is a
// note and not an alarm: a tinted band, not a full-width danger block.
.nb-notification-center__stale {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  padding: var(--nb-spacing-4) var(--nb-spacing-12);
  background: color-mix(in srgb, var(--nb-c-warning) 12%, transparent);
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-12);
  border-bottom: 1px solid var(--nb-c-layer-border-3);
}

.nb-notification-center__stale-text {
  flex: 1 1 auto;
  min-width: 0;
}

.nb-notification-center__retry {
  flex: 0 0 auto;
  border: 0;
  background: none;
  padding: 2px 4px;
  font-family: inherit;
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 1px;
  }
}

.nb-notification-center__loading {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-12);
  padding: var(--nb-spacing-12);
}

.nb-notification-center__footer {
  padding: var(--nb-spacing-8) var(--nb-spacing-12);
  border-top: 1px solid var(--nb-c-layer-border-3);
}

.nb-notification-center__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.nb-notification-center-pop-enter-active,
.nb-notification-center-pop-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.nb-notification-center-pop-enter-from,
.nb-notification-center-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.nb-notification-center__panel--above {
  &.nb-notification-center-pop-enter-from,
  &.nb-notification-center-pop-leave-to {
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-notification-center-pop-enter-active,
  .nb-notification-center-pop-leave-active {
    transition: none;
  }
}

/* Windows high contrast throws every background and every shadow away and
   repaints text, borders and outlines from the user's own palette. Three
   things in this panel were carried by colour alone and would have gone with
   it: the panel's edge (a shadow over a layer token), the unread badge (a
   filled danger swatch with no border) and the trigger's open state (a
   background tint). Each gets a border here, which is the one property the
   mode keeps. `system-color` values, not our tokens: the whole point of the
   mode is that the user's choices win. */
@media (forced-colors: active) {
  .nb-notification-center__panel {
    border: 1px solid CanvasText;
    box-shadow: none;
  }

  .nb-notification-center__badge {
    border: 1px solid CanvasText;
    /* The fill is forced to Canvas, so the digits need the text colour to
       stay on it rather than the fixed white they carry in both themes. */
    color: CanvasText;
    forced-color-adjust: none;
    background: Canvas;
  }

  .nb-notification-center__trigger--active {
    border-color: Highlight;
  }

  .nb-notification-center__header,
  .nb-notification-center__footer,
  .nb-notification-center__stale {
    border-color: CanvasText;
  }
}
</style>
