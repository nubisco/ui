<template>
  <div
    class="nb-page-layout"
    :class="[
      `nb-page-layout--stack-${stackBelow}`,
      { 'nb-page-layout--aside-first': asideFirst },
    ]"
  >
    <div class="nb-page-layout__inner" :data-gap="gap" :style="style">
      <div class="nb-page-layout__main">
        <slot />
      </div>
      <div v-if="$slots.aside" class="nb-page-layout__aside">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IPageLayoutProps } from './PageLayout.d'

const props = withDefaults(defineProps<IPageLayoutProps>(), {
  asideWidth: '3:2',
  stackBelow: 'md',
  asideFirst: false,
  gap: 'xl',
})

const RATIO = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/

/**
 * The two tracks, side by side. A ratio shares the width (`3:2` is 3fr and
 * 2fr); a length fixes the aside and gives the rest to the main region. Both
 * tracks are `minmax(0, ...)` so a long word or a wide table in either region
 * scrolls inside it rather than pushing the layout wider than the page.
 */
const columns = computed(() => {
  const match = RATIO.exec(props.asideWidth)
  if (match) return `minmax(0, ${match[1]}fr) minmax(0, ${match[2]}fr)`
  return `minmax(0, 1fr) minmax(0, ${props.asideWidth.trim()})`
})

const style = computed(() => ({ '--nb-page-layout-columns': columns.value }))
</script>

<style scoped lang="scss">
@use '../styles/variables/grid' as grid;

// Main and aside, answering to the width they are given rather than to the
// window. Inside NbShell a viewport query fires at the wrong moment (the rail
// and an open inspector are not the content's width), which is why this is a
// container query and nothing else. Phones need no rule of their own: a phone's
// content column is under every threshold, so it stacks by construction.
.nb-page-layout {
  container-type: inline-size;
  min-inline-size: 0;
}

.nb-page-layout__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.nb-page-layout__main,
.nb-page-layout__aside {
  min-inline-size: 0;
}

// Stacked, the aside can lead.
.nb-page-layout--aside-first > .nb-page-layout__inner > .nb-page-layout__aside {
  order: -1;
}

@each $name, $value in grid.$gap-ratios {
  .nb-page-layout__inner[data-gap='#{$name}'] {
    gap: #{$value};
  }
}

// A container query cannot read a custom property, so each threshold is its
// own rule. Side by side, the main region is first whatever `aside-first` says.
$stacks: (
  sm: 480px,
  md: 720px,
  lg: 960px,
);

@each $name, $width in $stacks {
  @container (min-width: #{$width}) {
    .nb-page-layout--stack-#{$name} > .nb-page-layout__inner {
      grid-template-columns: var(--nb-page-layout-columns);
      align-items: start;
    }

    .nb-page-layout--stack-#{$name}
      > .nb-page-layout__inner
      > .nb-page-layout__aside {
      order: 0;
    }
  }
}
</style>
