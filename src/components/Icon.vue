<template>
  <i
    :class="classes"
    :style="styles"
    v-bind="attributes"
    @click="!clickable ? undefined : emit('click', $event)"
    @keydown="onKeydown"
    @keyup="onKeyup"
  >
    <component
      :is="iconComponent"
      v-if="iconComponent"
      aria-hidden="true"
      focusable="false"
    />
  </i>
</template>

<script lang="ts">
const warnedSizes = new Set<string>()
let warnedClickable = false

/** Every name `size` accepts, the deprecated ones included. */
const ICON_SIZE_NAMES: readonly string[] = [
  'xxs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'xxl',
]
</script>

<script setup lang="ts">
import { computed, useAttrs, watch } from 'vue'
import { EAnimationMode, EWeight, EIconSize, IIconProps } from './Icon.d'
import { useStableId } from '@/composables/useStableId.composable'
import {
  getRegisteredIcon,
  type ICustomIconWeights,
} from '@/composables/iconRegistry'
import {
  glyphNameOf,
  pickWeight,
  resolveFromCatalog,
} from '@/composables/glyphCatalog.composable'

const props = withDefaults(defineProps<IIconProps>(), {
  name: undefined,
  icon: undefined,
  size: 'sm',
  animation: null,
  animationMode: EAnimationMode.Always,
  color: undefined,
  weight: EWeight.Regular,
  title: undefined,
  label: undefined,
  clickable: false,
  hoverable: false,
})

const emit = defineEmits(['click'])

/*
 * The size scale is 16, 20, 24 and 32 (`sm`, `md`, `lg`, `xl`). Below 16 a
 * Phosphor stroke drops under a pixel and the glyph turns to a grey smudge, so
 * `xs`, `xxs` and any number under 16 still render, and say so once in
 * development. One warning per offending value, not per icon, so a table of
 * small icons does not flood the console.
 */
function checkSize(size: IIconProps['size']) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production')
    return
  const tooSmall =
    size === 'xs' || size === 'xxs' || (typeof size === 'number' && size < 16)
  if (!tooSmall || warnedSizes.has(String(size))) return
  warnedSizes.add(String(size))
  console.warn(
    `[NbIcon] size ${JSON.stringify(size)} is deprecated: icons are drawn ` +
      'for 16px and up, and below that the stroke is under a pixel. Use the ' +
      'scale: sm (16), md (20), lg (24) or xl (32).',
  )
}
watch(() => props.size, checkSize, { immediate: true })

/*
 * `clickable` is deprecated: an icon that does something is a button, and
 * `NbButton variant="ghost"` with `icon` is that button, with padding, a focus
 * ring and a name check. Until it goes, a clickable icon at least behaves
 * like one: it is a tab stop, Enter and Space press it, and on a phone touch
 * screen it takes taps over a fingertip-sized box.
 */
watch(
  () => props.clickable,
  (clickable) => {
    if (!clickable || warnedClickable) return
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production')
      return
    warnedClickable = true
    console.warn(
      '[NbIcon] `clickable` is deprecated. An icon that does something is a ' +
        'button: use <NbButton variant="ghost" icon="..." /> with ' +
        'v-nb-tooltip naming the action.',
    )
  },
  { immediate: true },
)

function onKeydown(event: KeyboardEvent) {
  if (!props.clickable) return
  if (event.key === 'Enter') {
    event.preventDefault()
    emit('click', event)
  } else if (event.key === ' ') {
    // Space presses on release, as on a native button; stop the page scroll.
    event.preventDefault()
  }
}

function onKeyup(event: KeyboardEvent) {
  if (props.clickable && event.key === ' ') emit('click', event)
}

const source = computed(() => props.icon ?? props.name)

/**
 * The icon's name: given directly as a string, or read back off the module
 * when the compile-time plugin substituted one, so the identity class and the
 * stable element id are the same either way.
 */
const iconName = computed(() =>
  typeof source.value === 'string' ? source.value : glyphNameOf(source.value),
)

/** An icon module passed directly, through either `icon` or `name`. */
const iconModule = computed(() =>
  typeof source.value === 'string' ? undefined : source.value,
)

const componentInternalId = useStableId({ name: iconName.value })

const attrs = useAttrs()

/**
 * The accessible name, when the icon has one. An icon is decorative unless it
 * carries meaning that no adjacent text repeats (a status glyph alone in a
 * table cell, a lock on a row), and the call site says so by naming it:
 * `label` is the name, and `title` doubles as one because a native tooltip
 * that names the icon for a mouse user should name it for everyone else too.
 */
