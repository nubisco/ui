<template>
  <div ref="rootRef" :class="rootClass">
    <template v-for="item in shown" :key="item.id">
      <!-- Two branches because NbButton decides it is icon-only from the
           absence of a default slot, and an empty slot is still a slot. -->
      <NbButton
        v-if="iconOnly(item)"
        :variant="variantOf(item)"
        :outlined="item.outlined"
        :size="buttonSize"
        :disabled="item.disabled"
        :loading="item.loading"
        :icon="item.icon"
        :label="item.label"
        :disabled-reason="item.disabledReason"
        :pressed="item.pressed"
        :data-action-id="measuring ? item.id : undefined"
        @click="choose(item)"
      />
      <NbButton
        v-else
        :variant="variantOf(item)"
        :outlined="item.outlined"
        :size="buttonSize"
        :disabled="item.disabled"
        :loading="item.loading"
        :icon="item.icon"
        :disabled-reason="item.disabledReason"
        :pressed="item.pressed"
        :data-action-id="measuring ? item.id : undefined"
        @click="choose(item)"
        >{{ item.label }}</NbButton
      >
    </template>
    <NbOverflowMenu
      v-if="folded && hasOverflow"
      class="nb-action-group__more"
      :items="hidden"
      :label="overflowLabel"
      :size="buttonSize"
      @select="(id: string) => emit('select', id)"
    >
      <slot name="menu" />
    </NbOverflowMenu>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from 'vue'
import NbButton from './Button.vue'
import NbOverflowMenu from './OverflowMenu.vue'
import type { IActionGroupItem, IActionGroupProps } from './ActionGroup.d'
import type { TButtonVariant } from './Button.d'
import { NB_TOOLBAR } from './Toolbar.context'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import { hasSlotContent } from '@/utils/slotContent.helper'
import { fitActions } from '@/utils/actionFit.helper'

const props = withDefaults(defineProps<IActionGroupProps>(), {
  size: undefined,
  overflow: 'never',
  overflowLabel: undefined,
  phoneVisible: 1,
})

const emit = defineEmits<{ select: [id: string] }>()

const slots = useSlots()
const { phone } = usePhoneLayout()
const nbStrings = useNbStrings()
const toolbar = inject(NB_TOOLBAR, null)

// Inside a toolbar the buttons take the toolbar's height. Anywhere else a
// group without a size keeps the `sm` it has always had.
const buttonSize = computed(() => props.size ?? (toolbar ? undefined : 'sm'))

const rootClass = computed(() => [
  'nb-action-group',
  {
    'nb-action-group--in-toolbar': !!toolbar,
    'nb-action-group--auto': props.overflow === 'auto' && !phone.value,
  },
])

// #region fitting by width
/*
 * `overflow: 'auto'` folds by the room there is, not by the viewport: as
 * many actions as fit stay on screen, in reading order, and the rest go to
 * the overflow menu. Each button's width is read once, while every action
 * is on screen (the first frame, and again whenever the list of actions
 * changes), and kept. A resize then only does arithmetic against those
 * widths, so folding never makes the row flicker through a second layout.
 */
const rootRef = ref<HTMLElement | null>(null)
const widths = ref<Map<string, number>>(new Map())
const fitCount = ref<number | null>(null)
const measuring = computed(
  () => props.overflow === 'auto' && !phone.value && fitCount.value === null,
)

function measure() {
  const root = rootRef.value
  if (!root) return
  const next = new Map<string, number>()
  root
    .querySelectorAll<HTMLElement>('[data-action-id]')
    .forEach((el) => next.set(el.dataset.actionId!, el.offsetWidth))
  widths.value = next
}

function refit() {
  const root = rootRef.value
  if (!root || props.overflow !== 'auto' || phone.value) return
  if (fitCount.value === null) measure()
  const list = props.items.map((item) => widths.value.get(item.id) ?? 0)
  const style = getComputedStyle(root)
  const gap = parseFloat(style.columnGap) || 0
  // The trigger is a square, as tall as the buttons beside it.
  const first = root.querySelector<HTMLElement>('.nb-button')
  const trigger = first?.offsetHeight ?? 0
  fitCount.value = fitActions(list, root.clientWidth, trigger, gap)
}

