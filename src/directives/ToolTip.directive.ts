import type { App, DirectiveBinding, ObjectDirective } from 'vue'
import { prefersReducedMotion } from '@/composables/useReducedMotion.composable'
import type { IComponentContent } from '@/types/ContentRenderer'
import { renderTooltipContent, devWarn } from '@/directives/ToolTip.content'

type TTooltipChip = HTMLSpanElement & {
  __removeTimer__?: ReturnType<typeof setTimeout>
  /** True while the pointer is inside the chip. WCAG 2.1 AA 1.4.13
   *  ("Hoverable") requires that content revealed on hover can itself be
   *  hovered without disappearing, so this counts as engagement everywhere
   *  the anchor's own hover would. */
  __hovered__?: boolean
}

type TTooltipEl = HTMLElement & {
  __showTooltip__?: (trigger?: TTooltipTrigger) => void
  __hideTooltip__?: (delay?: number, reason?: TTooltipReason) => void
  __mouseMove__?: (e: MouseEvent) => void
  __showHandler__?: EventListener
  __hideHandler__?: EventListener
  __focusHandler__?: EventListener
  __blurHandler__?: EventListener
  __touchHandler__?: EventListener
  // Timestamp of the last touch that opened this tooltip. Used to swallow
  // the synthetic mouseenter every touchscreen browser fires right after a
  // tap, which would otherwise re-open the chip we just scheduled to close.
  __lastTouchAt__?: number
  // What opened the currently-visible chip. Pointer shows may follow the
  // cursor; focus and touch shows have no cursor to follow and must anchor
  // to the element instead.
  __trigger__?: TTooltipTrigger
  // The anchor's own aria-describedby before we appended our description
  // node's id, so unmount can put back exactly what the consumer had
  // (possibly nothing).
  __prevDescribedBy__?: string | null
  // The always-present, visually hidden node that carries the description
  // text for assistive technology. It exists from mount, NOT from the first
  // hover: a description a screen reader can only find while a chip happens
  // to be on screen is not in the tree at the moment focus arrives, which is
  // exactly when it is computed. See syncDescription.
  __descNode__?: HTMLSpanElement
  // Text last written into __descNode__, so a re-render that changed nothing
  // does not touch the accessibility tree.
  __descText__?: string
  // The anchor's own `title` before we stripped it. A native title renders
  // the browser's own tooltip on top of ours and competes as the description,
  // so it is stashed while the binding is live and put back on unmount.
  __prevTitle__?: string
  // True once the re-anchor loop has asked for a close because the anchor
  // went off screen, so a controlled chip that stays up (its host owns the
  // decision) is not re-reported on every animation frame.
  __offscreenReported__?: boolean
  // True when the aria-label on the anchor is ours (label mode) rather than
  // the consumer's. Only an attribute we own may be updated or removed.
  __ownsAriaLabel__?: boolean
  // True when we added tabindex="0" via `focusable`, so unmount can undo it.
  __ownsTabIndex__?: boolean
  __mouseX__?: number
  __mouseY__?: number
  __tooltipBinding__?: ITooltipOptions
  __showTimer__?: ReturnType<typeof setTimeout>
  __hideTimer__?: ReturnType<typeof setTimeout>
  // Every chip this anchor has ever put in <body> and not yet reaped.
  // Tracking the whole set (not just the latest) is what makes hide /
  // unmount able to remove chips a retriggered show would otherwise
  // orphan. Invariant: at most one entry, enforced by showTooltip.
  __chips__?: Set<TTooltipChip>
  // Signature of the content last written into the live chip, so the
  // `updated` hook can short-circuit without touching layout.
  __lastContent__?: string
  __watchdogTimer__?: ReturnType<typeof setTimeout>
  __watchdogMisses__?: number
  // The side the live chip is currently DRAWN on, which is what decides its
  // arrow class. Written by positionTooltip, never by the caller.
  __side__?: TSide
  // The side the chip was ASKED for. Kept separately from `__side__` because
  // the two diverge the moment a chip flips: re-running placement with the
  // side it flipped TO makes the flip permanent, so a chip that had to go
  // below at the bottom of a panel could never come back up once the anchor
  // scrolled into open space.
  __requestedSide__?: TSide
  // Last anchor rect the re-anchor loop acted on, as a cheap change test.
  __lastRect__?: string
  // The anchor's scroll-clipping ancestors, resolved once when a chip opens.
  // `getComputedStyle` is a forced style read, so it must not run per frame.
  __clippers__?: HTMLElement[]
  // True when we added role="img" alongside a permanent aria-label, so
  // unmount can undo it.
  __ownsRole__?: boolean
  // Set while a chip is on screen, so the controlled `open` option can tell
  // "already in the state you asked for" from "act now" without reading the
  // DOM, and so onOpenChange fires exactly once per transition.
  __openState__?: boolean
  // Disabled-anchor escalation. A native-disabled control fires no mouse
  // events at all, so its listeners live on the parent and hit-test by
  // geometry. See syncDisabledProxy.
  __proxyHost__?: HTMLElement
  __proxyMove__?: EventListener
  __proxyLeave__?: EventListener
  __proxyInside__?: boolean
  // The currently-live chip (the one `updated` repositions). Always a
  // member of `__chips__` while set.
  tooltipElement?: TTooltipChip
}

export interface ITooltipOptions {
  /** The three content slots accept `null` as well as `undefined`, because an
   *  application binding a value straight from its state (`projectPath`, a
   *  fetched description, an optional field) usually has `string | null` and
   *  the runtime has always treated any falsy value as "no tooltip" via
   *  `hasContent`. Rejecting `null` in the type while accepting it at runtime
   *  only forced `?? undefined` at every call site. Found by type-checking
   *  `v-nb-tooltip` in a real consumer for the first time. */
  body?: string | Array<IComponentContent> | null
  header?: string | Array<IComponentContent> | null
  tip?: string | Array<IComponentContent> | null
  /** The chip's tone, from the same vocabulary the rest of the library uses
   *  (`NbBanner.status`, `EVariant`). `default` is the inverted chip and is
   *  what a labelling tooltip should stay on: a coloured chip on a plain icon
   *  button reads as a state the control does not have. Reach for `danger` or
   *  `warning` only when the tooltip is explaining a blocked or destructive
   *  action, which is the case the fleet actually has. */
  status?: TTooltipStatus
  /** @deprecated Use `status`. Kept because it is the name every existing
   *  binding uses and removing it would break them silently. `status` wins
   *  when both are given. Typed now, where it used to be `string`: the four
   *  values that were only ever documented are now the four the compiler
   *  accepts, plus `success` and `warning`, which the library's own status
   *  vocabulary has and this directive was missing. */
  flavor?: TTooltipStatus
  delay?: number
  /** Milliseconds the chip stays up after the pointer or focus leaves.
   *  Defaults to 150. Raise it when the anchor sits next to a target the
   *  user must cross to reach, lower it for dense toolbars. */
  hideDelay?: number
  /** How the tooltip is wired to assistive technology.
   *  - `label`: the tooltip IS the anchor's accessible name (icon-only
   *    controls). Applied as a permanent `aria-label`, because a name that
   *    only exists while a chip is on screen is not a name.
   *  - `description`: the tooltip adds to an anchor that is already named.
   *    Applied as `aria-describedby` on the visible chip only.
   *  - `none`: no aria wiring at all. For decorative or duplicated text.
   *  - `auto` (default): `label` when the anchor has no accessible name,
   *    `description` when it does. */
  aria?: TTooltipAria
  /** Add `tabindex="0"` to an anchor that cannot otherwise take focus, so
   *  keyboard users can reach the tooltip. Only for anchors that carry
   *  information nothing else conveys (a truncated cell, a status dot).
   *  Never needed on a button or a link. */
  focusable?: boolean
  /** Open on touch (tap) as well as hover and focus. Default true. */
  touch?: boolean
  animationTime?: number
  position?: 'top' | 'bottom' | 'left' | 'right' | 'cursor'
  followCursor?: boolean
  overflowOnly?: boolean
  /** Extra classes for the CHIP (not for the anchor, which keeps its own
   *  `class` attribute untouched). Use it for a one-off width or a product
   *  skin; the supported knobs are the three custom properties in the docs. */
  chipClass?: string
  /** @deprecated Use `chipClass`, which says which element it lands on.
   *  `classExtra` is a name nothing else in this library uses. */
  classExtra?: string
  /** Controlled visibility. When this is a boolean, the chip is on screen if
   *  and only if it is `true`, and hover / focus / tap stop opening and
   *  closing it themselves: they report what the user did through
   *  `onOpenChange` and leave the decision to you. This is what an onboarding
   *  highlight, a "show me" button and a visual-regression snapshot of the
   *  open state need, and there was previously no way to get any of them
   *  without synthesising MouseEvents. Leave it `undefined` for the ordinary
   *  uncontrolled tooltip. */
  open?: boolean
  /** Open once, on mount, and behave normally afterwards. Uncontrolled: the
   *  first hover-out closes it for good. For a hint that should be seen once
   *  without taking the tooltip away from the user. */
  defaultOpen?: boolean
  /** Called on every transition, with what caused it. In controlled mode this
   *  is the only way the user's pointer and keyboard reach you. */
  onOpenChange?: (open: boolean, reason: TTooltipReason) => void
}

export type TTooltipAria = 'auto' | 'label' | 'description' | 'none'
/** What opened a chip. `program` is a controlled or `defaultOpen` show, which
 *  never waits out the hover-intent delay. */
export type TTooltipTrigger = 'pointer' | 'focus' | 'touch' | 'program'
/** What caused a transition reported through `onOpenChange`.
 *  - `dismiss`: the user got rid of it. Escape, a pointerdown outside, the
 *    window losing focus, a drag starting, the anchor scrolling out of sight.
 *  - `superseded`: another anchor opened a chip, and only one chip is ever on
 *    screen. Nothing the user did was a dismissal OF THIS tooltip, which is
 *    why it is not called one: a host that treats every `false` as "the user
 *    is done with this hint" would otherwise cancel an onboarding highlight
 *    the moment the pointer crossed an unrelated icon button. */