const accessibleName = computed(() => props.label || props.title || undefined)

/**
 * Whether the icon is announced. A name given straight through the fallthrough
 * attributes (`aria-label`, `aria-labelledby`) counts as well, so the icon is
 * never hidden from assistive technology while also carrying a name.
 */
const isInformative = computed(
  () =>
    !!accessibleName.value ||
    !!attrs['aria-label'] ||
    !!attrs['aria-labelledby'],
)

const attributes = computed(() => {
  const iconSize =
    typeof props.size === 'number'
      ? props.size
      : (EIconSize as unknown as Record<string, number>)[
          String(props.size).toUpperCase()
        ] || EIconSize.SM

  return {
    ...{ id: componentInternalId },
    ...(props.size && {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
    }),
    ...(props.title && { title: props.title }),
    // The same contract as NbNubiscoMark: named, the icon is an image with
    // that name; unnamed, it is hidden from assistive technology, and the SVG
    // inside is never a tab stop in the browsers that still make it one.
    ...(props.clickable
      ? { role: 'button', tabindex: 0, 'aria-label': accessibleName.value }
      : isInformative.value
        ? { role: 'img', 'aria-label': accessibleName.value }
        : { 'aria-hidden': 'true' as const }),
  }
})

/**
 * The name, when one was given as a string. `name` also accepts an icon module
 * so that the compile-time plugin can rewrite a literal name into a static
 * import without every forwarding component having to grow a second prop.
 */
const iconComponent = computed(() => {
  // An explicitly supplied module wins: nothing has to be resolved at runtime,
  // and the bundler linked exactly this icon.
  const explicit = iconModule.value
  if (explicit) return pickWeight(explicit, props.weight)

  const name = typeof source.value === 'string' ? source.value : undefined
  if (!name) return undefined

  // Then the app-level registry, so consumers can supply custom icons (or
  // override built-ins) without rebuilding the library. This is also the
  // supported way to declare a bounded set of runtime-chosen icons: register
  // the modules you know you need and no catalogue is required.
  const custom = getRegisteredIcon(
    name,
    props.weight as keyof ICustomIconWeights,
  )
  if (custom) return custom

  // Finally the full catalogue, which throws if it was never loaded.
  const fromCatalog = resolveFromCatalog('icon', name, props.weight)
  if (!fromCatalog && import.meta.env?.DEV) {
    console.error(
      `[@nubisco/ui] <NbIcon> found no icon named "${name}" in the loaded catalogue.`,
    )
  }
  return fromCatalog
})

const classes = computed(() => {
  return {
    'nb-icon': true,
    ...(iconName.value && { [iconName.value]: true }),
    [`nb-icon-${props.size}`]: ICON_SIZE_NAMES.includes(String(props.size)),
    [`nb-icon-animation-${props.animationMode}-${props.animation}`]:
      props.animation,
    hoverable:
      props.hoverable || (props.animation && props.animationMode === 'hover'),
    'box-clickable': props.clickable,
  }
})

const styles = computed(() => {
  return {
    ...(props.color && { color: props.color }),
    ...(typeof props.size === 'number' && {
      maxWidth: `${props.size}px`,
      maxHeight: `${props.size}px`,
      height: `${props.size}px`,
      width: `${props.size}px`,
    }),
    ...(typeof props.size === 'string' &&
      !ICON_SIZE_NAMES.includes(props.size) && {
        maxWidth: props.size,
        maxHeight: props.size,
        height: props.size,
        width: props.size,
      }),
  }
})
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use '../styles/logic/motion' as motion;
@use '../styles/logic/touch' as touch;

