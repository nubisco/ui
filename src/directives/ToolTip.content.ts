/**
 * Tooltip content rendering, and nothing else.
 *
 * Split out of `ToolTip.directive.ts` because it answers a different question
 * from the rest of it. Everything in that file is about WHEN a chip exists
 * and WHERE it sits; everything here is about what is allowed inside one when
 * the text did not come from the person writing the template. The two change
 * for unrelated reasons: a new allowed tag is a security review, a new
 * placement rule is a layout bug.
 *
 * Private to the directive. Nothing here is part of the public API.
 */
import type { IComponentContent } from '@/types/ContentRenderer'

// ── Structured content ───────────────────────────────────────────────────
//
// `body`, `header` and `tip` accept an array of `{ component, props, content }`
// nodes as well as a string. That node array comes from the CALLER, and the
// caller is not always the author: a CMS field, an API payload and a
// user-supplied column formatter have all ended up in a tooltip binding in
// this fleet. So the tag name and every prop name are checked against an
// allowlist rather than interpolated. Anything outside the list is dropped and
// its children are still rendered, so a bad node degrades to plain text
// instead of disappearing or executing.
//
// This closes a real hole: before the allowlist,
// `{ component: 'img', props: { src: 'x', onerror: 'steal()' } }` produced a
// working `onerror` handler inside `innerHTML`.

/** Tags a tooltip node may render. Inline and list markup only: no `img`, no
 *  `a`, no `iframe`, nothing that loads or navigates. The chip is reachable by
 *  the pointer (it has to be, see "Hoverable" below) but it is never in the
 *  tab order and it disappears on Escape, so anything that has to be operated
 *  does not belong in it. */
const ALLOWED_CONTENT_TAGS = new Set([
  'span',
  'div',
  'p',
  'b',
  'strong',
  'em',
  'i',
  'u',
  's',
  'small',
  'code',
  'kbd',
  'br',
  'ul',
  'ol',
  'li',
])

/** Tags that must not be given a closing tag. */
const VOID_CONTENT_TAGS = new Set(['br'])

/** Props a tooltip node may set. Presentation only. Notably absent: every
 *  `on*` handler, `src`, `href`, `srcdoc`, `id` (ids collide with the chip's
 *  own describedby id) and `title` (a native tooltip inside a tooltip). */
const ALLOWED_CONTENT_PROPS = new Set(['class', 'style', 'dir', 'lang'])

/** Attribute-value escaping: inside a quoted attribute nothing may survive
 *  unescaped. Escaping alone is NOT sufficient for `style` and `class`, whose
 *  dangerous payloads contain no character that escaping touches, so both go
 *  through the value filters below as well. */
const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

/** Declarations a content node's `style` may set. Typography and spacing
 *  only. The exclusions are the point, not an oversight:
 *
 *  - no `position` / `inset` / `top` / `left`: a `position: fixed; inset: 0`
 *    child turns a chip into a full-viewport click shield.
 *  - no `background-image`, and no value containing `url()` (see below): a
 *    background image is an outbound request, which is how a tooltip fed by a
 *    CMS field or an API payload becomes a read receipt for whoever wrote it.
 *  - no `content`, no `transform`, no `z-index`.
 *
 *  Anything not on the list is dropped and warns once in development. */
const ALLOWED_STYLE_PROPERTIES = new Set([
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-decoration',
  'text-transform',
  'white-space',
  'word-break',
  'overflow-wrap',
  'opacity',
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'max-width',
  'min-width',
  'border-radius',
])

/** Value-level guard applied on top of the property allowlist. `url()` and
 *  `image-set()` fetch; `expression()` executes on legacy engines; a
 *  backslash is how a filtered token is smuggled past a naive property test.
 *  None of them has any business in a tooltip. */
