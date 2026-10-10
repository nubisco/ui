import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import {
  NB_PHONE_QUERY,
  NB_PHONE_TOUCH_QUERY,
} from '../src/composables/usePhoneLayout.composable'

/**
 * The phone adaptations that live only in CSS: the modal sheet, 44px touch
 * targets, 16px field text, the docked toolbar. Each must exist, and each
 * must sit inside a phone media query, because a rule that leaks out of the
 * gate changes a desktop (and Stagewright) without anybody noticing.
 *
 * Asserted on the compiled output, the same way sfc-styles.test.ts does,
 * because jsdom evaluates no media queries.
 */

const dir = join(__dirname, '../src/components')

function compiled(file: string): string {
  const path = join(dir, file)
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  return descriptor.styles
    .map(
      (s) =>
        compileString(s.content, {
          syntax: 'scss',
          url: pathToFileURL(path),
          style: 'expanded',
        }).css,
    )
    .join('\n')
}

interface IMediaBlock {
  query: string
  body: string
  start: number
  end: number
}

function mediaBlocks(css: string): IMediaBlock[] {
  const blocks: IMediaBlock[] = []
  let at = css.indexOf('@media')
  while (at !== -1) {
    const open = css.indexOf('{', at)
    let depth = 0
    let end = open
    for (; end < css.length; end++) {
      if (css[end] === '{') depth++
      else if (css[end] === '}' && --depth === 0) break
    }
    blocks.push({
      query: css.slice(at + 6, open).trim(),
      body: css.slice(open, end + 1),
      start: at,
      end: end + 1,
    })
    at = css.indexOf('@media', end)
  }
  return blocks
}

/** Everything inside @media blocks whose query is exactly `query`. */
function mediaBodies(css: string, query: string): string {
  return mediaBlocks(css)
    .filter((block) => block.query === query)
    .map((block) => block.body)
    .join('\n')
}

/** The stylesheet with every @media block and comment taken out. */
function outsideMedia(css: string): string {
  let out = ''
  let from = 0
  for (const block of mediaBlocks(css)) {
    out += css.slice(from, block.start)
    from = block.end
  }
  return (out + css.slice(from)).replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The declarations of `selector` inside `css`. */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match?.[1] ?? ''
}

const phoneOf = (file: string) => mediaBodies(compiled(file), NB_PHONE_QUERY)
const phoneTouchOf = (file: string) =>
  mediaBodies(compiled(file), NB_PHONE_TOUCH_QUERY)

describe('phone styles stay behind the phone gate', () => {
  it('NbModal: overlay, sheet, full screen, footer and slide', () => {
    const phone = phoneOf('Modal.vue')
    expect(rule(phone, '.nb-modal--overlay')).toContain('align-items: flex-end')
    expect(rule(phone, '.nb-modal--overlay')).toContain('padding: 0')
    expect(rule(phone, '.nb-modal--content--sm')).toContain(
      'max-height: var(--nb-vvh, 100dvh)',
    )
    expect(rule(phone, '.nb-modal--content--sm')).toContain(
      'border-end-start-radius: 0',
    )
    expect(phone).toMatch(
      /\.nb-modal--content--md,\s*\.nb-modal--content--lg,\s*\.nb-modal--content--xl,\s*\.nb-modal--content--immersive\s*\{[^}]*height: var\(--nb-vvh, 100dvh\)[^}]*border-radius: 0px/,
    )
    expect(rule(phone, '.nb-modal--footer')).toContain(
      'padding-bottom: env(safe-area-inset-bottom)',
    )
    expect(phone).toMatch(/nb-modal-enter-from[^{]*\{[^}]*translateY\(100%\)/)

    const desktop = outsideMedia(compiled('Modal.vue'))
    expect(desktop).not.toContain('--nb-vvh')
    expect(desktop).not.toContain('translateY(100%)')
  })

  it('NbModal: the close square takes 44px of taps on a touch phone', () => {
    expect(phoneTouchOf('Modal.vue')).toContain('.nb-modal--close::after')
  })

  it('NbMenuItem: rows are at least 44px on a touch phone', () => {
    expect(rule(phoneTouchOf('MenuItem.vue'), '.nb-menu-item')).toContain(
      'min-block-size: 44px',
    )
  })

  it('NbDatePicker: sheet, 16px field text, 44px trigger', () => {
    const phone = phoneOf('DatePicker.vue')
    expect(rule(phone, '.nb-date-picker__calendar--sheet')).toContain(
      'inset-inline: 0',
    )
    expect(rule(phone, '.nb-date-picker__scrim')).toContain('position: fixed')
    const touch = phoneTouchOf('DatePicker.vue')
    expect(rule(touch, '.nb-date-picker__field')).toContain('max(16px')
    expect(touch).toContain('.nb-date-picker__icon::after')
  })

  it('NbInlineEdit: editor text is never below 16px on a touch phone', () => {
    const touch = phoneTouchOf('InlineEdit.vue')
    for (const size of ['md', 'lg', 'xl'])
      expect(rule(touch, `.nb-inline-edit__input--${size}`)).toContain(
        'max(16px',
      )
  })

  it('NbInfoHint: the trigger takes 44px of taps on a touch phone', () => {
    expect(phoneTouchOf('InfoHint.vue')).toContain(
      '.nb-info-hint--trigger::after',
    )
  })

  it('NbFloatingToolbar: the docked bar exists only in the phone layout', () => {
    const phone = phoneOf('FloatingToolbar.vue')
    expect(rule(phone, '.nb-floating-toolbar--docked')).toContain(
      'overflow-x: auto',
    )
    expect(phone).toContain('min-block-size: 44px')
    expect(outsideMedia(compiled('FloatingToolbar.vue'))).not.toContain(
      'nb-floating-toolbar--docked',
    )
  })
})
