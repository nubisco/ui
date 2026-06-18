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
      :href="rowTag === 'a' ? resolvedHref : undefined"
      :disabled="
        rowTag === 'button' && !hasChildren ? disabled || undefined : undefined
      "
      :aria-disabled="disabled || undefined"
      :aria-expanded="
        hasChildren && variant === 'verbose' ? expanded : undefined
      "
      :aria-label="variant === 'compact' ? label : undefined"
      role="menuitem"
      @click="onClick"
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
        class="nb-sidebar-menu-item__flyout"
        :style="flyoutStyle"
        @mouseenter="onFlyoutEnter"
        @mouseleave="onFlyoutLeave"
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
          <ul class="nb-sidebar-menu-item__flyout-children">
            <slot />
          </ul>
        </SidebarVariantScope>
      </div>
    </Teleport>
  </li>
</template>

<script setup lang="ts">
import {
  Comment,
  Fragment,
  Text,
  computed,
  inject,
  ref,
  useSlots,
  type Component,
  type Ref,
  type VNode,
} from 'vue'
import { ISidebarMenuItemProps } from './SidebarMenuItem.d'
import NbIcon from './Icon.vue'
import SidebarVariantScope from './SidebarVariantScope.vue'
import { useRouterLink } from '@/composables/useRouterLink.composable'

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

function hasRenderableContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) {
      return (
        typeof node.children === 'string' && node.children.trim().length > 0
      )
    }
    if (node.type === Fragment) {
      return Array.isArray(node.children)
        ? hasRenderableContent(node.children as VNode[])
        : false
    }
    return true
  })
}

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

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  if (isParentTrigger.value && variant.value === 'verbose') {
    expanded.value = !expanded.value
    return
  }
  emit('click', event)
}

// ── Compact flyout ──────────────────────────────────────────────────────────

const rowRef = ref<HTMLElement | null>(null)
const flyoutVisible = ref(false)
const flyoutStyle = ref<Record<string, string>>({})
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openFlyout() {
  if (variant.value !== 'compact') return
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  const el = rowRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  flyoutStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right + 8}px`,
  }
  flyoutVisible.value = true
}

function scheduleClose() {
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
</script>

<style scoped lang="scss">
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
  border-radius: 6px;
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
