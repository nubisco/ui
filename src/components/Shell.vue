<template>
  <div
    class="nb-shell"
    v-bind="layerProps"
    :class="[
      { 'nb-shell--no-sidebar': !showSidebar },
      showSidebar ? `nb-shell--sidebar-${sidebarVariant}` : null,
      {
        'nb-shell--collapsed': collapsed,
        'nb-shell--drawer-open': collapsed && drawerOpen,
      },
    ]"
    @keydown.esc="onFrameEscape"
  >
    <!-- ═══ SKIP LINK ═══
         First focusable element in the frame, visually hidden until focused.
         The shell owns it because the shell is the only thing that knows where
         `<main>` is; every application that hand-rolled one had to invent an id
         for a region it does not render. -->
    <a
      v-if="skipToContent"
      class="nb-shell__skip-link"
      :href="`#${resolvedMainId}`"
      @click="onSkipToContent"
      >{{ skipToContentLabel }}</a
    >

    <!-- ═══ OUTER LAYOUT: vertical stack ═══
         outer-menu spans the FULL width (above sidebar + body + inspector).
         Use for app-level menu bars that need to span everything. -->
    <div
      v-if="showRegion('outer-menu')"
      :ref="regionRef('outer-menu')"
      class="nb-shell__outer-menu"
      :class="regionClass('outer-menu')"
    >
      <slot name="outer-menu" />
    </div>

    <!-- ═══ MIDDLE LAYER: sidebar | (inner-menu + content + inspector) ═══ -->
    <div class="nb-shell__middle">
      <!-- ═══ SIDEBAR (auto-hidden when no slots used) ═══ -->
      <!-- ═══ SIDEBAR ═══
           A permanent column above `collapseAt`, an overlay drawer below it.
           Same element and same slots either way: a product does not get a
           second navigation tree to keep in step, and the drawer is `inert`
           while closed so its links are not a hidden tab stop. -->
      <nav
        v-if="showSidebar"
        :id="sidebarId"
        ref="sidebarRef"
        class="nb-shell__sidebar"
        :aria-label="sidebarLabel"
        :tabindex="collapsed ? -1 : undefined"
        :inert="sidebarHidden || undefined"
        :aria-hidden="sidebarHidden || undefined"
      >
        <div class="nb-shell__sidebar-logo">
          <slot name="sidebar-logo" />
        </div>
        <div class="nb-shell__sidebar-nav">
          <slot name="sidebar-nav" />
        </div>
        <div class="nb-shell__sidebar-spacer" />
        <div class="nb-shell__sidebar-bottom">
          <slot name="sidebar-bottom" />
        </div>
      </nav>

      <!-- The dimmer behind an open drawer. A plain div, not a button: it is
           decoration with a shortcut attached, and the drawer is already
           dismissible from the keyboard with Escape and from the toggle
           button, both of which are real controls. -->
      <div
        v-if="showSidebar && collapsed && drawerOpen"
        class="nb-shell__scrim"
        @click="setDrawerOpen(false)"
      />

      <!-- ═══ RIGHT AREA: inner-menu + body + inspector side by side ═══ -->
      <div class="nb-shell__right">
        <!-- inner-menu spans body + inspector (but not sidebar) -->
        <div
          v-if="showRegion('inner-menu')"
          :ref="regionRef('inner-menu')"
          class="nb-shell__inner-menu"
          :class="regionClass('inner-menu')"
        >
          <slot name="inner-menu" />
        </div>

        <!-- Content + Inspector row -->
        <div class="nb-shell__content-row">
          <!-- ═══ BODY (topbar + main + bottom) ═══ -->
          <div
            class="nb-shell__body"
            :inert="bodyInert || undefined"
            :aria-hidden="bodyInert || undefined"
          >
            <div
              v-if="showRegion('notification')"
              :ref="regionRef('notification')"
              class="nb-shell__notification"
              :class="regionClass('notification')"
            >
              <slot name="notification" />
            </div>

            <!-- Legacy menubar slot (inside body, does NOT span inspector) -->
            <div v-if="hasSlotContent('menubar')" class="nb-shell__menubar">
              <slot name="menubar" />
            </div>

            <div v-if="showTopbar" class="nb-shell__topbar">
              <!-- The drawer toggle lives in the topbar's flow rather than
                   floating over the page, so it cannot cover content and it
                   inherits the bar's own alignment. It is why `showTopbar`
                   forces the bar on while the drawer is collapsed: the frame
                   must not hide its only way back to the navigation. -->
              <button
                v-if="showNavToggle"
                ref="navToggleRef"
                type="button"
                class="nb-shell__nav-toggle"
                :aria-label="navToggleLabel"
                :aria-expanded="drawerOpen"
                :aria-controls="sidebarId"
                @click="setDrawerOpen(!drawerOpen)"
              >
                <span class="nb-shell__nav-toggle-glyph" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </button>
              <div
                :ref="regionRef('topbar-left')"
                class="nb-shell__topbar-left"
              >
                <slot name="topbar-left" />
              </div>
              <div
                :ref="regionRef('topbar-right')"
                class="nb-shell__topbar-right"
              >
                <slot name="topbar-right" />
              </div>
            </div>

            <div
              v-if="showRegion('fixedbar')"
              :ref="regionRef('fixedbar')"
              class="nb-shell__fixedbar"
            >
              <slot name="fixedbar" />
            </div>

            <main
              :id="resolvedMainId"
              ref="mainRef"
              tabindex="-1"
              class="nb-shell__main"
              :class="{ 'nb-shell__main--no-padding': !mainPadding }"
              v-bind="mainLayerProps"
            >
              <SurfaceLayerScope :level="1">
                <slot />
              </SurfaceLayerScope>
            </main>

            <!-- ═══ BOTTOM PANEL (optional) ═══ -->
            <div
              v-if="showRegion('bottom')"
              :ref="regionRef('bottom')"
              class="nb-shell__bottom"
            >
              <slot name="bottom" />
            </div>
          </div>

          <!-- ═══ INSPECTOR (optional column) ═══ -->
          <aside
            ref="inspectorRef"
            class="nb-shell__inspector"
            :aria-label="inspectorLabel"
            :inert="!inspectorOpen || undefined"
            :aria-hidden="!inspectorOpen || undefined"
            :class="{
              'nb-shell__inspector--visible': inspectorOpen,
              'nb-shell__inspector--expanded':
                inspectorOpen && inspectorExpanded,
              [`nb-shell__inspector--${inspectorSize}`]: inspectorOpen,
              'nb-shell__inspector--resizing': isResizing,
              'nb-shell__inspector--overlay': inspectorOverlay,
            }"
            :style="inspectorStyle"
          >
            <!-- The sheet's own way out. Rendered only while the inspector is
                 an overlay, because that is the only state where the frame has
                 covered every control the product might have used to close it.
                 First child, so it is also the first thing Tab reaches inside
                 the sheet. -->
            <button
              v-if="inspectorOverlay"
              ref="inspectorDismissRef"
              type="button"
              class="nb-shell__inspector-dismiss"
              :aria-label="inspectorCloseLabel"
              @click="setInspectorVisible(false)"
            >
              <span class="nb-shell__inspector-dismiss-glyph" aria-hidden="true"
                >&times;</span
              >
            </button>
            <div
              v-if="resizable && inspectorOpen && !collapsed"
              class="nb-shell__inspector-resize"
              role="separator"
              tabindex="0"
              aria-orientation="vertical"
              :aria-label="`Resize ${inspectorLabel}`"
              :aria-valuenow="ariaWidthNow"
              :aria-valuemin="RESIZE_FLOOR_PX"
              :aria-valuemax="ariaWidthMax"
              title="Drag or use the arrow keys to resize, Enter or double-click to reset"
              @pointerdown="onResizeStart"
              @dblclick="onResizeReset"
              @keydown="onResizeKeydown"
            />
            <slot name="inspector" />
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  useId,
  useSlots,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { hasSlotContent as slotHasContent } from '@/utils/slotContent.helper'