export type TTooltipReason = TTooltipTrigger | 'dismiss' | 'superseded'
/** The chip's tone. Same words as `NbBanner.status` and `EVariant`, minus the
 *  ones a 55-character chip has no use for. */
export type TTooltipStatus =
  | 'default'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

/** `status` wins over the deprecated `flavor`; neither means `default`. */
const statusOf = (options: ITooltipOptions): TTooltipStatus =>
  options.status ?? options.flavor ?? 'default'

/** `chipClass` wins over the deprecated `classExtra`. */
const chipClassOf = (options: ITooltipOptions): string | undefined =>
  options.chipClass ?? options.classExtra

const registeredTooltips = new Set() // Store active tooltips globally

/** Monotonic id source for chips that have to be referenced by
 *  `aria-describedby`. Ids must be unique per document, not per anchor:
 *  the same anchor can outlive several chips. */
let chipSeq = 0
const nextChipId = () => `nb-tooltip-${++chipSeq}`

/** Milliseconds after a touch during which the synthetic mouse events that
 *  every touchscreen browser replays are ignored. */
const TOUCH_MOUSE_GRACE_MS = 900
/** A touch-opened tooltip has no "pointer left" event to close it, so it
 *  closes itself. Long enough to read a control label, short enough that it
 *  is gone before the user's next tap. */
const TOUCH_VISIBLE_MS = 4000
/** A focus that lands within this window of a pointerdown was caused by that
 *  pointer, not by the keyboard. Clicking a button must not leave its
 *  tooltip hanging over whatever the click just opened. */
const POINTER_FOCUS_GRACE_MS = 500

let lastPointerDownAt = 0

/** Is `stamp` within `window` milliseconds of now?
 *
 *  A plain subtraction is not enough. `Date.now()` is a wall clock: an NTP
 *  correction, a timezone service or a user changing the system time can move
 *  it BACKWARDS, and a negative delta reads as "zero milliseconds ago" to
 *  every `< window` test. That would silently suppress focus-opened tooltips
 *  (the keyboard user's only way to read a label) until the clock caught up.
 *  A stamp in the future is treated as stale, which is the safe direction. */
const withinMs = (stamp: number | undefined, window: number): boolean => {
  if (!stamp) return false
  const since = Date.now() - stamp
  return since >= 0 && since < window
}

// Document-wide dismiss listeners. Installed once at app boot.
// Without these, a user who hovers a tooltip-bearing element and
// then clicks another control (an input, a button, ANY interactive
// surface) leaves the tooltip stuck on screen: mouseleave never
// fires because the cursor still sits over the anchor when focus
// jumps, and the anchor's own listeners never get a "user is done
// reading this" signal. Result is an orphan chip until the user
// happens to mouse away from the original anchor.
//
// Pointerdown anywhere = "user moved on, dismiss everything". Same
// for window.blur (Tab away, ⌘Tab, click into another app), which
// catches the case where the user reads the tooltip and then
// switches windows: the chip would otherwise stay on the
// re-foregrounded view.
let documentDismissInstalled = false
const installDocumentDismiss = () => {
  if (documentDismissInstalled || typeof document === 'undefined') return
  documentDismissInstalled = true
  const dismiss = (event?: Event) => {
    if (registeredTooltips.size === 0) return
    // A pointerdown INSIDE a chip is the user interacting with the chip
    // (selecting an error code to copy, most often). Closing on it would
    // undo the hoverability we just gained.
    const target = event?.target
    if (target instanceof Element && target.closest('.nb-tooltip')) return
    // 'dismiss', never 'program'. Every one of these is the USER asking for
    // the chip to go away (Escape, a pointerdown elsewhere, a drag, leaving
    // the window), and a user request is exactly what the controlled gate
    // exists to forward rather than act on. Routing them through 'program'
    // (what this used to do, via dismissAllTooltips) punched a hole in that
    // gate: a controlled chip was torn down behind the host's back and the
    // next render, with `open` still true because nobody had told the host
    // anything, put it straight back. Escape did not dismiss it, it blinked
    // it, which is WCAG 2.1 AA 1.4.13 Dismissible failed in the one mode the
    // docs promise it works in.
    dismissOpenTooltips('dismiss')
  }
  // Stamp every pointerdown, whether or not a tooltip is open, so the focus
  // handler can tell "the user tabbed here" from "the user clicked here".
  const stampPointer = () => {
    lastPointerDownAt = Date.now()
  }
  document.addEventListener('pointerdown', stampPointer, true)
  // Native drag and drop swallows the pointer stream entirely. Take the chip
  // down at the start of it rather than leaving it pinned over the drop
  // targets the user is aiming at.
  document.addEventListener('dragstart', () => dismiss(), true)
  // Escape closes the tooltip without moving focus, which is what a keyboard
  // user needs when the chip covers the thing they were about to read. The
  // event is never consumed: Escape still reaches the dialog, menu or field
  // underneath.
  document.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      dismiss()
    },
    true,
  )
  // capture: true so we run before the click handler that might
  // re-open a tooltip (button hover-states etc.), and so a stopPropagation
  // call on the click target doesn't prevent dismissal.
  document.addEventListener('pointerdown', dismiss, true)
  window.addEventListener('blur', dismiss)
  // Pointer left the document entirely (out of the window, onto native
  // chrome). mouseleave on the anchor does not always fire for that
  // exit path, so without this the chip can stay up indefinitely.
  document.addEventListener('mouseleave', dismiss)
}

// How long the exit animation runs before the node is detached. Must
// match the tooltipDisappear duration below so the chip is not ripped
// out mid-animation.
const HIDE_ANIMATION_MS = 200

// Self-life for a shown chip. Every tick re-verifies that the anchor is
// still in the document and still hovered; N consecutive misses reap
// the chip. This is what makes the directive self-sufficient: no user
// gesture, no route change and no host call is required for a chip to
// stop existing. Two ticks of grace keeps a legitimately hovered chip
// safe from a single transient miss.
const WATCHDOG_INTERVAL_MS = 1000
const WATCHDOG_MISSES_TO_HIDE = 2

/** Is the pointer inside the chip itself? WCAG 2.1 AA 1.4.13 requires that
 *  hover-revealed content stay up while the pointer is over it, so the
 *  watchdog must treat a hovered chip exactly as it treats a hovered anchor.
 *  Without this the watchdog reaps the chip the user is currently reading. */
const chipIsHovered = (el: TTooltipEl): boolean => {
  const chip = el.tooltipElement
  if (!chip) return false
  if (chip.__hovered__) return true
  try {
    return chip.isConnected && chip.matches(':hover')
  } catch {
    return false
  }
}

const isAnchorEngaged = (el: TTooltipEl): boolean => {
  if (!el.isConnected) return false
  // The chip counts as the anchor for engagement purposes, whatever opened
  // it: a keyboard user who then reaches for the mouse to read a long chip
  // must not have it pulled out from under the pointer.
  if (chipIsHovered(el)) return true
  // A focus-opened or touch-opened chip has no hover to verify. Reaping it on
  // the hover check alone is what used to make the directive unusable for
  // keyboard users: the label vanished two seconds after they tabbed to the
  // control.
  if (el.__trigger__ === 'focus' && el.contains(document.activeElement))
    return true
  if (
    el.__trigger__ === 'touch' &&
    withinMs(el.__lastTouchAt__, TOUCH_VISIBLE_MS)
  )
    return true
  try {
    return el.matches(':hover')
  } catch {
    // Engine without :hover selector support: assume engaged so the
    // watchdog can never hide a legitimately visible tooltip. The
    // disconnect check above still reaps orphaned anchors.
    return true
  }
}

const stopWatchdog = (el: TTooltipEl) => {
  clearTimeout(el.__watchdogTimer__)
  el.__watchdogTimer__ = undefined
  el.__watchdogMisses__ = 0
}

const startWatchdog = (el: TTooltipEl) => {
  stopWatchdog(el)
  const tick = () => {
    if (!el.__chips__?.size) {
      stopWatchdog(el)
      return
    }
    if (isAnchorEngaged(el)) {
      el.__watchdogMisses__ = 0
    } else {
      el.__watchdogMisses__ = (el.__watchdogMisses__ ?? 0) + 1
      if (!el.isConnected) {
        // Detached anchor: nothing left to animate against, and no host state
        // can be relevant to an element that is no longer in the document, so
        // this is the one watchdog exit that goes around the gate.
        hideTooltip(el, true, 'program')
        return
      }
      if (el.__watchdogMisses__ >= WATCHDOG_MISSES_TO_HIDE) {
        // Still connected, so the anchor may well be controlled. Ask; do not
        // take. The tick does not reschedule, so a controlled chip that stays
        // up is reported once, not once every interval.
        requestHide(el, 'dismiss')
        return
      }
    }
    el.__watchdogTimer__ = setTimeout(tick, WATCHDOG_INTERVAL_MS)
  }
  el.__watchdogTimer__ = setTimeout(tick, WATCHDOG_INTERVAL_MS)
}

// ── Re-anchoring ─────────────────────────────────────────────────────────
//
// A chip is `position: fixed` in <body>, so it does not move with its anchor.
// Anything that moves the anchor without moving the chip detaches the two:
// scrolling ANY ancestor (a Shell panel, an inspector, a scrolled table body),
// resizing the window, a sidebar collapsing, a row animating in.
//
// The previous version listened for `scroll` on `window` with no capture, so
// it heard nothing from an inner scroll container (scroll does not bubble) and
// nothing at all from a resize. In a shell, where practically every scroll is
// an inner scroll, that meant the chip stayed pinned at the coordinates it was
// born at while its trigger slid away.
//
// So: while at least one chip is on screen (usually zero, at most one per
// anchor), we subscribe to capture-phase `scroll` on the document (capture is
// how you hear a non-bubbling event from any descendant), to `resize`, and to
// a per-frame rect check that catches everything no event reports: transitions,
// layout shifts, an ancestor being collapsed. All three funnel into the same
// reposition. Every listener is removed the moment the last chip goes.