const UNSAFE_STYLE_VALUE =
  /url\(|image-set\(|expression\(|javascript:|@import|\\/i

/** A CSS class token. Deliberately narrow: no whitespace tricks, no quotes,
 *  no escapes. */
const CLASS_TOKEN = /^[A-Za-z_-][A-Za-z0-9_-]*$/

const sanitizeStyle = (raw: string): string =>
  raw
    .split(';')
    .map((declaration) => {
      const colon = declaration.indexOf(':')
      if (colon < 0) return ''
      const property = declaration.slice(0, colon).trim().toLowerCase()
      const value = declaration.slice(colon + 1).trim()
      if (!property || !value) return ''
      if (!ALLOWED_STYLE_PROPERTIES.has(property)) {
        devWarn(
          `style:${property}`,
          `"${property}" is not an allowed tooltip content style property and was dropped.`,
        )
        return ''
      }
      if (UNSAFE_STYLE_VALUE.test(value)) {
        devWarn(
          `style-value:${property}`,
          `The value of "${property}" was dropped: tooltip content may not load a resource or call a CSS function that does.`,
        )
        return ''
      }
      return `${property}: ${value}`
    })
    .filter(Boolean)
    .join('; ')

const sanitizeClass = (raw: string): string =>
  raw
    .split(/\s+/)
    .filter((token) => {
      if (!token) return false
      if (CLASS_TOKEN.test(token)) return true
      devWarn(
        `class:${token}`,
        `"${token}" is not a valid class token for tooltip content and was dropped.`,
      )
      return false
    })
    .join(' ')

/** Per-prop value filter. Everything ends up escaped; `style` and `class` are
 *  filtered first because escaping does nothing to them. */
const sanitizeContentProp = (key: string, value: string): string => {
  if (key === 'style') return sanitizeStyle(value)
  if (key === 'class') return sanitizeClass(value)
  return value
}

// ── Plain-string content ─────────────────────────────────────────────────
//
// A string body is TEXT with light emphasis, nothing more. It is rendered by
// the tag-only pass below rather than by the library's shared `escapeHtml`
// helper, which allows `<p style="…" class="…">` through with its attribute
// values untouched. That is fine for a helper whose input is an author's own
// literal, and not fine here: a string body is exactly the surface a CMS
// field, an API payload or a user-defined column formatter reaches, and
// `<p style="background-image:url(https://…);position:fixed;inset:0">` is a
// remote beacon plus a full-viewport overlay written entirely in characters
// that escaping leaves alone.
//
// So the string path parses NO attributes at all: a token that is not exactly
// an allowed bare tag is escaped and shown as the text it is. Markup that
// genuinely needs a class or a style goes through the structured form, where
// the value itself is checked declaration by declaration.

/** Bare inline tags a plain string body may use. */
const ALLOWED_STRING_TAGS = new Set([
  'b',
  'strong',
  'em',
  'i',
  'u',
  's',
  'small',
  'code',
  'kbd',
  'br',
  'p',
])

const TEXT_ESCAPES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

/** Escape text. `&` is only escaped when it does not already start a
 *  character reference, so a body written with `&nbsp;` or `&amp;` still
 *  renders as the author meant. A character reference cannot create an
 *  element, so passing one through is safe. */
const escapeText = (value: string): string =>
  value
    .replace(
      /&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,10}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});)/g,
      '&amp;',
    )
    .replace(/[<>"']/g, (char) => TEXT_ESCAPES[char])

/** Render a plain string body: allowed bare tags survive, everything else is
 *  text, newlines become line breaks. */
const renderStringContent = (value: string): string =>
  value
    // Split on anything SHAPED like a tag rather than on the allowlist, so a
    // token such as `<b onclick="x">` is recognised as a tag and escaped
    // whole instead of being half-matched and partly emitted.
    .split(/(<[^<>]*>)/g)
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        const match = /^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\s*\/?\s*>$/.exec(
          part,
        )
        const tag = match?.[2]?.toLowerCase()
        if (tag && ALLOWED_STRING_TAGS.has(tag)) return `<${match![1]}${tag}>`
        if (tag)
          devWarn(
            `string-tag:${tag}`,
            `<${tag}> is not allowed in a tooltip string and was shown as text. Use the structured content form for anything richer.`,
          )
        return escapeText(part)
      }
      return escapeText(part).replace(/\n/g, '<br>')
    })
    .join('')

const warnOnce = new Set<string>()
const devWarn = (key: string, message: string) => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')
    return
  if (warnOnce.has(key)) return
  warnOnce.add(key)
  console.warn(`[nb-tooltip] ${message}`)
}

/**
 * Converts a structured content node (or array of them) to an HTML string.
 * Supports both `children` and `content` for the child slot.
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

  const childrenHtml = Array.isArray(childContent)
    ? renderComplexContent(childContent)
    : childContent !== undefined
      ? renderStringContent(String(childContent))
      : ''

  const tag = String(component).toLowerCase()
  if (!ALLOWED_CONTENT_TAGS.has(tag)) {
    devWarn(
      `tag:${tag}`,
      `<${tag}> is not allowed in tooltip content and was dropped. Allowed tags: ${[...ALLOWED_CONTENT_TAGS].join(', ')}.`,
    )
    // Keep the words, drop the element. A rejected wrapper must not silently
    // delete the text it was wrapping.
    return childrenHtml
  }

  const propsStr = Object.entries(props as Record<string, unknown>)
    .filter(([key]) => {
      if (ALLOWED_CONTENT_PROPS.has(key)) return true
      devWarn(
        `prop:${key}`,
        `"${key}" is not an allowed tooltip content prop and was dropped. Allowed props: ${[...ALLOWED_CONTENT_PROPS].join(', ')}.`,
      )
      return false
    })
    .map(([key, value]) => [key, sanitizeContentProp(key, String(value))])
    // A prop whose entire value was filtered away leaves no attribute
    // behind: `class=""` and `style=""` are noise in the DOM contract the
    // docs promise.
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(' ')

  const open = `<${tag}${propsStr ? ` ${propsStr}` : ''}>`
  return VOID_CONTENT_TAGS.has(tag) ? open : `${open}${childrenHtml}</${tag}>`
}

/**
 * Renders tooltip content - supports both string and complex content structure
 */
const renderTooltipContent = (
  content: string | Array<IComponentContent> | undefined | null,
): string => {
  if (!content) return ''

  if (typeof content === 'string') {
    return renderStringContent(content)
  }

  if (Array.isArray(content)) {
    return renderComplexContent(content)
  }

  return ''
}

export { renderTooltipContent, devWarn }