import { IShellProps, TInspectorSize } from './Shell.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import {
  createShellSlotRegistry,
  NB_SHELL_SLOT_KEY,
  type TShellSlotName,
} from '@/composables/useShellSlot.composable'
import SurfaceLayerScope from './SurfaceLayerScope.vue'

const slots = useSlots()

/** Check if a named slot has renderable content */
function hasSlotContent(name: string): boolean {
  return slotHasContent(slots, name)
}

// ── Slot contributions (useShellSlot) ─────────────────────────────────────────
//
// Eight of our applications teleported view-level controls into this component
// through a DOM id they invented themselves. The registry below is the
// supported replacement: a view calls `useShellSlot('topbar-right')` and the
// shell hands it the live host element, counts it as content, and arbitrates
// when two views hold the same region during a route transition.
const {
  registry,
  count: slotCount,
  sharedCount: slotSharedCount,
  setElement,
} = createShellSlotRegistry()

provide(NB_SHELL_SLOT_KEY, registry)

// Cached per region so the function ref keeps a stable identity across
// renders. An inline arrow would be a new ref every patch, and Vue would set
// the host to null and back on each one, tearing the teleported controls down
// and rebuilding them (losing focus and any local state) on every render.
const regionRefs = new Map<
  TShellSlotName,
  (el: Element | ComponentPublicInstance | null) => void
>()

function regionRef(name: TShellSlotName) {
  let fn = regionRefs.get(name)
  if (!fn) {
    fn = (el) => setElement(name, (el as HTMLElement | null) ?? null)
    regionRefs.set(name, fn)
  }
  return fn
}

/**
 * A region renders when its slot has content OR a view has contributed to it.
 * The second half is what lets a region appear on demand: the shell renders
 * before its slot children exist, the contribution registers during that
 * child's setup, and this recomputes.
 */
function showRegion(name: TShellSlotName): boolean {
  return hasSlotContent(name) || slotCount(name) > 0
}

/**
 * Three of the eight contributable regions (`outer-menu`, `inner-menu`,
 * `notification`) are block containers by design: what goes in them is the
 * product's own markup and we do not get to lay it out. But CSS `order`, which
 * is what sorts `claim: 'all'` contributions, only exists for flex and grid
 * children, so in those three the documented ordering was silently doing
 * nothing.
 *
 * This class turns exactly those regions into a column flex container, and only
 * while a shared contribution is actually registered. A product that has never
 * called `useShellSlot` therefore keeps the block layout it has always had,
 * byte for byte, and the layout switch is scoped to the new API that needs it.
 * Column, not row, because block stacking is what those regions already do:
 * `align-items: stretch` is the flex default, so children stay full width.
 */
function regionClass(name: TShellSlotName): string | null {
  return slotSharedCount(name) > 0 ? 'nb-shell__region--ordered' : null
}

/** Check if any sidebar slot has renderable content */
const showSidebar = computed(() => {
  for (const name of ['sidebar-logo', 'sidebar-nav', 'sidebar-bottom']) {
    if (hasSlotContent(name)) return true
  }
  return false
})

const props = withDefaults(defineProps<IShellProps>(), {
  inspectorVisible: false,
  inspectorExpanded: false,
  inspectorSize: 'md',
  resizable: false,
  mainPadding: true,
  sidebarVariant: 'compact',
  topbar: 'auto',
  collapseAt: 'md',
  navToggleLabel: 'Navigation',
  inspectorCloseLabel: 'Close inspector',
  skipToContent: true,
  skipToContentLabel: 'Skip to content',
  sidebarLabel: 'Primary',
  inspectorLabel: 'Inspector',
})

const emit = defineEmits<{
  'update:inspectorWidth': [width: number | null]
  'update:sidebarOpen': [open: boolean]
  'update:inspectorVisible': [visible: boolean]
}>()

// ── Responsive frame ──────────────────────────────────────────────────────────
//
// The frame is `height: 100dvh; overflow: hidden`, which means a column that
// does not fit has nowhere to go: a 240px verbose rail next to a 288px
// inspector leaves a negative body width on a phone, and the page cannot be
// scrolled out from under them. The same arithmetic bites on a laptop at 200%
// browser zoom, because zoom shrinks the viewport in CSS pixels, which is
// exactly the reflow case WCAG 1.4.10 is about.
//
// Below `collapseAt` the sidebar becomes an overlay drawer and the inspector a
// full-width overlay, so the body always keeps the whole width.
//
// The decision is made here, in script, and published as a class, rather than
// in a media query. A media query would put the breakpoint in two places: CSS
// would move the sidebar while `inert`, `aria-expanded` and the toggle button
// (all of which only script can set) stayed on the desktop story. One source
// of truth, and `window.innerWidth` is in CSS pixels, so it tracks zoom the
// same way a media query does.
//
// The pixel values are the library's own scale from
// styles/variables/_breakpoints.scss. They are duplicated here rather than read
// back out of a custom property because `getComputedStyle` on the frame would
// make first paint depend on the stylesheet having loaded.
const COLLAPSE_PX: Record<string, number> = { md: 672, lg: 1056 }

