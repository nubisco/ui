<template>
  <div class="nb-sidebar-brand" :class="[`nb-sidebar-brand--${variant}`]">
    <div v-if="icon || $slots.icon" class="nb-sidebar-brand__icon">
      <slot name="icon">
        <NbIcon v-if="icon" :name="icon" :size="24" />
      </slot>
    </div>
    <div v-if="variant === 'verbose'" class="nb-sidebar-brand__text">
      <span class="nb-sidebar-brand__title">{{ title }}</span>
      <span v-if="subtitle" class="nb-sidebar-brand__subtitle">
        {{ subtitle }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import { ISidebarBrandProps } from './SidebarBrand.d'
import NbIcon from './Icon.vue'

withDefaults(defineProps<ISidebarBrandProps>(), {
  subtitle: undefined,
  icon: undefined,
})

const variantRef = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const variant = computed(() => variantRef.value)
</script>

<style scoped lang="scss">
.nb-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  color: var(--nb-shell-sidebar-link-hover-color);

  &--compact {
    justify-content: center;
    gap: 0;
  }
}

.nb-sidebar-brand__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nb-shell-sidebar-link-active-color);
}

.nb-sidebar-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.nb-sidebar-brand__title {
  font-size: var(--nb-type-heading-compact-size);
  font-weight: var(--nb-font-weight-semibold, 600);
  letter-spacing: var(--nb-type-heading-compact-letter-spacing);
  color: var(--nb-shell-sidebar-link-active-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-sidebar-brand__subtitle {
  font-size: var(--nb-type-overline-size);
  font-weight: var(--nb-type-overline-weight);
  letter-spacing: var(--nb-type-overline-letter-spacing);
  text-transform: var(--nb-type-overline-text-transform);
  color: var(--nb-shell-sidebar-link-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
