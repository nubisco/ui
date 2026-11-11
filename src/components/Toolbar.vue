<template>
  <div
    ref="rootRef"
    :class="[
      'nb-toolbar',
      `nb-toolbar--${size}`,
      { 'nb-toolbar--flush': flush },
    ]"
    role="toolbar"
    :aria-label="label"
    @keydown="onKeydown"
    @focusin="onFocusIn"
  >
    <div v-if="$slots.start" class="nb-toolbar__start">
      <slot name="start" />
    </div>
    <div class="nb-toolbar__main">
      <slot />
    </div>
    <div v-if="$slots.end" class="nb-toolbar__end">
      <slot name="end" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import type { IToolbarProps } from './Toolbar.d'
import { NB_TOOLBAR } from './Toolbar.context'
import { useRovingFocus } from '@/composables/useRovingFocus.composable'

const props = withDefaults(defineProps<IToolbarProps>(), {
  size: 'lg',
  flush: false,
})

const rootRef = ref<HTMLElement | null>(null)

/*
 * One height for the strip, handed to every button in it. A button given a
 * size of its own keeps it, so a toolbar can still hold a deliberately
 * smaller control. `flush` reaches the buttons the same way: it is what
 * squares their corners and lets them meet edge to edge.
 */
provide(NB_TOOLBAR, {
  size: computed(() => props.size),
  flush: computed(() => props.flush),
})

const { onKeydown, onFocusIn, focus } = useRovingFocus(rootRef, {
  orientation: () => 'horizontal',
})

defineExpose({ focus })
</script>

<style lang="scss">
/*
 * Carbon's toolbar: a strip as tall as the table row or header it belongs
 * to. The start slot holds what fills the width (a search field), the
 * default slot the tools, and the end slot the primary action, which sits
 * flush in the corner.
 *
 * Not scoped: the slots hold other components (a button, an action group,
 * an overflow menu), and the strip lays out their roots.
 */
.nb-toolbar {
  --nb-toolbar-height: calc(var(--nb-base-unit) * 6);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-8);
  min-height: var(--nb-toolbar-height);
  min-width: 0;

  &--sm {
    --nb-toolbar-height: calc(var(--nb-base-unit) * 4);
  }
  &--md {
    --nb-toolbar-height: calc(var(--nb-base-unit) * 5);
  }
  &--xl {
    --nb-toolbar-height: calc(var(--nb-base-unit) * 8);
  }

  &__start,
  &__main,
  &__end {
    display: flex;
    align-items: center;
    gap: inherit;
    min-width: 0;
  }

  // The start slot takes whatever width the tools leave, and moves to a line
  // of its own when that is too little (a phone, a narrow card). Anything
  // placed there grows to fill it, so an expandable search, a plain field or
  // a filter chip row needs no layout of its own.
  &__start {
    flex: 1 1 16rem;

    > * {
      flex: 1 1 auto;
      min-width: 0;
    }
  }

  // The tools sit at the end of the strip, after the start slot.
  &__main {
    flex: 0 1 auto;
    margin-inline-start: auto;
  }

  &__end {
    flex: none;
  }

  /*
   * Flush: no gaps, square corners, every control the full height of the
   * strip. The buttons square themselves (NbButton reads `flush` from the
   * toolbar), so nothing here reaches into another component's styles.
   */
  &--flush {
    align-items: stretch;
    gap: 0;

    .nb-toolbar__start,
    .nb-toolbar__main,
    .nb-toolbar__end {
      align-items: stretch;
    }

    // A field in the start slot keeps its own height, centred in the strip,
    // with the table's 16px from the edge.
    .nb-toolbar__start {
      align-items: center;
      padding-inline: var(--nb-spacing-16) var(--nb-spacing-8);
    }
  }
}
</style>
