import type { PropType } from 'vue'

// Breakpoint type with short names
export type TBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

// Grid direction types
export type TGridType = 'row' | 'col' | 'row-reverse' | 'col-reverse'
export type TGridTypeResponsive = Partial<Record<TBreakpoint, TGridType>>

// Alignment types
export type TGridAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch'
export type TGridAlignResponsive = Partial<Record<TBreakpoint, TGridAlign>>

// Justify types
export type TGridJustify =
  | 'around'
  | 'between'
  | 'center'
  | 'end'
  | 'evenly'
  | 'start'
export type TGridJustifyResponsive = Partial<Record<TBreakpoint, TGridJustify>>

// Wrap types
export type TGridWrap = 'nowrap' | 'wrap' | 'reverse'
export type TGridWrapResponsive = Partial<Record<TBreakpoint, TGridWrap>>

// Gap types
export type TGapSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type TGridGap = TGapSize | Partial<Record<TBreakpoint, TGapSize>>

// Grid columns (1-16)
export type TGridColumns =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
export type TGridColumnsResponsive = Partial<Record<TBreakpoint, TGridColumns>>

// Grid shift (0-15)
export type TGridShift =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
export type TGridShiftResponsive = Partial<Record<TBreakpoint, TGridShift>>

// Boolean responsive type (for first, last, reverse)
export type TBooleanResponsive = boolean | TBreakpoint[]

// Grid mode
export type TGridMode = 'wide' | 'narrow' | 'condensed'

// Class collection type
export type TClassCollection = Record<string, boolean>

// Handler context for class generation
export interface IHandlerContext {
  collection: TClassCollection
  breakpoint?: string
  classMap?: Record<string, string>
}

// Component props interface
export interface IGridProps {
  id?: string | null
  is?: string
  dir?: TGridType | TGridTypeResponsive
  align?: TGridAlign | TGridAlignResponsive | null
  justify?: TGridJustify | TGridJustifyResponsive | null
  gap?: TGridGap | null
  grid?: TGridColumns | TGridColumnsResponsive | null
  shift?: TGridShift | TGridShiftResponsive | null
  wrap?: TGridWrap | TGridWrapResponsive | null
  first?: TBooleanResponsive | null
  last?: TBooleanResponsive | null
  visible?: boolean | Partial<Record<TBreakpoint, boolean>> | null
  reverse?: TBooleanResponsive
  grow?: boolean | null
  flex?: boolean | null
  shrink?: boolean | null
  distributed?: boolean
  mode?: TGridMode
  tabIndex?: string | null
}

