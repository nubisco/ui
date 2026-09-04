import type { IAnchorSize } from '@/utils/anchorPosition.helper'
import type { TNotificationVariant } from './NotificationCenterItem.d'

export interface INotificationItem {
  /** Stable key. Reused across refetches so the list does not re-mount. */
  id: string | number
  title: string
  body?: string
  /** ISO string, epoch milliseconds or a Date. */
  time?: string | number | Date
  /** Pre-formatted time, when the host already has one it likes. */
  timeLabel?: string
  read?: boolean
  /** Status word, from the same vocabulary as NbToast and NbMessage. */
  variant?: TNotificationVariant
  icon?: string | null
  /** Renders the row as a link instead of a button. */
  href?: string
  /** Overrides the centre's `interactive` for this one row. `false` makes
   *  the row inert: read, not pressed. */
  interactive?: boolean
}

/**
 * Everything a replacement trigger has to carry for the panel to be
 * announced correctly. Handed to the `#trigger` slot and meant to be spread
 * onto whatever element the host renders:
 *
 * ```vue
 * <template #trigger="{ triggerProps, setTriggerRef, toggle, unreadCount }">
 *   <NbButton :ref="setTriggerRef" v-bind="triggerProps" @click="toggle" />
 * </template>
 * ```
 *
 * The centre cannot generate these ids for a host it never sees, and a host
 * cannot guess them, so they are passed rather than documented. `aria-label`
 * is a default, not a mandate: bind it after the spread to replace it.
 */
export interface INotificationTriggerProps {
  id: string
  'aria-haspopup': 'dialog'
  'aria-expanded': 'true' | 'false'
  'aria-controls': string | undefined
  'aria-label': string
  disabled: boolean | undefined
}

/**
 * Everything the built-in mark-all control binds, as one object, handed to
 * the `#header-actions` slot. A host that replaces the header still gets the
 * pending-safe behaviour (aria-disabled rather than disabled so the in-flight
 * button keeps focus, aria-busy, and a second click that is swallowed instead
 * of firing a second request the host cannot cancel) by spreading this onto
 * its own button rather than re-deriving it:
 *
 * ```vue
 * <template #header-actions="{ markAllProps, markAllText }">
 *   <MyFilter v-model="filter" />
 *   <button v-bind="markAllProps">{{ markAllText }}</button>
 * </template>
 * ```
 *
 * `onClick` is included, so `v-bind` attaches the handler with it.
 */
export interface INotificationMarkAllProps {
  type: 'button'
  disabled: boolean
  'aria-disabled': 'true' | undefined
  'aria-busy': 'true' | undefined
  onClick: () => void
}

export interface INotificationCenterProps {
  /** The rows. Omit it and use the default slot when the shape of a
   *  notification is more than a title, a body and a time. */
  items?: INotificationItem[]
  /** Authoritative unread total, for products that page the list and know a
   *  server-side count larger than what is loaded. Defaults to counting
   *  `items` where `read` is not true. */
  unreadCount?: number
  /**
   * How many rows are on screen. Required alongside `unreadCount` whenever
   * you fill the default slot, optional otherwise (with `items` the centre
   * counts the array).
   *
   * The centre renders your slot, it does not read it, so it cannot tell an
   * empty feed from a slot you chose not to fill. Without this number the
   * `#empty` state cannot render at all, and `error` resolves to the full
   * error region rather than the stale-data strip, because a failure that
   * might be hiding behind rows is the one thing this component exists to
   * prevent. A dev-mode warning is printed the first time a panel opens in
   * that configuration.
   */
  itemCount?: number
  /** Optional `v-model:open`. Left undefined the centre owns its own state. */
  open?: boolean
  /** Names the trigger and titles the panel. */
  label?: string
  markAllLabel?: string
  /** Shown, and announced, while `markAllPending` is true. Present tense. */
  markAllPendingLabel?: string
  /** The host's mark-all request is in flight. The control keeps focus and
   *  stops accepting clicks rather than firing the request again. */
  markAllPending?: boolean
  emptyTitle?: string
  emptyDescription?: string
  /** Announced while `loading` is true. */
  loadingLabel?: string
  /** Renders placeholder rows instead of the list, the empty state or the
   *  error state. A request that has not finished is not a result. */
  loading?: boolean
  /**
   * The fetch failed. This is a state of its own and not a flavour of empty:
   * the audit that motivated this component found an app whose single
   * `.empty-text` rendered both, so a failed request read as "no contacts
   * yet". With no rows to show, the panel renders the error state; with rows
   * already on screen it keeps them and says the refresh failed, because
   * stale notifications beat no notifications.
   */
  error?: boolean
  errorTitle?: string
  errorDescription?: string
  /** Shown on the stale strip when a refresh fails over rows already loaded. */
  errorStaleLabel?: string
  retryLabel?: string
  /** Offer a retry control with the error state. Turn it off when the host
   *  retries on its own and a button would be a lie. */
  showRetry?: boolean
  /** Counts above this render as "n+" on the badge. */
  maxCount?: number
  /** Panel width in px. */
  width?: number
  /** Tallest the scrolling list may get, in px. Clamped further when the
   *  viewport is shorter than that. */
  maxHeight?: number
  /** Which trigger edge the panel lines up with. */
  align?: 'start' | 'end'
  showMarkAll?: boolean
  /**
   * Whether rows are activatable. `false` renders genuinely inert rows: no
   * tabindex, no place in the roving focus, no `select`. Right for a feed
   * with nowhere to go, and when every row is inert the scrolling list
   * becomes the tab stop so a keyboard can still reach the bottom of it.
   */
  interactive?: boolean
  closeOnSelect?: boolean
  /** Close when the page navigates (history back/forward, a hash change, or
   *  any navigation the browser reports through the Navigation API). */
  closeOnNavigate?: boolean
  disabled?: boolean
  /** Phosphor icon for the trigger and the empty state. */
  icon?: string
  /** BCP 47 tag for relative times. */
  locale?: string
  unreadLabel?: string
  readLabel?: string
  /** Builds the unread half of the trigger's accessible name. Replace it to
   *  translate or to pluralise the way your language actually does. */
  formatUnread?: (count: number) => string
}

export interface IPanelPlacementOptions {
  align: 'start' | 'end'
  /** Panel width in px. */
  width: number
  /** Tallest the scrolling list may get. */
  maxHeight: number
  viewport: IAnchorSize
}

export interface IPanelPlacement {
  /** Viewport (`position: fixed`) coordinates. */
  top: number
  left: number
  /** The side actually used, after any flip. */
  side: 'top' | 'bottom'
  /** What the list may scroll to before it clips, after the viewport clamp. */
  maxListHeight: number
}

/* The placement arithmetic itself (`placeNotificationPanel`,
 * `isAnchorInViewport`) is runtime code and therefore lives in
 * NotificationCenter.vue, which is where it is imported from. Only its
 * argument and result shapes are declared here. */
