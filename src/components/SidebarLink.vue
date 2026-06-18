<template>
  <component
    :is="linkTag"
    class="nb-sidebar-link"
    :class="{
      'nb-sidebar-link--active': active,
      'nb-sidebar-link--danger': danger,
      'nb-sidebar-link--disabled': disabled,
    }"
    :to="useRouter ? to : undefined"
    :href="linkTag === 'a' ? resolvedHref : undefined"
    :disabled="linkTag === 'button' ? disabled || undefined : undefined"
    :aria-disabled="linkTag !== 'button' && disabled ? true : undefined"
    :data-tooltip="tooltip || undefined"
    @click="disabled ? undefined : $emit('click', $event)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ISidebarLinkProps } from './SidebarLink.d'
import { useRouterLink } from '@/composables/useRouterLink.composable'

const props = withDefaults(defineProps<ISidebarLinkProps>(), {
  to: undefined,
  href: undefined,
  tooltip: undefined,
  active: false,
  disabled: false,
  danger: false,
})

defineEmits<{ click: [event: MouseEvent] }>()

// Render a real <RouterLink> when vue-router is installed and `to` is set;
// otherwise a string `to`/`href` becomes a plain <a> and an object `to` (which
// needs a router) falls back to a <button>.
const routerLink = useRouterLink()
const useRouter = computed(() => props.to != null && !!routerLink.value)

const resolvedHref = computed<string | undefined>(() => {
  if (typeof props.to === 'string') return props.to
  if (props.href) return props.href
  return undefined
})

const linkTag = computed<string | Component>(() => {
  if (useRouter.value) return routerLink.value as Component
  if (resolvedHref.value) return 'a'
  return 'button'
})
</script>

<style scoped lang="scss">
.nb-sidebar-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  text-decoration: none;
  color: var(--nb-shell-sidebar-link-color);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  padding: 0;
  flex-shrink: 0;
  position: relative;
  transition:
    background 0.15s,
    color 0.15s;

  // ── Tooltip ────────────────────────────────────────────────────────────────

  &[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: var(--nb-c-contrast);
    color: var(--nb-c-surface);
    padding: 0.3rem 0.65rem;
    border-radius: 5px;
    font-size: 0.76rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s;
    z-index: 500;
  }

  &[data-tooltip]:hover::after {
    opacity: 1;
  }

  // ── States ─────────────────────────────────────────────────────────────────

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

  &--danger:hover:not(&--disabled) {
    background: var(
      --nb-shell-sidebar-link-danger-bg,
      color-mix(in srgb, var(--nb-c-danger) 12%, transparent)
    );
    color: var(--nb-shell-sidebar-link-danger-color, var(--nb-c-danger));
  }

  &--disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
