<template>
  <component
    :is="interactive ? 'button' : 'span'"
    ref="rootRef"
    :class="classes"
    v-bind="rootAttrs"
    @click="onRootClick"
    @keydown="onRootKeydown"
  >
    <NbIcon
      v-if="reverting"
      class="nb-ai-label--revert"
      :name="iconRevert"
      :size="revertIconSize"
      weight="regular"
    />
    <template v-else>
      <span
        v-if="variant === EAiLabelVariant.Inline"
        class="nb-ai-label--dot"
        aria-hidden="true"
      />
      <span
        v-if="variant === EAiLabelVariant.Inline && say('text')"
        class="nb-ai-label--text"
        aria-hidden="true"
        >{{ say('text') }}</span
      >
      <svg
        v-else
        class="nb-ai-label--glyph"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <path
          d="M 104.301 197.8 L 94.501 162.4 L 53.101 162.4 L 43.501 197.8 L 17.101 197.8 L 56.301 58.2 L 92.701 58.2 L 132.101 197.8 L 104.301 197.8 Z M 74.701 84 L 73.101 84 L 57.701 141 L 90.101 141 L 74.701 84 Z M 150.099 197.8 L 150.099 178.2 L 181.499 178.2 L 181.499 77.8 L 150.099 77.8 L 150.099 58.2 L 238.899 58.2 L 238.899 77.8 L 207.499 77.8 L 207.499 178.2 L 238.899 178.2 L 238.899 197.8 L 150.099 197.8 Z"
          fill="currentColor"
        />
      </svg>
    </template>

    <!-- The explanation. Teleported, so DOM events inside it never reach the
         button, and a click in it is not a click on the label. -->
    <Teleport v-if="explains" :to="teleportTo">
      <div
        v-if="isOpen && phone"
        class="nb-ai-label--scrim"
        aria-hidden="true"
        @click="close()"
      />
      <div
        v-if="isOpen"
        :id="popoverId"
        ref="popoverRef"
        role="dialog"
        :aria-label="say('dialog')"
        tabindex="-1"
        :class="[
          'nb-ai-label--popover',
          phone ? 'nb-ai-label--popover-sheet' : `nb-ai-label--popover-${side}`,
        ]"
        v-bind="layerProps"
        :style="phone ? undefined : popoverStyle"
        @keydown="onPopoverKeydown"
        @focusout="onPopoverFocusout"
      >
        <div class="nb-ai-label--content">
          <slot name="explain">
            <p>{{ explain }}</p>
          </slot>
        </div>
        <div
          v-if="$slots.actions || plainAvailable"
          class="nb-ai-label--actions"
        >
          <slot name="actions" />
          <NbButton
            v-if="plainAvailable"
            variant="ghost"
            size="sm"
            @click="onShowPlain"
          >
            {{ say('showPlain') }}
          </NbButton>
        </div>
      </div>
    </Teleport>
  </component>
</template>

<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue'
import * as iconRevert from '@nubisco/ui/icons/arrow-counter-clockwise'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import { useStableId } from '@/composables/useStableId.composable'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { usePhoneLayout } from '@/composables/usePhoneLayout.composable'
import {
  placeAnchored,
  viewportSize,
  type TAnchorSide,
} from '@/utils/anchorPosition.helper'
import { EAiLabelVariant, EAiLabelSize, type IAiLabelProps } from './AiLabel.d'

const props = withDefaults(defineProps<IAiLabelProps>(), {
  variant: EAiLabelVariant.Default,
  size: EAiLabelSize.Medium,
  static: false,
  label: undefined,
  text: undefined,
  explain: undefined,
  placement: 'bottom',
  teleportTo: 'body',
  revertable: false,
  revertLabel: undefined,
  plainAvailable: false,
  showPlainLabel: undefined,
})

