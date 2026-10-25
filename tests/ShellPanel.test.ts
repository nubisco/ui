import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import { mount } from '@vue/test-utils'
import ShellPanel from '../src/components/ShellPanel.vue'

/** The declarations of one top-level rule in the compiled scoped style. */
function ruleBody(selector: string): string {
  const path = join(__dirname, '../src/components/ShellPanel.vue')
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  const css = descriptor.styles
    .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
  const match = new RegExp(
    `(?:^|\\})\\s*${selector.replace(/[.-]/g, '\\$&')}\\s*\\{([^}]*)\\}`,
  ).exec(css)
  expect(match, `no rule for ${selector}`).toBeTruthy()
  return (match as RegExpExecArray)[1]
}

describe('ShellPanel', () => {
  it('renders with the default size class', () => {
    const w = mount(ShellPanel, { props: { title: 'P' } })
    expect(w.classes()).toContain('default')
    w.unmount()
  })

  it('does NOT carry the fluid modifier class by default', () => {
    const w = mount(ShellPanel, { props: { title: 'P' } })
    expect(w.classes()).not.toContain('nb-shell-panel--fluid')
    w.unmount()
  })

  it('applies the fluid modifier class when fluid=true', () => {
    const w = mount(ShellPanel, { props: { title: 'P', fluid: true } })
    expect(w.classes()).toContain('nb-shell-panel--fluid')
    w.unmount()
  })

  it('emits update:size when the size buttons are clicked', async () => {
    const w = mount(ShellPanel, {
      props: { title: 'P', size: 'default' },
    })
    const buttons = w.findAll('.nb-shell-panel__size-btn')
    expect(buttons.length).toBeGreaterThan(0)
    // Click "collapsed" (first button per the template order).
    await buttons[0]!.trigger('click')
    const ev = w.emitted('update:size')?.[0]?.[0]
    expect(ev).toBe('collapsed')
    w.unmount()
  })

  // A long title ran under the size buttons: the row let nothing shrink but
  // the buttons. jsdom does no layout, so these read the rules that make the
  // title give way instead, and the full text that stays reachable.
  describe('a long title', () => {
    const long = 'Question 1 answers (empty lines keep the agreed order)'

    it('keeps the full text in a title attribute', () => {
      const w = mount(ShellPanel, { props: { title: long } })
      const title = w.find('.nb-shell-panel__title')
      expect(title.text()).toBe(long)
      expect(title.attributes('title')).toBe(long)
      w.unmount()
    })

    it('is cut with an ellipsis on one line', () => {
      const body = ruleBody('.nb-shell-panel__title')
      expect(body).toMatch(/overflow:\s*hidden/)
      expect(body).toMatch(/text-overflow:\s*ellipsis/)
      expect(body).toMatch(/white-space:\s*nowrap/)
      expect(body).toMatch(/min-width:\s*0/)
    })

    it('lets the left side shrink below its content', () => {
      const body = ruleBody('.nb-shell-panel__header-left')
      expect(body).toMatch(/flex:\s*0 1 auto/)
      expect(body).toMatch(/min-width:\s*0/)
    })

    it('never shrinks the size buttons', () => {
      expect(ruleBody('.nb-shell-panel__header-right')).toMatch(
        /flex-shrink:\s*0/,
      )
      expect(ruleBody('.nb-shell-panel__size-btn')).toMatch(/flex-shrink:\s*0/)
    })
  })
})
