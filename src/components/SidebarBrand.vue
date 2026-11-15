<template>
  <div class="nb-sidebar-brand" :class="[`nb-sidebar-brand--${variant}`]">
    <div v-if="icon || $slots.icon" class="nb-sidebar-brand__icon">
      <slot name="icon">
        <NbIcon v-if="icon" :name="icon" :size="24" />
      </slot>
    </div>
    <!-- Expanded, the title beside it names the brand, so the tile is
         decorative. Collapsed, it is all there is, so it carries the name. -->
    <div
      v-else-if="monogramText"
      class="nb-sidebar-brand__icon nb-sidebar-brand__monogram"
      v-bind="
        variant === 'compact'
          ? { role: 'img', 'aria-label': title }
          : { 'aria-hidden': 'true' }
      "
    >
      {{ monogramText }}
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

const props = withDefaults(defineProps<ISidebarBrandProps>(), {
  subtitle: undefined,
  icon: undefined,
  monogram: false,
})

const variantRef = inject<Ref<'compact' | 'verbose'>>(
  'nb-shell-sidebar-variant',
  ref('verbose') as Ref<'compact' | 'verbose'>,
)
const variant = computed(() => variantRef.value)

type TSegmenter = new () => {
  segment(text: string): Iterable<{ segment: string }>
}

/**
 * The tile's letters. Graphemes, not UTF-16 units, so an accented or
 * non-Latin initial is not cut in half.
 */
function firstGraphemes(text: string, count: number): string {
  const Segmenter = (Intl as unknown as { Segmenter?: TSegmenter }).Segmenter
  if (Segmenter) {
    const out: string[] = []
    for (const { segment } of new Segmenter().segment(text)) {
      out.push(segment)
      if (out.length === count) break
    }
    return out.join('')
  }
  return Array.from(text).slice(0, count).join('')
}

const monogramText = computed(() => {
  const source = props.monogram
  if (!source) return ''
  if (typeof source === 'string') return firstGraphemes(source.trim(), 2)
  const words = props.title.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => firstGraphemes(word, 1))
    .join('')
    .toLocaleUpperCase()
})
</script>

<style scoped lang="scss">
@use '../styles/logic/radius' as radius;

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

// The fallback mark: a 24px tile, the size of the icon it stands in for, in
// the app's primary colour with its readable ink. Its corner follows the
// appearance: square in the square one, a small round in the rounded one.
.nb-sidebar-brand__monogram {
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  @include radius.standalone(control-sm);
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);
  // The overline set: 12px semibold, the one 12px role that carries weight.
  font-size: var(--nb-type-overline-size);
  font-weight: var(--nb-type-overline-weight);
  line-height: 1;
  letter-spacing: 0;
  user-select: none;
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
