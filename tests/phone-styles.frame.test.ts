import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import { NB_PHONE_QUERY } from '../src/composables/usePhoneLayout.composable'

/**
 * The frame-level phone adaptations that live in CSS: the Shell topbar safety
 * net, the CommandPalette sheet and the UserMenu width cap. Each must sit
 * inside the phone media query, because a rule that leaks out of the gate
 * changes a desktop (and Stagewright) without anybody noticing. Asserted on
 * the compiled output, because jsdom evaluates no media queries.
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

function phoneOf(css: string): string {
  return mediaBlocks(css)
    .filter((b) => b.query === NB_PHONE_QUERY)
    .map((b) => b.body)
    .join('\n')
}

function outsideMedia(css: string): string {
  let out = ''
  let from = 0
  for (const block of mediaBlocks(css)) {
    out += css.slice(from, block.start)
    from = block.end
  }
  return (out + css.slice(from)).replace(/\/\*[\s\S]*?\*\//g, '')
}

function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css)
  return match?.[1] ?? ''
}

describe('frame phone styles stay behind the gates', () => {
  it('NbShell: the topbar safety net is phone and collapsed both', () => {
    const css = compiled('Shell.vue')
    const phone = phoneOf(css)
    const right = rule(phone, '.nb-shell--collapsed .nb-shell__topbar-right')
    expect(right).toContain('flex-shrink: 1')
    expect(right).toContain('overflow-x: auto')
    expect(right).toContain('min-width: 0')
    expect(
      rule(phone, '.nb-shell--collapsed .nb-shell__topbar-left:not(:empty)'),
    ).toContain('min-width: min(40%, 10rem)')

    // Outside the phone query the right half is as it always was.
    const desktop = outsideMedia(css)
    const base = rule(desktop, '\n.nb-shell__topbar-right')
    expect(base).toContain('flex-shrink: 0')
    expect(base).not.toContain('overflow')
  })

  it('NbShell: the touch sizes and the dismiss inset are collapsed only', () => {
    const desktop = outsideMedia(compiled('Shell.vue'))
    expect(
      rule(
        desktop,
        '.nb-shell--collapsed .nb-shell__nav-toggle,\n.nb-shell--collapsed .nb-shell__inspector-dismiss',
      ),
    ).toContain('width: 44px')
    expect(
      rule(desktop, '.nb-shell--collapsed .nb-shell__contextbar-toggle'),
    ).toContain('min-block-size: 44px')
    expect(
      rule(desktop, '.nb-shell--collapsed .nb-shell__fixedbar > *'),
    ).toContain('min-width: 0')
    expect(desktop).toMatch(
      /\.nb-shell--collapsed \.nb-shell__inspector--overlay\s*\{\s*--nb-shell-inspector-dismiss-inset:/,
    )
    // The custom property is set nowhere else.
    expect(desktop.match(/--nb-shell-inspector-dismiss-inset:/g)).toHaveLength(
      1,
    )
  })

  it('NbCommandPalette: a full-width sheet from the top on a phone', () => {
    const css = compiled('CommandPalette.vue')
    const phone = phoneOf(css)
    expect(rule(phone, '.nb-command-palette__overlay')).toContain(
      'padding-top: 0',
    )
    const sheet = rule(phone, '.nb-command-palette')
    expect(sheet).toContain('max-width: none')
    expect(sheet).toContain('max-height: var(--nb-vvh, 100dvh)')
    expect(rule(phone, '.nb-command-palette__results')).toContain(
      'min-height: 0',
    )
    const desktop = outsideMedia(css)
    expect(rule(desktop, '.nb-command-palette__overlay')).toContain(
      'padding-top: 15vh',
    )
    expect(desktop).not.toContain('--nb-vvh')
  })

  it('NbUserMenu: the panel is capped to the screen on a phone only', () => {
    const css = compiled('UserMenu.vue')
    expect(rule(phoneOf(css), '.nb-user-menu__panel')).toContain(
      'max-width: calc(100vw - 16px)',
    )
    expect(rule(outsideMedia(css), '.nb-user-menu__panel')).not.toContain(
      'max-width',
    )
  })
})