let observer: ResizeObserver | undefined

function observe() {
  observer?.disconnect()
  observer = undefined
  if (
    props.overflow !== 'auto' ||
    !rootRef.value ||
    typeof ResizeObserver === 'undefined'
  ) {
    return
  }
  observer = new ResizeObserver(() => refit())
  observer.observe(rootRef.value)
}

onMounted(observe)
onBeforeUnmount(() => observer?.disconnect())

// A new set of actions has new widths: show them all for one frame to read
// them, then fit again.
watch(
  () => [props.overflow, phone.value, props.items.map((i) => i.id).join()],
  async () => {
    fitCount.value = null
    await nextTick()
    observe()
    refit()
  },
)
// #endregion

/**
 * Folded means some actions live in the overflow menu. `'never'` is checked
 * first, so a group that never opted in renders the plain buttons whatever
 * the viewport says.
 */
const folded = computed(() => {
  if (props.overflow === 'never') return false
  if (props.overflow === 'always') return true
  if (phone.value) return true
  if (props.overflow === 'auto') {
    return fitCount.value !== null && fitCount.value < props.items.length
  }
  return false
})

/**
 * The actions that stay on screen when folded. By width: the first ones
 * that fit. Otherwise the first `phoneVisible` flagged primary, or the first
 * ones when the product flagged none. The rest keep their reading order in
 * the menu.
 */
const visible = computed<IActionGroupItem[]>(() => {
  if (props.overflow === 'auto' && !phone.value) {
    return props.items.slice(0, fitCount.value ?? props.items.length)
  }
  const count = Math.max(0, props.phoneVisible)
  const primary = props.items.filter((item) => item.priority === 'primary')
  return (primary.length ? primary : props.items).slice(0, count)
})

const shown = computed(() => (folded.value ? visible.value : props.items))

const hidden = computed<IActionGroupItem[]>(() =>
  props.items.filter((item) => !visible.value.includes(item)),
)

// No trigger for a menu with nothing in it.
const hasOverflow = computed(
  () => hidden.value.length > 0 || hasSlotContent(slots, 'menu'),
)

const overflowLabel = computed(
  () => props.overflowLabel ?? nbStrings.value.overflowMenuLabel,
)

/**
 * An action asked to be icon-only is, everywhere. On a phone the actions left
 * on screen also drop their text to fit a 360px topbar. Either way the label
 * becomes the button's `label`: its accessible name and its tooltip. An
 * action without an icon would be an empty square, so it keeps its text.
 */
function iconOnly(item: IActionGroupItem): boolean {
  if (!item.icon) return false
  return !!item.iconOnly || (folded.value && phone.value)
}

function variantOf(item: IActionGroupItem): TButtonVariant | undefined {
  return item.variant ?? (item.danger ? 'danger' : undefined)
}

function choose(item: IActionGroupItem) {
  if (item.disabled || item.loading) return
  item.onSelect?.()
  emit('select', item.id)
}
</script>

<style lang="scss">
// A row of buttons with the library's 8px between them, wherever it is put.
.nb-action-group {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nb-spacing-8);

  /*
   * Inside a toolbar the buttons are the toolbar's own children: they take
   * its gap (none when it is flush), its height and its roving focus, as the
   * same buttons placed there by hand would.
   */
  &--in-toolbar {
    display: contents;
  }

  // Folding by width: the group takes the room it is given and no more, and
  // the fit decides what shows. Never wraps, which would defeat the fit.
  &--auto {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    justify-content: flex-end;
    min-width: 0;
    overflow: hidden;
  }

  &--in-toolbar.nb-action-group--auto {
    align-self: stretch;
    align-items: inherit;
    gap: inherit;
  }
}
</style>