.nb-icon {
  display: flex;
  line-height: 1em;
  position: relative;
  &:not(.hoverable):not(.box-clickable) {
    pointer-events: none;
  }

  // Deprecated, see the `clickable` warning. Until it goes it is a real
  // target: a pointer, a focus ring and a fingertip of hit area on a phone.
  &.box-clickable {
    cursor: pointer;
    outline: none;
    @include touch.hit-area($position: false);

    &:focus-visible {
      outline: 1px solid var(--nb-c-focus-ring);
      outline-offset: 2px;
    }
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  // The scale is 16, 20, 24 and 32, the sizes Phosphor's regular stroke
  // holds up at. `xs`, `xxs` and `xxl` stay for compatibility; the first two
  // warn in development (see checkSize).
  @each $name,
    $px
      in (xxl: 92px, xl: 32px, lg: 24px, md: 20px, sm: 16px, xs: 12px, xxs: 8px)
  {
    &-#{$name} {
      max-width: $px;
      max-height: $px;
      height: $px;
      width: $px;
    }
  }

  // Animations.
  //
  // Every keyframe starts and ends at the icon's own size: an animated icon is
  // the same size as its static neighbour, and only the gesture moves. The
  // timing reads the motion tokens, so a product that retunes
  // `--nb-motion-loop` retunes these with it. A continuous spin is linear
  // (constant speed is what "still working" looks like); the gestures ease on
  // the standard curve.
  //
  // `loading` marks the ones that say "working" (a spin, a turn, a timer).
  // Under reduced motion they keep looping as an opacity breath, and the rest,
  // which are pure travel, stop. See docs/principles/motion/accessibility.md.
  $animations: (
    swing-right: (
      duration: calc(var(--nb-motion-loop) / 2),
    ),
    wobble: (),
    expand: (
      duration: calc(var(--nb-motion-loop) / 2),
    ),
    refresh: (
      easing: linear,
      loading: true,
    ),
    heart: (
      duration: calc(var(--nb-motion-loop) / 2),
    ),
    undo: (),
    italic: (),
    cog: (
      duration: calc(var(--nb-motion-loop) * 5),
      loading: true,
    ),
    wrench: (
      origin: 79% 26%,
    ),
    mouse-pointer: (),
    magic: (),
    lock: (),
    unlock: (
      origin: 75% 25%,
    ),
    hourglass: (
      loading: true,
    ),
    eraser: (),
    rocket: (),
    times: (),
  );

  $defaults: (
    duration: var(--nb-motion-loop),
    easing: var(--nb-ease-standard),
  );

  @each $name, $given in $animations {
    $spec: map.merge($defaults, $given);
    &-animation-hover-#{$name}:hover,
    &-animation-always-#{$name} {
      @if map.has-key($spec, origin) {
        transform-origin: map.get($spec, origin);
      }
      animation: $name map.get($spec, duration) map.get($spec, easing) infinite;
    }
  }

  // The one reduced-motion block. Travel stops; a loading glyph keeps looping
  // as a tint, because a frozen "working" icon reads as a hung page.
  @include motion.reduced {
    @each $name, $spec in $animations {
      &-animation-hover-#{$name}:hover,
      &-animation-always-#{$name} {
        @if map.get($spec, loading) {
          animation: nb-icon-breathe
            calc(var(--nb-motion-loop) * 1.6)
            var(--nb-ease-standard)
            infinite;
        } @else {
          animation: none;
        }
      }
    }
  }

  @keyframes nb-icon-breathe {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  @keyframes swing-right {
    0% {
      transform: translateX(0);
    }
    33% {
      transform: translateX(-5px);
    }
    66% {
      transform: translateX(5px);
    }
    100% {
      transform: translateX(0);
    }
  }
  @keyframes wobble {
    0% {
      transform: translate(0, 0);
    }
    20% {
      transform: translate(-5px, 5px);
    }
    40% {
      transform: translate(-5px, -5px);
    }
    60% {
      transform: translate(5px, 5px);
    }
    80% {
      transform: translate(5px, -5px);
    }
    100% {
      transform: translate(0, 0);
    }
  }
  @keyframes expand {
    0% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(-5px, 5px);
    }
    50% {
      transform: scale(1.25);
    }
    75% {
      transform: translate(5px, -5px);
    }
    100% {
      transform: translate(0, 0);
    }
  }
  @keyframes refresh {
    from {
      transform: rotate(0);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes heart {
    0% {
      transform: none;
    }
    20% {
      transform: scale(1.25);
    }
    30% {
      transform: none;
    }
    40% {
      transform: scale(1.25);
    }
    100% {
      transform: none;
    }
  }
  @keyframes undo {
    0% {
      transform: translateX(0) rotate(0);
    }
    33% {
      transform: translateX(10px) rotate(0);
    }
    66% {
      transform: translateX(-10px) rotate(-360deg);
    }
    100% {
      transform: translateX(0) rotate(-360deg);
    }
  }
  @keyframes italic {
    0% {
      transform: skewX(0);
    }
    50% {
      transform: skewX(12deg);
    }
    100% {
      transform: skewX(0);
    }
  }
  @keyframes cog {
    0% {
      transform: rotate(0);
    }
    10% {
      transform: rotate(45deg);
    }
    17% {
      transform: rotate(45deg);
    }
    20% {
      transform: rotate(90deg);
    }
    27% {
      transform: rotate(90deg);
    }
    30% {
      transform: rotate(135deg);
    }
    37% {
      transform: rotate(135deg);
    }
    40% {
      transform: rotate(180deg);
    }
    47% {
      transform: rotate(180deg);
    }
    50% {
      transform: rotate(225deg);
    }
    57% {
      transform: rotate(225deg);
    }
    60% {
      transform: rotate(270deg);
    }
    67% {
      transform: rotate(270deg);
    }
    70% {
      transform: rotate(315deg);
    }
    77% {
      transform: rotate(315deg);
    }
    80% {
      transform: rotate(360deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes wrench {
    0% {
      transform: rotate(0);
    }
    20% {
      transform: rotate(30deg);
    }
    30% {
      transform: rotate(-20deg);
    }
    50% {
      transform: rotate(30deg);
    }
    60% {
      transform: rotate(-20deg);
    }
    100% {
      transform: rotate(0);
    }
  }
  @keyframes mouse-pointer {
    0% {
      transform: none;
    }
    20% {
      transform: none;
    }
    22.5% {
      transform: scale(0.8);
    }
    32.5% {
      transform: scale(0.8);
    }
    35% {
      transform: none;
    }
    100% {
      transform: none;
    }
  }
  @keyframes magic {
    0% {
      transform: translate(0, 0) rotate(0);
    }
    10% {
      transform: translate(-5px, 2.5px) rotate(-10deg);
    }
    20% {
      transform: translate(-10px, 0) rotate(-20deg);
    }
    30% {
      transform: translate(-5px, -2.5px) rotate(-30deg);
    }
    40% {
      transform: translate(0, 0) rotate(-20deg);
    }
    50% {
      transform: translate(5px, 2.5px) rotate(-10deg);
    }
    60% {
      transform: translate(10px, 0) rotate(0);
    }
    70% {
      transform: translate(5px, -2.5px) rotate(10deg);
    }
    100% {
      transform: translate(0, 0) rotate(0);
    }
  }
  @keyframes lock {
    0% {
      transform: translateY(0);
    }
    20% {
      transform: translateY(-5px);
    }
    30% {
      transform: translateY(5px);
    }
    50% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(5px);
    }
    100% {
      transform: translateY(0);
    }
  }
  @keyframes unlock {
    0% {
      transform: rotate(-15deg);
    }
    15% {
      transform: rotate(-40deg);
    }
    30% {
      transform: rotate(5deg);
    }
    45% {
      transform: rotate(-30deg);
    }
    60% {
      transform: rotate(-5deg);
    }
    75% {
      transform: rotate(-20deg);
    }
    90% {
      transform: rotate(-15deg);
    }
    100% {
      transform: rotate(-15deg);
    }
  }
  @keyframes hourglass {
    0% {
      transform: rotate(0);
    }
    35% {
      transform: rotate(180deg);
    }
    65% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(0);
    }
  }
  @keyframes eraser {
    0% {
      transform: translate(0, 0);
    }
    15% {
      transform: translate(-10px, -5px);
    }
    30% {
      transform: translate(-10px, 5px);
    }
    45% {
      transform: translate(-5px, -5px);
    }
    60% {
      transform: translate(-5px, 5px);
    }
    75% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(10px, 0);
    }
  }
  @keyframes rocket {
    0% {
      transform: translate(0, 0);
      opacity: 1;
    }
    5% {
      transform: translate(2px, 0);
      opacity: 1;
    }
    10% {
      transform: translate(1px, -2px);
      opacity: 1;
    }
    15% {
      transform: translate(3px, -1px);
      opacity: 1;
    }
    20% {
      transform: translate(2px, -3px);
      opacity: 1;
    }
    25% {
      transform: translate(4px, -2px);
      opacity: 1;
    }
    50% {
      transform: translate(10px, -10px);
      opacity: 0;
    }
    51% {
      transform: translate(-10px, 10px);
      opacity: 0;
    }
    100% {
      transform: translate(0, 0);
      opacity: 1;
    }
  }
  @keyframes times {
    0% {
      transform: translateX(0);
    }
    15% {
      transform: translateX(5px);
    }
    30% {
      transform: translateX(-5px);
    }
    45% {
      transform: translateX(3px);
    }
    60% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }
}
</style>
