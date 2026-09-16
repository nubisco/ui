<template>
  <li
    class="nb-sidebar-menu-item"
    :class="[`nb-sidebar-menu-item--${variant}`]"
    role="none"
    @mouseenter="onRowEnter"
    @mouseleave="onRowLeave"
  >
    <component
      :is="rowTag"
      ref="rowRef"
      class="nb-sidebar-menu-item__row"
      :class="{
        'nb-sidebar-menu-item__row--active': active,
        'nb-sidebar-menu-item__row--disabled': disabled,
        'nb-sidebar-menu-item__row--expandable':
          hasChildren && variant === 'verbose',
        'nb-sidebar-menu-item__row--compact': variant === 'compact',
      }"
      :type="rowTag === 'button' ? 'button' : undefined"
      :to="useRouter ? to : undefined"
      v-bind="anchorAttrs"
      :disabled="
        rowTag === 'button' && !hasChildren ? disabled || undefined : undefined
      "
      :aria-disabled="disabled || undefined"
      :aria-expanded="
        hasChildren
          ? variant === 'verbose'
            ? expanded
            : flyoutVisible
          : undefined
      "
      :aria-haspopup="hasChildren && variant === 'compact' ? 'menu' : undefined"
      :aria-label="variant === 'compact' ? label : undefined"
      role="menuitem"
      @click="onClick"
      @keydown="onRowKeydown"
    >
      <NbIcon
        v-if="icon"
        class="nb-sidebar-menu-item__icon"
        :name="icon"
        :size="variant === 'compact' ? 18 : 16"
      />
      <template v-if="variant === 'verbose'">
        <span class="nb-sidebar-menu-item__label">{{ label }}</span>
        <span
          v-if="badge !== undefined"
          class="nb-sidebar-menu-item__badge"
          :class="[`nb-sidebar-menu-item__badge--${badgeVariant}`]"
        >
          {{ badge }}
        </span>
        <NbIcon
          v-if="hasChildren"
          class="nb-sidebar-menu-item__caret"
          :class="{ 'nb-sidebar-menu-item__caret--expanded': expanded }"
          name="caret-right"
          :size="12"
        />
      </template>
      <span
        v-else-if="badge !== undefined"
        class="nb-sidebar-menu-item__badge-dot"
        :class="[`nb-sidebar-menu-item__badge-dot--${badgeVariant}`]"
        :title="String(badge)"
      />
    </component>

    <!-- Verbose: inline expansion -->
    <ul
      v-if="hasChildren && variant === 'verbose'"
      v-show="expanded"
      class="nb-sidebar-menu-item__children"
      role="group"
    >
      <slot />
    </ul>

    <!-- Compact: teleported flyout with label + (optionally) children -->
    <Teleport v-if="variant === 'compact' && flyoutVisible" to="body">
      <div
        ref="flyoutRef"
        class="nb-sidebar-menu-item__flyout"
        :style="flyoutStyle"
        @mouseenter="onFlyoutEnter"
        @mouseleave="onFlyoutLeave"
        @keydown="onFlyoutKeydown"
        @focusout="onFlyoutFocusOut"
        @click="onFlyoutClick"
      >
        <div class="nb-sidebar-menu-item__flyout-header">
          <span class="nb-sidebar-menu-item__flyout-label">{{ label }}</span>
          <span
            v-if="badge !== undefined"
            class="nb-sidebar-menu-item__badge"
            :class="[`nb-sidebar-menu-item__badge--${badgeVariant}`]"
          >
            {{ badge }}
          </span>
        </div>
        <SidebarVariantScope v-if="hasChildren" variant="verbose">
          <ul
            class="nb-sidebar-menu-item__flyout-children"
            role="menu"
            :aria-label="label"
          >
            <slot />
          </ul>
        </SidebarVariantScope>
      </div>
    </Teleport>
  </li>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  useSlots,
  watch,
  type Component,
  type Ref,
} from 'vue'
import { ISidebarMenuItemProps } from './SidebarMenuItem.d'
import NbIcon from './Icon.vue'
import SidebarVariantScope from './SidebarVariantScope.vue'
import { useRouterLink } from '@/composables/useRouterLink.composable'
import { hasRenderableContent } from '@/utils/slotContent.helper'

