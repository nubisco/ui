<template>
  <i
    :class="classes"
    :style="styles"
    v-bind="attributes"
    :title="title"
    @click="!clickable ? undefined : emit('click', $event)"
  >
    <component :is="iconComponent" aria-hidden="true" />
  </i>
</template>

<script setup lang="ts">
// @ts-expect-error virtual module provided by icons vite plugin
import icons from 'virtual:icons'
import { computed } from 'vue'
import kebab2camel from '@/utils/kebab2camel.helper'
import { ESize } from '@/types/Size.d'
import { EAnimationMode, EWeight, EIconSize, IIconProps } from './Icon.d'
import { useStableId } from '@/composables/useStableId.composable'

const props = withDefaults(defineProps<IIconProps>(), {
  size: ESize.Medium,
  animation: null,
  animationMode: EAnimationMode.Always,
  color: undefined,
  weight: EWeight.Regular,
  title: undefined,
  clickable: false,
  hoverable: false,
})

const emit = defineEmits(['click'])

const componentInternalId = useStableId(props)

const attributes = computed(() => {
  const iconSize =
    typeof props.size === 'number'
      ? props.size
      : (EIconSize as unknown as Record<string, number>)[
          String(props.size).toUpperCase()
        ] || EIconSize.MD

  return {
    ...{ id: componentInternalId },
    ...(props.size && {
      width: `${iconSize}px`,
      height: `${iconSize}px`,
    }),
    ...(props.clickable && { role: 'button' }),
  }
})

const iconComponent = computed(() => {
  const iconKey = kebab2camel(`i-${props.name}`)
  const iconSet = (icons as Record<string, any>)[iconKey]
  return iconSet?.[props.weight] || iconSet?.regular
})

const classes = computed(() => {
  return {
    'nb-icon': true,
    ...(props.name && { [props.name]: true }),
    [`nb-icon-${props.size}`]: [
      'xxs',
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      'xxl',
    ].includes(String(props.size)),
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
      !['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(props.size) && {
        maxWidth: props.size,
        maxHeight: props.size,
        height: props.size,
        width: props.size,
      }),
  }
})
</script>