// `window.innerWidth` is not reactive, so reading it inside a computed pins the
// value to whatever the viewport was on the render that happened to evaluate
// it: a width persisted on a wide monitor survived into a narrow window and
// squeezed the body toward zero. This ref is the reactive mirror.
//
// It is not written on every resize event, though. This component is the frame
// every product mounts once at the root, so a ref it writes 60 times a second
// during a window drag re-runs the whole application's render function 60
// times a second. Only two things read the width, and they want very different
// update rates:
//
//   - the collapse threshold, a boolean, which changes twice per drag at most.
//     It is latched: the ref is written only on a render where the answer
//     actually flips.
//   - the resize handle's `aria-valuenow` / `aria-valuemax`, which need the
//     real number, but only exist while `resizable` is on. That listener is
//     attached only then, and coalesced to one write per animation frame.
//
// The result is zero renders on a drag for the majority of consumers (nobody
// passes `resizable`), and one render per frame instead of one per event for
// the rest.
const viewportWidth = ref(
  typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY,
)

/** True when `w` is on the collapsed side of the current `collapseAt`. */
function isBelowThreshold(w: number): boolean {
  const px = COLLAPSE_PX[props.collapseAt]
  return px != null && w < px
}

let resizeRaf = 0

/**
 * Always attached, but it writes the ref only when the collapse answer flips.
 * Comparing booleans rather than pixels is what makes a 1200px-to-900px drag
 * cost nothing: same side of 672, no write, no render.
 */
function onThresholdResize() {
  const w = window.innerWidth
  if (isBelowThreshold(w) !== isBelowThreshold(viewportWidth.value)) {
    viewportWidth.value = w
  }
}

/**
 * Attached only while `resizable`, because it is the only feature that needs
 * the width as a number. Coalesced through `requestAnimationFrame` so a drag
 * costs one render per painted frame rather than one per event.
 */
function onWidthResize() {
  if (resizeRaf) return
  resizeRaf = window.requestAnimationFrame(() => {
    resizeRaf = 0
    viewportWidth.value = window.innerWidth
  })
}

function stopWidthTracking() {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', onWidthResize)
  if (resizeRaf) {
    window.cancelAnimationFrame(resizeRaf)
    resizeRaf = 0
  }
}

function startWidthTracking() {
  if (typeof window === 'undefined') return
  viewportWidth.value = window.innerWidth
  window.addEventListener('resize', onWidthResize, { passive: true })
}

/** True when the frame is running its single-column, overlay layout. */
const collapsed = computed(() => isBelowThreshold(viewportWidth.value))

// Which props the consumer actually passed, read off the vnode once at setup.
// `props.x === undefined` cannot answer this: Vue casts an absent boolean prop
// to `false`, so a shell that was never told about `sidebar-open` looks
// exactly like one that was told `false`, and the difference is precisely what
// decides who owns the state.
const passedProps = (getCurrentInstance()?.vnode.props ?? {}) as Record<
  string,
  unknown
>

/** True when the key is on the vnode at all, whatever its value. */
function hasKey(camel: string, kebab: string): boolean {
  return camel in passedProps || kebab in passedProps
}

function passedValue(camel: string, kebab: string): unknown {
  if (camel in passedProps) return passedProps[camel]
  if (kebab in passedProps) return passedProps[kebab]
  return undefined
}

/**
 * Controlled means "the key is present AND it carries a value". The second
 * half exists because `<NbShell :sidebar-open="isMobile ? open : undefined">`
 * puts the key on the vnode while binding nothing: reading presence alone, the
 * shell declared itself controlled by `undefined`, `drawerOpen` was pinned to
 * false forever and the toggle did nothing. Treating that as uncontrolled is
 * the reading that makes the conditional binding behave the way it reads.
 *
 * The decision is still made once, at setup, because a piece of state that
 * changes owner mid-life is worse than either owner. Where the key is present
 * but was undefined at setup, `mirrorWhenUncontrolled` below keeps the shell's
 * own copy in step with the value once it appears, so the binding is not
 * merely ignored.
 */
function wasPassed(camel: string, kebab: string): boolean {
  return hasKey(camel, kebab) && passedValue(camel, kebab) !== undefined
}

// The drawer is controlled or uncontrolled, decided once: if the consumer
// passed `sidebar-open` at all, they own it and we only ever emit. If they did
// not, the shell keeps the state, which is what makes `<NbShell>` with nothing
// but slots survive a phone with no application changes at all.
const sidebarOpenControlled = wasPassed('sidebarOpen', 'sidebar-open')
const internalSidebarOpen = ref(false)

// The conditional-binding case: the key was there, the value was not. The
// shell owns the state, but it follows the prop whenever the application does
// supply one, so `:sidebar-open="isMobile ? open : undefined"` still opens the
// drawer from the application side instead of being quietly dropped.
if (hasKey('sidebarOpen', 'sidebar-open') && !sidebarOpenControlled) {
  watch(
    () => props.sidebarOpen,
    (v) => {
      internalSidebarOpen.value = v === true
    },
  )
}
const drawerOpen = computed(() =>
  sidebarOpenControlled
    ? props.sidebarOpen === true
    : internalSidebarOpen.value,
)

const sidebarUid = useId()
const sidebarId = computed(() => `nb-shell-sidebar-${sidebarUid}`)
const navToggleRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)

/** The toggle exists only where the sidebar is not permanently on screen. */
const showNavToggle = computed(() => showSidebar.value && collapsed.value)

/**
 * A closed drawer is `inert`, not just off-screen. A translated-away nav is
 * still in the tab order and still read in a landmark list, so a keyboard user
 * would tab into links they cannot see, which is the failure mode a hidden
 * drawer is famous for.
 */
const sidebarHidden = computed(
  () => showSidebar.value && collapsed.value && !drawerOpen.value,
)

function setDrawerOpen(open: boolean) {
  if (!sidebarOpenControlled) internalSidebarOpen.value = open
  emit('update:sidebarOpen', open)
}

function onFrameEscape() {
  // Escape closes whichever overlay the frame is currently holding, topmost
  // first (the drawer sits above the inspector sheet). When it holds neither,
  // the event keeps travelling, so a dialog or a menu inside the page still
  // gets its own Escape.
  if (showSidebar.value && collapsed.value && drawerOpen.value) {
    setDrawerOpen(false)
    return
  }
  if (inspectorOverlay.value) setInspectorVisible(false)
}

// Focus follows the drawer, in both directions: into it when it opens (so the
// next Tab is a navigation link rather than the page behind the scrim), back to
// the toggle when it closes (so focus is never left on a removed element).
watch(drawerOpen, async (open) => {
  if (!collapsed.value) return
  await nextTick()
  if (open) {
    const first = sidebarRef.value?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    // The rail itself takes `tabindex="-1"` while collapsed, so a drawer with
    // no focusable child (a product whose navigation is all custom elements)
    // still gets focus somewhere inside it rather than leaving it on the
    // toggle behind the scrim.
    ;(first ?? sidebarRef.value)?.focus?.()
  } else {
    navToggleRef.value?.focus?.()
  }
})