const props = withDefaults(defineProps<ISidebarMenuItemProps>(), {
  icon: undefined,
  to: undefined,
  href: undefined,
  active: false,
  disabled: false,
  defaultExpanded: false,
  badge: undefined,
  badgeVariant: 'neutral',
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const variantRef = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const variant = computed(() => variantRef.value)

const slots = useSlots()

const hasChildren = computed(() => {
  const content = slots.default?.()
  return content ? hasRenderableContent(content) : false
})

const expanded = ref(props.defaultExpanded || props.active)

// Renders as a real <RouterLink> when vue-router is installed; otherwise falls
// back to a plain anchor (string `to`/`href`) or a button (see `rowTag`).
const routerLink = useRouterLink()

const resolvedHref = computed<string | undefined>(() => {
  if (typeof props.to === 'string') return props.to
  if (props.href) return props.href
  return undefined
})

// A row that toggles a submenu (verbose parent) or opens the flyout (compact
// parent) is always a <button> — it doesn't navigate.
const isParentTrigger = computed(() => hasChildren.value)

// Render as RouterLink only when `to` is set, the row navigates (not a parent
// trigger), and RouterLink is actually available.
const useRouter = computed(
  () => props.to != null && !isParentTrigger.value && !!routerLink.value,
)

// Verbose: expandable parents are buttons (they toggle, not navigate).
// Compact: parents are buttons too (they open the flyout on hover); leaf rows
// navigate via RouterLink (object/string `to`) or an anchor (string `href`).
const rowTag = computed<string | Component>(() => {
  if (isParentTrigger.value) return 'button'
  if (useRouter.value) return routerLink.value as Component
  if (resolvedHref.value) return 'a'
  return 'button'
})

// Spread rather than bound individually, because an attribute bound to
// `undefined` is not the same as an absent one: RouterLink computes its own
// href, and a fallthrough `href` merges over it, leaving a link with no href
// in every app that has a router installed.
const anchorAttrs = computed(() =>
  rowTag.value === 'a' ? { href: resolvedHref.value } : {},
)

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  if (isParentTrigger.value && variant.value === 'verbose') {
    expanded.value = !expanded.value
    return
  }
  if (isParentTrigger.value && variant.value === 'compact') {
    toggleFlyoutFromClick(event)
  }
  emit('click', event)
}

// ── Compact flyout ──────────────────────────────────────────────────────────

const rowRef = ref<HTMLElement | null>(null)
const flyoutRef = ref<HTMLElement | null>(null)
const flyoutVisible = ref(false)
// Opened deliberately (click, tap or keyboard) rather than by hover. A pinned
// flyout ignores the pointer leaving and stays until it is dismissed, so it can
// be used without a mouse.
const pinned = ref(false)
const flyoutStyle = ref<Record<string, string>>({})
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openFlyout() {
  if (variant.value !== 'compact') return
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  const el = rowElement()
  if (!el) return
  const rect = el.getBoundingClientRect()
  flyoutStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 8}px`,
  }
  flyoutVisible.value = true
}

function scheduleClose() {
  if (pinned.value) return
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    flyoutVisible.value = false
    closeTimer = null
  }, 120)
}

function onRowEnter() {
  openFlyout()
}
function onRowLeave() {
  scheduleClose()
}
function onFlyoutEnter() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}
function onFlyoutLeave() {
  scheduleClose()
}

// A leaf row can be a RouterLink, whose ref is the component instance rather
// than the element.
function rowElement(): HTMLElement | null {
  const row = rowRef.value as HTMLElement | { $el?: HTMLElement } | null
  if (!row) return null
  return row instanceof HTMLElement ? row : (row.$el ?? null)
}

function closeFlyout(returnFocus = false) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  flyoutVisible.value = false
  pinned.value = false
  if (returnFocus) rowElement()?.focus()
}

// The reachable items in the flyout, in order. A collapsed nested group hides
// its children with v-show, so those are skipped.
function flyoutItems(): HTMLElement[] {
  const root = flyoutRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>('[role="menuitem"]'),
  ).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.getAttribute('aria-disabled') !== 'true' &&
      !el.closest('[style*="display: none"]'),
  )
}

async function openPinned(focusFirst: boolean) {
  openFlyout()
  pinned.value = true
  if (!focusFirst) return
  await nextTick()
  flyoutItems()[0]?.focus()
}

// On a touch screen the browser emulates mouseenter before the click, so the
// flyout is often already open (unpinned) when the click arrives. That click
// pins it instead of closing it; only a click on a pinned flyout closes it.
function toggleFlyoutFromClick(event: MouseEvent) {
  if (flyoutVisible.value && pinned.value) {
    closeFlyout()
    return
  }
  // detail is 0 when Enter or Space activated the button.
  void openPinned(event.detail === 0)
}

function onRowKeydown(event: KeyboardEvent) {
  if (!isParentTrigger.value || variant.value !== 'compact') return
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    void openPinned(true)
  } else if (event.key === 'Escape' && flyoutVisible.value) {
    event.preventDefault()
    closeFlyout(true)
  }
}

function onFlyoutKeydown(event: KeyboardEvent) {
  const items = flyoutItems()
  const index = items.indexOf(document.activeElement as HTMLElement)
  switch (event.key) {
    case 'Escape':
    case 'ArrowLeft':
      event.preventDefault()
      event.stopPropagation()
      closeFlyout(true)
      return
    case 'ArrowDown':
      event.preventDefault()
      items[(index + 1) % items.length]?.focus()
      return
    case 'ArrowUp':
      event.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
      return
    case 'Home':
      event.preventDefault()
      items[0]?.focus()
      return
    case 'End':
      event.preventDefault()
      items[items.length - 1]?.focus()
      return
    case 'Tab':
      // The flyout is teleported to <body>, so the browser's next tab stop from
      // inside it is the end of the document. Handing focus back to the row
      // first, without preventing the default, lets Tab continue from the rail.
      closeFlyout(true)
      return
  }
}

function onFlyoutFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  // null means focus went nowhere focusable, which the outside-press handler
  // below deals with; closing here too would fight a click inside the flyout.
  if (!next) return
  if (flyoutRef.value?.contains(next) || rowElement()?.contains(next)) return
  closeFlyout()
}

// Choosing a destination closes the flyout. A nested group's own toggle
// (it carries aria-expanded) keeps it open.
function onFlyoutClick(event: MouseEvent) {
  const item = (event.target as Element | null)?.closest('[role="menuitem"]')
  if (item && !item.hasAttribute('aria-expanded')) closeFlyout()
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (flyoutRef.value?.contains(target) || rowElement()?.contains(target))
    return
  closeFlyout()
}

watch(flyoutVisible, (visible) => {
  if (typeof document === 'undefined') return
  if (visible)
    document.addEventListener('pointerdown', onDocumentPointerDown, true)
  else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})

watch(variant, () => closeFlyout())

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
  if (typeof document !== 'undefined')
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

.nb-sidebar-menu-item {
  list-style: none;
  margin: 0;
}

// ── Row (verbose default) ──────────────────────────────────────────────────

.nb-sidebar-menu-item__row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  // Declare explicitly: the row pairs `width: 100%` with horizontal padding, so
  // it must stay border-box even if a consumer (or the docs host) doesn't apply
  // a global `* { box-sizing: border-box }` reset, or overrides it for anchors.
  box-sizing: border-box;
  padding: 0.45rem 0.75rem;
  // a nav row is a rounded rectangle, not a pill
  @include radius.standalone(control-sm);
  border: none;
  background: none;
  color: var(--nb-shell-sidebar-link-color);
  text-decoration: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;

  &:hover:not(&--disabled) {
    background: var(
      --nb-shell-sidebar-link-hover-bg,
      rgba(255, 255, 255, 0.08)
    );
    color: var(--nb-shell-sidebar-link-hover-color);
  }

  &--active {
    background: var(
      --nb-shell-sidebar-link-active-bg,
      rgba(124, 58, 237, 0.25)
    );
    color: var(--nb-shell-sidebar-link-active-color);
  }

  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  // Compact: icon-only square button, label is shown in the flyout.
  &--compact {
    width: 40px;
    height: 40px;
    padding: 0;
    margin: 0 auto;
    justify-content: center;
    position: relative;
  }
}

.nb-sidebar-menu-item__icon {
  flex-shrink: 0;
}

.nb-sidebar-menu-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-sidebar-menu-item__badge {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--nb-shell-sidebar-link-hover-bg);
  color: var(--nb-shell-sidebar-link-hover-color);

  &--accent {
    background: var(
      --nb-shell-sidebar-link-active-bg,
      rgba(124, 58, 237, 0.25)
    );
    color: var(--nb-shell-sidebar-link-active-color);
  }
  &--success {
    background: color-mix(
      in srgb,
      var(--nb-c-success, #22c55e) 22%,
      transparent
    );
    color: var(--nb-c-success, #22c55e);
  }
  &--warning {
    background: color-mix(
      in srgb,
      var(--nb-c-warning, #f59e0b) 22%,
      transparent
    );
    color: var(--nb-c-warning, #f59e0b);
  }
  &--danger {
    background: color-mix(
      in srgb,
      var(--nb-c-danger, #ef4444) 22%,
      transparent
    );
    color: var(--nb-c-danger, #ef4444);
  }
}

// Badge dot for compact: small coloured pip in the top-right of the icon.
.nb-sidebar-menu-item__badge-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--nb-shell-sidebar-link-active-color);

  &--accent {
    background: var(--nb-shell-sidebar-link-active-color);
  }
  &--success {
    background: var(--nb-c-success, #22c55e);
  }
  &--warning {
    background: var(--nb-c-warning, #f59e0b);
  }
  &--danger {
    background: var(--nb-c-danger, #ef4444);
  }
}

.nb-sidebar-menu-item__caret {
  flex-shrink: 0;
  transition: transform 0.15s ease;
  opacity: 0.65;

  &--expanded {
    transform: rotate(90deg);
  }
}

.nb-sidebar-menu-item__children {
  list-style: none;
  margin: 2px 0 4px;
  padding: 0 0 0 1.625rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-left: 1px solid var(--nb-shell-sidebar-link-hover-bg);
  margin-left: 0.875rem;
}
</style>

<style lang="scss">
// Flyout is teleported to body so it lives outside the scoped tree.
.nb-sidebar-menu-item__flyout {
  position: fixed;
  z-index: 1000;
  min-width: 200px;
  max-width: 280px;
  padding: 6px;
  background: var(--nb-shell-sidebar-bg);
  border: 1px solid var(--nb-shell-sidebar-link-hover-bg);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  color: var(--nb-shell-sidebar-link-color);
  font-size: 0.8125rem;
}

.nb-sidebar-menu-item__flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem 0.5rem;
}

.nb-sidebar-menu-item__flyout-label {
  font-weight: 600;
  color: var(--nb-shell-sidebar-link-hover-color);
}

.nb-sidebar-menu-item__flyout-children {
  list-style: none;
  margin: 0;
  padding: 4px 0 0;
  border-top: 1px solid var(--nb-shell-sidebar-link-hover-bg);
  display: flex;
  flex-direction: column;
  gap: 1px;

  // Children inside the flyout render as compact verbose-style rows.
  .nb-sidebar-menu-item__row {
    padding: 0.4rem 0.625rem;
    width: 100%;
    height: auto;
    justify-content: flex-start;
  }
}
</style>
