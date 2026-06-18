<template>
  <ul
    class="nb-sidebar-menu"
    :class="[`nb-sidebar-menu--${density}`]"
    role="menu"
  >
    <slot />
  </ul>
</template>

<script setup lang="ts">
import { ISidebarMenuProps } from './SidebarMenu.d'

withDefaults(defineProps<ISidebarMenuProps>(), {
  density: 'comfortable',
})
</script>

<style scoped lang="scss">
.nb-sidebar-menu {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  color: var(--nb-shell-sidebar-link-color);
  font-size: 0.8125rem;
}
</style>