// Growing past the breakpoint turns the drawer back into a column. Leaving the
// open flag set would then mean the next narrowing reopens it unasked, and in
// the controlled case the application's own state would be lying.
watch(collapsed, (isCollapsed) => {
  if (!isCollapsed && drawerOpen.value) setDrawerOpen(false)
})

// ── Inspector visibility, and the way out of it ───────────────────────────────
//
// Below `collapseAt` the inspector stops being a column and becomes a sheet
// over the content row. The content row holds the body, and the body holds the
// topbar, so the sheet covers the topbar too, including the drawer toggle. A
// product whose only close button lives in `topbar-right` therefore had no way
// out of the inspector on a phone, and nothing behind the sheet was inert, so
// a keyboard user could tab into a page they could not see. Three things fix
// it: the sheet carries its own dismiss control, Escape closes it, and the
// body is inert for as long as it is covered.
//
// `inspectorVisible` is now controlled-or-uncontrolled like the other two
// pieces of shell state, and `update:inspectorVisible` is emitted whenever the
// shell closes it, so `v-model:inspector-visible` is all an application needs.
const inspectorVisibleControlled = wasPassed(
  'inspectorVisible',
  'inspector-visible',
)
const internalInspectorVisible = ref(props.inspectorVisible === true)
if (
  hasKey('inspectorVisible', 'inspector-visible') &&
  !inspectorVisibleControlled
) {
  watch(
    () => props.inspectorVisible,
    (v) => {
      internalInspectorVisible.value = v === true
    },
  )
}

// The escape hatch of last resort. A shell told `:inspector-visible="true"`
// with no listener for the update cannot ask anyone to close the sheet, and
// refusing to close it would leave the trap in place. So the shell keeps a
// local override that only ever applies while the inspector is an overlay, and
// clears itself the moment the application says "visible" again or the frame
// stops collapsing. Nothing about the desktop column changes.
const overlayDismissed = ref(false)

const inspectorOpen = computed(() => {
  const wanted = inspectorVisibleControlled
    ? props.inspectorVisible === true
    : internalInspectorVisible.value
  if (!wanted) return false
  return !(collapsed.value && overlayDismissed.value)
})

/** True while the inspector is a sheet over the content rather than a column. */
const inspectorOverlay = computed(() => collapsed.value && inspectorOpen.value)

function setInspectorVisible(visible: boolean) {
  if (inspectorVisibleControlled) {
    overlayDismissed.value = !visible
  } else {
    internalInspectorVisible.value = visible
    overlayDismissed.value = false
  }
  emit('update:inspectorVisible', visible)
}

watch(
  () => props.inspectorVisible,
  (v) => {
    if (v) overlayDismissed.value = false
  },
)
watch(collapsed, (isCollapsed) => {
  if (!isCollapsed) overlayDismissed.value = false
})

// Focus follows the sheet the same way it follows the drawer: into the dismiss
// control when the sheet opens (the body behind it is inert, so leaving focus
// there would strand it), back to whatever opened it when it closes.
const inspectorDismissRef = ref<HTMLElement | null>(null)
const inspectorReturnFocus = ref<HTMLElement | null>(null)

watch(inspectorOverlay, async (isOverlay) => {
  if (isOverlay) {
    inspectorReturnFocus.value =
      (document.activeElement as HTMLElement | null) ?? null
    await nextTick()
    inspectorDismissRef.value?.focus?.()
  } else {
    const back = inspectorReturnFocus.value
    inspectorReturnFocus.value = null
    // Only if it is still on the page: a route change can take the opener with
    // it, and focusing a detached node sends focus to <body>.
    if (back?.isConnected) {
      await nextTick()
      back.focus?.()
    }
  }
})

/**
 * The body is inert while the sheet covers it. That is what stops Tab from
 * walking into the page underneath, and it is also why the sheet must carry
 * its own dismiss control: the drawer toggle is inside the body.
 */
const bodyInert = computed(() => inspectorOverlay.value)

// ── Skip link ─────────────────────────────────────────────────────────────────
//
// The main region carries an id so the link has something to point at, and
// `tabindex="-1"` so following the link actually moves focus rather than only
// scrolling. The id is per-instance by default: two shells on one page (a
// preview inside a documentation page, for one) must not both answer to the
// same anchor.
const mainRef = ref<HTMLElement | null>(null)
const shellUid = useId()
const resolvedMainId = computed(
  () => props.mainId || `nb-shell-main-${shellUid}`,
)

// The href alone scrolls and moves focus in every browser we support, but only
// because of the `tabindex`. Calling focus() as well is what makes it work when
// the application intercepts in-page anchors (a router with a scroll
// behaviour), which several of ours do.
function onSkipToContent() {
  mainRef.value?.focus()
}

// ── Topbar presence ───────────────────────────────────────────────────────────
//
// The topbar used to render unconditionally. Its two child divs are always
// present, so the `:empty` rules further down could never match it, and four
// applications ended up hiding an empty bar from the outside (one with the only
// `:deep()` in its codebase, one racing the specificity of a built stylesheet).
// The check belongs here, on the slots, which is the only place that knows
// whether there is anything to show.
const showTopbar = computed(() => {
  // The drawer toggle lives in the topbar, so at collapsed widths the bar is
  // the only route back to the navigation and cannot be optional. This is
  // ahead of the `never` check on purpose: a frame with no way to reach its
  // own menu is worse than a frame with one strip the route did not ask for.
  if (showNavToggle.value) return true
  if (props.topbar === 'always') return true
  if (props.topbar === 'never') return false
  return (
    hasSlotContent('topbar-left') ||
    hasSlotContent('topbar-right') ||
    slotCount('topbar-left') > 0 ||
    slotCount('topbar-right') > 0
  )
})

// A contribution into a region the frame is not rendering has nowhere to go:
// the host element never mounts, so `ready` stays false and the view's `Outlet`
// renders nothing, silently. That is the right runtime behaviour (a view must
// stay usable wherever it is mounted) but it is a confusing thing to debug, so
// say it out loud in development. Once per shell: a route transition can hold
// two contributors at a time and a warning per keystroke helps nobody.
let warnedSuppressed = false
if (import.meta.env?.DEV) {
  watch(
    () =>
      showTopbar.value
        ? 0
        : slotCount('topbar-left') + slotCount('topbar-right'),
    (contributions) => {
      if (contributions > 0 && !warnedSuppressed) {
        warnedSuppressed = true
        console.warn(
          '[NbShell] A view contributed to the topbar with useShellSlot(), but ' +
            'this shell renders no topbar (topbar="never"). The contribution ' +
            'is dropped. Use topbar="auto" on this shell, or contribute to a ' +
            'region it does render.',
        )
      }
    },
    { immediate: true },
  )
}