const emit = defineEmits<{
  /** The explanation opened. */
  open: []
  /** The explanation closed. */
  close: []
  /** Restore the AI value the person edited. Only while `revertable`. */
  revert: []
  /** Swap the AI text for the plain rendering of the same facts. */
  'show-plain': []
}>()

const slots = useSlots()
const attrs = useAttrs()

/**
 * The words the label says, in English. A prop replaces any of them, and
 * every read goes through `say()`, so a strings provider can sit between the
 * prop and this fallback without a change to the props.
 */
const STRINGS = {
  /** Accessible name of the label when it is a button. */
  control: 'AI, show information',
  /** Accessible name of the label when it is a mark. */
  mark: 'Written by AI',
  /** The visible word of the inline variant. */
  text: 'AI',
  /** Accessible name of the explanation. */
  dialog: 'About this AI content',
  /** Accessible name of the label once a person has edited the AI value. */
  revert: 'Revert to AI input',
  /** The action that swaps in the plain version. */
  showPlain: 'Show the plain version',
} as const

function say(key: keyof typeof STRINGS): string {
  const fromProp: Partial<Record<keyof typeof STRINGS, string | undefined>> = {
    control: props.label,
    mark: props.label,
    text: props.text,
    revert: props.revertLabel,
    showPlain: props.showPlainLabel,
  }
  return fromProp[key] ?? STRINGS[key]
}

/** Something to open: an explanation, actions, or the plain version. */
const explains = computed(
  () =>
    !props.static &&
    !props.revertable &&
    !!(slots.explain || slots.actions || props.explain || props.plainAvailable),
)

/** After a person edits the AI value, the label becomes the way back. */
const reverting = computed(() => !props.static && props.revertable)

/**
 * A button exists because there is something to do. A label with nothing to
 * open and no click listener is a mark, never an inert button: a screen
 * reader would otherwise reach a control that does nothing.
 *
 * `useAttrs()` is not reactive on its own, but a change of listeners
 * re-renders the component, and the template reads this on every render.
 */
const interactive = computed(
  () => explains.value || reverting.value || (!props.static && !!attrs.onClick),
)

const popoverId = `${useStableId({})}-explain`

const rootAttrs = computed(() => {
  if (!interactive.value) return { role: 'img', 'aria-label': say('mark') }
  if (reverting.value) return { type: 'button', 'aria-label': say('revert') }
  return {
    type: 'button',
    'aria-label': say('control'),
    ...(explains.value && {
      'aria-expanded': isOpen.value ? 'true' : 'false',
      'aria-controls': popoverId,
    }),
  }
})

const classes = computed(() => ({
  'nb-ai-label': true,
  [`nb-ai-label__${props.variant}`]: true,
  [`nb-ai-label__${props.size}`]: true,
  'nb-ai-label__static': !interactive.value,
  'nb-ai-label__reverting': reverting.value,
  'nb-ai-label__open': isOpen.value,
}))

const revertIconSize = computed(
  () => ({ sm: 12, md: 16, lg: 20 })[props.size] ?? 16,
)

// ── The explanation ────────────────────────────────────────────────────

// Teleported, so its DOM parent says nothing about depth. An overlay pins
// to the top layer, which keeps slotted panels on the right surface.
const { layerProps } = useSurfaceLayer({ overlay: true })
const { phone } = usePhoneLayout()

const rootRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const side = ref<TAnchorSide>(props.placement as TAnchorSide)
const position = ref({ top: 0, left: 0 })

const popoverStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
}))

function reposition() {
  const root = rootRef.value
  const popover = popoverRef.value
  if (!root || !popover || phone.value) return
  // Layout size, not getBoundingClientRect, so the entrance animation's
  // scale does not shrink what is measured (see NbInfoHint).
  const placement = placeAnchored(
    root.getBoundingClientRect(),
    { width: popover.offsetWidth, height: popover.offsetHeight },
    { side: props.placement as TAnchorSide, viewport: viewportSize() },
  )
  side.value = placement.side
  position.value = { top: placement.top, left: placement.left }
}