const liveAnchors = new Set<TTooltipEl>()
let reanchorFrame: number | null = null

/** Serialised anchor geometry. Comparing this string is how the frame loop
 *  avoids writing styles on the ~99% of frames where nothing moved. */
const rectKey = (r: DOMRect): string =>
  `${Math.round(r.top)}:${Math.round(r.left)}:${Math.round(r.width)}:${Math.round(r.height)}`

/** Is the anchor still somewhere a chip could point at? A zero-sized box means
 *  it was hidden (display:none, a collapsed panel); a box entirely outside the
 *  viewport means the user scrolled it away. Either way the chip is pointing at
 *  nothing and must go rather than hover over unrelated content. */
/** Does this element clip its overflowing descendants? */
const clipsOverflow = (node: HTMLElement): boolean => {
  if (typeof getComputedStyle !== 'function') return false
  let style: CSSStyleDeclaration
  try {
    style = getComputedStyle(node)
  } catch {
    return false
  }
  const overflow = `${style.overflow} ${style.overflowX} ${style.overflowY}`
  return /hidden|scroll|auto|clip|overlay/.test(overflow)
}

/** The anchor's scroll-clipping ancestors, nearest first.
 *
 *  Resolved once per chip rather than per frame: `getComputedStyle` forces a
 *  style recalculation, and the re-anchor loop runs on every frame in which
 *  the anchor moved. A container that changes its own overflow while a
 *  tooltip is open is not a case worth a per-frame style read. */
const collectClippers = (el: TTooltipEl): HTMLElement[] => {
  const out: HTMLElement[] = []
  let node = el.parentElement
  while (node && node !== document.body && node !== document.documentElement) {
    if (clipsOverflow(node)) out.push(node)
    node = node.parentElement
  }
  return out
}

/** jsdom, and any element that has never been laid out, report an all-zero
 *  rect. Treating that as real geometry would make every unit test and every
 *  first paint hide its own tooltip. */
const hasLayout = (rect: DOMRect): boolean =>
  !(rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)

const anchorStillVisible = (el: TTooltipEl, rect: DOMRect): boolean => {
  if (!el.isConnected) return false
  // jsdom and any element that has never been laid out report an all-zero
  // rect. Treating that as "gone" would make every unit test and every
  // server-rendered first paint hide its own tooltip, so a zero-area rect at
  // the origin is read as "no layout information", not as "off screen".
  if (!hasLayout(rect)) return true
  if (rect.width === 0 || rect.height === 0) return false
  if (
    !(
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    )
  )
    return false
  // The viewport is not the only thing that hides an anchor. A row scrolled
  // out of a table body, a field scrolled out of an inspector, a card
  // scrolled out of a shell panel: all of them are still inside the viewport
  // and completely invisible, and a viewport-only test leaves the chip glued
  // to a clipped anchor, floating over the panel's own chrome. This is the
  // single most common layout in the fleet, so it is checked by default
  // rather than behind a flag.
  for (const clipper of el.__clippers__ ?? []) {
    if (!clipper.isConnected) continue
    const bounds = clipper.getBoundingClientRect()
    if (!hasLayout(bounds)) continue
    if (
      rect.bottom <= bounds.top ||
      rect.top >= bounds.bottom ||
      rect.right <= bounds.left ||
      rect.left >= bounds.right
    )
      return false
  }
  return true
}

/** Put one live chip back where it belongs, or take it down if its anchor no
 *  longer exists on screen. */
const reanchor = (el: TTooltipEl) => {
  const chip = el.tooltipElement
  if (!chip || !el.__chips__?.size) {
    liveAnchors.delete(el)
    return
  }
  const rect = el.getBoundingClientRect()
  if (!anchorStillVisible(el, rect)) {
    // Latched: this loop runs every frame, and a controlled chip whose host
    // keeps `open` true would otherwise be reported as dismissed sixty times
    // a second. Report the transition once; re-arm when the anchor comes back.
    if (!el.__offscreenReported__) {
      el.__offscreenReported__ = true
      requestHide(el, 'dismiss')
    }
    return
  }
  el.__offscreenReported__ = false
  el.__lastRect__ = rectKey(rect)
  // A cursor-anchored chip has no anchor geometry to follow: the pointer is
  // its anchor, and the pointer cannot move without firing mousemove. Leave
  // it where it is rather than teleporting it to the element on every scroll.
  if (el.__side__ === 'cursor') return
  positionTooltip(el, chip, el.__requestedSide__ ?? el.__side__)
}

const reanchorAll = () => {
  // A scroll or a resize is motion by definition: follow at full rate until
  // it stops rather than at the idle cadence.
  noteMotion()
  for (const el of Array.from(liveAnchors)) reanchor(el)
}

/** How often the frame loop reads anchor geometry while nothing is moving. */
const IDLE_POLL_MS = 100
/** How long a detected move keeps the loop reading every frame. */
const MOTION_BURST_MS = 320
let lastPollAt = 0
let motionUntil = 0

/** Declare that something which moves anchors just happened (a scroll, a
 *  resize, a placement change), so the next frames are read at full rate. */
const noteMotion = () => {
  motionUntil = Date.now() + MOTION_BURST_MS
}

/** Frame loop, adaptive.
 *
 *  `getBoundingClientRect` is a forced layout, and running it on every live
 *  anchor on every frame is a measurable cost for a chip that is, most of the
 *  time, sitting still: the previous version paid 60 reads a second to
 *  discover 60 times that nothing had changed. So the loop reads at 10 Hz
 *  while the page is quiet and at full frame rate for a third of a second
 *  after anything moves, which covers scrolling, resizing, a CSS transition
 *  on an ancestor and a drag, because all of those keep re-arming the burst.
 *  Style writes still only happen when the geometry actually differs. */
const frameTick = () => {
  if (liveAnchors.size === 0) {
    reanchorFrame = null
    return
  }
  const now = Date.now()
  if (now >= motionUntil && now - lastPollAt < IDLE_POLL_MS) {
    reanchorFrame = requestAnimationFrame(frameTick)
    return
  }
  lastPollAt = now
  for (const el of Array.from(liveAnchors)) {
    if (!el.tooltipElement) {
      liveAnchors.delete(el)
      continue
    }
    const key = rectKey(el.getBoundingClientRect())
    if (key !== el.__lastRect__) {
      noteMotion()
      reanchor(el)
    }
  }
  reanchorFrame = requestAnimationFrame(frameTick)
}

