<template>
  <li
    class="nb-sidebar-menu-group"
    :class="[`nb-sidebar-menu-group--${variant}`]"
    role="none"
  >
    <template v-if="variant === 'verbose'">
      <component
        :is="collapsible ? 'button' : 'div'"
        class="nb-sidebar-menu-group__header"
        :class="{ 'nb-sidebar-menu-group__header--interactive': collapsible }"
        :type="collapsible ? 'button' : undefined"
        :aria-expanded="collapsible ? !collapsed : undefined"
        @click="collapsible ? (collapsed = !collapsed) : undefined"
      >
        <span class="nb-sidebar-menu-group__label">{{ label }}</span>
        <NbIcon
          v-if="collapsible"
          class="nb-sidebar-menu-group__caret"
          :class="{ 'nb-sidebar-menu-group__caret--collapsed': collapsed }"
          name="caret-down"
          :size="12"
        />
      </component>
      <ul v-show="!collapsed" class="nb-sidebar-menu-group__items" role="group">
        <slot />
      </ul>
    </template>

    <template v-else>
      <!-- Compact mode: groups become a thin separator. The label is
           announced to assistive tech as the items' group name. -->
      <hr class="nb-sidebar-menu-group__divider" :aria-label="label" />
      <ul class="nb-sidebar-menu-group__items" role="group" :aria-label="label">
        <slot />
      </ul>
    </template>
  </li>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import { ISidebarMenuGroupProps } from './SidebarMenuGroup.d'
import NbIcon from './Icon.vue'

const props = withDefaults(defineProps<ISidebarMenuGroupProps>(), {
  collapsible: false,
  defaultCollapsed: false,
})

const variantRef = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const variant = computed(() => variantRef.value)

const collapsed = ref(props.collapsible && props.defaultCollapsed)
</script>

<style scoped lang="scss">
.nb-sidebar-menu-group {
  list-style: none;
  margin: 0.75rem 0 0.25rem;

  &:first-child {
    margin-top: 0;
  }

  &--compact {
    margin: 0.5rem 0 0.25rem;
  }
}

.nb-sidebar-menu-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  padding: 0.25rem 0.75rem 0.3rem;
  background: none;
  border: none;
  cursor: default;
  font: inherit;
  color: inherit;
  text-align: left;

  &--interactive {
    cursor: pointer;
  }
}

.nb-sidebar-menu-group__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--nb-shell-sidebar-link-color);
  opacity: 0.75;
}

.nb-sidebar-menu-group__caret {
  transition: transform 0.15s ease;
  color: var(--nb-shell-sidebar-link-color);

  &--collapsed {
    transform: rotate(-90deg);
  }
}

.nb-sidebar-menu-group__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nb-sidebar-menu-group__divider {
  height: 1px;
  border: 0;
  background: var(--nb-shell-sidebar-link-hover-bg);
  margin: 0.5rem 0.625rem;
}
</style>
