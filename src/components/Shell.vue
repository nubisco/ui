<template>
  <div
    class="nb-shell"
    :class="[
      { 'nb-shell--no-sidebar': !showSidebar },
      showSidebar ? `nb-shell--sidebar-${sidebarVariant}` : null,
    ]"
  >
    <!-- ═══ OUTER LAYOUT: vertical stack ═══
         outer-menu spans the FULL width (above sidebar + body + inspector).
         Use for app-level menu bars that need to span everything. -->
    <div v-if="hasSlotContent('outer-menu')" class="nb-shell__outer-menu">
      <slot name="outer-menu" />
    </div>

    <!-- ═══ MIDDLE LAYER: sidebar | (inner-menu + content + inspector) ═══ -->
    <div class="nb-shell__middle">
      <!-- ═══ SIDEBAR (auto-hidden when no slots used) ═══ -->
      <nav v-if="showSidebar" class="nb-shell__sidebar">
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

      <!-- ═══ RIGHT AREA: inner-menu + body + inspector side by side ═══ -->
      <div class="nb-shell__right">
        <!-- inner-menu spans body + inspector (but not sidebar) -->
        <div v-if="hasSlotContent('inner-menu')" class="nb-shell__inner-menu">
          <slot name="inner-menu" />
        </div>

        <!-- Content + Inspector row -->
        <div class="nb-shell__content-row">
          <!-- ═══ BODY (topbar + main + bottom) ═══ -->
          <div class="nb-shell__body">
            <div v-if="$slots.notification" class="nb-shell__notification">
              <slot name="notification" />
            </div>

            <!-- Legacy menubar slot (inside body, does NOT span inspector) -->
            <div v-if="$slots.menubar" class="nb-shell__menubar">
              <slot name="menubar" />
            </div>

            <div class="nb-shell__topbar">
              <div class="nb-shell__topbar-left">
                <slot name="topbar-left" />
              </div>
              <div class="nb-shell__topbar-right">
                <slot name="topbar-right" />
              </div>
            </div>

            <div v-if="hasSlotContent('fixedbar')" class="nb-shell__fixedbar">
              <slot name="fixedbar" />
            </div>

            <main
              class="nb-shell__main"
              :class="{ 'nb-shell__main--no-padding': !mainPadding }"
            >
              <slot />
            </main>

            <!-- ═══ BOTTOM PANEL (optional) ═══ -->
            <div v-if="$slots.bottom" class="nb-shell__bottom">
              <slot name="bottom" />
            </div>
          </div>

          <!-- ═══ INSPECTOR (optional column) ═══ -->
          <aside
            ref="inspectorRef"
            class="nb-shell__inspector"
            :class="{
              'nb-shell__inspector--visible': inspectorVisible,
              'nb-shell__inspector--expanded':
                inspectorVisible && inspectorExpanded,
              [`nb-shell__inspector--${inspectorSize}`]: inspectorVisible,
              'nb-shell__inspector--resizing': isResizing,
            }"
            :style="inspectorStyle"
          >
            <div
              v-if="resizable && inspectorVisible"
              class="nb-shell__inspector-resize"
              title="Drag to resize, double-click to reset"
              @mousedown="onResizeStart"
              @dblclick="onResizeReset"
            />
            <slot name="inspector" />
          </aside>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, toRef, useSlots } from 'vue'
import { hasSlotContent as slotHasContent } from '@/utils/slotContent.helper'
import { IShellProps } from './Shell.d'

const slots = useSlots()

/** Check if a named slot has renderable content */
function hasSlotContent(name: string): boolean {
  return slotHasContent(slots, name)
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
const emit = defineEmits<{ 'update:inspectorWidth': [width: number | null] }>()

const inspectorRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)
const RESIZE_FLOOR_PX = 288 // xs inspector width (base-unit * 36)

const inspectorStyle = computed(() => {
  if (
    !props.resizable ||
    !props.inspectorVisible ||
    props.inspectorWidth == null
  ) {
    return undefined
  }
  const maxW =
    typeof window !== 'undefined'
      ? window.innerWidth * 0.5
      : props.inspectorWidth
  const w = Math.max(RESIZE_FLOOR_PX, Math.min(props.inspectorWidth, maxW))
  return { '--nb-shell-inspector-width': `${w}px` }
})

function onResizeMove(e: MouseEvent) {
  const el = inspectorRef.value
  if (!el) return
  const right = el.getBoundingClientRect().right
  const maxW = window.innerWidth * 0.5
  const w = Math.round(
    Math.max(RESIZE_FLOOR_PX, Math.min(maxW, right - e.clientX)),
  )
  emit('update:inspectorWidth', w)
}

function onResizeEnd() {
  isResizing.value = false
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

function onResizeStart(e: MouseEvent) {
  if (!props.resizable) return
  e.preventDefault()
  isResizing.value = true
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizeReset() {
  emit('update:inspectorWidth', null)
}

onBeforeUnmount(onResizeEnd)
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
  overflow: hidden;
  background: var(--nb-c-surface-raised);
}

// ── Outer menu (full width, above everything) ─────────────────────────────────

.nb-shell__outer-menu {
  flex-shrink: 0;
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  overflow: visible; // menus must expand
  z-index: 200;
}

// ── Middle layer (sidebar + right area) ───────────────────────────────────────

.nb-shell__middle {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
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
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
  overflow: visible; // menus must expand
  z-index: 150;
}

// ── Content row (body + inspector side by side) ───────────────────────────────

.nb-shell__content-row {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

// ── Body ───────────────────────────────────────────────────────────────────────

.nb-shell__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--nb-c-surface);
}

.nb-shell__notification {
  flex-shrink: 0;
}

.nb-shell__menubar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
}

.nb-shell__topbar {
  flex-shrink: 0;
  height: var(--nb-shell-topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(var(--nb-base-unit) * 3);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
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
  padding: 0 calc(var(--nb-base-unit) * 3);
  border-bottom: 1px solid var(--nb-c-border);
  background: var(--nb-c-surface);
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
.nb-shell__fixedbar:empty {
  display: none;
}

.nb-shell__main {
  flex: 1;
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
  }

  &--expanded {
    width: var(--nb-shell-inspector-expanded-width);
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
// with hard-coded fallbacks so it stays visible even where theme tokens are not
// loaded.
.nb-shell__inspector-resize {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 8px;
  cursor: ew-resize;
  z-index: 5;

  // A grab-line that is always visible (accent-tinted so it reads on any
  // ground) and brightens + widens on hover / while dragging. Accent colour
  // is hard-coded as a fallback so it never depends on a theme token being
  // loaded.
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--nb-c-primary, #8b6cff);
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

// ── Sidebar variants ──────────────────────────────────────────────────────────
//
// The default (compact) variant keeps the legacy 56px icon rail. The verbose
// variant widens the sidebar and switches its children to stretch alignment so
// full-width rows from NbSidebarMenu render correctly. The base
// --nb-shell-sidebar-width default lives at :root in styles/_theme.scss;
// this state-level override only fires when the verbose variant is active.

.nb-shell--sidebar-verbose {
  --nb-shell-sidebar-width: calc(var(--nb-base-unit) * 30); // 240px

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
