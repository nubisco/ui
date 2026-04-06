<template>
  <component
    :is="to || href ? 'a' : 'button'"
    class="nb-sidebar-link"
    :class="{
      'nb-sidebar-link--active': active,
      'nb-sidebar-link--danger': danger,
      'nb-sidebar-link--disabled': disabled,
    }"
    :href="to ? (typeof to === 'string' ? to : undefined) : (href ?? undefined)"
    :disabled="!to && !href ? disabled || undefined : undefined"
    :aria-disabled="(to || href) && disabled ? true : undefined"
    :data-tooltip="tooltip || undefined"
    @click="disabled ? undefined : $emit('click', $event)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { ISidebarLinkProps } from './SidebarLink.d'

withDefaults(defineProps<ISidebarLinkProps>(), {
  to: undefined,
  href: undefined,
  tooltip: undefined,
  active: false,
  disabled: false,
  danger: false,
})

defineEmits<{ click: [event: MouseEvent] }>()
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
  color: var(--nb-shell-sidebar-link-color, rgba(255, 255, 255, 0.55));
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
    background: rgba(15, 15, 30, 0.95);
    color: #fff;
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
    color: var(--nb-shell-sidebar-link-hover-color, rgba(255, 255, 255, 0.9));
  }

  &--active {
    background: var(
      --nb-shell-sidebar-link-active-bg,
      rgba(124, 58, 237, 0.25)
    );
    color: var(--nb-shell-sidebar-link-active-color, #a78bfa);
  }

  &--danger:hover:not(&--disabled) {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
  }

  &--disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