// The shell is the application frame, not a nested surface: at the top of a tree
// it resolves to layer 1, which is exactly what its chrome regions (topbar, body,
// menu strips) already painted from the `:root` default, so its own pixels are
// unchanged. What it adds is an origin for contextual depth, so a surface dropped
// into the shell body separates from it instead of matching it.
const { layerProps } = useSurfaceLayer()

// The main region is the page ground, so it paints layer 0 and the first
// surface a page puts in it lands on layer 1. Deriving it from the chrome
// instead made a top-level card layer 2, the darkest fill in the light ramp,
// on a near-white body: one level too deep everywhere, and the opposite of the
// mental model the layer docs describe (ground 0, panel 1, section 2).
//
// `provideContext: false` because this call must not become the shell's
// context: only the main slot counts from here, while the topbar, inspector
// and sidebar slots keep counting from the chrome. `SurfaceLayerScope` inside
// the element is what carries it to the slot. The probe is off for the same
// reason it is on Modal: the level is not up for negotiation.
const { layerProps: mainLayerProps } = useSurfaceLayer({
  level: 0,
  probe: false,
  provideContext: false,
})

// Provided so descendants of the `sidebar-*` slots (NbSidebarMenu,
// NbSidebarMenuItem, NbSidebarMenuGroup, NbSidebarBrand) can adapt their
// presentation to the active variant. Exposed as a reactive ref so switching
// at runtime "just works".
provide('nb-shell-sidebar-variant', toRef(props, 'sidebarVariant'))

// ── Resizable inspector ───────────────────────────────────────────────────────
// When `resizable`, a handle on the inspector's left edge drags its width,
// clamped between the size floor (xs = 288px) and half the viewport. The chosen
// width is emitted via `v-model:inspector-width` so the consumer can persist it;
// double-clicking the handle resets to the size default (emits null).
const inspectorRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)

// The inspector column is always in the DOM (it animates from zero width), so
// its host is registered once on mount rather than through a function ref.
onMounted(() => setElement('inspector', inspectorRef.value))
watch(inspectorRef, (el) => setElement('inspector', el))
const RESIZE_FLOOR_PX = 288 // xs inspector width (base-unit * 36)

/**
 * Widths the size presets resolve to, so the component can reason about the
 * width it is about to render without measuring the DOM. `lg` and `xl` are
 * viewport fractions, matching the CSS.
 */
const SIZE_FRACTION: Partial<Record<TInspectorSize, number>> = {
  lg: 0.5,
  xl: 0.75,
}
const SIZE_PX: Partial<Record<TInspectorSize, number>> = {
  xs: 288,
  sm: 360,
  md: 560,
}

// Off-document (server render, a test that never touched the window) there is
// no viewport to measure. Falling back to a plain desktop width keeps every
// derived number finite: an `aria-valuenow` of `Infinity` is worse than one
// that is briefly a guess and corrects itself on the first client resize.
const effectiveViewport = computed(() =>
  Number.isFinite(viewportWidth.value) ? viewportWidth.value : 1280,
)

/** Half the viewport, floored at the minimum so the clamp can never invert. */
const maxInspectorWidth = computed(() =>
  Math.max(RESIZE_FLOOR_PX, effectiveViewport.value * 0.5),
)

function clampWidth(px: number): number {
  return Math.round(
    Math.max(RESIZE_FLOOR_PX, Math.min(px, maxInspectorWidth.value)),
  )
}

// Controlled or uncontrolled, decided once at setup by whether the prop was
// passed at all. Before this, `resizable` without `v-model:inspector-width`
// rendered a focusable handle that emitted into the void: the style binding
// below read the prop, the prop never changed, and nothing moved. Now the
// shell keeps the width when nobody else claims it, and still emits either
// way so an application can persist without having to own the state.
const widthControlled = wasPassed('inspectorWidth', 'inspector-width')
const internalWidth = ref<number | null>(null)

/** The chosen width, wherever it is stored. `null` means "use the preset". */
const chosenWidth = computed<number | null>(() =>
  widthControlled ? (props.inspectorWidth ?? null) : internalWidth.value,
)

function setWidth(px: number | null) {
  if (!widthControlled) internalWidth.value = px
  emit('update:inspectorWidth', px)
}

const inspectorStyle = computed(() => {
  const chosen = chosenWidth.value
  if (!props.resizable || !inspectorOpen.value || chosen == null) {
    return undefined
  }
  return {
    '--nb-shell-inspector-width': `${clampWidth(chosen)}px`,
  }
})

/**
 * The width the inspector is actually rendering, chosen or preset. The handle
 * announces this: a focusable `separator` with no `aria-valuenow` is an ARIA
 * violation, and it was the shipped default, because the old computed returned
 * `undefined` for exactly the state every consumer starts in.
 */
const renderedInspectorWidth = computed(() => {
  const chosen = chosenWidth.value
  if (chosen != null) return clampWidth(chosen)
  if (props.inspectorExpanded) {
    return Math.round(effectiveViewport.value * 0.5)
  }
  const fraction = SIZE_FRACTION[props.inspectorSize]
  const preset =
    fraction != null
      ? effectiveViewport.value * fraction
      : (SIZE_PX[props.inspectorSize] ?? RESIZE_FLOOR_PX)
  // `xl` and `expanded` opt out of the CSS ceiling, so their announced width
  // must opt out of it too or the announcement contradicts the pixels.
  return Math.round(
    props.inspectorSize === 'xl'
      ? preset
      : Math.min(preset, maxInspectorWidth.value),
  )
})

/**
 * Upper bound announced by the handle, tracking the live viewport. Widened to
 * the rendered width for the two sizes that are deliberately past half the
 * window, so the announced range always contains the announced value.
 */
const ariaWidthMax = computed(() =>
  Math.round(Math.max(maxInspectorWidth.value, renderedInspectorWidth.value)),
)

const ariaWidthNow = computed(() => renderedInspectorWidth.value)

function currentWidth(): number {
  return renderedInspectorWidth.value
}

function onResizeMove(e: PointerEvent) {
  const el = inspectorRef.value
  if (!el) return
  const right = el.getBoundingClientRect().right
  setWidth(clampWidth(right - e.clientX))
}

function onResizeEnd() {
  isResizing.value = false
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
  window.removeEventListener('pointercancel', onResizeEnd)
}

function onResizeStart(e: PointerEvent) {
  if (!props.resizable) return
  e.preventDefault()
  isResizing.value = true
  // Pointer events rather than mouse events, so a pen or a touch drag on a
  // convertible resizes the inspector too. `pointercancel` matters here: a
  // touch drag that turns into a browser gesture never sends `pointerup`, and
  // the old mouse-only pair left the shell stuck in its resizing state.
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd)
  window.addEventListener('pointercancel', onResizeEnd)
}

function onResizeReset() {
  setWidth(null)
}

