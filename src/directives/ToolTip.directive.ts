import type { App, DirectiveBinding } from 'vue'
import { escapeHtml } from '@/utils/escapeHtml.helper'
import type { IComponentContent } from '@/types/ContentRenderer'

type TTooltipChip = HTMLSpanElement & {
  __removeTimer__?: ReturnType<typeof setTimeout>
}

type TTooltipEl = HTMLElement & {
  __showTooltip__?: () => void
  __hideTooltip__?: (delay?: number) => void
  __mouseMove__?: (e: MouseEvent) => void
  __showHandler__?: EventListener
  __hideHandler__?: EventListener
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
  // The currently-live chip (the one `updated` repositions). Always a
  // member of `__chips__` while set.
  tooltipElement?: TTooltipChip
}

export interface ITooltipOptions {
  body?: string | Array<IComponentContent>
  header?: string | Array<IComponentContent>
  tip?: string | Array<IComponentContent>
  flavor?: string
  delay?: number
  animationTime?: number
  position?: 'top' | 'bottom' | 'left' | 'right' | 'cursor'
  followCursor?: boolean
  overflowOnly?: boolean
  classExtra?: string
}

const registeredTooltips = new Set() // Store active tooltips globally

/**
 * Converts complex content structure (IComponentContent array) to HTML string
 * Supports both 'children' and 'content' properties for compatibility
 */
const renderComplexContent = (
  content: Array<IComponentContent> | IComponentContent | any,
): string => {
  if (Array.isArray(content)) {
    return content.map((item) => renderComplexContent(item)).join('')
  }

  if (!content || typeof content !== 'object' || !content.component) {
    return ''
  }

  const { component, props = {}, children, content: contentProp } = content
  // Support both 'children' and 'content' properties
  const childContent = children !== undefined ? children : contentProp

  const propsStr = Object.entries(props)
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(' ')

  const childrenHtml = Array.isArray(childContent)
    ? renderComplexContent(childContent)
    : childContent !== undefined
      ? escapeHtml(String(childContent))
      : ''

  return `<${component}${propsStr ? ` ${propsStr}` : ''}>${childrenHtml}</${component}>`
}

/**
 * Renders tooltip content - supports both string and complex content structure
 */
