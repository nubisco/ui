/**
 * Turns the design system's colours into the hex values Monaco needs.
 *
 * Monaco paints from a theme object, not from CSS, so `NbCodeEditor` cannot
 * point it at `var(--nb-c-field-bg)`. It reads what each token resolves to on
 * the editor's own element instead (light, dark, tinted dark surfaces, a
 * region that switched mode), and hands Monaco the result. The parsing is kept
 * here, away from the component, so it can be tested without a browser.
 */

/** The editor colours `NbCodeEditor` takes from the design system. */
export const CODE_EDITOR_TOKENS = {
  'editor.background': '--nb-c-field-bg',
  'editor.foreground': '--nb-c-text',
  'editorLineNumber.foreground': '--nb-c-text-subtle',
  'editorLineNumber.activeForeground': '--nb-c-text',
  'editorCursor.foreground': '--nb-c-primary',
  'editor.selectionBackground': '--nb-c-primary-subtle',
  'editor.inactiveSelectionBackground': '--nb-c-layer-hover-1',
  'editor.lineHighlightBackground': '--nb-c-layer-hover-1',
  'editorIndentGuide.background1': '--nb-c-border',
  'editorWidget.background': '--nb-c-layer-1',
  'editorWidget.border': '--nb-c-border',
  'scrollbarSlider.background': '--nb-c-border',
  'scrollbarSlider.hoverBackground': '--nb-c-border-strong',
} as const

const hex2 = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')

/**
 * A computed CSS colour as `#rrggbb`, or `#rrggbbaa` when it is not opaque.
 *
 * Takes the forms a browser reports for a computed `color`: `rgb()`, `rgba()`,
 * either with commas or spaces, and `color(srgb r g b / a)`, which is what
 * `color-mix()` and `oklch()` tokens compute to. Anything else returns
 * `undefined`, and Monaco keeps its own colour for that slot.
 */
export function toHexColor(css: string): string | undefined {
  const value = css.trim().toLowerCase()
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(value)) return value
  if (/^#[0-9a-f]{3}$/.test(value)) {
    return '#' + [...value.slice(1)].map((c) => c + c).join('')
  }

  let channels: number[] | undefined
  let alpha = 1
  const rgb = value.match(/^rgba?\(([^)]+)\)$/)
  const srgb = value.match(/^color\(srgb\s+([^)]+)\)$/)
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean)
    channels = parts.slice(0, 3).map(Number)
    if (parts[3] !== undefined) alpha = parseAlpha(parts[3])
  } else if (srgb) {
    const parts = srgb[1].split(/[\s/]+/).filter(Boolean)
    channels = parts.slice(0, 3).map((p) => Number(p) * 255)
    if (parts[3] !== undefined) alpha = parseAlpha(parts[3])
  }
  if (!channels || channels.length < 3 || channels.some(Number.isNaN)) {
    return undefined
  }
  const base = '#' + channels.map(hex2).join('')
  return alpha >= 1 ? base : base + hex2(alpha * 255)
}

function parseAlpha(part: string): number {
  return part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part)
}

/**
 * The editor colours as they resolve on `element`, ready for
 * `monaco.editor.defineTheme`. A token that does not resolve is left out.
 */
export function readEditorColors(element: HTMLElement): Record<string, string> {
  const probe = document.createElement('span')
  probe.style.display = 'none'
  element.appendChild(probe)
  const colors: Record<string, string> = {}
  try {
    for (const [slot, token] of Object.entries(CODE_EDITOR_TOKENS)) {
      probe.style.color = `var(${token})`
      const hex = toHexColor(getComputedStyle(probe).color)
      if (hex) colors[slot] = hex
    }
  } finally {
    probe.remove()
  }
  return colors
}
