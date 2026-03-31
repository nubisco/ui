import type { Directive, DirectiveBinding } from 'vue'

export type RulersOptions = {
  horizontal?: boolean
  vertical?: boolean
  color?: string
  offset?: number
  labelBg?: string
  labelColor?: string
  strokeWidth?: number
  fontSize?: number
}

type NormalizedOptions = Required<RulersOptions>

type RulersBinding = boolean | RulersOptions | null | undefined

type RulersState = {
  options: NormalizedOptions
  enabled: boolean
  overlay: SVGSVGElement | null
  resizeObserver: ResizeObserver | null
  rafId: number | null
  removeListeners: Array<() => void>
  updateNow: () => void
  scheduleUpdate: () => void
  destroy: () => void
}

const SVG_NS = 'http://www.w3.org/2000/svg'

const DEFAULT_OPTIONS: NormalizedOptions = {
  horizontal: false,
  vertical: true,
  color: '#ff2f92',
  offset: 14,
  labelBg: 'transparent',
  labelColor: '#ff2f92',
  strokeWidth: 1,
  fontSize: 11,
}

const stateByElement = new WeakMap<HTMLElement, RulersState>()

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function addListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean,
): () => void {
  target.addEventListener(type, listener, options)
  return () => target.removeEventListener(type, listener, options)
}

function normalizeBinding(binding: DirectiveBinding<RulersBinding>): {
  enabled: boolean
  options: NormalizedOptions
} {
  const value = binding.value

  if (!value) {
    return { enabled: false, options: { ...DEFAULT_OPTIONS } }
  }

  if (value === true) {
    return { enabled: true, options: { ...DEFAULT_OPTIONS } }
  }

  const options: NormalizedOptions = {
    ...DEFAULT_OPTIONS,
    ...value,
  }

  if (value.horizontal === undefined && value.vertical === undefined) {
    options.horizontal = true
    options.vertical = true
  }

  return {
    enabled: options.horizontal || options.vertical,
    options,
  }
}

function createSvgOverlay(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'fixed'
  svg.style.left = '0'
  svg.style.top = '0'
  svg.style.width = '100vw'
  svg.style.height = '100vh'
  svg.style.pointerEvents = 'none'
  svg.style.setProperty('z-index', 'var(--nb-zindex-debug, 15)')
  svg.style.overflow = 'hidden'
  svg.style.display = 'block'
  document.body.appendChild(svg)
  return svg
}

function ensureOverlay(state: RulersState): SVGSVGElement {
  if (!state.overlay || !document.body.contains(state.overlay)) {
    state.overlay = createSvgOverlay()
  }
  return state.overlay
}

function clearOverlay(svg: SVGSVGElement): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild)
  }
}

function appendSvg<K extends keyof SVGElementTagNameMap>(
  parent: SVGElement,
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value))
  }
  parent.appendChild(node)
  return node
}