const renderTooltipContent = (
  content: string | Array<IComponentContent> | undefined,
): string => {
  if (!content) return ''

  if (typeof content === 'string') {
    return escapeHtml(content)
  }

  if (Array.isArray(content)) {
    return renderComplexContent(content)
  }

  return ''
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
// switches windows — the chip would otherwise stay on the
// re-foregrounded view.
let documentDismissInstalled = false
const installDocumentDismiss = () => {
  if (documentDismissInstalled || typeof document === 'undefined') return
  documentDismissInstalled = true
  const dismiss = () => {
    if (registeredTooltips.size === 0) return
    dismissAllTooltips()
  }
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

const isAnchorHovered = (el: TTooltipEl): boolean => {
  if (!el.isConnected) return false
  try {
    return el.matches(':hover')
  } catch {
    // Engine without :hover selector support: assume hovered so the
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
    if (isAnchorHovered(el)) {
      el.__watchdogMisses__ = 0
    } else {
      el.__watchdogMisses__ = (el.__watchdogMisses__ ?? 0) + 1
      if (!el.isConnected || el.__watchdogMisses__ >= WATCHDOG_MISSES_TO_HIDE) {
        // Detached anchor: nothing left to animate against, drop it now.
        hideTooltip(el, !el.isConnected)
        return
      }
    }
    el.__watchdogTimer__ = setTimeout(tick, WATCHDOG_INTERVAL_MS)
  }
  el.__watchdogTimer__ = setTimeout(tick, WATCHDOG_INTERVAL_MS)
}

const removeChip = (el: TTooltipEl, chip: TTooltipChip, immediate: boolean) => {
  el.__chips__?.delete(chip)
  clearTimeout(chip.__removeTimer__)
  chip.__removeTimer__ = undefined
  if (immediate) {
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
  if (el.__chips__) {
    for (const chip of Array.from(el.__chips__)) removeChip(el, chip, immediate)
  }
  el.tooltipElement = undefined
  el.__lastContent__ = undefined
  stopWatchdog(el)
}

const tooltipDirective = (app: App) => {
  installDocumentDismiss()
  const router = app.config.globalProperties.$router

  if (router) {
    router.beforeEach(() => {
      registeredTooltips.forEach((el: any) => el?.__hideTooltip__?.(0))
      registeredTooltips.clear()
    })
  }

  app.directive('nb-tooltip', {
    mounted(el: TTooltipEl, binding: DirectiveBinding<ITooltipOptions>) {
      el.__showTooltip__ = () => {
        clearTimeout(el.__hideTimer__)
        el.__hideTimer__ = undefined
        if (el.__tooltipBinding__) showTooltip(el, el.__tooltipBinding__)
      }

      el.__hideTooltip__ = (delay = 150) => {
        // set optimal hide delay by default (150ms)
        clearTimeout(el.__hideTimer__)
        el.__hideTimer__ = setTimeout(() => {
          el.__hideTimer__ = undefined
          hideTooltip(el, delay <= 0)
        }, delay)
      }

      el.__mouseMove__ = (event: MouseEvent) => {
        el.__mouseX__ = event.clientX
        el.__mouseY__ = event.clientY
        if (binding.value?.followCursor) {
          positionTooltip(
            el,
            el.tooltipElement,
            el.__tooltipBinding__?.position,
          )
        }
      }

      el.__tooltipBinding__ = binding.value

      el.__showHandler__ = () => el.__showTooltip__?.()
      el.__hideHandler__ = () => el.__hideTooltip__?.()

      el.addEventListener('mouseenter', el.__showHandler__)
      el.addEventListener('mouseleave', el.__hideHandler__)
      el.addEventListener('mousemove', el.__mouseMove__ as EventListener)
      window.addEventListener('scroll', el.__hideHandler__)
    },

    updated(el: TTooltipEl, binding: DirectiveBinding<ITooltipOptions>) {
      const previous = el.__tooltipBinding__
      el.__tooltipBinding__ = binding.value

      if (!binding.value) {
        hideTooltip(el, true)
        return
      }
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
      if (el.__mouseMove__)
        el.removeEventListener('mousemove', el.__mouseMove__ as EventListener)
      if (el.__hideHandler__)
        window.removeEventListener('scroll', el.__hideHandler__)
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

/** Everything that decides what a chip looks like, as a comparable
 *  string. Pure string work: no DOM reads, no layout. */
const contentSignature = (options: ITooltipOptions): string =>
  `${options.position ?? ''}|${options.flavor ?? ''}|${createTooltipContent(options)}`

const showTooltip = (el: TTooltipEl, options: ITooltipOptions) => {
  const {
    header,
    body,
    tip,
    flavor = 'default',
    delay = 400,
    animationTime = 300,
    position,
    overflowOnly,
    classExtra,
  } = options

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

  el.__showTimer__ = setTimeout(() => {
    el.__showTimer__ = undefined
    // Nothing to anchor to any more (anchor unmounted while the show
    // was pending): do not append an instantly-orphaned chip.
    if (!el.isConnected) return

    const tooltip = document.createElement('span') as TTooltipChip
    tooltip.style.transition = `opacity ${animationTime}ms ease-in-out`
    tooltip.className = `nb-tooltip nb-tooltip-${position} ${flavor ? `nb-tooltip-flavor-${flavor}` : ''} ${classExtra || ''}`
    tooltip.innerHTML = createTooltipContent({ header, body, tip })
    tooltip.style.animation = `tooltipAppear ${animationTime}ms ease-in-out forwards`

    el.tooltipElement = tooltip
    ;(el.__chips__ ??= new Set()).add(tooltip)
    el.__lastContent__ = contentSignature(options)
    registeredTooltips.add(el) // Register active tooltip

    document.body.appendChild(tooltip)
    positionTooltip(el, tooltip, position)
    startWatchdog(el)
  }, delay) // ← optimal show delay (400ms)
}

const hideTooltip = (el: TTooltipEl, immediate = false) => {
  clearTimeout(el.__showTimer__)
  el.__showTimer__ = undefined
  // Reap EVERY chip this anchor owns, not just the memoized latest.
  removeAllChips(el, immediate)
  registeredTooltips.delete(el) // Remove from active tooltips
}

const updateTooltip = (
  el: TTooltipEl,
  { header, body, tip, position }: ITooltipOptions,
) => {
  // Retrieve tooltip element from the memoized property
  const tooltip = el.tooltipElement

  if (tooltip) {
    tooltip.innerHTML = createTooltipContent({
      header,
      body,
      tip,
    })
    positionTooltip(el, tooltip, position)
  }
}

type TSide = 'top' | 'bottom' | 'left' | 'right' | 'cursor'

function placeFor(
  side: TSide,
  rect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  gap: number,
  scrollTop: number,
  scrollLeft: number,
  mouseX: number,
  mouseY: number,
): { top: number; left: number } {
  switch (side) {
    case 'top':
      return {
        top: rect.top - (tooltipHeight + gap * 2) - scrollTop,
        left:
          rect.left +
          rect.width / 2 -
          (tooltipWidth / 2 + gap / 2) -
          scrollLeft,
      }
    case 'bottom':
      return {
        top: rect.bottom + gap - scrollTop,
        left:
          rect.left +
          rect.width / 2 -
          (tooltipWidth / 2 + gap / 2) -
          scrollLeft,
      }
    case 'left':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2 - scrollTop,
        left: rect.left - (tooltipWidth + gap * 2) - scrollLeft,
      }
    case 'right':
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2 - scrollTop,
        left: rect.right + gap - scrollLeft,
      }
    case 'cursor':
    default:
      return { top: mouseY + gap, left: mouseX + gap }
  }
}

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
  const scrollTop = el.scrollTop
  const scrollLeft = el.scrollLeft
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
    placeFor(
      side,
      rect,
      tooltipWidth,
      tooltipHeight,
      gap,
      scrollTop,
      scrollLeft,
      mouseX,
      mouseY,
    )

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

  // Update the side-suffix class so the arrow swap matches the new
  // placement. Cheap: strip any nb-tooltip-{side} classes already on
  // the element and add the chosen one. (Pinch: this only touches
  // the position classes; flavour / extra classes stay untouched.)
  if (chosenSide !== initialSide && chosenSide !== 'cursor') {
    for (const s of ['top', 'bottom', 'left', 'right'] as const) {
      tooltip.classList.remove(`nb-tooltip-${s}`)
    }
    tooltip.classList.add(`nb-tooltip-${chosenSide}`)
  }

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

/** Dismiss every currently-visible tooltip. Useful for view switches
 *  in single-page apps where the trigger element gets unmounted by a
 *  reactive `v-if` and the cleanup race (show-timer still pending,
 *  tooltip element about to be appended) leaves orphan chips behind.
 *  Call from the host on route / view change.
 *
 *  Exposed via `useTooltip()` (composable) and `Tooltip.dismissAll`
 *  (named export) so consumers don't need to dig through registered
 *  state directly. */
export function dismissAllTooltips() {
  for (const el of Array.from(registeredTooltips)) {
    ;(el as TTooltipEl).__hideTooltip__?.(0)
  }
  registeredTooltips.clear()
  // Belt-and-braces: nuke any stray nb-tooltip nodes that somehow
  // detached from their registered anchor (cancelled show timer
  // races, slotted children whose unmount fired before the timer).
  document.querySelectorAll('span.nb-tooltip').forEach((n) => n.remove())
}

export default tooltipDirective
