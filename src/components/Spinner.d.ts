import { IDefaultProps } from '@/types/Props.d'

/**
 * Diameter is derived from the field height scale: a spinner is always half
 * the height of the field or button of the same size, so `size="md"` lines up
 * optically inside an `md` control without any per-call-site nudging.
 */
enum ESpinnerSize {
  ExtraSmall = 'xs',
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}

enum ESpinnerOverlay {
  /** Inline: the spinner sits in normal flow and takes only its own box. */
  None = 'none',
  /**
   * Covers the nearest positioned ancestor, and blocks it: everything that was
   * inside that ancestor when the spinner appeared is marked `inert` and the
   * ancestor is marked `aria-busy` until it leaves. That ancestor must be
   * positioned.
   */
  Container = 'container',
  /**
   * Covers the viewport and blocks the application as it stood when it
   * appeared. Anything opened afterwards (a dialog raised by the work itself)
   * paints above it and stays usable.
   */
  Page = 'page',
}

enum ESpinnerTone {
  /** Brand primary. The default for standalone spinners. */
  Primary = 'primary',
  /** Inherits `color` from the parent, for spinners inside buttons or rows. */
  Inherit = 'inherit',
}

interface ISpinnerProps extends IDefaultProps {
  /** Diameter step, mapped to half the matching field height. */
  size?: `${ESpinnerSize}`
  /**
   * Accessible name announced by the live region. Say what is loading
   * ("Loading invoices"), not that something is loading.
   */
  label?: string
  /** Renders `label` as visible text beside the ring as well as announcing it. */
  showLabel?: boolean
  /** Where the spinner is placed: inline, over its container, or over the page. */
  overlay?: `${ESpinnerOverlay}`
  /** Ring colour source. */
  tone?: `${ESpinnerTone}`
  /**
   * Milliseconds to wait before appearing. A spinner that flashes for 80ms is
   * noise, so give fast operations a delay of 300 or so and they resolve
   * before anything is drawn.
   */
  delay?: number
  /**
   * Announced once, politely, when the spinner unmounts because the work
   * finished ("Invoices loaded"). A spinner that simply disappears tells a
   * screen reader user nothing, so pair this with `label` on any load the user
   * is waiting on rather than watching. Skipped when the spinner never became
   * visible (a `delay` that outlived the request) and when `decorative`.
   */
  completeLabel?: string
  /**
   * Drops the role, the live region and the label. Use it only when an
   * ancestor already announces the loading state (NbInlineLoading does this,
   * and a button that swaps its own label for a spinner should too), so the
   * same message is not announced twice.
   *
   * Ignored by `overlay="page"`: a full-viewport scrim is the element holding
   * focus and nothing else is left to name it.
   */
  decorative?: boolean
}

export { ESpinnerSize, ESpinnerOverlay, ESpinnerTone, ISpinnerProps }