/**
 * The handle is a real control, not a mouse target. It is a `separator` with a
 * value, which is the role screen readers announce as a resizable splitter, and
 * it answers the keys that role implies:
 *
 * - Left / Right: 16px, or 64px with Shift. Left grows the inspector, because
 *   the handle is on its left edge and that is the direction it moves.
 * - Home / End: the floor (288px) / the ceiling, which is half the viewport but
 *   never less than the floor. Below 576px those two meet, and Home and End
 *   land on the same width, which is the honest answer: there is no room to
 *   resize into. Below `collapseAt` the handle is not rendered at all, because
 *   the inspector is an overlay there and its width is the window's.
 * - Enter or Space: reset to the `inspectorSize` default, the keyboard
 *   equivalent of double-clicking the handle.
 */
const KEY_STEP_PX = 16
const KEY_STEP_LARGE_PX = 64

function onResizeKeydown(e: KeyboardEvent) {
  if (!props.resizable) return
  const step = e.shiftKey ? KEY_STEP_LARGE_PX : KEY_STEP_PX
  let next: number | null
  switch (e.key) {
    case 'ArrowLeft':
      next = currentWidth() + step
      break
    case 'ArrowRight':
      next = currentWidth() - step
      break
    case 'Home':
      next = RESIZE_FLOOR_PX
      break
    case 'End':
      next = maxInspectorWidth.value
      break
    case 'Enter':
    case ' ':
      next = null
      break
    default:
      return
  }
  e.preventDefault()
  setWidth(next == null ? null : clampWidth(next))
}

onMounted(() => {
  if (typeof window === 'undefined') return
  viewportWidth.value = window.innerWidth
  window.addEventListener('resize', onThresholdResize, { passive: true })
  if (props.resizable) startWidthTracking()
})

// Changing `collapseAt` at runtime is rare but legal (a product that flips it
// for a print route). Re-reading the width here is what stops the latch from
// answering the old breakpoint forever: the last write may have been made
// against a threshold that no longer exists.
watch(
  () => props.collapseAt,
  () => {
    if (typeof window !== 'undefined') viewportWidth.value = window.innerWidth
  },
)

// The exact-width listener costs nothing when nobody reads the width, so it
// exists only while the resize handle does.
watch(
  () => props.resizable,
  (on) => (on ? startWidthTracking() : stopWidthTracking()),
)

onBeforeUnmount(() => {
  onResizeEnd()
  stopWidthTracking()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onThresholdResize)
  }
})

/**
 * The escape hatches. Sibling components in this library expose their host
 * element and the one or two actions a parent legitimately needs to drive from
 * the outside, and the frame is the component most likely to be driven: a
 * command palette that focuses the page, a keyboard shortcut that opens the
 * navigation, a route guard that closes the inspector before leaving.
 */
defineExpose({
  /** The `<main>` element, so a parent can scroll or measure the page ground. */
  mainEl: mainRef,
  /** The sidebar `<nav>`, or null when no sidebar slot has content. */
  sidebarEl: sidebarRef,
  /** The inspector `<aside>`. Always present; it animates from zero width. */
  inspectorEl: inspectorRef,
  /** Move focus to the main region, exactly as the skip link does. */
  focusMain: () => mainRef.value?.focus(),
  /** Open or close the navigation drawer. No-op above `collapseAt`. */
  setSidebarOpen: setDrawerOpen,
  /** Show or hide the inspector, and emit `update:inspectorVisible`. */
  setInspectorVisible,
})
</script>

<style scoped lang="scss">
// Shell-level CSS variables (--nb-shell-*) are declared at :root in
// styles/_theme.scss so consuming apps can override them on :root without
// fighting scoped-style specificity. Only layout rules live here.

.nb-shell {
  // ── Layout ────────────────────────────────────────────────────────────────

  display: flex;
  flex-direction: column;
  height: 100vh;
  // Mobile browsers subtract their own chrome from the dynamic viewport unit,
  // so the shell stops being taller than the screen on a phone. The 100vh line
  // above stays as the fallback for engines without dvh.
  height: 100dvh;
  overflow: hidden;
  background: var(--nb-shell-bg);
}

// ── Skip link ─────────────────────────────────────────────────────────────────
//
// Off-screen rather than `display: none`, because a hidden element is not
// focusable and a skip link that cannot be focused is not a skip link. It comes
// back into the top-left corner of the frame when it takes focus.
.nb-shell__skip-link {
  // Fixed, not absolute: the shell is the full viewport anyway, and making
  // `.nb-shell` a containing block would silently re-parent every absolutely
  // positioned element ten applications already have inside it.
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transform: translateY(-200%);
  padding: 0.5rem 0.875rem;
  background: var(--nb-shell-chrome-bg);
  color: var(--nb-shell-chrome-color);
  border: var(--nb-shell-chrome-border);
  border-radius: 2px;
  font-size: 0.875rem;
  text-decoration: none;
  transition: transform 0.12s ease;

  &:focus-visible,
  &:focus {
    transform: translateY(0);
    outline: 2px solid var(--nb-c-primary);
    outline-offset: 2px;
  }
}

// ── Outer menu (full width, above everything) ─────────────────────────────────

.nb-shell__outer-menu {
  flex-shrink: 0;
  border-bottom: var(--nb-shell-menu-border);
  background: var(--nb-shell-menu-bg);
  color: var(--nb-shell-menu-color);
  overflow: visible; // menus must expand
  z-index: 200;
}

// ── Middle layer (sidebar + right area) ───────────────────────────────────────

.nb-shell__middle {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  // The containing block for the navigation drawer and its scrim at collapsed
  // widths. Declared unconditionally: making an element a containing block
  // only under a media query is how absolutely positioned content inside a
  // product's own sidebar ends up jumping at one width and not another.
  position: relative;
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

.nb-shell__sidebar {
  width: var(--nb-shell-sidebar-width);
  flex-shrink: 0;
  background: var(--nb-shell-sidebar-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
  height: 100%;
  overflow: visible; // required so tooltips overflow the sidebar edge
  z-index: 100;
}

.nb-shell__sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.nb-shell__sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  // Tooltips and flyouts from items still need to escape the rail; that is
  // handled by teleporting them to <body>, not by overflow: visible here.
  scrollbar-width: thin;
}

.nb-shell__sidebar-spacer {
  // The nav now grows on its own (`flex: 1`); the spacer is no longer needed
  // but kept as a zero-size element so the layout DOM order is unchanged.
  flex: 0 0 0;
  width: 0;
  height: 0;
}

.nb-shell__sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 0 8px 0.5rem;
}

// ── Right area (inner-menu + content row) ─────────────────────────────────────

.nb-shell__right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Inner menu (spans body + inspector, but not sidebar) ──────────────────────