function open() {
  if (!explains.value || isOpen.value) return
  isOpen.value = true
  emit('open')
  // Two frames: the first mounts the popover, the second can measure it.
  void nextTick(() => {
    reposition()
    requestAnimationFrame(reposition)
  })
}

/**
 * Closes the explanation. `returnFocus` puts focus back on the label, which
 * is what Escape and the end of the content do. An outside click leaves
 * focus where the person put it.
 */
function close(returnFocus = false) {
  if (!isOpen.value) return
  isOpen.value = false
  emit('close')
  if (returnFocus) rootRef.value?.focus()
}

function onRootClick() {
  if (reverting.value) {
    emit('revert')
    return
  }
  if (!explains.value) return
  if (isOpen.value) close()
  else open()
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  return Array.from(
    popoverRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
  )
}

function onRootKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
    return
  }
  // The explanation is teleported, so it is not next in the tab order. Tab
  // from the label goes into it, the way it would if it sat beside it.
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    const first = focusables()[0] ?? popoverRef.value
    first?.focus()
  }
}

function onPopoverKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close(true)
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  // Shift+Tab off the start goes back to the label. Tab off the end closes
  // the explanation and returns to the label, so focus never falls into the
  // page from a teleported box it cannot see the way back from.
  if (event.shiftKey && (active === first || active === popoverRef.value)) {
    event.preventDefault()
    rootRef.value?.focus()
  } else if (!event.shiftKey && (active === last || !items.length)) {
    event.preventDefault()
    close(true)
  }
}

function onPopoverFocusout(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (!next) return
  if (popoverRef.value?.contains(next)) return
  if (rootRef.value?.contains(next)) return
  close()
}

function onShowPlain() {
  emit('show-plain')
  close(true)
}

function onDocumentPointerDown(event: Event) {
  const target = event.target as Node | null
  if (!target) return
  if (rootRef.value?.contains(target)) return
  if (popoverRef.value?.contains(target)) return
  close()
}

function onScroll(event: Event) {
  // On a phone the explanation is a sheet, fixed to the screen: a scroll
  // behind it does not move it.
  if (phone.value) return
  if (popoverRef.value?.contains(event.target as Node)) return
  reposition()
}

// Listeners exist only while the explanation does.
function listen(on: boolean) {
  if (typeof document === 'undefined') return
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocumentPointerDown, true)
  window[method]('resize', reposition)
  window[method]('scroll', onScroll, true)
}

watch(isOpen, (value) => listen(value))

// A label that stops explaining (it became revertable, or lost its content)
// cannot leave a box open with nothing to anchor it.
watch(explains, (value) => {
  if (!value) close()
})

onBeforeUnmount(() => listen(false))

defineExpose({ open, close, isOpen })
</script>

<style lang="scss" scoped>
@use '../styles/logic/radius' as radius;
@use '../styles/variables/breakpoints' as bp;