<style lang="scss" scoped>
.nb-icon {
  display: flex;
  line-height: 1em;
  position: relative;
  &:not(.hoverable):not(.box-clickable) {
    pointer-events: none;
  }

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  &-xxl {
    max-width: var(--nb-font-size-92);
    max-height: var(--nb-font-size-92);
    height: var(--nb-font-size-92);
    width: var(--nb-font-size-92);
  }
  &-xl {
    max-width: var(--nb-font-size-60);
    max-height: var(--nb-font-size-60);
    height: var(--nb-font-size-60);
    width: var(--nb-font-size-60);
  }
  &-lg {
    max-width: var(--nb-font-size-20);
    max-height: var(--nb-font-size-20);
    height: var(--nb-font-size-20);
    width: var(--nb-font-size-20);
  }
  &-md {
    max-width: var(--nb-font-size-16);
    max-height: var(--nb-font-size-16);
    height: var(--nb-font-size-16);
    width: var(--nb-font-size-16);
  }
  &-sm {
    max-width: var(--nb-font-size-14);
    max-height: var(--nb-font-size-14);
    height: var(--nb-font-size-14);
    width: var(--nb-font-size-14);
  }
  &-xs {
    max-width: var(--nb-font-size-12);
    max-height: var(--nb-font-size-12);
    height: var(--nb-font-size-12);
    width: var(--nb-font-size-12);
  }
  &-xxs {
    max-width: var(--nb-font-size-8);
    max-height: var(--nb-font-size-8);
    height: var(--nb-font-size-8);
    width: var(--nb-font-size-8);
  }

  // animations
  &-animation-hover-swing-right:hover {
    animation: swing-right 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-swing-right {
    animation: swing-right 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-wobble:hover {
    animation: wobble 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-wobble {
    animation: wobble 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-expand:hover {
    animation: expand 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-expand {
    animation: expand 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-refresh:hover {
    animation: refresh 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-refresh {
    animation: refresh 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-heart:hover {
    animation: heart 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-heart {
    animation: heart 0.5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-undo:hover {
    animation: undo 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-undo {
    animation: undo 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-italic:hover {
    animation: italic 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-italic {
    animation: italic 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-cog:hover {
    animation: cog 5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-cog {
    animation: cog 5s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-wrench:hover {
    transform-origin: 79% 26%;
    animation: wrench 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-wrench {
    transform-origin: 79% 26%;
    animation: wrench 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-mouse-pointer:hover {
    animation: mouse-pointer 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-mouse-pointer {
    animation: mouse-pointer 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-magic:hover {
    animation: magic 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-magic {
    animation: magic 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-lock:hover {
    animation: lock 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-lock {
    animation: lock 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-unlock:hover {
    transform-origin: 75% 25%;
    animation: unlock 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-unlock {
    transform-origin: 75% 25%;
    animation: unlock 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-hourglass:hover {
    animation: hourglass 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-hourglass {
    animation: hourglass 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-eraser:hover {
    animation: eraser 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-eraser {
    animation: eraser 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-rocket:hover {
    animation: rocket 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-rocket {
    animation: rocket 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-hover-times:hover {
    animation: times 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }
  &-animation-always-times {
    animation: times 1s cubic-bezier(0.36, 0.07, 0.57, 0.99) infinite;
  }

  @keyframes swing-right {
    0% {
      transform: scale(1.5) translateX(0);
    }
    33% {
      transform: scale(1.5) translateX(-5px);
    }
    66% {
      transform: scale(1.5) translateX(5px);
    }
    100% {
      transform: scale(1.5) translateX(0);
    }
  }
  @keyframes wobble {
    0% {
      transform: scale(1.5) translate(0, 0);
    }
    20% {
      transform: scale(1.5) translate(-5px, 5px);
    }
    40% {
      transform: scale(1.5) translate(-5px, -5px);
    }
    60% {
      transform: scale(1.5) translate(5px, 5px);
    }
    80% {
      transform: scale(1.5) translate(5px, -5px);
    }
    100% {
      transform: scale(1.5) translate(0, 0);
    }
  }
  @keyframes expand {
    0% {
      transform: scale(1.5) translate(0, 0);
    }
    25% {
      transform: scale(1.5) translate(-5px, 5px);
    }
    50% {
      transform: scale(2) translate(0, 0);
    }
    75% {
      transform: scale(1.5) translate(5px, -5px);
    }
    100% {
      transform: scale(1.5) translate(0, 0);
    }
  }
  @keyframes refresh {
    from {
      transform: scale(1.5) rotate(0);
    }
    to {
      transform: scale(1.5) rotate(360deg);
    }
  }
  @keyframes heart {
    0% {
      transform: scale(1.5);
    }
    20% {
      transform: scale(2);
    }
    30% {
      transform: scale(1.5);
    }
    40% {
      transform: scale(2);
    }
    100% {
      transform: scale(1.5);
    }
  }
  @keyframes undo {
    0% {
      transform: scale(1.5) translateX(0) rotate(0);
    }
    33% {
      transform: scale(1.5) translateX(10px) rotate(0);
    }
    66% {
      transform: scale(1.5) translateX(-10px) rotate(-360deg);
    }
    100% {
      transform: scale(1.5) translateX(0) rotate(-360deg);
    }
  }
  @keyframes italic {
    0% {
      transform: scale(1.5) skewX(0);
    }
    50% {
      transform: scale(1.5) skewX(12deg);
    }
    100% {
      transform: scale(1.5) skewX(0);
    }
  }
  @keyframes cog {
    0% {
      transform: scale(1.5) rotate(0);
    }
    10% {
      transform: scale(1.5) rotate(45deg);
    }
    17% {
      transform: scale(1.5) rotate(45deg);
    }
    20% {
      transform: scale(1.5) rotate(90deg);
    }
    27% {
      transform: scale(1.5) rotate(90deg);
    }
    30% {
      transform: scale(1.5) rotate(135deg);
    }
    37% {
      transform: scale(1.5) rotate(135deg);
    }
    40% {
      transform: scale(1.5) rotate(180deg);
    }
    47% {
      transform: scale(1.5) rotate(180deg);
    }
    50% {
      transform: scale(1.5) rotate(225deg);
    }
    57% {
      transform: scale(1.5) rotate(225deg);
    }
    60% {
      transform: scale(1.5) rotate(270deg);
    }
    67% {
      transform: scale(1.5) rotate(270deg);
    }
    70% {
      transform: scale(1.5) rotate(315deg);
    }
    77% {
      transform: scale(1.5) rotate(315deg);
    }
    80% {
      transform: scale(1.5) rotate(360deg);
    }
    100% {
      transform: scale(1.5) rotate(360deg);
    }
  }
  @keyframes wrench {
    0% {
      transform: scale(1.5) rotate(0);
    }
    20% {
      transform: scale(1.5) rotate(30deg);
    }
    30% {
      transform: scale(1.5) rotate(-20deg);
    }
    50% {
      transform: scale(1.5) rotate(30deg);
    }
    60% {
      transform: scale(1.5) rotate(-20deg);
    }
    100% {
      transform: scale(1.5) rotate(0);
    }
  }
  @keyframes mouse-pointer {
    0% {
      transform: scale(1.5);
    }
    20% {
      transform: scale(1.5);
    }
    22.5% {
      transform: scale(1.2);
    }
    32.5% {
      transform: scale(1.2);
    }
    35% {
      transform: scale(1.5);
    }
    100% {
      transform: scale(1.5);
    }
  }
  @keyframes magic {
    0% {
      transform: scale(1.5) translate(0, 0) rotate(0);
    }
    10% {
      transform: scale(1.5) translate(-5px, 2.5px) rotate(-10deg);
    }
    20% {
      transform: scale(1.5) translate(-10px, 0) rotate(-20deg);
    }
    30% {
      transform: scale(1.5) translate(-5px, -2.5px) rotate(-30deg);
    }
    40% {
      transform: scale(1.5) translate(0, 0) rotate(-20deg);
    }
    50% {
      transform: scale(1.5) translate(5px, 2.5px) rotate(-10deg);
    }
    60% {
      transform: scale(1.5) translate(10px, 0) rotate(0);
    }
    70% {
      transform: scale(1.5) translate(5px, -2.5px) rotate(10deg);
    }
    100% {
      transform: scale(1.5) translate(0, 0) rotate(0);
    }
  }
  @keyframes lock {
    0% {
      transform: scale(1.5) translateY(0);
    }
    20% {
      transform: scale(1.5) translateY(-5px);
    }
    30% {
      transform: scale(1.5) translateY(5px);
    }
    50% {
      transform: scale(1.5) translateY(-5px);
    }
    60% {
      transform: scale(1.5) translateY(5px);
    }
    100% {
      transform: scale(1.5) translateY(0);
    }
  }
  @keyframes unlock {
    0% {
      transform: scale(1.5) rotate(-15deg);
    }
    15% {
      transform: scale(1.5) rotate(-40deg);
    }
    30% {
      transform: scale(1.5) rotate(5deg);
    }
    45% {
      transform: scale(1.5) rotate(-30deg);
    }
    60% {
      transform: scale(1.5) rotate(-5deg);
    }
    75% {
      transform: scale(1.5) rotate(-20deg);
    }
    90% {
      transform: scale(1.5) rotate(-15deg);
    }
    100% {
      transform: scale(1.5) rotate(-15deg);
    }
  }
  @keyframes hourglass {
    0% {
      transform: scale(1.5) rotate(0);
    }
    35% {
      transform: scale(1.5) rotate(180deg);
    }
    65% {
      transform: scale(1.5) rotate(180deg);
    }
    100% {
      transform: scale(1.5) rotate(0);
    }
  }
  @keyframes eraser {
    0% {
      transform: scale(1.5) translate(0, 0);
    }
    15% {
      transform: scale(1.5) translate(-10px, -5px);
    }
    30% {
      transform: scale(1.5) translate(-10px, 5px);
    }
    45% {
      transform: scale(1.5) translate(-5px, -5px);
    }
    60% {
      transform: scale(1.5) translate(-5px, 5px);
    }
    75% {
      transform: scale(1.5) translate(0, 0);
    }
    100% {
      transform: scale(1.5) translate(10px, 0);
    }
  }
  @keyframes rocket {
    0% {
      transform: scale(1.5) translate(0, 0);
      opacity: 1;
    }
    5% {
      transform: scale(1.5) translate(2px, 0);
      opacity: 1;
    }
    10% {
      transform: scale(1.5) translate(1px, -2px);
      opacity: 1;
    }
    15% {
      transform: scale(1.5) translate(3px, -1px);
      opacity: 1;
    }
    20% {
      transform: scale(1.5) translate(2px, -3px);
      opacity: 1;
    }
    25% {
      transform: scale(1.5) translate(4px, -2px);
      opacity: 1;
    }
    50% {
      transform: scale(1.5) translate(10px, -10px);
      opacity: 0;
    }
    51% {
      transform: scale(1.5) translate(-10px, 10px);
      opacity: 0;
    }
    100% {
      transform: scale(1.5) translate(0, 0);
      opacity: 1;
    }
  }
  @keyframes times {
    0% {
      transform: scale(1.5) translateX(0);
    }
    15% {
      transform: scale(1.5) translateX(5px);
    }
    30% {
      transform: scale(1.5) translateX(-5px);
    }
    45% {
      transform: scale(1.5) translateX(3px);
    }
    60% {
      transform: scale(1.5) translateX(-3px);
    }
    75% {
      transform: scale(1.5) translateX(0);
    }
    100% {
      transform: scale(1.5) translateX(0);
    }
  }
}
</style>
