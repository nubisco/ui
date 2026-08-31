import type { ComputedRef, Ref } from 'vue'
import type { TAnchorSide } from '@/utils/anchorPosition.helper'

/**
 * Preferred side for the step popover. `auto` lets the placement algorithm
 * pick, which is the sane default for targets whose position depends on
 * viewport size (a sidebar that collapses, a toolbar that wraps).
 */
type TWalkthroughPlacement = `${TAnchorSide}` | 'auto'

/** How a run ended. Recorded alongside the version in storage. */
type TWalkthroughOutcome = 'finish' | 'skip'

/**
 * Anything that can resolve to the element a step points at.
 *
 * A bare string is looked up as a tour-step id first (`v-nb-tour-step` /
 * `data-nb-tour-step`) and only then as a CSS selector, so the stable-id
 * convention wins over brittle structural selectors without needing a
 * separate prop.
 */
type TWalkthroughTarget =
  | string
  | HTMLElement
  | (() => HTMLElement | null | undefined)
  | Ref<HTMLElement | null | undefined>

interface IWalkthroughStep {
  /**
   * Element to spotlight. Omit it for an intro or outro step: the popover is
   * then centred on the viewport with no cut-out.
   */
  target?: TWalkthroughTarget
  title?: string
  /** Plain-text body. The component's `step` slot overrides it for rich content. */
  body?: string
  placement?: TWalkthroughPlacement
  /** Extra pixels of breathing room between the target and the cut-out edge. */
  padding?: number
  /** Optional stable identifier, echoed on `step-change` for analytics. */
  id?: string
}

interface IWalkthrough {
  /** Stable identifier for this tour. Used as the storage key. */
  id: string
  /**
   * Bump when the tour's content changes materially. A user who completed
   * version 1 is shown version 2 again; a user who completed version 2 is not.
   */
  version: number
  steps: IWalkthroughStep[]
}

interface IWalkthroughRecord {
  version: number
  outcome: TWalkthroughOutcome
  /** ISO-8601 timestamp. */
  completedAt: string
}

/**
 * Persistence seam. The default implementation is localStorage-backed; an app
 * can hand in one that talks to its own API without changing a single call
 * site, which is the point of keeping reads async-tolerant.
 */
interface IWalkthroughStorage {
  get(
    id: string,
  ): IWalkthroughRecord | null | Promise<IWalkthroughRecord | null>
  set(id: string, record: IWalkthroughRecord): void | Promise<void>
  remove(id: string): void | Promise<void>
}

interface IWalkthroughOptions {
  storage?: IWalkthroughStorage
  /** Callbacks mirror the component's events, for imperative (non-template) use. */
  onFinish?: (walkthrough: IWalkthrough) => void
  onSkip?: (walkthrough: IWalkthrough, stepIndex: number) => void
  onStepChange?: (step: IWalkthroughStep, index: number) => void
}

interface IWalkthroughController {
  active: Ref<boolean>
  stepIndex: Ref<number>
  step: ComputedRef<IWalkthroughStep | undefined>
  steps: ComputedRef<IWalkthroughStep[]>
  stepCount: ComputedRef<number>
  isFirst: ComputedRef<boolean>
  isLast: ComputedRef<boolean>
  walkthrough: ComputedRef<IWalkthrough>
  /** Start at step 0 regardless of stored completion. */
  start: () => void
  /** Clear the stored record, then start. Use from a "replay the tour" menu item. */
  restart: () => Promise<void>
  next: () => void
  back: () => void
  goTo: (index: number) => void
  /** End the run as completed and persist it. */
  finish: () => Promise<void>
  /** End the run as skipped and persist it. */
  skip: () => Promise<void>
  /** Start only when no record exists for the current version. */
  maybeAutoStart: () => Promise<boolean>
  /** True when a stored record covers the current version or newer. */
  isCompleted: () => Promise<boolean>
  /** Forget the stored record without starting. */
  reset: () => Promise<void>
}

interface IWalkthroughLabels {
  back: string
  next: string
  skip: string
  done: string
  /** Progress line. Receives the 1-based step number and the total. */
  progress: (current: number, total: number) => string
  /** Accessible name for the overlay dialog. */
  dialog: string
}

interface IWalkthroughProps {
  /** The tour definition. Required unless a `controller` is supplied. */
  walkthrough?: IWalkthrough
  /**
   * A controller from `useWalkthrough()`. Pass one when the tour must be
   * started from outside the template (a help menu, a router guard); omit it
   * and the component creates its own.
   */
  controller?: IWalkthroughController
  /** Run `maybeAutoStart()` on mount. Ignored when `controller` is provided. */
  autoStart?: boolean
  /** Storage adapter. Ignored when `controller` is provided. */
  storage?: IWalkthroughStorage
  /** Partial label overrides, for localisation. */
  labels?: Partial<IWalkthroughLabels>
  teleportTo?: string
  /** Clicking the dimmed area skips the tour. Off by default: too easy to hit by accident. */
  closeOnScrim?: boolean
  /** Default cut-out padding, overridable per step. */
  padding?: number
}

export type {
  TWalkthroughPlacement,
  TWalkthroughOutcome,
  TWalkthroughTarget,
  IWalkthroughStep,
  IWalkthrough,
  IWalkthroughRecord,
  IWalkthroughStorage,
  IWalkthroughOptions,
  IWalkthroughController,
  IWalkthroughLabels,
  IWalkthroughProps,
}
