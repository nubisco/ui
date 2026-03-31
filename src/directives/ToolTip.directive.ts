import type { App, DirectiveBinding } from 'vue'
import { escapeHtml } from '@/utils/escapeHtml.helper'
import type { IComponentContent } from '@/types/ContentRenderer'

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
  tooltipElement?: HTMLSpanElement
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

const tooltipDirective = (app: App) => {
  const router = app.config.globalProperties.$router

  if (router) {
    router.beforeEach(() => {
      registeredTooltips.forEach((el: any) => el?.__hideTooltip__?.(0))
      registeredTooltips.clear()
    })
  }

  app.directive('nb-tooltip', {
    mounted(el: TTooltipEl, binding: DirectiveBinding<ITooltipOptions>) {
      let hideTimer: ReturnType<typeof setTimeout> | undefined = undefined

      el.__showTooltip__ = () => {
        clearTimeout(hideTimer)
        if (el.__tooltipBinding__) showTooltip(el, el.__tooltipBinding__)
      }

      el.__hideTooltip__ = (delay = 150) => {
        // set optimal hide delay by default (150ms)
        hideTimer = setTimeout(() => {
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
      el.__tooltipBinding__ = binding.value
      if (!binding.value) {
        hideTooltip(el, true)
      } else if (el.tooltipElement) {
        updateTooltip(el, binding.value)
      }
    },

    unmounted(el: TTooltipEl) {
      hideTooltip(el, true)
      if (el.__showHandler__)
        el.removeEventListener('mouseenter', el.__showHandler__)
      if (el.__hideHandler__)
        el.removeEventListener('mouseleave', el.__hideHandler__)
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
  return `
    <div class="nb-tooltip-content">
      <div class="nb-tooltip-header">${renderTooltipContent(header)}</div>
      <div class="nb-tooltip-body">${renderTooltipContent(body)}</div>
      <div class="nb-tooltip-tip">${renderTooltipContent(tip)}</div>
    </div>
  `
}

const showTooltip = (
  el: TTooltipEl,
  {
    header,
    body,
    tip,
    flavor = 'default',
    delay = 400,
    animationTime = 300,
    position,
    overflowOnly,
    classExtra,
  }: ITooltipOptions,
) => {
  // Check if tooltip already exists, and remove it if it does
  const existingTooltip = el.tooltipElement
  if (existingTooltip) {
    existingTooltip.remove()
  }

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
    const tooltip = document.createElement('span')
    tooltip.style.transition = `opacity ${animationTime}ms ease-in-out`
    tooltip.className = `nb-tooltip nb-tooltip-${position} ${flavor ? `nb-tooltip-flavor-${flavor}` : ''} ${classExtra || ''}`
    tooltip.innerHTML = createTooltipContent({ header, body, tip })
    tooltip.style.animation = `tooltipAppear ${animationTime}ms ease-in-out forwards`

    el.tooltipElement = tooltip
    registeredTooltips.add(el) // Register active tooltip

    document.body.appendChild(tooltip)
    positionTooltip(el, tooltip, position)
  }, delay) // ← optimal show delay (400ms)
}

const hideTooltip = (el: TTooltipEl, immediate = false) => {
  // Retrieve tooltip element from the memoized property
  const tooltip = el.tooltipElement

  clearTimeout(el.__showTimer__)

  if (tooltip) {
    if (immediate) {
      tooltip.remove()
    } else {
      tooltip.style.animation = `tooltipDisappear 200ms ease-in-out forwards`
      setTimeout(() => {
        tooltip.remove()
      }, 200)
    }
    registeredTooltips.delete(el) // Remove from active tooltips
  }
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

const positionTooltip = (
  el: TTooltipEl,
  tooltip: HTMLSpanElement | undefined,
  position: ITooltipOptions['position'],
) => {
  const gap = 4
  const rect = el.getBoundingClientRect()
  const tooltipRect = tooltip?.getBoundingClientRect()
  const tooltipWidth = tooltipRect?.width || 0
  const tooltipHeight = tooltipRect?.height || 0
  const parentScrollTop = el.scrollTop
  const parentScrollLeft = el.scrollLeft
  let top, left

  switch (position) {
    case 'top':
      top = rect.top - (tooltipHeight + gap * 2) - parentScrollTop // space for "arrow" which is 7.6 px
      left =
        rect.left +
        rect.width / 2 -
        (tooltipWidth / 2 + gap / 2) -
        parentScrollLeft
      break
    case 'bottom':
      top = rect.bottom + gap - parentScrollTop
      left =
        rect.left +
        rect.width / 2 -
        (tooltipWidth / 2 + gap / 2) -
        parentScrollLeft
      break
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 - parentScrollTop
      left = rect.left - (tooltipWidth + gap * 2) - parentScrollLeft
      break
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2 - parentScrollTop
      left = rect.right + gap - parentScrollLeft
      break
    case 'cursor':
    default:
      top = (el.__mouseY__ ?? 0) + gap
      left = (el.__mouseX__ ?? 0) + gap
      break
  }

  if (tooltip) {
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  }
}

export default tooltipDirective