function drawHorizontalRuler(
  group: SVGElement,
  rect: DOMRect,
  options: NormalizedOptions,
): void {
  const tickHalf = 5
  const marginTop = 10
  const y =
    rect.top - options.offset >= marginTop
      ? rect.top - options.offset
      : rect.bottom + options.offset
  const x1 = rect.left
  const x2 = rect.right
  const centerX = x1 + rect.width / 2
  const labelText = `${Math.round(rect.width)}px`

  appendSvg(group, 'line', {
    x1,
    y1: y,
    x2,
    y2: y,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  appendSvg(group, 'line', {
    x1,
    y1: y - tickHalf,
    x2: x1,
    y2: y + tickHalf,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  appendSvg(group, 'line', {
    x1: x2,
    y1: y - tickHalf,
    x2,
    y2: y + tickHalf,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  const fontSize = options.fontSize
  const padX = 6
  const padY = 3
  const estimatedLabelWidth = Math.max(
    26,
    Math.ceil(labelText.length * fontSize * 0.58 + padX * 2),
  )
  const labelHeight = Math.ceil(fontSize + padY * 2)
  const labelX = centerX - estimatedLabelWidth / 2
  const labelY = y - labelHeight - 4

  appendSvg(group, 'rect', {
    x: labelX,
    y: labelY,
    width: estimatedLabelWidth,
    height: labelHeight,
    rx: 3,
    fill: options.labelBg,
  })

  appendSvg(group, 'text', {
    x: centerX,
    y: labelY + labelHeight / 2,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    'font-size': fontSize,
    fill: options.labelColor,
    'font-family':
      "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  }).textContent = labelText
}

function drawVerticalRuler(
  group: SVGElement,
  rect: DOMRect,
  options: NormalizedOptions,
): void {
  const tickHalf = 5
  const x = rect.right + options.offset
  const y1 = rect.top
  const y2 = rect.bottom
  const centerY = y1 + rect.height / 2
  const labelText = `${Math.round(rect.height)}px`

  appendSvg(group, 'line', {
    x1: x,
    y1,
    x2: x,
    y2,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  appendSvg(group, 'line', {
    x1: x - tickHalf,
    y1,
    x2: x + tickHalf,
    y2: y1,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  appendSvg(group, 'line', {
    x1: x - tickHalf,
    y1: y2,
    x2: x + tickHalf,
    y2,
    stroke: options.color,
    'stroke-width': options.strokeWidth,
  })

  const fontSize = options.fontSize
  const padX = 6
  const padY = 3
  const estimatedLabelWidth = Math.max(
    26,
    Math.ceil(labelText.length * fontSize * 0.58 + padX * 2),
  )
  const labelHeight = Math.ceil(fontSize + padY * 2)
  const labelX = x + 8
  const labelY = centerY - labelHeight / 2

  appendSvg(group, 'rect', {
    x: labelX,
    y: labelY,
    width: estimatedLabelWidth,
    height: labelHeight,
    rx: 3,
    fill: options.labelBg,
  })

  appendSvg(group, 'text', {
    x: labelX + estimatedLabelWidth / 2,
    y: labelY + labelHeight / 2,
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    'font-size': fontSize,
    fill: options.labelColor,
    'font-family':
      "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  }).textContent = labelText
}

function renderOverlay(el: HTMLElement, state: RulersState): void {
  if (!state.enabled) {
    if (state.overlay) {
      clearOverlay(state.overlay)
      state.overlay.style.display = 'none'
    }
    return
  }

  const svg = ensureOverlay(state)
  svg.style.display = 'block'
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)

  clearOverlay(svg)

  const rect = el.getBoundingClientRect()
  const isValidRect = Number.isFinite(rect.left) && Number.isFinite(rect.top)
  if (!isValidRect || rect.width <= 0 || rect.height <= 0) {
    return
  }

  const group = appendSvg(svg, 'g', {
    'shape-rendering': 'geometricPrecision',
    'vector-effect': 'non-scaling-stroke',
  })

  if (state.options.horizontal) {
    drawHorizontalRuler(group, rect, state.options)
  }

  if (state.options.vertical) {
    drawVerticalRuler(group, rect, state.options)
  }
}

function createState(
  el: HTMLElement,
  binding: DirectiveBinding<RulersBinding>,
): RulersState {
  const normalized = normalizeBinding(binding)

  const state: RulersState = {
    options: normalized.options,
    enabled: normalized.enabled,
    overlay: null,
    resizeObserver: null,
    rafId: null,
    removeListeners: [],
    updateNow: () => {
      renderOverlay(el, state)
    },
    scheduleUpdate: () => {
      if (state.rafId !== null) {
        return
      }
      state.rafId = window.requestAnimationFrame(() => {
        state.rafId = null
        state.updateNow()
      })
    },
    destroy: () => {
      if (state.rafId !== null) {
        window.cancelAnimationFrame(state.rafId)
        state.rafId = null
      }

      state.resizeObserver?.disconnect()
      state.resizeObserver = null

      for (const remove of state.removeListeners) {
        remove()
      }
      state.removeListeners = []

      if (state.overlay) {
        state.overlay.remove()
        state.overlay = null
      }
    },
  }

  state.resizeObserver = new ResizeObserver(() => {
    state.scheduleUpdate()
  })
  state.resizeObserver.observe(el)

  state.removeListeners.push(
    addListener(window, 'resize', () => state.scheduleUpdate(), {
      passive: true,
    }),
    addListener(window, 'scroll', () => state.scheduleUpdate(), {
      capture: true,
      passive: true,
    }),
  )

  state.scheduleUpdate()

  return state
}

function updateStateFromBinding(
  state: RulersState,
  binding: DirectiveBinding<RulersBinding>,
): void {
  const normalized = normalizeBinding(binding)
  state.options = normalized.options
  state.enabled = normalized.enabled
  state.scheduleUpdate()
}

export const rulersDirective: Directive<HTMLElement, RulersBinding> = {
  mounted(el, binding) {
    if (!isClient()) {
      return
    }

    const state = createState(el, binding)
    stateByElement.set(el, state)
  },
  updated(el, binding) {
    if (!isClient()) {
      return
    }

    const state = stateByElement.get(el)
    if (!state) {
      const newState = createState(el, binding)
      stateByElement.set(el, newState)
      return
    }

    updateStateFromBinding(state, binding)
  },
  unmounted(el) {
    const state = stateByElement.get(el)
    if (!state) {
      return
    }

    state.destroy()
    stateByElement.delete(el)
  },
}

export default rulersDirective
export { DEFAULT_OPTIONS }