let reanchorListening = false
const startReanchoring = (el: TTooltipEl) => {
  liveAnchors.add(el)
  el.__lastRect__ = undefined
  el.__clippers__ = collectClippers(el)
  if (typeof window === 'undefined') return
  if (!reanchorListening) {
    reanchorListening = true
    // capture: true is the whole point. `scroll` does not bubble, so a
    // bubble-phase document listener never hears an inner container scroll.
    document.addEventListener('scroll', reanchorAll, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', reanchorAll, { passive: true })
  }
  if (reanchorFrame === null && typeof requestAnimationFrame === 'function') {
    reanchorFrame = requestAnimationFrame(frameTick)
  }
}

const stopReanchoring = (el: TTooltipEl) => {
  liveAnchors.delete(el)
  el.__lastRect__ = undefined
  el.__clippers__ = undefined
  if (liveAnchors.size > 0 || typeof window === 'undefined') return
  if (reanchorListening) {
    reanchorListening = false
    document.removeEventListener('scroll', reanchorAll, { capture: true })
    window.removeEventListener('resize', reanchorAll)
  }
  if (reanchorFrame !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(reanchorFrame)
    reanchorFrame = null
  }
}

const removeChip = (el: TTooltipEl, chip: TTooltipChip, immediate: boolean) => {
  el.__chips__?.delete(chip)
  clearTimeout(chip.__removeTimer__)
  chip.__removeTimer__ = undefined
  if (immediate || prefersReducedMotion()) {
    chip.remove()
    return
  }
  chip.style.animation = `tooltipDisappear ${HIDE_ANIMATION_MS}ms ease-in-out forwards`
  chip.__removeTimer__ = setTimeout(() => {
    chip.__removeTimer__ = undefined
    chip.remove()
  }, HIDE_ANIMATION_MS)
}

/** Reap every chip this anchor owns, not just the memoized latest. */
const removeAllChips = (el: TTooltipEl, immediate: boolean) => {
  // Note what is NOT here: the description link. It is not the chip's to
  // give or to take away. It belongs to the binding and outlives every chip.
  stopReanchoring(el)
  el.__trigger__ = undefined
  el.__side__ = undefined
  if (el.__chips__) {
    for (const chip of Array.from(el.__chips__)) removeChip(el, chip, immediate)
  }
  el.tooltipElement = undefined
  el.__lastContent__ = undefined
  stopWatchdog(el)
}

// ── Accessible naming ────────────────────────────────────────────────────
//
// The whole reason three apps rebuilt this directive is that they needed to
// label an icon-only button and the tooltip could not do it. The two jobs a
// tooltip can have are NOT interchangeable:
//
//   LABEL       the control has no text of its own (a bare icon). The tooltip
//               text is its name. It must exist for assistive technology
//               whether or not a chip is on screen, so it is written as a
//               permanent `aria-label` on the anchor.
//   DESCRIBE    the control is already named ("Publish") and the tooltip adds
//               a detail ("publishes to the live site"). A name must not be
//               replaced by a description, so this is `aria-describedby`
//               pointing at the chip, and only while the chip exists.
//
// Getting this backwards is silent: a screen reader announces "button" for a
// labelled-as-description icon, or announces the description instead of the
// name. So `aria: 'auto'` picks by asking whether the anchor already has a
// name, and every other mode is explicit.

const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [tabindex]'

/** Marks every element the directive is mounted on, so a bubbling trigger can
 *  find the anchor NEAREST to it. */
const ANCHOR_ATTR = 'data-nb-tooltip-anchor'

/** `focusin` and `touchstart` bubble, so a tooltip on a wrapper hears the
 *  events of a tooltip on a control inside it, and a single Tab used to open
 *  two overlapping chips. The innermost anchor owns the event; every anchor
 *  above it ignores it. (`mouseenter` does not bubble but nests the same way,
 *  which `showTooltip` handles by closing any ancestor's chip when a
 *  descendant opens one.) */
const isNearestAnchor = (el: TTooltipEl, event: Event): boolean => {
  const target = event.target
  if (!(target instanceof Element)) return true
  if (target === el) return true
  const nearest = target.closest(`[${ANCHOR_ATTR}]`)
  return nearest === null || nearest === el
}

/** Flatten tooltip content to the string a screen reader should hear. Markup
 *  the chip renders (allowed inline tags, <br>) is meaningless to AT, so it is
 *  stripped rather than announced. */
const plainTextOf = (
  content:
    | string
    | Array<IComponentContent>
    | IComponentContent
    | undefined
    | null,
): string => {
  if (!content) return ''
  if (typeof content === 'string') {
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (Array.isArray(content)) {
    return content
      .map((item) => plainTextOf(item))
      .filter(Boolean)
      .join(' ')
  }
  if (typeof content === 'object') {
    const node = content as IComponentContent & { content?: unknown }
    const children = (node as any).children ?? (node as any).content
    return plainTextOf(children as any)
  }
  return ''
}

/** Header + body + tip as one announceable string. */
const announceableText = (options: ITooltipOptions): string =>
  [
    plainTextOf(options.header),
    plainTextOf(options.body),
    plainTextOf(options.tip),
  ]
    .filter(Boolean)
    .join('. ')

/** Does the anchor already have an accessible name that is not ours? Text
 *  content counts: a <button>Save</button> is named by its own text. */
const hasForeignName = (el: TTooltipEl): boolean => {
  if (el.hasAttribute('aria-labelledby')) return true
  if (el.hasAttribute('aria-label') && !el.__ownsAriaLabel__) return true
  if (el.hasAttribute('title')) return true
  if ((el.textContent ?? '').trim().length > 0) return true
  const img = el.querySelector('img[alt]')
  return !!img && (img.getAttribute('alt') ?? '').trim().length > 0
}

const resolveAria = (
  el: TTooltipEl,
  options: ITooltipOptions,
): TTooltipAria => {
  const requested = options.aria ?? 'auto'
  if (requested !== 'auto') return requested
  return hasForeignName(el) ? 'description' : 'label'
}

/** Keep the permanent `aria-label` in step with the binding. Runs on mount and
 *  on every content change, because an icon button whose tooltip changed
 *  ("Mute" -> "Unmute") has changed its name. */
const syncAriaLabel = (
  el: TTooltipEl,
  options: ITooltipOptions | undefined,
) => {
  if (!options || resolveAria(el, options) !== 'label') {
    if (el.__ownsAriaLabel__) {
      el.removeAttribute('aria-label')
      el.__ownsAriaLabel__ = false
    }
    if (el.__ownsRole__) {
      el.removeAttribute('role')
      el.__ownsRole__ = false
    }
    return
  }
  const text = announceableText(options)
  if (!text) return
  el.setAttribute('aria-label', text)
  el.__ownsAriaLabel__ = true
  // `aria-label` is only honoured on elements that have a role which supports
  // naming. On a bare <span> or <div> it is prohibited by ARIA and browsers
  // announce it inconsistently or not at all, which would make the headline
  // promise of this directive (naming an unlabelled control) silently produce
  // nothing on exactly the non-interactive anchors it is recommended for: a
  // status dot, a coloured square, a bare glyph. Giving such an anchor
  // role="img" makes it a nameable object with no children exposed, which is
  // precisely what a labelled decorative element is. Anchors that already
  // have a role, and anchors that are natively interactive, are left alone.
  if (
    !el.__ownsRole__ &&
    !el.hasAttribute('role') &&
    !el.matches(FOCUSABLE_SELECTOR)
  ) {
    el.setAttribute('role', 'img')
    el.__ownsRole__ = true
  }
}

/** Reachability. A `<span>` or an `<svg>` cannot be tabbed to, so its tooltip
 *  is invisible to keyboard and screen-reader users. We never add a tab stop
 *  behind the consumer's back: `focusable: true` is an explicit statement that
 *  this element carries information nothing else on the page carries.
 *
 *  Re-run on every update, not only on mount: `focusable` is bound to app
 *  state as often as any other option (a cell is only informative while it is
 *  truncated), and evaluating it once at mount silently ignored every later
 *  change. We only ever add or remove a tabindex we put there ourselves. */
const syncFocusable = (
  el: TTooltipEl,
  options: ITooltipOptions | undefined,
) => {
  const wanted = !!options?.focusable
  if (wanted && !el.__ownsTabIndex__) {
    if (el.matches(FOCUSABLE_SELECTOR) || el.hasAttribute('tabindex')) return
    el.setAttribute('tabindex', '0')
    el.__ownsTabIndex__ = true
    return
  }
  if (!wanted && el.__ownsTabIndex__) {
    el.removeAttribute('tabindex')
    el.__ownsTabIndex__ = false
  }
}

/** Point the anchor at the visible chip, preserving any describedby the
 *  consumer already had (a field can be described by both its error message
 *  and its tooltip). */
const linkDescription = (el: TTooltipEl, chipId: string) => {
  el.__prevDescribedBy__ = el.getAttribute('aria-describedby')
  const merged = [el.__prevDescribedBy__, chipId].filter(Boolean).join(' ')
  el.setAttribute('aria-describedby', merged)
}

const unlinkDescription = (el: TTooltipEl) => {
  if (el.__prevDescribedBy__ === undefined) return
  if (el.__prevDescribedBy__) {
    el.setAttribute('aria-describedby', el.__prevDescribedBy__)
  } else {
    el.removeAttribute('aria-describedby')
  }
  el.__prevDescribedBy__ = undefined
}

/** Class on the persistent description node. Styled visually hidden, never
 *  `display: none` or `hidden`: either would take it back out of the
 *  accessibility tree, which is the one place it has to be. */
const DESC_CLASS = 'nb-tooltip-description'

/** Is there anything to put in a chip at all? */
const hasContent = (options: ITooltipOptions | undefined): boolean =>
  !!options && !!(options.body || options.header || options.tip)

/** The description, in the accessibility tree, from mount.
 *
 *  A screen reader computes an element's description when focus reaches it.
 *  Wiring `aria-describedby` at the moment a chip appears is therefore too
 *  late by construction, and with a hover-intent delay in front of it, late by
 *  400ms: a keyboard user tabs to the control, hears its name, and the
 *  description that the tooltip exists to provide arrives after the
 *  announcement it should have been part of. So the text lives in a hidden
 *  node that is created with the binding, updated with the binding, and
 *  referenced by the anchor the whole time. The visible chip is then purely
 *  visual, which is also what makes the label / description flip safe: there
 *  is never a moment where both a name and a live description say the same
 *  thing.
 *
 *  Idempotent, and cheap when nothing changed: one string compare. */
const syncDescription = (
  el: TTooltipEl,
  options: ITooltipOptions | undefined,
) => {
  if (typeof document === 'undefined') return
  const wanted =
    options && hasContent(options) && resolveAria(el, options) === 'description'
      ? announceableText(options)
      : ''
  if (!wanted) {
    destroyDescription(el)
    return
  }
  let node = el.__descNode__
  if (!node) {
    node = document.createElement('span')
    node.className = DESC_CLASS
    node.id = nextChipId()
    // The node IS the tooltip as far as assistive technology is concerned, so
    // it carries the role. The painted chip carries aria-hidden instead.
    node.setAttribute('role', 'tooltip')
    document.body.appendChild(node)
    el.__descNode__ = node
    linkDescription(el, node.id)
  }
  if (el.__descText__ !== wanted) {
    node.textContent = wanted
    el.__descText__ = wanted
  }
}

const destroyDescription = (el: TTooltipEl) => {
  if (!el.__descNode__) return
  unlinkDescription(el)
  el.__descNode__.remove()
  el.__descNode__ = undefined
  el.__descText__ = undefined
}

/** A native `title` on a tooltip anchor is a second tooltip.
 *
 *  The browser draws its own yellow box, on its own schedule, wherever the
 *  pointer happens to be, on top of the chip; and the accessibility tree takes
 *  the title as a name or a description depending on what else the element
 *  has, so the two compete for the same slot. There is no arrangement in which
 *  both are wanted. The attribute is stashed and stripped while the binding is
 *  live and put back on unmount, so an app that also renders a title for a
 *  non-directive reason keeps its markup.
 *
 *  Stripping it BEFORE the aria pass matters: `hasForeignName` counts a title
 *  as a name, so an icon button whose only name was its title would resolve to
 *  `description` mode and end up with no name at all. With the title gone, the
 *  same button resolves to `label` and the tooltip text becomes its name,
 *  which is what the author was reaching for when they wrote the title. */
const syncNativeTitle = (
  el: TTooltipEl,
  options: ITooltipOptions | undefined,
) => {
  if (hasContent(options)) {
    if (el.__prevTitle__ === undefined && el.hasAttribute('title')) {
      el.__prevTitle__ = el.getAttribute('title') ?? ''
      el.removeAttribute('title')
    }
    return
  }
  restoreNativeTitle(el)
}

const restoreNativeTitle = (el: TTooltipEl) => {
  if (el.__prevTitle__ === undefined) return
  if (!el.hasAttribute('title')) el.setAttribute('title', el.__prevTitle__)
  el.__prevTitle__ = undefined
}

/** The whole accessible contract of an anchor, in the order the pieces depend
 *  on each other: strip the competing native tooltip, then decide name versus
 *  description against what is left, then keep the hidden description node in
 *  step. Runs on mount and on every update, never only on show. */
const syncAria = (el: TTooltipEl, options: ITooltipOptions | undefined) => {
  syncNativeTitle(el, options)
  syncAriaLabel(el, options)
  syncDescription(el, options)
}

// ── Disabled controls ────────────────────────────────────────────────────
//
// "Why is this button greyed out?" is one of the two things people reach for a
// tooltip to answer, and it was the one case this directive could not do:
// every listener sat on the anchor, and a natively-disabled <button>,
// <input>, <select> or <textarea> fires no mouse events at all. The binding
// was accepted, the aria-label was written, and nothing ever opened.
//
// A disabled control is still hit-tested: the events its ancestors receive
// carry pointer coordinates that fall inside it. So when the anchor is
// disabled we listen on its parent instead and decide "is the pointer over my
// anchor?" geometrically. This is the wrapper-element workaround every
// component library documents, done for the consumer instead of asked of
// them, and it needs no extra DOM.
//
// `aria-disabled` controls are NOT proxied: they are ordinary elements that
// receive their own events, which is one of the reasons to prefer them.

const isNativelyDisabled = (el: HTMLElement): boolean => {
  const candidate = el as HTMLElement & { disabled?: unknown }
  if (candidate.disabled === true) return true
  // A control inside a disabled <fieldset> is disabled without carrying the
  // attribute itself.
  const fieldset = el.closest?.('fieldset[disabled]')
  return (
    !!fieldset && !el.closest?.('fieldset[disabled] > legend:first-of-type')
  )
}

const pointInRect = (rect: DOMRect, x: number, y: number): boolean =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

const detachDisabledProxy = (el: TTooltipEl) => {
  const host = el.__proxyHost__
  if (!host) return
  if (el.__proxyMove__) host.removeEventListener('mousemove', el.__proxyMove__)
  if (el.__proxyLeave__)
    host.removeEventListener('mouseleave', el.__proxyLeave__)
  el.__proxyHost__ = undefined
  el.__proxyMove__ = undefined
  el.__proxyLeave__ = undefined
  el.__proxyInside__ = false
}

/** Attach, move or drop the parent-level listeners a disabled anchor needs.
 *  Re-run on every update, because `disabled` is bound to application state
 *  as often as the tooltip text is. */
const syncDisabledProxy = (el: TTooltipEl) => {
  const wanted = !!el.__tooltipBinding__ && isNativelyDisabled(el)
  const host = wanted ? el.parentElement : null
  if (el.__proxyHost__ === host) return
  detachDisabledProxy(el)
  if (!host) return

  el.__proxyMove__ = ((event: Event) => {
    const mouse = event as MouseEvent
    // Mid-drag, same rule as the ordinary hover path.
    if (mouse.buttons) return
    const rect = el.getBoundingClientRect()
    // No geometry (never laid out, or a test environment): fall back to the
    // event's own target, which is the only other evidence available.
    const inside = hasLayout(rect)
      ? pointInRect(rect, mouse.clientX, mouse.clientY)
      : event.target === el || el.contains(event.target as Node)
    if (inside) {
      el.__mouseX__ = mouse.clientX
      el.__mouseY__ = mouse.clientY
      if (!el.__proxyInside__) {
        el.__proxyInside__ = true
        el.__showTooltip__?.('pointer')
      } else if (el.__tooltipBinding__?.followCursor) {
        positionTooltip(el, el.tooltipElement, el.__requestedSide__)
      }
      return
    }
    if (el.__proxyInside__) {
      el.__proxyInside__ = false
      el.__hideTooltip__?.(undefined, 'pointer')
    }
  }) as EventListener

  el.__proxyLeave__ = (() => {
    if (!el.__proxyInside__) return
    el.__proxyInside__ = false
    el.__hideTooltip__?.(undefined, 'pointer')
  }) as EventListener

  host.addEventListener('mousemove', el.__proxyMove__)
  host.addEventListener('mouseleave', el.__proxyLeave__)
  el.__proxyHost__ = host
}

/** Apply the controlled `open` option. Called on mount and on every update.
 *  Only acts on a DIFFERENCE, so a re-render that leaves `open: true` alone
 *  does not restart the chip, and `defaultOpen` cannot re-fire. */
/** A controlled tooltip whose host never listens can never be opened by a
 *  hover, closed by a mouseleave, or dismissed by Escape: the gate reports
 *  into the void and the chip does whatever `open` last said. That is a
 *  1.4.13 Dismissible failure written in three lines of host code, so say so
 *  the first time it happens. */
const warnDeafControlled = (options: ITooltipOptions) => {
  if (options.onOpenChange) return
  devWarn(
    'controlled-no-handler',
    'a tooltip was given `open` but no `onOpenChange`, so nothing the user does (hover, blur, Escape) can change it. Either handle `onOpenChange` or drop `open` and let the directive own visibility.',
  )
}

const syncOpenState = (
  el: TTooltipEl,
  options: ITooltipOptions | undefined,
) => {
  if (!options) return
  const wanted =
    options.open !== undefined
      ? options.open
      : el.__openState__ === undefined && options.defaultOpen
        ? true
        : undefined
  if (wanted === undefined) return
  const isOpen = el.__openState__ === true || !!el.__showTimer__
  if (wanted === isOpen) return
  if (wanted) el.__showTooltip__?.('program')
  else el.__hideTooltip__?.(0, 'program')
}

const tooltipDirective = (app: App) => {
  installDocumentDismiss()
  const router = app.config.globalProperties.$router

  if (router) {
    router.beforeEach(() => {
      registeredTooltips.forEach((el: any) =>
        el?.__hideTooltip__?.(0, 'program'),
      )
      registeredTooltips.clear()
    })
  }

  app.directive('nb-tooltip', {
    mounted(el: TTooltipEl, binding: DirectiveBinding<ITooltipOptions>) {
      el.__showTooltip__ = (trigger: TTooltipTrigger = 'pointer') => {
        const options = el.__tooltipBinding__
        if (!options) return
        // Controlled. `open` is the single source of truth, so a user gesture
        // is a REQUEST: report it and let the host decide. Without this the
        // chip would open on hover and then be closed again by the next
        // render that re-applied `open: false`, which is the flicker every
        // controlled/uncontrolled hybrid produces.
        if (options.open !== undefined && trigger !== 'program') {
          warnDeafControlled(options)
          options.onOpenChange?.(true, trigger)
          return
        }
        clearTimeout(el.__hideTimer__)
        el.__hideTimer__ = undefined
        showTooltip(el, options, trigger)
      }

      el.__hideTooltip__ = (
        delay = el.__tooltipBinding__?.hideDelay ?? 150,
        reason: TTooltipReason = 'dismiss',
      ) => {
        const options = el.__tooltipBinding__
        // Controlled, and this is a request rather than the host's own doing.
        // Report it and stop: `open` is the host's state and we do not write
        // to it. Escape arrives here as 'dismiss', so a host that handles
        // `onOpenChange` gets a genuine dismissal; a host that does not is
        // warned, once, because an undismissable tooltip fails WCAG 1.4.13.
        if (options?.open !== undefined && reason !== 'program') {
          warnDeafControlled(options)
          options.onOpenChange?.(false, reason)
          return
        }
        clearTimeout(el.__hideTimer__)
        // `0` means now, not "next macrotask". Every caller that passes 0 is
        // saying the chip must not survive this tick: a route change, an
        // Escape, and above all the one-chip rule, which would otherwise
        // leave two chips painted for a frame.
        if (delay <= 0) {
          el.__hideTimer__ = undefined
          hideTooltip(el, true, reason)
          return
        }
        // Default 150ms: long enough that crossing a 1px gap between two
        // adjacent icon buttons does not flicker, short enough that the chip
        // is gone before the user's eye returns.
        el.__hideTimer__ = setTimeout(() => {
          el.__hideTimer__ = undefined
          hideTooltip(el, delay <= 0, reason)
        }, delay)
      }

      el.__mouseMove__ = (event: MouseEvent) => {
        el.__mouseX__ = event.clientX
        el.__mouseY__ = event.clientY
        // Read from the LIVE binding, not the closure's mount-time one:
        // `followCursor` is a reactive option like every other, and reading
        // `binding.value` here froze it at whatever it was when the anchor
        // mounted.
        if (el.__tooltipBinding__?.followCursor) {
          positionTooltip(
            el,
            el.tooltipElement,
            el.__tooltipBinding__?.position,
          )
        }
      }

      el.__tooltipBinding__ = binding.value

      el.__showHandler__ = (event: Event) => {
        // Touchscreen browsers replay a full mouse sequence after a tap. The
        // touch handler has already opened (and scheduled the close of) the
        // chip, so honouring the replayed mouseenter would re-open it with no
        // mouseleave ever coming to close it again.
        if (withinMs(el.__lastTouchAt__, TOUCH_MOUSE_GRACE_MS)) return
        const mouse = event as MouseEvent
        // Mid-drag. A pointer that enters this anchor with a button already
        // held is committed to a gesture that started somewhere else (a
        // slider thumb, a reorder handle, a text selection), so an anchor it
        // merely passes over on the way must stay quiet rather than pop a
        // chip under the moving cursor.
        //
        // Read from the event rather than from a flag we maintain across
        // pointerdown/pointerup: a drag that ends outside the document never
        // delivers a pointerup, and a flag left stuck on would suppress every
        // hover for the rest of the session. `buttons` is 0 on an ordinary
        // hover in every engine.
        if (mouse.buttons) return
        // Seed the cursor position from the enter event. Without this a
        // cursor-positioned tooltip opened by an element sliding under a
        // stationary pointer lands at the top-left corner of the viewport.
        if (
          typeof mouse.clientX === 'number' &&
          (mouse.clientX || mouse.clientY)
        ) {
          el.__mouseX__ = mouse.clientX
          el.__mouseY__ = mouse.clientY
        }
        el.__showTooltip__?.('pointer')
      }
      el.__hideHandler__ = () => el.__hideTooltip__?.(undefined, 'pointer')

      // Keyboard. An icon-only button is unusable without this: the user can
      // reach it with Tab and has no way to find out what it does.
      el.__focusHandler__ = (event: Event) => {
        // Focus that a click just moved here is not a request to read the
        // label, and the chip would then sit over whatever the click opened.
        if (withinMs(lastPointerDownAt, POINTER_FOCUS_GRACE_MS)) return
        // A nested anchor owns its own focus. Without this a wrapper and the
        // control inside it both opened a chip on one Tab.
        if (!isNearestAnchor(el, event)) return
        el.__showTooltip__?.('focus')
      }
      el.__blurHandler__ = () => el.__hideTooltip__?.(undefined, 'focus')

      // Touch. No hover exists, so a tap opens the chip immediately and it
      // times itself out; the document-level pointerdown dismiss closes it
      // early if the user taps anything else.
      el.__touchHandler__ = (event: Event) => {
        if (el.__tooltipBinding__?.touch === false) return
        if (!isNearestAnchor(el, event)) return
        el.__lastTouchAt__ = Date.now()
        el.__showTooltip__?.('touch')
        el.__hideTooltip__?.(TOUCH_VISIBLE_MS, 'touch')
      }

      // Reachability. A <span> or an <svg> cannot be tabbed to, so its
      // tooltip is invisible to keyboard and screen-reader users. We never
      // add a tab stop behind the consumer's back: `focusable: true` is an
      // explicit statement that this element carries information nothing
      // else on the page carries.
      syncFocusable(el, binding.value)

      syncAria(el, binding.value)
      el.setAttribute(ANCHOR_ATTR, '')

      el.addEventListener('mouseenter', el.__showHandler__)
      el.addEventListener('mouseleave', el.__hideHandler__)
      el.addEventListener('mousemove', el.__mouseMove__ as EventListener)
      // focusin/focusout rather than focus/blur: they bubble, so a tooltip on
      // a wrapper still fires when focus lands on the control inside it.
      el.addEventListener('focusin', el.__focusHandler__)
      el.addEventListener('focusout', el.__blurHandler__)
      el.addEventListener('touchstart', el.__touchHandler__, { passive: true })
      syncDisabledProxy(el)
      // `defaultOpen` and a controlled `open: true` both have to take effect
      // now, not on the first hover: an onboarding highlight that waits for a
      // pointer is not a highlight.
      syncOpenState(el, binding.value)
      // Scrolling is NOT wired here. A per-anchor `scroll` listener on
      // `window` (what this used to be) is the wrong subscription twice over:
      // it never hears an inner container scroll, because scroll does not
      // bubble, and hiding is the wrong response anyway. Scroll is handled by
      // the shared re-anchor loop, which follows the anchor while it is
      // visible and takes the chip down when it is not.
    },

    updated(el: TTooltipEl, binding: DirectiveBinding<ITooltipOptions>) {
      const previous = el.__tooltipBinding__
      el.__tooltipBinding__ = binding.value

      if (!binding.value) {
        syncAria(el, undefined)
        syncFocusable(el, undefined)
        hideTooltip(el, true)
        return
      }

      // The accessible contract tracks the binding even when nothing is on
      // screen: an icon button whose tooltip flipped from "Mute" to "Unmute"
      // has changed its name, chip or no chip, and an `aria` option that
      // flipped from `label` to `description` has changed which of the two the
      // anchor is carrying. Running this only in `showTooltip` was how a chip
      // that was already up ended up announced twice: the anchor kept the name
      // it was mounted with and gained a description saying the same words.
      if (previous !== binding.value) {
        syncAria(el, binding.value)
        syncFocusable(el, binding.value)
      }
      // Outside the identity guard above, deliberately: `disabled` is an
      // attribute of the ELEMENT, not of the binding, so it flips on renders
      // where the options object is unchanged, and a control that just became
      // disabled has silently lost every listener it had. The check is a
      // property read and a reference comparison.
      syncDisabledProxy(el)
      // Before the early-outs below: visibility is not content, and a
      // controlled tooltip whose `open` just changed must act even when the
      // chip's markup is identical.
      syncOpenState(el, binding.value)
      // Nothing on screen: never touch layout on a host re-render.
      if (!el.tooltipElement) return
      // Same options object as last render: cannot have changed.
      if (previous === binding.value) return
      // Content-equal re-render (inline object literal, new identity,
      // identical effective content). Comparing the rendered signature
      // is pure string work; the expensive part (innerHTML rewrite plus
      // getBoundingClientRect, i.e. a forced synchronous layout of the
      // whole document) only runs when something actually changed.
      const signature = contentSignature(binding.value)
      if (signature === el.__lastContent__) return

      el.__lastContent__ = signature
      updateTooltip(el, binding.value)
    },

    unmounted(el: TTooltipEl) {
      // Belt-and-braces: cancel the show-timer FIRST so a pending
      // show doesn't append a tooltip after the anchor's gone.
      // hideTooltip below also clears it, but doing it explicitly
      // here guards against any reordering inside hideTooltip.
      clearTimeout(el.__showTimer__)
      el.__showTimer__ = undefined
      clearTimeout(el.__hideTimer__)
      el.__hideTimer__ = undefined
      // immediate: the anchor is gone, so every chip it created goes
      // with it right now rather than after an exit animation.
      hideTooltip(el, true)
      registeredTooltips.delete(el)
      if (el.__showHandler__)
        el.removeEventListener('mouseenter', el.__showHandler__)
      if (el.__hideHandler__)
        el.removeEventListener('mouseleave', el.__hideHandler__)
      if (el.__focusHandler__)
        el.removeEventListener('focusin', el.__focusHandler__)
      if (el.__blurHandler__)
        el.removeEventListener('focusout', el.__blurHandler__)
      if (el.__touchHandler__)
        el.removeEventListener('touchstart', el.__touchHandler__)
      destroyDescription(el)
      restoreNativeTitle(el)
      if (el.__ownsAriaLabel__) {
        el.removeAttribute('aria-label')
        el.__ownsAriaLabel__ = false
      }
      if (el.__ownsTabIndex__) {
        el.removeAttribute('tabindex')
        el.__ownsTabIndex__ = false
      }
      if (el.__ownsRole__) {
        el.removeAttribute('role')
        el.__ownsRole__ = false
      }
      el.removeAttribute(ANCHOR_ATTR)
      detachDisabledProxy(el)
      if (el.__mouseMove__)
        el.removeEventListener('mousemove', el.__mouseMove__ as EventListener)
      stopReanchoring(el)
    },
  })
}

const createTooltipContent = ({
  header = '',
  body = '',
  tip = '',
}: Partial<Pick<ITooltipOptions, 'header' | 'body' | 'tip'>>) => {
  // No surrounding whitespace between the wrapper and the children.
  // When `.nb-tooltip-content` is `display: flex` (or any layout that
  // creates anonymous-text-node flex items), the indentation between
  // sibling divs becomes a visible flex child and inflates the chip's
  // height. Emitting tight HTML avoids that anonymous-item trap and
  // also makes empty header/body/tip divs cleanly match `:empty`
  // selectors for hide-on-empty rules.
  return (
    `<div class="nb-tooltip-content">` +
    `<div class="nb-tooltip-header">${renderTooltipContent(header)}</div>` +
    `<div class="nb-tooltip-body">${renderTooltipContent(body)}</div>` +
    `<div class="nb-tooltip-tip">${renderTooltipContent(tip)}</div>` +
    `</div>`
  )
}

/** The chip's full class list for a given side. Built in one place so the
 *  `updated` path cannot drift from the `show` path: a live chip whose
 *  `flavor` or `classExtra` changed used to keep the class list it was born
 *  with, because only `innerHTML` was rewritten. */
const chipClassName = (
  side: TSide,
  status: TTooltipStatus | undefined,
  extra: string | undefined,
): string =>
  [
    'nb-tooltip',
    `nb-tooltip-${side}`,
    // The class keeps the historical `flavor` infix. Renaming the option is
    // an API change consumers opt into by editing one word; renaming the
    // class would break every stylesheet that already targets a chip.
    status ? `nb-tooltip-flavor-${status}` : '',
    extra || '',
  ]
    .filter(Boolean)
    .join(' ')

/** Everything that decides what a chip looks like, as a comparable
 *  string. Pure string work: no DOM reads, no layout. Every field in here
 *  MUST be one the update path can actually apply to a live chip. */
const contentSignature = (options: ITooltipOptions): string =>
  `${options.position ?? ''}|${statusOf(options)}|${chipClassOf(options) ?? ''}|${createTooltipContent(options)}`

const showTooltip = (
  el: TTooltipEl,
  options: ITooltipOptions,
  trigger: TTooltipTrigger = 'pointer',
) => {
  const {
    header,
    body,
    tip,
    delay = 400,
    animationTime = 300,
    position,
    overflowOnly,
  } = options
  const status = statusOf(options)
  const extraClass = chipClassOf(options)

  // One chip per anchor, always. Cancel any show still pending (its
  // chip would be created behind our back and immediately orphaned by
  // the tooltipElement overwrite below) and reap anything already on
  // screen before scheduling a replacement.
  clearTimeout(el.__showTimer__)
  el.__showTimer__ = undefined
  removeAllChips(el, true)

  if (overflowOnly) {
    const rect = el.getBoundingClientRect()
    const isOverflowing = Math.round(rect.width) < Math.round(el.scrollWidth)
    if (!isOverflowing) {
      return
    }
  }

  if (!(body || header || tip)) {
    return
  }

  // A tap has no hover to wait out, a keyboard user has already committed by
  // moving focus, and a programmatic open was decided by the application, so
  // none of the three sits through the hover-intent delay.
  const effectiveDelay = trigger === 'pointer' ? delay : 0
  const reduceMotion = prefersReducedMotion()

  el.__showTimer__ = setTimeout(() => {
    el.__showTimer__ = undefined
    // Nothing to anchor to any more (anchor unmounted while the show
    // was pending): do not append an instantly-orphaned chip.
    if (!el.isConnected) return

    // Cursor-anchored placement needs a cursor. Focus and touch have none, so
    // they fall back to a side-anchored chip; the collision pass below then
    // flips it wherever it actually fits.
    const effectivePosition: TSide =
      trigger === 'pointer'
        ? ((position ?? 'cursor') as TSide)
        : position && position !== 'cursor'
          ? position
          : 'top'

    // One chip on screen. The nesting case (a wrapper and the control inside
    // it, each receiving their own non-bubbling `mouseenter`) is the common
    // one, but it is not the only one: a button focused by Tab and a sibling
    // hovered by the mouse are unrelated anchors, and both used to render a
    // chip at once.
    //
    // This goes through each anchor's own gate, not through `hideTooltip`.
    // The distinction is the whole of controlled mode: an UNCONTROLLED chip
    // closes here and reports `superseded`; a CONTROLLED one reports the same
    // and stays up, because its host owns `open` and hovering an unrelated
    // icon three panels away is not the host changing its mind. Closing it
    // anyway is worse than two chips: the host's `open` is still `true`, so
    // the next render re-opens it and tears down the chip that replaced it,
    // and the two ping-pong for as long as the pointer keeps moving.
    for (const other of Array.from(liveAnchors)) {
      if (other !== el) requestHide(other, 'superseded')
    }

    const tooltip = document.createElement('span') as TTooltipChip
    tooltip.className = chipClassName(effectivePosition, status, extraClass)
    tooltip.innerHTML = createTooltipContent({ header, body, tip })

    // ── Hoverable (WCAG 2.1 AA 1.4.13) ──────────────────────────────────
    //
    // The chip is `pointer-events: auto`, and moving the pointer onto it
    // cancels the pending hide. Without both halves, content revealed on
    // hover cannot be reached by the pointer, which fails 1.4.13 outright
    // and, more concretely, makes a chip that has been clamped or wrapped
    // unreadable to anyone using screen magnification: they cannot pan onto
    // it without it vanishing.
    //
    // The chip is still not a container. It takes no focus, holds nothing
    // interactive, and Escape and the next pointerdown outside it both close
    // it. Hoverable is about reading, not about operating.
    tooltip.addEventListener('mouseenter', () => {
      tooltip.__hovered__ = true
      clearTimeout(el.__hideTimer__)
      el.__hideTimer__ = undefined
      el.__watchdogMisses__ = 0
    })
    tooltip.addEventListener('mouseleave', () => {
      tooltip.__hovered__ = false
      el.__hideTooltip__?.()
    })

    if (reduceMotion) {
      // No fade in either direction. The chip is informational; a user who
      // asked for less motion still needs to be able to read it instantly.
      tooltip.style.opacity = '1'
    } else {
      tooltip.style.transition = `opacity ${animationTime}ms ease-in-out`
      tooltip.style.animation = `tooltipAppear ${animationTime}ms ease-in-out forwards`
    }

    // Aria wiring: there is none, and that is the point.
    //
    // The chip is a PAINTING of text that is already in the accessibility
    // tree. In label mode the anchor carries the text as its accessible name
    // (syncAriaLabel); in description mode a persistent hidden node carries it
    // and the anchor has pointed at it since mount (syncDescription). Either
    // way the chip is a duplicate, so it is hidden from assistive technology
    // unconditionally.
    //
    // It used to be the description itself, minted here with a fresh id. Two
    // things were wrong with that. The id landed on the anchor one macrotask
    // after `focusin`, and a screen reader computes the description AT focus,
    // so a keyboard user heard nothing. And flipping the `aria` option while a
    // chip was up left the anchor with both a permanent name and a live
    // `aria-describedby` to a chip that was not hidden, announcing twice.
    tooltip.setAttribute('aria-hidden', 'true')

    el.__trigger__ = trigger
    el.tooltipElement = tooltip
    ;(el.__chips__ ??= new Set()).add(tooltip)
    el.__lastContent__ = contentSignature(options)
    registeredTooltips.add(el) // Register active tooltip

    document.body.appendChild(tooltip)
    // The side asked for. `positionTooltip` writes back the side it could
    // actually use into `__side__`; the request is what every later
    // re-placement starts from, so a flip is always reconsidered.
    el.__requestedSide__ = effectivePosition
    el.__side__ = effectivePosition
    positionTooltip(el, tooltip, effectivePosition)
    // From here the chip follows its anchor: ancestor scroll, window resize
    // and any silent layout move all re-run placement, and an anchor that
    // scrolls out of sight takes its chip with it.
    startReanchoring(el)
    startWatchdog(el)
    const wasOpen = el.__openState__ === true
    el.__openState__ = true
    // One report per transition. A retrigger that replaces a live chip (a
    // content change, a second mouseenter) is not an open.
    if (!wasOpen) options.onOpenChange?.(true, trigger)
  }, effectiveDelay) // hover-intent delay, default 400ms
}

/** Ask an anchor to close, THROUGH ITS OWN GATE.
 *
 *  `hideTooltip` is the mechanism; `__hideTooltip__` is the policy. Only the
 *  gate knows whether this anchor is controlled, and therefore whether a close
 *  is ours to perform or merely ours to report. Every close that originates
 *  outside the anchor (the one-chip rule, the orphan watchdog, the anchor
 *  scrolling out of a clipping ancestor) has to come through here, because
 *  reaching past the gate into `hideTooltip` tears down a controlled chip that
 *  the host still believes is open: the host's `open` is still `true`, so the
 *  very next render re-opens it, which closes whatever chip replaced it, which
 *  re-opens this one. Two anchors on one page is enough to start that loop. */
const requestHide = (
  el: TTooltipEl,
  reason: TTooltipReason,
  immediate = true,
) => {
  if (el.__hideTooltip__) {
    el.__hideTooltip__(immediate ? 0 : undefined, reason)
    return
  }
  // No gate (the anchor was never mounted through the directive, or has
  // already been torn down): nothing is controlling it, so close it directly.
  hideTooltip(el, immediate, reason)
}

const hideTooltip = (
  el: TTooltipEl,
  immediate = false,
  reason: TTooltipReason = 'dismiss',
) => {
  clearTimeout(el.__showTimer__)
  el.__showTimer__ = undefined
  const wasOpen = el.__openState__ === true
  // Reap EVERY chip this anchor owns, not just the memoized latest.
  removeAllChips(el, immediate)
  registeredTooltips.delete(el) // Remove from active tooltips
  el.__requestedSide__ = undefined
  if (wasOpen) {
    el.__openState__ = false
    // Exactly one report per transition: a second hide on an already-hidden
    // anchor (a blur after an Escape, the watchdog after an unmount) is not a
    // state change and must not re-notify.
    el.__tooltipBinding__?.onOpenChange?.(false, reason)
  }
}

const updateTooltip = (el: TTooltipEl, options: ITooltipOptions) => {
  const { header, body, tip, position } = options
  const status = statusOf(options)
  const extraClass = chipClassOf(options)
  // Re-place against the side the live chip was opened with, not the raw
  // option: a chip opened by focus while `position` is 'cursor' is anchored
  // to the element, and must not jump to a stale cursor coordinate because
  // its content changed.
  const requested =
    el.__requestedSide__ ?? el.__side__ ?? (position as TSide | undefined)
  // Retrieve tooltip element from the memoized property
  const tooltip = el.tooltipElement

  if (tooltip) {
    tooltip.innerHTML = createTooltipContent({
      header,
      body,
      tip,
    })
    // Appearance, not just content. `flavor` and `classExtra` are part of the
    // signature that decided to repaint, so they have to be applied here or a
    // chip switched from `danger` to `info` while open stays red.
    // Painted with the side the chip is currently DRAWN on, so there is no
    // frame in which the arrow points the wrong way; `positionTooltip` then
    // re-derives it from the REQUESTED side and rewrites the class if the new
    // content changed which sides fit.
    tooltip.className = chipClassName(
      el.__side__ ?? requested ?? 'cursor',
      status,
      extraClass,
    )
    positionTooltip(el, tooltip, requested)
  }
}

type TSide = 'top' | 'bottom' | 'left' | 'right' | 'cursor'

// The chip is `position: fixed`, so its coordinate space IS the viewport, and
// `getBoundingClientRect()` is already in that space. No scroll offset of any
// kind belongs in this arithmetic. An earlier version subtracted the ANCHOR's
// own `scrollTop` / `scrollLeft`, which is its internal content offset: for a
// scrollable anchor (a truncated cell, a code block, any element with
// `overflow: auto`) the chip was displaced by however far its own content had
// been scrolled.
function placeFor(
  side: TSide,
  rect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  gap: number,
  mouseX: number,
  mouseY: number,
): { top: number; left: number } {
  switch (side) {
    case 'top':
      return {
        top: rect.top - (tooltipHeight + gap * 2),
        left: rect.left + rect.width / 2 - (tooltipWidth / 2 + gap / 2),
      }
    case 'bottom':
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2 - (tooltipWidth / 2 + gap / 2),
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.left - (tooltipWidth + gap * 2),
      }
    case 'right':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + gap,
      }
    case 'cursor':
    default:
      // A wider offset than the side gap, and deliberately so: now that the
      // chip is hoverable it is also clickable, and a chip whose corner sits
      // on the pointer hotspot would swallow the click meant for the anchor.
      // `CURSOR_GAP` keeps the hotspot outside the chip's box while staying
      // close enough to read as attached to the pointer.
      return { top: mouseY + CURSOR_GAP, left: mouseX + CURSOR_GAP }
  }
}