// Prop definitions for defineProps
export const gridPropDefinitions = {
  id: {
    type: String as PropType<string>,
    default: null,
  },

  is: {
    type: String as PropType<string>,
    default: 'div',
  },

  dir: {
    type: [String, Object] as PropType<TGridType | TGridTypeResponsive>,
    default: 'row',
    validator: (value: TGridType | TGridTypeResponsive): boolean => {
      if (typeof value === 'string') {
        return (['row', 'col', 'row-reverse', 'col-reverse'] as const).includes(
          value as TGridType,
        )
      }
      return Object.values(value).every((v) =>
        (['row', 'col', 'row-reverse', 'col-reverse'] as const).includes(
          v as TGridType,
        ),
      )
    },
  },

  align: {
    type: [String, Object] as PropType<TGridAlign | TGridAlignResponsive>,
    default: null,
    validator: (value: TGridAlign | TGridAlignResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'string') {
        return (
          ['start', 'end', 'center', 'baseline', 'stretch'] as const
        ).includes(value as TGridAlign)
      }
      return Object.values(value).every((v) =>
        (['start', 'end', 'center', 'baseline', 'stretch'] as const).includes(
          v as TGridAlign,
        ),
      )
    },
  },

  justify: {
    type: [String, Object] as PropType<TGridJustify | TGridJustifyResponsive>,
    default: null,
    validator: (value: TGridJustify | TGridJustifyResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'string') {
        return (
          ['around', 'between', 'center', 'end', 'evenly', 'start'] as const
        ).includes(value as TGridJustify)
      }
      return Object.values(value).every((v) =>
        (
          ['around', 'between', 'center', 'end', 'evenly', 'start'] as const
        ).includes(v as TGridJustify),
      )
    },
  },

  gap: {
    type: [String, Object] as PropType<TGridGap>,
    default: null,
    validator: (value: TGridGap): boolean => {
      if (value == null) return true
      const validSizes = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const
      if (typeof value === 'string') {
        return validSizes.includes(value as TGapSize)
      }
      return Object.values(value).every((v) =>
        validSizes.includes(v as TGapSize),
      )
    },
  },

  grid: {
    type: [Number, String, Object] as PropType<
      TGridColumns | TGridColumnsResponsive
    >,
    default: null,
    validator: (value: TGridColumns | TGridColumnsResponsive): boolean => {
      if (value == null) return true
      const isValidColumn = (v: number | string) => {
        const num = typeof v === 'string' ? parseInt(v, 10) : v
        return num >= 1 && num <= 16 && !isNaN(num)
      }

      if (typeof value === 'number' || typeof value === 'string') {
        return isValidColumn(value)
      }
      return Object.values(value).every(isValidColumn)
    },
  },

  shift: {
    type: [Number, String, Object] as PropType<
      TGridShift | TGridShiftResponsive
    >,
    default: null,
    validator: (value: TGridShift | TGridShiftResponsive): boolean => {
      if (value == null) return true
      const isValidShift = (v: number | string) => {
        const num = typeof v === 'string' ? parseInt(v, 10) : v
        return num >= 0 && num <= 15 && !isNaN(num)
      }

      if (typeof value === 'number' || typeof value === 'string') {
        return isValidShift(value)
      }
      return Object.values(value).every(isValidShift)
    },
  },

  wrap: {
    type: [String, Object] as PropType<TGridWrap | TGridWrapResponsive>,
    default: null,
    validator: (value: TGridWrap | TGridWrapResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'string') {
        return (['nowrap', 'wrap', 'reverse'] as const).includes(
          value as TGridWrap,
        )
      }
      return Object.values(value).every((v) =>
        (['nowrap', 'wrap', 'reverse'] as const).includes(v as TGridWrap),
      )
    },
  },

  first: {
    type: [Boolean, Array] as PropType<TBooleanResponsive>,
    default: null,
    validator: (value: TBooleanResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'boolean') return true
      const validBreakpoints = ['sm', 'md', 'lg', 'xl', 'xxl'] as const
      return value.every((bp) => validBreakpoints.includes(bp as TBreakpoint))
    },
  },

  last: {
    type: [Boolean, Array] as PropType<TBooleanResponsive>,
    default: null,
    validator: (value: TBooleanResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'boolean') return true
      const validBreakpoints = ['sm', 'md', 'lg', 'xl', 'xxl'] as const
      return value.every((bp) => validBreakpoints.includes(bp as TBreakpoint))
    },
  },

  visible: {
    type: [Boolean, Object] as PropType<
      boolean | Partial<Record<TBreakpoint, boolean>>
    >,
    default: null,
  },

  reverse: {
    type: [Boolean, Array] as PropType<TBooleanResponsive>,
    default: false,
    validator: (value: TBooleanResponsive): boolean => {
      if (value == null) return true
      if (typeof value === 'boolean') return true
      const validBreakpoints = ['sm', 'md', 'lg', 'xl', 'xxl'] as const
      return value.every((bp) => validBreakpoints.includes(bp as TBreakpoint))
    },
  },

  grow: {
    type: Boolean as PropType<boolean>,
    default: null,
  },

  flex: {
    type: Boolean as PropType<boolean>,
    default: null,
  },

  shrink: {
    type: Boolean as PropType<boolean>,
    default: null,
  },

  distributed: {
    type: Boolean as PropType<boolean>,
    default: false,
  },

  mode: {
    type: String as PropType<TGridMode>,
    default: 'wide',
    validator: (value: string): boolean => {
      return (['wide', 'narrow', 'condensed'] as const).includes(
        value as TGridMode,
      )
    },
  },

  tabIndex: {
    type: String as PropType<string>,
    default: null,
  },
}
