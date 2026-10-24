<template>
  <div
    v-nb-tooltip="{
      body: isCompact ? label : null,
      aria: 'none',
      position: 'right',
    }"
    class="nb-sidebar-status"
    :class="[
      `nb-sidebar-status--${status}`,
      { 'nb-sidebar-status--compact': isCompact },
    ]"
    role="status"
    :aria-label="label"
  >
    <span class="nb-sidebar-status__dot" aria-hidden="true" />
    <span v-if="!isCompact" class="nb-sidebar-status__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * A one-line, read-only status for the bottom of the rail, for something only
 * this product has (a daemon, a sync, a device link). It sits last, under the
 * user menu, so the rows every product shares keep the same place everywhere.
 *
 * Expanded it lines up with the menu rows: the dot where their icons are, the
 * words where their labels are. Collapsed it is the dot alone, named by a
 * tooltip.
 */
import { computed, inject, ref, type Ref } from 'vue'
import type { ISidebarStatusProps } from './SidebarStatus.d'

withDefaults(defineProps<ISidebarStatusProps>(), {
  status: 'neutral',
})

const variant = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const isCompact = computed(() => variant.value === 'compact')
</script>

<style scoped lang="scss">
.nb-sidebar-status {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  box-sizing: border-box;
  width: 100%;
  min-height: 32px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--nb-shell-sidebar-link-color);

  &--compact {
    justify-content: center;
    padding: 0.25rem 0;
  }
}

// 8px in a 16px box, so the dot sits where a menu row's icon does.
.nb-sidebar-status__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin: 0 4px;
  border-radius: 50%;
  background: var(--nb-c-component-inactive, currentColor);
  transition: background 0.3s ease;

  .nb-sidebar-status--success & {
    background: var(--nb-c-success, #22c55e);
    box-shadow: 0 0 6px
      color-mix(in srgb, var(--nb-c-success, #22c55e) 60%, transparent);
  }
  .nb-sidebar-status--warning & {
    background: var(--nb-c-warning, #f59e0b);
  }
  .nb-sidebar-status--danger & {
    background: var(--nb-c-danger, #ef4444);
  }
  .nb-sidebar-status--compact & {
    margin: 0;
  }
}

.nb-sidebar-status__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