.nb-shell__inner-menu {
  flex-shrink: 0;
  border-bottom: var(--nb-shell-menu-border);
  background: var(--nb-shell-menu-bg);
  color: var(--nb-shell-menu-color);
  overflow: visible; // menus must expand
  z-index: 150;
}

// ── Content row (body + inspector side by side) ───────────────────────────────

.nb-shell__content-row {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
  // Containing block for the inspector when it becomes an overlay. Same
  // reasoning as `.nb-shell__middle` above.
  position: relative;
}

// ── Body ───────────────────────────────────────────────────────────────────────

.nb-shell__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--nb-shell-body-bg);
}

.nb-shell__notification {
  flex-shrink: 0;
}

// ── Ordered regions ───────────────────────────────────────────────────────────
//
// `outer-menu`, `inner-menu` and `notification` are block containers: what goes
// in them is the product's markup and its layout is the product's business. But
// a `claim: 'all'` contribution is sorted by a CSS `order`, and `order` only
// applies to flex and grid children, so in those three regions the documented
// ordering was doing nothing at all.
//
// The class is bound by the component and only while such a contribution is
// registered, so nothing changes for a product that fills those regions by hand
// and never calls useShellSlot(). Column direction with the default
// `align-items: stretch` reproduces block stacking (children stay full width),
// which is what those regions already looked like.
.nb-shell__region--ordered {
  display: flex;
  flex-direction: column;
}

.nb-shell__menubar {
  flex-shrink: 0;
  border-bottom: var(--nb-shell-menu-border);
  background: var(--nb-shell-menu-bg);
  color: var(--nb-shell-menu-color);
}

.nb-shell__topbar {
  flex-shrink: 0;
  height: var(--nb-shell-topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--nb-shell-chrome-padding-x);
  border-bottom: var(--nb-shell-topbar-border);
  background: var(--nb-shell-topbar-bg);
  color: var(--nb-shell-topbar-color);
  gap: 1rem;
}

.nb-shell__topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.nb-shell__topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.nb-shell__fixedbar {
  flex-shrink: 0;
  display: flex;
  padding: 0 var(--nb-shell-chrome-padding-x);
  border-bottom: var(--nb-shell-fixedbar-border);
  background: var(--nb-shell-fixedbar-bg);
  color: var(--nb-shell-fixedbar-color);
  gap: 1rem;
}

// Slot-presence detection runs on vnodes, so a component in the slot counts as
// content even on the renders where it outputs nothing: `<RouterView
// name="fixedbar" />` on a route with no fixedbar view emits the wrapper with
// nothing inside it. A zero-height bordered strip under the topbar reads as a
// doubled header rule (2px instead of 1px). Comments are ignored by `:empty`,
// so this catches exactly the "wrapper rendered, nothing in it" case and leaves
// wrappers holding real (even empty-looking) elements alone.
.nb-shell__outer-menu:empty,
.nb-shell__inner-menu:empty,
.nb-shell__menubar:empty,
.nb-shell__notification:empty,
.nb-shell__bottom:empty,
.nb-shell__fixedbar:empty {
  display: none;
}

// The topbar's own presence is decided in script, on the slots, because that is
// the only check that can be right. This rule is the same vnode-lies safety net
// the `:empty` block above provides for the other strips, expressed with
// `:has()` because the topbar always holds its two halves and can therefore
// never be `:empty` itself. Both halves must be genuinely empty in the DOM for
// it to fire, so a topbar holding anything at all is untouched. Removing the
// halves instead would have been simpler and would have broken every consumer
// that passes only `topbar-right`: without the `flex: 1` left half there is
// nothing to push the right half to the right edge.
// `:not(:has(> .nb-shell__nav-toggle))` because at collapsed widths the bar
// also carries the drawer toggle, and a bar holding the only route back to the
// navigation must never be hidden for looking empty.
.nb-shell__topbar:not(:has(> .nb-shell__nav-toggle)):has(
    > .nb-shell__topbar-left:empty
  ):has(> .nb-shell__topbar-right:empty) {
  display: none;
}

.nb-shell__main {
  flex: 1;
  // Reads layer 0 through the class the component binds here, so the page
  // ground is a shade below the chrome it sits under rather than the same fill.
  background: var(--nb-shell-main-bg);
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &--no-padding {
    padding: 0;
    overflow: hidden;
  }
}

// ── Bottom panel ──────────────────────────────────────────────────────────────

.nb-shell__bottom {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// When the bottom panel is maximized, collapse the main area so the panel
// fills the body below the topbar. `:has()` lets the parent react to the
// size class set on the child. Scoped to .nb-shell__bottom so that panels
// placed inside the main content area do not trigger this rule.
.nb-shell__body:has(> .nb-shell__bottom > .nb-bottom-panel.full),
.nb-shell__body:has(> .nb-shell__bottom > .nb-shell-panel.full) {
  .nb-shell__main {
    display: none;
  }
  .nb-shell__bottom {
    flex: 1 1 0;
  }
}

// ── Inspector ─────────────────────────────────────────────────────────────────

.nb-shell__inspector {
  width: 0;
  position: relative;
  flex-shrink: 0;
  background: var(--nb-shell-inspector-bg);
  border-left: 0 solid transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    width 0.2s ease,
    border-color 0.2s ease;

  &--visible {
    width: var(--nb-shell-inspector-width);
    // The viewport ceiling, in CSS, so it also applies to the fixed
    // `inspectorSize` presets that never pass through the resize path: a 560px
    // `md` inspector on a 900px-wide window would otherwise leave 340px of
    // body. Override the token (to `none`) if a product really wants the
    // inspector to be able to take the window.
    max-width: var(--nb-shell-inspector-max-width);
    border-left: var(--nb-shell-inspector-border);
  }

  &--xs {
    --nb-shell-inspector-width: calc(var(--nb-base-unit) * 36); // 288px
  }

  &--sm {
    --nb-shell-inspector-width: calc(var(--nb-base-unit) * 45); // 360px
  }

  &--md {
    --nb-shell-inspector-width: calc(var(--nb-base-unit) * 70); // 560px
  }

  &--lg {
    --nb-shell-inspector-width: 50vw;
  }

  &--xl {
    --nb-shell-inspector-width: 75vw;
    // Already viewport-relative and deliberately past half, so the ceiling
    // would only fight it.
    --nb-shell-inspector-max-width: none;
  }

  &--expanded {
    width: var(--nb-shell-inspector-expanded-width);
    // Same reasoning as `--xl`: the expanded width is the consumer saying how
    // much of the viewport this may take.
    --nb-shell-inspector-max-width: none;
  }

  // No width transition while dragging the handle, so the panel tracks the
  // cursor instead of lagging behind it.
  &--resizing {
    transition: none;
    user-select: none;
  }
}

// Resize handle on the inspector's left edge (rendered only when `resizable`).
// Drag to resize, double-click to reset to the size default. An 8px hit area
// with a grab-line that is faint at rest and brightens to the accent on hover,
.nb-shell__inspector-resize {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 5;

  // A grab-line that is always visible (accent-tinted so it reads on any
  // ground) and brightens + widens on hover / while dragging. The accent comes
  // from --nb-shell-inspector-resize-color, which defaults to the primary
  // colour: a white-label product retints the handle by setting a token, not
  // by naming our brand ramp in its own stylesheet.
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--nb-shell-inspector-resize-color);
    opacity: 0.4;
    transition:
      opacity 0.12s ease,
      width 0.12s ease;
  }

  &:hover::before,
  .nb-shell__inspector--resizing &::before {
    width: 4px;
    opacity: 1;
  }
}