/** Offset between the pointer hotspot and the top-left corner of a
 *  cursor-anchored chip. */
const CURSOR_GAP = 14

function fitsViewport(
  top: number,
  left: number,
  w: number,
  h: number,
  inset: number,
): boolean {
  return (
    left >= inset &&
    top >= inset &&
    left + w <= window.innerWidth - inset &&
    top + h <= window.innerHeight - inset
  )
}

// Order in which we try side fallbacks when the requested side
// doesn't fit. We always start with the opposite (top↔bottom or
// left↔right) since that's the most visually-consistent fallback,
// then walk the orthogonal pair. Used by the auto-flip pass below.
const FALLBACK_ORDER: Record<TSide, readonly TSide[]> = {
  top: ['bottom', 'right', 'left'],
  bottom: ['top', 'right', 'left'],
  left: ['right', 'top', 'bottom'],
  right: ['left', 'top', 'bottom'],
  cursor: [],
}

const positionTooltip = (
  el: TTooltipEl,
  tooltip: HTMLSpanElement | undefined,
  position: ITooltipOptions['position'],
) => {
  if (!tooltip) return
  const gap = 4
  // 16 px keeps the chip clear of native window chrome (macOS resize
  // grips, scrollbar gutters) and feels less cramped than the previous
  // 6 px which dropped the chip right against the viewport edge.
  const inset = 16
  const rect = el.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  const tooltipWidth = tooltipRect.width || 0
  const tooltipHeight = tooltipRect.height || 0
  const mouseX = el.__mouseX__ ?? 0
  const mouseY = el.__mouseY__ ?? 0

  // Auto-flip: requested side first, then opposite, then orthogonals.
  // The original implementation only tried the opposite, which left
  // tooltips in viewport corners (where BOTH the requested and the
  // opposite axis overflow) stuck on the requested side with their
  // contents clamped off-anchor. Walking all four sides finds a fit
  // whenever one exists.
  const initialSide = (position ?? 'cursor') as TSide
  const tryPlace = (side: TSide) =>
    placeFor(side, rect, tooltipWidth, tooltipHeight, gap, mouseX, mouseY)

  let placed = tryPlace(initialSide)
  let chosenSide: TSide = initialSide

  if (
    tooltipWidth > 0 &&
    tooltipHeight > 0 &&
    !fitsViewport(placed.top, placed.left, tooltipWidth, tooltipHeight, inset)
  ) {
    for (const candidate of FALLBACK_ORDER[initialSide]) {
      const candidatePlaced = tryPlace(candidate)
      if (
        fitsViewport(
          candidatePlaced.top,
          candidatePlaced.left,
          tooltipWidth,
          tooltipHeight,
          inset,
        )
      ) {
        placed = candidatePlaced
        chosenSide = candidate
        break
      }
    }
  }

  // Final viewport clamp on whichever side won. Acts as a backstop
  // when even the flip can't fit (tiny windows, very long tooltip
  // content). Without it the chip would render half-offscreen.
  let { top, left } = placed
  if (tooltipWidth > 0 && tooltipHeight > 0) {
    const maxLeft = window.innerWidth - tooltipWidth - inset
    const maxTop = window.innerHeight - tooltipHeight - inset
    if (left > maxLeft) left = maxLeft
    if (left < inset) left = inset
    if (top > maxTop) top = maxTop
    if (top < inset) top = inset
  }

  // Update the side-suffix class so the arrow matches where the chip
  // actually IS. Unconditionally, and this is the whole point: an earlier
  // version only rewrote the class when the chosen side differed from the
  // requested one, which is right on the way out (top -> bottom against the
  // viewport edge) and wrong on the way back (bottom -> top once the anchor
  // scrolled into open space, where `chosenSide === initialSide` skipped the
  // rewrite and left the chip drawn above its anchor still carrying
  // `nb-tooltip-bottom`, with its arrow on the top edge pointing at nothing).
  // Stripping and re-adding costs one classList pass and cannot desync.
  // Flavour and extra classes are not touched.
  if (chosenSide !== 'cursor') {
    for (const s of ['top', 'bottom', 'left', 'right'] as const) {
      tooltip.classList.remove(`nb-tooltip-${s}`)
    }
    tooltip.classList.add(`nb-tooltip-${chosenSide}`)
  }
  // The side the chip is DRAWN on, for anything that has to re-derive the
  // class list (a content update repaints `className` wholesale). The side it
  // was ASKED for lives in `__requestedSide__` and is what the re-anchor loop
  // passes back in, so a chip can flip back the moment the flip stops being
  // necessary.
  el.__side__ = chosenSide

  // Arrow re-aim: the base CSS positions the arrow at the chip's 50%
  // center. After viewport clamping, the chip and the anchor are no
  // longer centre-aligned, so a fixed 50% arrow points into empty
  // space. Compute where the anchor's centre sits relative to the
  // clamped chip and expose it as `--nb-tooltip-arrow-offset` (a
  // percentage). The SCSS uses this var to position the `:before`
  // pseudo so the arrow still meets the anchor.
  if (tooltipWidth > 0 && tooltipHeight > 0 && chosenSide !== 'cursor') {
    const anchorCenterX = rect.left + rect.width / 2
    const anchorCenterY = rect.top + rect.height / 2
    const arrowMargin = 8 // keep the arrow this many px inside the chip
    if (chosenSide === 'top' || chosenSide === 'bottom') {
      const offsetPx = Math.max(
        arrowMargin,
        Math.min(tooltipWidth - arrowMargin, anchorCenterX - left),
      )
      const offsetPct = (offsetPx / tooltipWidth) * 100
      tooltip.style.setProperty('--nb-tooltip-arrow-offset', `${offsetPct}%`)
    } else {
      const offsetPx = Math.max(
        arrowMargin,
        Math.min(tooltipHeight - arrowMargin, anchorCenterY - top),
      )
      const offsetPct = (offsetPx / tooltipHeight) * 100
      tooltip.style.setProperty('--nb-tooltip-arrow-offset', `${offsetPct}%`)
    }
  }

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`
}

/** Take down every chip the user just asked to be rid of: Escape, a
 *  pointerdown outside, a drag starting, the window losing focus.
 *
 *  Deliberately per-anchor rather than a document-wide sweep. An UNCONTROLLED
 *  chip closes here and reports `(false, 'dismiss')`. A CONTROLLED one is not
 *  ours to close: its gate reports the same `(false, 'dismiss')` and leaves
 *  the chip standing until the host lowers `open`. That is the whole contract
 *  of controlled mode, and it is why a controlled tooltip whose host ignores
 *  `onOpenChange` is an accessibility bug we warn about at the gate.
 */
function dismissOpenTooltips(reason: TTooltipReason) {
  for (const el of Array.from(registeredTooltips)) {
    ;(el as TTooltipEl).__hideTooltip__?.(0, reason)
  }
  // Orphan sweep. A chip whose anchor is no longer registered (a cancelled
  // show-timer race, a slotted child unmounted mid-animation) answers to
  // nobody and nothing else will ever reap it. Chips a registered anchor
  // still owns are left exactly alone, which is what keeps a controlled chip
  // on screen through this path.
  const owned = new Set<Element>()
  for (const el of Array.from(registeredTooltips)) {
    for (const chip of (el as TTooltipEl).__chips__ ?? []) owned.add(chip)
  }
  document.querySelectorAll('span.nb-tooltip').forEach((node) => {
    if (!owned.has(node)) node.remove()
  })
}

/** Dismiss every currently-visible tooltip. Useful for view switches
 *  in single-page apps where the trigger element gets unmounted by a
 *  reactive `v-if` and the cleanup race (show-timer still pending,
 *  tooltip element about to be appended) leaves orphan chips behind.
 *  Call from the host on route / view change.
 *
 *  Exported by name from the library entry, alongside the directive
 *  installer, so consumers do not have to reach into registered state. */
export function dismissAllTooltips() {
  for (const el of Array.from(registeredTooltips)) {
    // 'program', not 'dismiss', and this is the ONLY place that distinction
    // goes this way. A view switch is the host itself talking: the anchor is
    // about to be unmounted, so the chip has to go whether or not the host
    // owns the `open` flag. Every user-driven dismissal (Escape, outside
    // pointerdown, window blur, drag) goes through `dismissOpenTooltips`
    // with 'dismiss' instead, so the controlled gate keeps its say.
    ;(el as TTooltipEl).__hideTooltip__?.(0, 'program')
  }
  registeredTooltips.clear()
  // Drop the shared scroll / resize / frame subscriptions now rather than
  // waiting for each anchor's own hide timer, so a route change leaves
  // nothing running behind the new view.
  for (const el of Array.from(liveAnchors)) stopReanchoring(el)
  // Belt-and-braces: nuke any stray nb-tooltip nodes that somehow
  // detached from their registered anchor (cancelled show timer
  // races, slotted children whose unmount fired before the timer).
  document.querySelectorAll('span.nb-tooltip').forEach((n) => n.remove())
}

// ── Template typing ──────────────────────────────────────────────────────
//
// Every component in this library is type-checked in consumer templates
// through the generated `GlobalComponents` augmentation, but a directive is
// resolved by a different table. Without this block `v-nb-tooltip` is an
// unknown directive: no completion, no check that `position` is one of five
// strings, and `vue-tsc` silently accepts `v-nb-tooltip="'Save'"` (a bare
// string, which this directive does not accept) in a consumer's own build.
//
// The augmentation lives here rather than in `src/global.d.ts`, which is
// regenerated wholesale from `src/components/*.vue` on every build and would
// drop anything hand-written into it. It reaches consumers through the
// package's main type entry, which re-exports this module.
export type TTooltipDirective = ObjectDirective<HTMLElement, ITooltipOptions>

declare module 'vue' {
  // The name is Vue's, not ours: this is the exact interface the template
  // type-checker reads when it resolves a directive that was never imported.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface GlobalDirectives {
    /** Attach a tooltip to any element. See `ITooltipOptions` for the
     *  binding value: at minimum one of `header`, `body` or `tip`. */
    vNbTooltip: TTooltipDirective
  }
}

export default tooltipDirective
