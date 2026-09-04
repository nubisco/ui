import { IDefaultProps } from '@/types/Props.d'

enum ESkeletonVariant {
  /** One or more body text lines, sized from a type set. */
  Text = 'text',
  /** A single line sized from a heading type set. */
  Heading = 'heading',
  /** A rectangle: cards, images, charts, map panes, table cells. */
  Block = 'block',
  /** A circle: avatars and round icon buttons. */
  Circle = 'circle',
}

/**
 * Type sets the text and heading variants can borrow their metrics from.
 * These are the same names the `--nb-type-*` custom properties are generated
 * from, so a skeleton line is exactly as tall as the text that replaces it.
 *
 * The code sets are here because monospaced blocks are the worst offenders for
 * layout shift: a JSON viewer placeholder measured with body metrics is a
 * different height from the code that lands in it. `display-01` and
 * `display-02` are left out on purpose, since marketing hero type does not
 * arrive asynchronously.
 */
type TSkeletonTypeSet =
  | 'label-sm'
  | 'label-md'
  | 'label-lg'
  | 'body-sm'
  | 'body-md'
  | 'body-lg'
  | 'code-sm'
  | 'code-md'
  | 'code-lg'
  | 'heading-01'
  | 'heading-02'
  | 'heading-03'
  | 'heading-04'
  | 'heading-05'
  | 'heading-06'

interface ISkeletonProps extends IDefaultProps {
  /** Shape family. */
  variant?: `${ESkeletonVariant}`
  /** Type set the line height is derived from. Text and heading variants only. */
  type?: TSkeletonTypeSet
  /** Number of text lines. Text variant only. */
  lines?: number
  /**
   * Width of the last line when there is more than one, so a paragraph does
   * not read as a solid rectangle. Any CSS length or percentage.
   */
  lastLineWidth?: string
  /** Width of the placeholder. A number is treated as pixels. */
  width?: string | number
  /**
   * Height of the placeholder. Block and circle variants only: text sizes
   * itself from `type`. A number is treated as pixels.
   */
  height?: string | number
  /** Corner radius step. Ignored by the circle variant. */
  radius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'pill'
  /** Turns the shimmer off. Static placeholders still read as loading. */
  animated?: boolean
  /**
   * Accessible announcement. Set it on ONE skeleton per loading region and
   * leave the rest silent, otherwise a table of forty placeholders announces
   * itself forty times.
   */
  label?: string
  /**
   * Announced once, politely, when the skeleton unmounts ("Comments loaded").
   * The swap from placeholder to content is silent otherwise: the live region
   * that said "loading" is removed at the same moment the content arrives, so
   * nothing is left to speak. Set it on the same single skeleton that carries
   * `label`.
   *
   * It is announced on any unmount, because a component cannot read a prop
   * changed by the same render that removed it. Where the load can fail, call
   * `suppressLoadingAnnouncement()` in the catch (or drive the request through
   * `useInlineLoading`, which does it for you) so a failure is not reported as
   * an arrival.
   */
  completeLabel?: string
}

export { ESkeletonVariant, ISkeletonProps, TSkeletonTypeSet }