// ── Inspector sheet dismiss ───────────────────────────────────────────────────
//
// Rendered only while the inspector is an overlay, so it never appears next to
// a product's own close button on the desktop column. Same 40px square and the
// same focus ring as the drawer toggle, because they are the two controls the
// frame itself owns at small widths.
.nb-shell__inspector-dismiss {
  position: absolute;
  top: calc(var(--nb-base-unit) * 1);
  right: calc(var(--nb-base-unit) * 1);
  z-index: 6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--nb-base-unit) * 5); // 40px
  height: calc(var(--nb-base-unit) * 5);
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: var(--nb-c-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }
}

.nb-shell__inspector-dismiss-glyph {
  font-size: 1.25rem;
  line-height: 1;
}

// ── Navigation drawer toggle ──────────────────────────────────────────────────
//
// Rendered only at collapsed widths, in the topbar's own flow. A 40px square,
// which is the smallest thing we ship that is still a comfortable touch target,
// with the focus ring the rest of the library uses.
.nb-shell__nav-toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--nb-base-unit) * 5); // 40px
  height: calc(var(--nb-base-unit) * 5);
  margin-left: calc(var(--nb-base-unit) * -1);
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: var(--nb-c-surface-raised);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-primary);
    outline-offset: -2px;
  }
}

.nb-shell__nav-toggle-glyph {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(var(--nb-base-unit) * 2); // 16px
  height: 12px;

  > span {
    display: block;
    height: 2px;
    // currentColor, so the glyph follows the chrome's own text colour and a
    // dark topbar needs no second rule.
    background: currentColor;
    border-radius: 1px;
  }
}

// ── Collapsed frame ───────────────────────────────────────────────────────────
//
// Below `collapseAt` the frame stops being three columns. The class is set by
// the component from the live viewport width (see COLLAPSE_PX in the script),
// which is what keeps `inert`, `aria-expanded` and these rules from ever
// disagreeing about which layout is on screen.
//
// The body keeps the full width in this mode: nothing squeezes it, so a page
// still reflows into one column at 320px and at 200% zoom instead of being
// pushed to a negative width inside a frame that cannot scroll.
.nb-shell--collapsed {
  .nb-shell__sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 300;
    // The rail's own width, not a full-bleed sheet: navigation that keeps its
    // shape is navigation the user already knows, and the sliver of page still
    // visible next to it is the affordance that says the page is still there.
    // Capped so a verbose rail cannot take the whole of a 320px screen.
    width: min(var(--nb-shell-sidebar-width), 84vw);
    transform: translateX(-100%);
    transition: transform 0.18s ease;
    box-shadow: none;
  }

  // The inspector becomes a sheet over the content row rather than a column
  // beside it. As a column it would be 288px wide at minimum, which on a 320px
  // screen leaves 32px of page: not a layout, just two unusable things at once.
  //
  // The content row holds the body, and the body holds the topbar, so this
  // covers the topbar as well. That is deliberate (a 320px sheet with a strip
  // of unrelated chrome above it is not a sheet), and it is why the component
  // renders a dismiss button inside the sheet, answers Escape, and marks the
  // body `inert` for as long as the sheet is up.
  .nb-shell__inspector--overlay {
    position: absolute;
    inset: 0;
    z-index: 250;
    width: 100%;
    max-width: none;
    border-left: 0;
  }

  // The chrome gives its side padding back to the content at this size.
  --nb-shell-chrome-padding-x: calc(var(--nb-base-unit) * 2); // 16px

  .nb-shell__main {
    padding: 1rem;
  }
}

.nb-shell--drawer-open .nb-shell__sidebar {
  transform: translateX(0);
  box-shadow: 0 0 24px rgb(0 0 0 / 35%);
}

.nb-shell__scrim {
  position: absolute;
  inset: 0;
  z-index: 200;
  background: var(--nb-shell-scrim-bg);
}

// A second, narrower step, in CSS alone because nothing about it needs the
// component to know: at the bottom of the scale the frame gives up the rest of
// its decorative padding rather than the content.
@media (max-width: 480px) {
  .nb-shell__main {
    padding: 0.75rem;
  }

  .nb-shell__topbar {
    gap: 0.5rem;
  }
}

// ── Sidebar variants ──────────────────────────────────────────────────────────
//
// The default (compact) variant keeps the legacy 56px icon rail. The verbose
// variant widens the sidebar and switches its children to stretch alignment so
// full-width rows from NbSidebarMenu render correctly. The base
// --nb-shell-sidebar-width default lives at :root in styles/_theme.scss;
// this state-level override only fires when the verbose variant is active.

// ── Reduced motion ────────────────────────────────────────────────────────────
//
// A 560px column sliding in over 200ms is exactly the kind of large-area
// movement the preference exists to suppress, and the skip link snapping into
// place is fine without an ease. Everything here is a transition on a state the
// component reaches either way, so removing the transition removes the motion
// and nothing else.
@media (prefers-reduced-motion: reduce) {
  .nb-shell__inspector,
  .nb-shell__inspector-resize::before,
  .nb-shell__skip-link,
  .nb-shell__sidebar,
  .nb-shell__scrim {
    transition: none;
  }
}

.nb-shell--sidebar-verbose {
  --nb-shell-sidebar-width: var(--nb-shell-sidebar-width-verbose);

  .nb-shell__sidebar {
    align-items: stretch;
    padding: 0.75rem 0;
  }

  .nb-shell__sidebar-logo {
    width: auto;
    height: auto;
    margin: 0 0 1rem;
    padding: 0 0.875rem;
    justify-content: flex-start;
  }

  .nb-shell__sidebar-nav,
  .nb-shell__sidebar-bottom {
    align-items: stretch;
    padding: 0 0.75rem;
    gap: 2px;
  }

  // Leave room below the last menu item so it isn't pressed against the
  // bottom edge when the nav is scrolled fully down.
  .nb-shell__sidebar-nav {
    padding-bottom: 0.5rem;
  }
}
</style>
