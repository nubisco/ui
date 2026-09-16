<template>
  <span
    class="nb-avatar"
    :class="[`nb-avatar--${size}`]"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : accessibleName || undefined"
    :aria-hidden="decorative ? 'true' : undefined"
    :title="decorative ? undefined : accessibleName || undefined"
  >
    <img
      v-if="showPicture"
      class="nb-avatar__picture"
      :src="picture ?? undefined"
      alt=""
      @error="failed = true"
    />
    <span v-else class="nb-avatar__initials" aria-hidden="true">{{
      initials
    }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IAvatarProps } from './Avatar.d'
import { initialsOf } from '@/utils/initials.helper'

const props = withDefaults(defineProps<IAvatarProps>(), {
  name: undefined,
  email: undefined,
  picture: undefined,
  size: 'md',
  decorative: false,
})

// A new address gets a fresh attempt: the failure belonged to the old one.
const failed = ref(false)
watch(
  () => props.picture,
  () => {
    failed.value = false
  },
)

const showPicture = computed(() => !!props.picture && !failed.value)
const initials = computed(() => initialsOf(props))
const accessibleName = computed(
  () => props.name?.trim() || props.email?.trim() || '',
)
</script>

<style lang="scss">
.nb-avatar {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: 50%;
  overflow: hidden;
  vertical-align: middle;
  // The same pairing as NbUserMenu's avatar: primary with its readable
  // foreground, so initials stay legible in any theme.
  background: var(--nb-c-primary, #6b46c1);
  color: var(--nb-c-primary-a11y, #fff);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  user-select: none;

  &--xs {
    width: 20px;
    height: 20px;
    font-size: 0.5rem;
  }
  &--sm {
    width: 24px;
    height: 24px;
    font-size: 0.5625rem;
  }
  &--md {
    width: 28px;
    height: 28px;
    font-size: 0.64rem;
  }
  &--lg {
    width: 40px;
    height: 40px;
    font-size: 0.875rem;
  }
}

.nb-avatar__picture {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
