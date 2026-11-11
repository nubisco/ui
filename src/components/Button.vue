<template>
  <component
    :is="linkTag"
    v-nb-tooltip="tooltip"
    :class="[
      'nb-button',
      // `variant` is optional, and interpolating it unguarded put a literal
      // `nb-button--undefined` class on every button that did not pass one.
      resolvedVariant ? `nb-button--${resolvedVariant}` : null,
      `nb-button--${resolvedSize}`,
      { 'nb-button--outlined': resolvedOutlined },
      { 'nb-button--loading': loading },
      { 'nb-button--icon-only': isIconOnly },
      { 'nb-button--with-icon': hasDecoration && !isIconOnly },
      { 'nb-button--pressed': pressed },
      { 'nb-button--flush': toolbar?.flush.value },
      { 'nb-button--explained': explained },
    ]"
    :to="useRouter ? to : undefined"
    v-bind="anchorAttrs"
    :disabled="nativeDisabled"
    :aria-disabled="isInert && !nativeDisabled ? true : undefined"
    :aria-label="ariaLabel"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    :type="linkTag === 'button' ? type : undefined"
    @click="onClick"
  >
    <span v-if="!isIconOnly" class="nb-button__label"><slot /></span>
    <span v-if="hasDecoration" class="nb-button__decorations">
      <span v-if="loading" class="nb-button__spinner" aria-hidden="true" />
      <NbIcon
        v-else-if="icon"
        :name="icon"
        :size="iconSize"
        :weight="iconWeight"
        class="nb-button__icon"
      />
    </span>
  </component>
</template>

<script lang="ts">
const warnedIcons = new Set<string>()

/** A readable key for an icon given by name, glyph module or component. */
function iconKey(icon: unknown): string {
  if (typeof icon === 'string') return icon
  if (icon && (typeof icon === 'object' || typeof icon === 'function')) {
    const named = icon as { glyphName?: unknown }
    if (typeof named.glyphName === 'string') return named.glyphName
  }
  return ''
}
</script>

<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  useAttrs,
  useSlots,
  type Component,
} from 'vue'
import { ESize } from '@/types/Size.d'
import { EButtonType, IButtonProps } from './Button.d'
import NbIcon from './Icon.vue'
import {
  nbTooltip as vNbTooltip,
  type ITooltipOptions,
} from '@/directives/ToolTip.directive'
import { useRouterLink } from '@/composables/useRouterLink.composable'
import { NB_PRIMARY_ACTION_SCOPE } from './PrimaryAction.context'
import { NB_TOOLBAR } from './Toolbar.context'