.nb-ai-label {
  --nb-ai-label-box: calc(var(--nb-base-unit) * 4);
  --nb-ai-label-glyph: calc(var(--nb-base-unit) * 2);
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--nb-ai-label-box);
  height: var(--nb-ai-label-box);
  margin: 0;
  padding: 0;
  border: solid 1px var(--nb-c-border);
  background: transparent;
  color: inherit;
  font: inherit;
  vertical-align: middle;
  // A small mark, so it follows the control corner.
  @include radius.standalone(control-sm);

  &--dot {
    flex-shrink: 0;
    width: calc(var(--nb-base-unit) / 2);
    height: calc(var(--nb-base-unit) / 2);
    border-radius: var(--nb-radius-pill);
    background: currentColor;
  }

  &--glyph {
    width: var(--nb-ai-label-glyph);
    height: var(--nb-ai-label-glyph);
  }

  &--text {
    font-weight: var(--nb-type-label-md-weight);
    line-height: 1;
  }

  // 24, 32 and 40px on the base unit, with a glyph half the box.
  &__sm {
    --nb-ai-label-box: calc(var(--nb-base-unit) * 3);
    --nb-ai-label-glyph: calc(var(--nb-base-unit) * 1.5);
  }

  &__lg {
    --nb-ai-label-box: calc(var(--nb-base-unit) * 5);
    --nb-ai-label-glyph: calc(var(--nb-base-unit) * 2.5);
  }

  // Inline: a dot and a word, set in the type it sits beside (12, 14, 16px).
  &__inline {
    gap: calc(var(--nb-base-unit) / 2);
    width: fit-content;
    height: auto;
    padding: calc(var(--nb-base-unit) / 4);
    border: none;
    font-size: var(--nb-font-size-14);

    &.nb-ai-label__sm {
      font-size: var(--nb-font-size-12);
    }

    &.nb-ai-label__lg {
      font-size: var(--nb-font-size-16);
    }

    .nb-ai-label--glyph {
      width: 1.15em;
      height: 1.15em;
    }
  }

  // Once a person has edited the value, the label is an undo button: no
  // border, the size of the label it replaced.
  &__reverting {
    border-color: transparent;
  }

  &:not(.nb-ai-label__static) {
    cursor: pointer;

    &:focus-visible {
      outline: solid 2px var(--nb-c-focus-ring);
      outline-offset: 1px;
    }
  }

  &__default:not(.nb-ai-label__static):hover,
  &__default.nb-ai-label__open {
    background: var(--nb-c-contrast);
    color: var(--nb-c-surface);
  }

  &__inline:not(.nb-ai-label__static):hover,
  &__inline.nb-ai-label__open {
    outline: solid 1px var(--nb-c-border);
  }
}

// ── The explanation ──────────────────────────────────────────────────────

.nb-ai-label--popover {
  // --nb-c-surface / --nb-c-border come from the nb-layer-* class that
  // useSurfaceLayer binds.
  position: fixed;
  z-index: var(--nb-zindex-tooltip);
  box-sizing: border-box;
  width: max-content;
  max-width: calc(var(--nb-base-unit) * 40); // 320px
  padding: calc(var(--nb-base-unit) * 2);
  border: 1px solid var(--nb-c-border);
  @include radius.surface(popover);
  background: var(--nb-c-surface);
  color: var(--nb-c-text);
  box-shadow: 0 calc(var(--nb-base-unit) * 0.5) calc(var(--nb-base-unit) * 2)
    var(--nb-c-scrim);
  text-align: left;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
  }
}

.nb-ai-label--content {
  font-family: var(--nb-type-body-sm-family);
  font-size: var(--nb-type-body-sm-size);
  font-weight: var(--nb-type-body-sm-weight);
  line-height: var(--nb-type-body-sm-line-height);

  :deep(p) {
    margin: 0 0 var(--nb-base-unit);

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(dl),
  :deep(ul) {
    margin: 0 0 var(--nb-base-unit);
  }
}

.nb-ai-label--actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nb-base-unit);
  margin-top: calc(var(--nb-base-unit) * 1.5);
  padding-top: calc(var(--nb-base-unit) * 1.5);
  border-top: 1px solid var(--nb-c-border);
}

// ── Phone: the explanation is a bottom sheet over a dimmed page ─────────
@include bp.phone {
  .nb-ai-label--scrim {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: var(--nb-c-scrim);
  }

  .nb-ai-label--popover-sheet {
    inset-inline: 0;
    bottom: 0;
    z-index: 9999;
    width: 100%;
    max-width: none;
    max-height: 80dvh;
    overflow-y: auto;
    border-inline: 0;
    border-bottom: 0;
    // Rounded where it meets the page, square at the screen edge.
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    padding-bottom: calc(
      calc(var(--nb-base-unit) * 2) + env(safe-area-inset-bottom)
    );
  }
}
</style>
