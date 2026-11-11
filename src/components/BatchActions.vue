<template>
  <div
    :class="[
      'nb-batch-actions',
      `nb-batch-actions--${variant}`,
      { 'nb-batch-actions--phone': phone },
    ]"
    role="region"
    :aria-label="label ?? nbStrings.batchActionsLabel"
  >
    <span class="nb-batch-actions__count" aria-live="polite">
      {{ nbStrings.selectionCount(count) }}
    </span>
    <div class="nb-batch-actions__actions">
      <template v-if="items?.length">
        <!-- On a phone the bar is one row the width of the screen, so the
             actions fold into a menu rather than wrapping over the page. -->
        <NbOverflowMenu
          v-if="phone"
          class="nb-batch-actions__more"
          :items="items"
          @select="(id: string) => emit('select', id)"
        />
        <template v-else>
          <NbButton
            v-for="item in items"
            :key="item.id"
            variant="ghost"
            :icon="item.icon"
            :disabled="item.disabled"
            :loading="item.loading"
            @click="choose(item)"
            >{{ item.label }}</NbButton
          >
        </template>
      </template>
      <slot :phone="phone" />
    </div>
    <!-- Cancel, on the far right as Carbon's. An icon on a phone, where the
         actions need the room. -->
    <NbButton
      v-if="phone"
      class="nb-batch-actions__cancel"
      variant="ghost"
      icon="x"
      :label="cancelText"
      tooltip-position="top"
      @click="emit('cancel')"
    />
    <NbButton
      v-else
      class="nb-batch-actions__cancel"
      variant="ghost"
      @click="emit('cancel')"
      >{{ cancelText }}</NbButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import NbButton from './Button.vue'
import NbOverflowMenu from './OverflowMenu.vue'
import type { IActionGroupItem } from './ActionGroup.d'
import type { IBatchActionsProps } from './BatchActions.d'
import { NB_TOOLBAR } from './Toolbar.context'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'

const props = withDefaults(defineProps<IBatchActionsProps>(), {
  items: () => [],
  variant: 'overlay',
  size: undefined,
  cancelLabel: undefined,
  label: undefined,
})

const emit = defineEmits<{
  /** Cancel was pressed. The host clears its selection. */
  cancel: []
  /** An action from `items` was chosen. Carries its `id`. */
  select: [id: string]
}>()

const nbStrings = useNbStrings()
const { phone } = usePhoneLayout()

const cancelText = computed(
  () => props.cancelLabel ?? nbStrings.value.batchActionsCancel,
)

/*
 * The bar is a toolbar to the buttons inside it, slotted or not: one height
 * for all of them, and on an overlay flush and full height, so the bar
 * matches the strip it covers without reaching into the buttons' styles.
 */
provide(NB_TOOLBAR, {
  size: computed(
    () => props.size ?? (props.variant === 'overlay' ? 'lg' : 'sm'),
  ),
  flush: computed(() => props.variant === 'overlay'),
})

function choose(item: IActionGroupItem) {
  if (item.disabled || item.loading) return
  item.onSelect?.()
  emit('select', item.id)
}
</script>

<style lang="scss">
@use '../styles/variables/breakpoints' as bp;

/*
 * Carbon's batch action bar: the brand fill and its inverse ink, so
 * selection mode is unmistakable, with the count at the start, the actions
 * after it and Cancel on the far right.
 */
.nb-batch-actions {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-16);
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);

  &__count {
    display: flex;
    align-items: center;
    flex: none;
    font-weight: var(--nb-font-weight-semibold);
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 1 auto;
    min-width: 0;
  }

  &__cancel {
    flex: none;
  }

  // Ghost on brand: the bar's inverse ink, not the ghost's own colour, which
  // is tuned for the surface. Two classes, to outrank the button's own.
  .nb-button.nb-button--ghost {
    color: inherit;

    &:hover:not(:disabled) {
      background: var(--nb-c-primary-hover, rgb(255 255 255 / 0.16));
    }
  }

  /*
   * Over a toolbar strip: it fills the strip (the host makes itself the
   * containing block), and its buttons are flush and full height.
   */
  &--overlay {
    position: absolute;
    inset: 0;
    align-items: stretch;
    padding-inline-start: var(--nb-spacing-16);

    .nb-batch-actions__actions {
      align-items: stretch;
    }
  }

  // A pill floating at the foot of a free layout.
  &--floating {
    position: sticky;
    bottom: var(--nb-spacing-16);
    z-index: 3;
    gap: var(--nb-spacing-12);
    inline-size: fit-content;
    max-inline-size: calc(100% - 32px);
    margin: var(--nb-spacing-16) auto 0;
    padding: var(--nb-spacing-8) var(--nb-spacing-16);
    border-radius: var(--nb-radius-panel, 4px);
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.2);

    .nb-batch-actions__actions {
      flex-wrap: wrap;
      gap: var(--nb-spacing-4);
    }
  }

  // One row on a phone: what does not fit scrolls sideways rather than
  // wrapping onto a second row over the content.
  &--phone .nb-batch-actions__actions {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
}
</style>