const props = withDefaults(defineProps<IButtonProps>(), {
  variant: undefined,
  outlined: false,
  // Unset rather than `md`, so a button inside an NbToolbar can tell it was
  // given no size and take the toolbar's. Everywhere else it is still `md`.
  size: undefined,
  disabled: false,
  loading: false,
  icon: undefined,
  iconWeight: 'regular',
  label: undefined,
  disabledReason: undefined,
  tooltipPosition: 'bottom',
  pressed: undefined,
  type: EButtonType.Button,
  href: undefined,
  target: undefined,
  rel: undefined,
  to: undefined,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

/*
 * `tertiary` is a name for a button that already existed: primary, outlined.
 * It renders exactly the classes `variant="primary" outlined` does, and
 * `danger-tertiary` is the same thing for danger. `danger-ghost` is its own
 * class: a ghost's box with danger's meaning.
 */
const resolvedVariant = computed(() => {
  if (props.variant === 'tertiary') return 'primary'
  if (props.variant === 'danger-tertiary') return 'danger'
  return props.variant
})
const resolvedOutlined = computed(
  () =>
    props.outlined ||
    props.variant === 'tertiary' ||
    props.variant === 'danger-tertiary',
)

/*
 * Inside an NbToolbar (or a bar that acts as one, NbBatchActions) a button
 * with no size of its own takes the strip's, so every control in it is the
 * same height as the row it belongs to. A flush toolbar also squares the
 * button's corners, so the buttons meet edge to edge and the last one sits
 * flush in the corner.
 */
const toolbar = inject(NB_TOOLBAR, null)
const resolvedSize = computed(
  () => props.size ?? toolbar?.size.value ?? ESize.Medium,
)

// Inside a header's actions slot (NbPanel, NbCard, NbPageHeader), a filled
// primary counts itself, so the header can warn when it holds two.
const primaryScope = inject(NB_PRIMARY_ACTION_SCOPE, null)
let uncountPrimary: (() => void) | null = null
onMounted(() => {
  if (
    primaryScope &&
    resolvedVariant.value === 'primary' &&
    !resolvedOutlined.value
  ) {
    uncountPrimary = primaryScope.register()
  }
})
onBeforeUnmount(() => uncountPrimary?.())

const slots = useSlots()
const attrs = useAttrs()
const isIconOnly = computed(
  () => !slots.default && !!(props.icon || props.loading),
)
const hasDecoration = computed(() => !!(props.loading || props.icon))

/*
 * An icon-only button is named by `label`, and the same words are its
 * tooltip, anchored below the button: the one place a sighted mouse user
 * learns what an unlabelled icon does. An explicit `aria-label` still wins
 * for the name, so a caller that wants a longer spoken name than the chip
 * ("Delete invoice 2026/002" against "Delete") keeps it.
 */
const ariaLabel = computed(() => {
  if (!isIconOnly.value || !props.label) return undefined
  return (attrs['aria-label'] as string | undefined) ?? props.label
})
const tooltip = computed<ITooltipOptions | undefined>(() => {
  const position = props.tooltipPosition
  // A disabled button that says why: the reason is the tooltip, announced as
  // the button's description, and an icon-only button keeps its label as the
  // chip's header so the chip still says what the button is.
  if (explained.value) {
    return {
      header: isIconOnly.value ? props.label : undefined,
      body: props.disabledReason,
      aria: 'description',
      position,
    }
  }
  return isIconOnly.value && props.label
    ? { body: props.label, aria: 'none', position }
    : undefined
})

// Render a real <RouterLink> when vue-router is installed and `to` is set;
// otherwise a string `to`/`href` becomes a plain <a> and an object `to` (which
// needs a router) falls back to a <button>.
const routerLink = useRouterLink()
const isInert = computed(() => props.disabled || props.loading)
/*
 * A disabled button with a reason stays in the tab order. Native `disabled`
 * takes a button out of it, so a keyboard user could never reach the tooltip
 * that says why the action is unavailable. It carries `aria-disabled`
 * instead, is still announced as unavailable, and the click is swallowed in
 * `onClick` (which also stops a submit button from submitting).
 */
const explained = computed(() => props.disabled && !!props.disabledReason)
const nativeDisabled = computed(() =>
  linkTag.value === 'button' && isInert.value && !explained.value
    ? true
    : undefined,
)
/*
 * A disabled link is a plain <a> with no href. A RouterLink keeps its own
 * click handler and an <a> keeps its href, so `pointer-events: none` only
 * stopped the mouse: Enter on a focused, disabled link still navigated.
 */
const useRouter = computed(
  () => props.to != null && !!routerLink.value && !isInert.value,
)

const resolvedHref = computed<string | undefined>(() => {
  if (typeof props.to === 'string') return props.to
  if (props.href) return props.href
  return undefined
})

const linkTag = computed<string | Component>(() => {
  if (useRouter.value) return routerLink.value as Component
  if (resolvedHref.value) return 'a'
  if (props.to != null && routerLink.value) return 'a'
  return 'button'
})

// Spread rather than bound individually, because an attribute bound to
// `undefined` is not the same as an absent one. RouterLink computes its own
// href and renders it on the <a> it owns; a fallthrough `href` merges over
// that, so `:href="linkTag === 'a' ? resolvedHref : undefined"` produced a
// link with no href in every app that has a router installed.
const anchorAttrs = computed(() => {
  if (linkTag.value !== 'a') return {}
  if (isInert.value) return { role: 'link' }
  return { href: resolvedHref.value, target: props.target, rel: props.rel }
})

function onClick(event: MouseEvent) {
  if (isInert.value) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

/*
 * Both maps stay on the icon scale (16, 20, 24, 32): below 16 a Phosphor
 * stroke drops under a pixel, which is why NbIcon warns on it.
 */
const iconSizeMap: Record<string, number> = {
  xxs: 16,
  xs: 16,
  sm: 16,
  md: 16,
  lg: 16,
  xl: 16,
  xxl: 16,
}
/*
 * Icon-only buttons size their icon differently, and the stylesheet already
 * said so: `--nb-button-icon-size` is set per size and then set AGAIN, larger,
 * under `--icon-only`. Only the spinner read it, so an icon-only button showed
 * a 14px icon and an 18px spinner in the same slot and jumped between them
 * when it started loading.
 */
const iconOnlySizeMap: Record<string, number> = {
  xxs: 16,
  xs: 16,
  sm: 16,
  md: 20,
  lg: 20,
  xl: 24,
  xxl: 32,
}

const iconSize = computed(() => {
  const map = isIconOnly.value ? iconOnlySizeMap : iconSizeMap
  return map[resolvedSize.value] ?? (isIconOnly.value ? 20 : 16)
})

/*
 * An icon-only button has no text, so without an aria-label it is announced as
 * just "button". Nothing stopped that, and it only came out right when a caller
 * remembered the attribute. Warn in development instead of changing the API:
 * the check reads the rendered element after mount, so a name supplied any way
 * that works (aria-label, aria-labelledby, title, visually hidden text, or
 * v-nb-tooltip, which writes aria-label) counts. One warning per icon, so a
 * table of unnamed row actions does not flood the console.
 */
const instance = getCurrentInstance()
onMounted(() => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }
  if (!isIconOnly.value) return
  void nextTick(() => {
    const el = instance?.proxy?.$el as Element | null | undefined
    if (!el || typeof el.getAttribute !== 'function') return
    const named = ['aria-label', 'aria-labelledby', 'title'].some(
      (attr) => (el.getAttribute(attr) ?? '').trim().length > 0,
    )
    if (named || (el.textContent ?? '').trim().length > 0) return
    const key = iconKey(props.icon)
    if (warnedIcons.has(key)) return
    warnedIcons.add(key)
    console.warn(
      `[NbButton] An icon-only button${key ? ` (icon "${key}")` : ''} has no ` +
        'accessible name, so a screen reader announces it as "button". Give ' +
        'it a `label`, which names it and shows the same words as its tooltip.',
      el,
    )
  })
})
</script>

<style scoped lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;
@use '../styles/logic/focus' as focus;
@use '../styles/variables/breakpoints' as bp;
@use '../styles/logic/touch' as touch;
@use '../styles/logic/ink' as ink;

/*
 * Anatomy, after Carbon.
 *
 * The label starts at the left edge and the icon sits at the right edge,
 * never beside the label in the middle. A labelled button keeps 64px at its
 * end whether or not it has an icon: 16px of padding, the 16px icon, and at
 * least 32px between the icon and the label. So adding an icon, or the
 * spinner taking the icon's place while loading, never changes the width.
 *
 * Up to lg (48px) a button is one line tall. xl and xxl are the sizes that
 * bleed to the edge of a modal, side panel or full-screen surface: their
 * label sits at the top left, wraps onto a second line rather than
 * overflowing, and the icon stays pinned to the top right.
 */
.nb-button {
  --nb-button-pad-start: calc(var(--nb-base-unit) * 2);
  --nb-button-pad-end: calc(var(--nb-base-unit) * 8);
  --nb-button-icon-gap: calc(var(--nb-base-unit) * 4);

  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--nb-button-icon-gap);
  border: none;
  /*
   * Standalone, not inset. A button in the middle of a panel does not run
   * parallel to the panel's edges, so it does not follow the panel's corner:
   * it keeps the control radius wherever it is placed. It also stops the
   * concentric context here, so an icon inside it derives from the button
   * rather than from a surface two levels up.
   */
  @include radius.standalone(control);
  // Not inherited from anywhere: a <button> defaults to border-box and an <a>
  // defaults to content-box, so the SAME button was two different sizes
  // depending on whether `href` was set. It showed up on icon-only, where the
  // width is fixed: 32px became 32 + 12 + 12 of padding, and one link sat
  // visibly wider than the buttons beside it.
  box-sizing: border-box;
  font-family: inherit;
  font-size: var(--nb-type-body-compact-size);
  font-weight: var(--nb-font-weight-regular, 400);
  letter-spacing: var(--nb-type-body-compact-letter-spacing, 0.16px);
  line-height: 1;
  text-align: start;
  cursor: pointer;
  transition:
    background var(--nb-motion-short),
    color var(--nb-motion-short),
    opacity var(--nb-motion-short),
    box-shadow var(--nb-motion-short);
  white-space: nowrap;
  outline: none;
  text-decoration: none;
  background: var(--nb-c-contrast);
  color: var(--nb-c-surface);
  padding-inline: var(--nb-button-pad-start) var(--nb-button-pad-end);

  &:hover:not(:disabled):not([aria-disabled='true']) {
    background: color-mix(
      in srgb,
      var(--nb-c-contrast) 86%,
      var(--nb-c-surface)
    );
  }
  &:active:not(:disabled):not([aria-disabled='true']) {
    background: color-mix(
      in srgb,
      var(--nb-c-contrast) 76%,
      var(--nb-c-surface)
    );
  }

  &:focus-visible {
    @include focus.ring;
  }

  // With an icon (or the spinner) the 64px end splits into padding, icon and gap.
  &--with-icon {
    --nb-button-pad-end: var(--nb-button-pad-start);
  }

  &__label {
    flex: 0 1 auto;
    min-width: 0;
  }

  &--xxs {
    height: calc(var(--nb-base-unit) * 2);
    --nb-button-pad-start: var(--nb-base-unit);
    --nb-button-pad-end: var(--nb-base-unit);
    --nb-button-icon-gap: calc(var(--nb-base-unit) * 0.5);
    font-size: var(--nb-type-body-sm-size);
    --nb-button-icon-size: 16px;
  }
  &--xs {
    height: calc(var(--nb-base-unit) * 3);
    --nb-button-icon-size: 16px;
  }
  &--sm {
    height: calc(var(--nb-base-unit) * 4);
    --nb-button-icon-size: 16px;
  }
  // The small and medium sizes are 16 to 40px tall, under a fingertip's 44.
  // On a phone touch screen an invisible box takes the taps around them, and
  // the button looks exactly as it does everywhere else. Medium was missing,
  // so a default button (NbFileUploader's, a form's Save) was a 40px target.
  &--xxs,
  &--xs,
  &--sm,
  &--md {
    @include touch.hit-area($position: false);

    // The hit box needs a positioning context. At zero specificity, so a host
    // that positions the button itself (absolute, sticky) still wins, and its
    // box is the context instead.
    @include bp.phone-touch {
      @at-root :where(#{&}) {
        position: relative;
      }
    }
  }
  &--md {
    height: calc(var(--nb-base-unit) * 5);
    --nb-button-icon-size: 16px;
  }
  &--lg {
    height: calc(var(--nb-base-unit) * 6);
    --nb-button-icon-size: 16px;
  }
  &--xl,
  &--xxl {
    height: auto;
    max-width: 20rem;
    align-items: flex-start;
    padding-block: calc(var(--nb-base-unit) * 2);
    white-space: normal;
    line-height: var(--nb-type-body-compact-line-height, 1.2857);
    --nb-button-icon-size: 16px;

    // Centre the icon on the first line of the label.
    .nb-button__decorations {
      height: 1lh;
    }
  }
  &--xl {
    min-height: calc(var(--nb-base-unit) * 8);
  }
  &--xxl {
    min-height: calc(var(--nb-base-unit) * 10);
  }

  // Icon-only: no slot content, so a square button with the icon centred.
  &--icon-only {
    padding: 0;
    align-items: center;
    justify-content: center;
    max-width: none;

    &.nb-button--xxs {
      width: 16px;
      --nb-button-icon-size: 16px;
    }
    &.nb-button--xs {
      width: 24px;
      --nb-button-icon-size: 16px;
    }
    &.nb-button--sm {
      width: 32px;
      --nb-button-icon-size: 16px;
    }
    &.nb-button--md {
      width: 40px;
      --nb-button-icon-size: 20px;
    }
    &.nb-button--lg {
      width: 48px;
      --nb-button-icon-size: 20px;
    }
    &.nb-button--xl {
      width: 64px;
      height: 64px;
      --nb-button-icon-size: 24px;
    }
    &.nb-button--xxl {
      width: 80px;
      height: 80px;
      --nb-button-icon-size: 32px;
    }

    .nb-button__decorations {
      height: auto;
    }
  }

  &--primary {
    background: var(--nb-c-primary);
    color: var(--nb-c-primary-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-primary-hover);
      color: var(--nb-c-primary-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-primary-active);
      color: var(--nb-c-primary-active-a11y);
    }
  }

  &--secondary {
    background: var(--nb-c-secondary);
    color: var(--nb-c-secondary-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-secondary-hover);
      color: var(--nb-c-secondary-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-secondary-active);
      color: var(--nb-c-secondary-active-a11y);
    }
  }

  /*
   * Ghost: no box until the pointer is on it, and then a neutral one.
   *
   * The hover is the surface's own hover, the grey every row, list item and
   * hand-made icon control already used, so a ghost close button and the row
   * beside it light the same way. It used to fill with the brand colour, the
   * loudest thing on the page for the quietest button on it. A ghost keeps
   * 16px on both sides, and its icon follows the label 8px later rather than
   * sitting at the far edge: a ghost is sized by its content.
   */
  &--ghost,
  &--danger-ghost {
    background: transparent;
    color: var(--nb-c-contrast);
    --nb-button-pad-end: var(--nb-button-pad-start);
    --nb-button-icon-gap: var(--nb-base-unit);
    justify-content: flex-start;
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-surface-hover);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: color-mix(in srgb, var(--nb-c-contrast) 14%, transparent);
    }
  }
  &--ghost.nb-button--xxs,
  &--danger-ghost.nb-button--xxs {
    --nb-button-icon-gap: calc(var(--nb-base-unit) * 0.5);
  }

  // A toggle that is on. Ghost is where toggles live (toolbars, view
  // switches), so that is where the pressed state is drawn.
  &--pressed {
    &.nb-button--ghost,
    &.nb-button--danger-ghost {
      background: color-mix(in srgb, var(--nb-c-contrast) 12%, transparent);
    }
  }

  // In a flush toolbar: square corners, so neighbours meet edge to edge and
  // the last button fills the toolbar's corner. The toolbar's own corner (a
  // table's, a panel's) is what rounds it.
  &--flush {
    border-radius: 0;
  }

  // Danger's meaning on a ghost's box. Carbon's danger--ghost: red text at
  // rest, filled red on hover.
  &--danger-ghost {
    color: ink.ink(danger);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-danger);
      color: var(--nb-c-danger-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-danger-active);
      color: var(--nb-c-danger-active-a11y);
    }
  }

  /*
   * Link: a button that reads as a text link.
   *
   * For an action that sits inside text or a table cell (a key that opens its
   * record, "Select" beside a field, a crumb), where a boxed button is louder
   * than the line around it. No fill, no padding, no fixed height: it takes
   * the font, weight and line height of where it sits, so it lines up with
   * the text beside it and `size` does not change it. It stays a real
   * <button>, <a> or <RouterLink>, so it keeps the keyboard, the disabled
   * state and the focus ring every other variant has.
   *
   * The colour is `--nb-c-link`: primary drawn as ink, the same lift an
   * outlined primary button uses, which `tests/textRoles.test.ts` holds at
   * WCAG AA on every layer of both themes. Hover and focus add an underline
   * and step to `--nb-c-link-hover` rather than painting a wash, so the
   * ground it is measured on never changes.
   * `--nb-button-link-color` re-points it. Set it to `currentColor` to take
   * the colour of the surrounding text (not `inherit`, which on a custom
   * property inherits the property, not the colour).
   */
  &--link {
    height: auto;
    min-height: 0;
    max-width: none;
    padding: 0;
    gap: 0.35em;
    justify-content: flex-start;
    background: transparent;
    color: var(--nb-button-link-color, var(--nb-c-link));
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    white-space: normal;
    text-align: start;
    vertical-align: baseline;
    text-decoration: none;
    text-underline-offset: 0.2em;
    border-radius: 2px;
    --nb-button-icon-size: 1em;

    &:hover:not(:disabled):not([aria-disabled='true']),
    &:focus-visible {
      color: var(--nb-button-link-color, var(--nb-c-link-hover));
      text-decoration: underline;
      background: transparent;
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      text-decoration-thickness: 2px;
      background: transparent;
    }
    &:focus-visible {
      outline: 2px solid var(--nb-c-focus-ring);
      outline-offset: 2px;
      box-shadow: none;
    }
    // Icon-only sets a square width per size. A link has no box to square.
    &.nb-button--icon-only {
      width: auto;
      height: auto;
    }
  }

  &--warning {
    background: var(--nb-c-warning);
    color: var(--nb-c-warning-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-warning-hover);
      color: var(--nb-c-warning-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-warning-active);
      color: var(--nb-c-warning-active-a11y);
    }
  }

  &--danger {
    background: var(--nb-c-danger);
    color: var(--nb-c-danger-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-danger-hover);
      color: var(--nb-c-danger-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-danger-active);
      color: var(--nb-c-danger-active-a11y);
    }
  }

  &--success {
    background: var(--nb-c-success);
    color: var(--nb-c-success-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-success-hover);
      color: var(--nb-c-success-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-success-active);
      color: var(--nb-c-success-active-a11y);
    }
  }

  &--info {
    background: var(--nb-c-info);
    color: var(--nb-c-info-a11y);
    &:hover:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-info-hover);
      color: var(--nb-c-info-hover-a11y);
    }
    &:active:not(:disabled):not([aria-disabled='true']) {
      background: var(--nb-c-info-active);
      color: var(--nb-c-info-active-a11y);
    }
  }

  // Outlined modifier: transparent background, colored border and text
  // Applied to all variants except ghost (which has no bg by design)
  &--outlined:not(&--ghost):not(&--link) {
    background: transparent;
    color: var(--nb-c-contrast);
    border: 1px solid currentColor;
  }

  /*
   * Outlined text and border are drawn as INK, straight onto whatever surface
   * the button sits on, so they read `ink.ink()` rather than the fill colour.
   * In light mode that is the same colour exactly. In dark mode the fills are
   * picked to carry their own foreground, not to be read against a dark layer,
   * and the outlined secondary measured as low as 1.21:1 there. See
   * `styles/logic/_ink.scss`.
   *
   * Hover fills solid, the way Carbon's tertiary does: the border was already
   * the variant's colour, so the button becomes the filled variant under the
   * pointer. An 8% tint was too faint to read as a response on a dark layer.
   */
  &--outlined {
    @each $variant in primary, secondary, danger, warning, success, info {
      &.nb-button--#{$variant} {
        color: ink.ink($variant);
        &:hover:not(:disabled):not([aria-disabled='true']) {
          color: var(--nb-c-#{$variant}-hover-a11y);
          background: var(--nb-c-#{$variant}-hover);
          border-color: var(--nb-c-#{$variant}-hover);
        }
        &:active:not(:disabled):not([aria-disabled='true']) {
          color: var(--nb-c-#{$variant}-active-a11y);
          background: var(--nb-c-#{$variant}-active);
          border-color: var(--nb-c-#{$variant}-active);
        }
      }
    }
  }

  /*
   * Disabled, from tokens rather than opacity.
   *
   * Fading the whole button left a disabled primary still reading as the
   * page's primary, only paler, and its contrast moved with whatever sat
   * behind it. A filled button now takes the disabled fill, an outlined one
   * the disabled border, and a ghost or link only the disabled text.
   * Loading is not disabled to the eye: it keeps its colours and the wait
   * cursor while the native `disabled` keeps it from being pressed twice.
   */
  &:disabled:not(&--loading),
  &[aria-disabled='true']:not(&--loading) {
    --nb-button-disabled-text: color-mix(
      in srgb,
      var(--nb-c-contrast) 40%,
      var(--nb-c-component-disabled)
    );
    cursor: not-allowed;
    pointer-events: none;
    background: var(--nb-c-component-disabled);
    color: var(--nb-button-disabled-text);
    border-color: transparent;

    &.nb-button--outlined {
      background: transparent;
      border-color: var(--nb-c-component-disabled);
    }
    &.nb-button--ghost,
    &.nb-button--danger-ghost,
    &.nb-button--link {
      background: transparent;
      color: color-mix(in srgb, var(--nb-c-contrast) 40%, transparent);
    }
  }

  // A disabled button that explains itself takes the pointer, so its
  // tooltip can open on hover. Clicks are swallowed in script.
  &--explained:not(&--loading) {
    pointer-events: auto;
  }

  &--loading {
    cursor: wait;
    pointer-events: none;
  }

  &__decorations {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    flex-shrink: 0;
  }

  &__spinner {
    width: var(--nb-button-icon-size, 16px);
    height: var(--nb-button-icon-size, 16px);
    box-sizing: border-box;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: nb-spin 0.6s linear infinite;
  }

  @keyframes nb-spin {
    to {
      transform: rotate(360deg);
    }
  }

  // Freezing the ring leaves a three-quarter arc parked at one angle, which
  // reads as a rendering fault rather than as work in progress. Close the ring
  // and breathe it instead: no rotation, still alive. This matches what
  // NbSpinner does under the same preference, so the two indicators do not
  // disagree inside one product.
  @include motion.reduced {
    .nb-button__spinner {
      border-top-color: currentcolor;
      animation: nb-button-spinner-breathe 1600ms ease-in-out infinite;
    }
  }

  @keyframes nb-button-spinner-breathe {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 1;
    }
  }
}
</style>
