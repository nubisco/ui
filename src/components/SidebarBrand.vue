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
  color: var(--nb-shell-sidebar-link-hover-color, rgba(255, 255, 255, 0.95));

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
  color: var(--nb-shell-sidebar-link-active-color, #a78bfa);
}

.nb-sidebar-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.nb-sidebar-brand__title {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--nb-shell-sidebar-link-active-color, #a78bfa);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nb-sidebar-brand__subtitle {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--nb-shell-sidebar-link-color, rgba(255, 255, 255, 0.55));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
