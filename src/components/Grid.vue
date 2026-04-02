<template>
  <component
    :is="is"
    :id="id"
    ref="root"
    :class="classes"
    :tabindex="(tabIndex ?? !focusableElements.includes(is)) ? '-1' : '0'"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gridPropDefinitions } from './Grid.d'
import type {
  TClassCollection,
  IHandlerContext,
  TGridType,
  TGridAlign,
  TGridJustify,
  TGridWrap,
  TBreakpoint,
} from './Grid.d'

// Focusable HTML elements
const focusableElements = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'details',
  'iframe',
  'object',
  'embed',
  'area',
  'audio',
  'video',
]

// Component ref
const root = ref<HTMLElement>()
const getRef = () => root.value

defineExpose({
  getRef,
})

// Define props
const props = defineProps(gridPropDefinitions)

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalizes breakpoint names from camelCase to kebab-case
 * Example: 'mediumLarge' -> 'medium-large'
 */
const normalizeBreakpoint = (breakpoint: string): string =>
  breakpoint.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

// ============================================================================
// Individual Property Handlers
// ============================================================================

/**
 * Handles direction prop (row, col, row-reverse, col-reverse)
 */
function handleDirection(value: TGridType, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  // Skip base 'row' for responsive breakpoints (row is default)
  if (breakpoint && value === 'row') {
    return
  }

  collection[`${prefix}${value}`] = true
}

/**
 * Handles align prop (start, end, center, baseline, stretch)
 */
function handleAlign(value: TGridAlign, ctx: IHandlerContext): void {
  const { collection, breakpoint, classMap } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''
  const mappedValue = classMap?.[value] ?? value

  collection[`${prefix}align-${mappedValue}`] = true
}

/**
 * Handles justify prop (around, between, center, end, evenly, start)
 */
function handleJustify(value: TGridJustify, ctx: IHandlerContext): void {
  const { collection, breakpoint, classMap } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''
  const mappedValue = classMap?.[value] ?? value

  collection[`${prefix}justify-${mappedValue}`] = true
}

/**
 * Handles gap prop (xxs, xs, sm, md, lg, xl, xxl)
 */
function handleGap(value: string, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}gap-${value}`] = true
}

/**
 * Handles grid prop (1-16 columns)
 */
function handleGrid(value: number | string, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}grid-${value}`] = true
}

/**
 * Handles shift prop (0-15 columns offset)
 */
function handleShift(value: number | string, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}shift-${value}`] = true
}

/**
 * Handles wrap prop (nowrap, wrap, reverse)
 */
function handleWrap(value: TGridWrap, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}${value}`] = true
}

/**
 * Handles reverse prop
 */
function handleReverse(value: boolean, ctx: IHandlerContext): void {
  if (!value) return

  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}reverse`] = true
}

/**
 * Handles order props (first, last)
 */
function handleOrder(
  value: boolean,
  ctx: IHandlerContext,
  type: 'first' | 'last',
): void {
  if (!value) return

  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}${type}`] = true
}

/**
 * Handles visible prop
 */
function handleVisible(value: boolean, ctx: IHandlerContext): void {
  const { collection, breakpoint } = ctx
  const prefix = breakpoint ? `${breakpoint}-` : ''

  collection[`${prefix}${value ? 'visible' : 'hidden'}`] = true
}

// ============================================================================
// Responsive Property Processor
// ============================================================================

/**
 * Generic processor for responsive props.
 * Handles three input modes:
 *   1. Scalar value  — applies at all breakpoints: dir="col"
 *   2. Breakpoint map — per-breakpoint object: :dir="{ sm: 'col', md: 'row' }"
 *   3. Function — called at render time; reactive deps are tracked by the
 *      parent computed(): :dir="() => isNavOpen ? 'col' : 'row'"
 *
 * Array form is also accepted for boolean props (first, last, reverse):
 *   :first="['sm', 'md']"
 */
function processResponsiveProp<T>(
  prop:
    | T
    | Partial<Record<TBreakpoint, T>>
    | TBreakpoint[]
    | (() => T)
    | null
    | undefined,
  handler: (value: T, ctx: IHandlerContext) => void,
  classMap?: Record<string, string>,
): TClassCollection {
  const collection: TClassCollection = {}

  if (prop == null) return collection

  // Function — call it; Vue's reactivity tracks deps inside the parent computed
  if (typeof prop === 'function') {
    const value = (prop as () => T)()
    if (value != null) {
      handler(value, { collection, classMap })
    }
    return collection
  }

  // Simple value (string, number, boolean)
  if (
    typeof prop === 'string' ||
    typeof prop === 'number' ||
    typeof prop === 'boolean'
  ) {
    handler(prop as T, { collection, classMap })
    return collection
  }

  // Array of breakpoints (for boolean props like first: ['sm', 'md'])
  if (Array.isArray(prop)) {
    prop.forEach((breakpoint) => {
      const normBp = normalizeBreakpoint(breakpoint as string)
      handler(true as T, { collection, breakpoint: normBp, classMap })
    })
    return collection
  }

  // Object (responsive map with breakpoint keys)
  if (typeof prop === 'object') {
    Object.entries(prop).forEach(([breakpoint, value]) => {
      if (value != null) {
        const normBp = normalizeBreakpoint(breakpoint)
        handler(value as T, { collection, breakpoint: normBp, classMap })
      }
    })
  }

  return collection
}

// ============================================================================
// Main Class Generator
// ============================================================================

/**
 * Generates all CSS classes based on component props
 * Clean and declarative approach using separate handlers
 */
const generateGridClasses = (props: any): TClassCollection => {
  // Class mapping for semantic aliases
  const alignClassMap: Record<string, string> = {
    top: 'start',
    bottom: 'end',
    center: 'center',
    stretch: 'stretch',
    baseline: 'base',
  }

  const justifyClassMap: Record<string, string> = {
    left: 'start',
    right: 'end',
    center: 'center',
    between: 'between',
    around: 'around',
    evenly: 'evenly',
  }

  return {
    'nb-grid': true,
    ...processResponsiveProp(props.dir, handleDirection),
    ...processResponsiveProp(props.align, handleAlign, alignClassMap),
    ...processResponsiveProp(props.justify, handleJustify, justifyClassMap),
    ...processResponsiveProp(props.gap, handleGap),
    ...processResponsiveProp(props.grid, handleGrid),
    ...processResponsiveProp(props.shift, handleShift),
    ...processResponsiveProp(props.wrap, handleWrap),
    ...processResponsiveProp(props.reverse, handleReverse),
    ...processResponsiveProp(props.first, (val, ctx) =>
      handleOrder(val, ctx, 'first'),
    ),
    ...processResponsiveProp(props.last, (val, ctx) =>
      handleOrder(val, ctx, 'last'),
    ),
    ...processResponsiveProp(props.visible, handleVisible),
    ...(props.flex ? { flex: true } : {}),
    ...(props.distributed ? { distributed: true } : {}),
    ...(props.mode ? { [props.mode]: true } : {}),
    ...(props.grow ? { grow: true } : {}),
    ...(props.shrink !== null && props.shrink !== undefined
      ? { [`shrink-${props.shrink ? '1' : '0'}`]: true }
      : {}),
  }
}

// Computed property for reactive class generation
const classes = computed(() => generateGridClasses(props))
</script>
