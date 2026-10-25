// NbShell's main region is the page ground, layer 0.
//
// It carried the `nb-layer-0` class, so inside it `--nb-c-surface` was layer 0,
// but it painted `--nb-shell-main-bg`, and that was declared at `:root` as
// `var(--nb-c-surface)`. A custom property substitutes on the element that
// declares it, so the token froze to the root's surface, layer 1, and every
// main region painted layer 1. A card painted with `--nb-c-surface` came out
// darker than the page around it, and a top-level NbPanel matched the page.
//
// jsdom cannot resolve custom properties, so the painted colour itself is
// measured by `e2e/shell-ground.spec.ts` in a real browser. This guards the two
// halves of the fix that can be read without one.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile, propsFrom } from '../scripts/lib/layerTokens.mjs'

describe('the shell page ground', () => {
  it('is not given a default at :root, where it would freeze to layer 1', () => {
    const root = propsFrom(compile(['base', 'light', 'dark']), /^:root$/)
    expect(root).not.toHaveProperty('--nb-shell-main-bg')
  })

  it('is resolved on the main element itself, from its own surface', () => {
    const source = readFileSync(resolve('src/components/Shell.vue'), 'utf8')
    const main = /\n\.nb-shell__main \{([^}]*)\}/.exec(source)
    expect(main, '.nb-shell__main rule not found').toBeTruthy()
    expect((main as RegExpExecArray)[1]).toMatch(
      /background:\s*var\(--nb-shell-main-bg,\s*var\(--nb-c-surface\)\)/,
    )
  })

  it('leaves NbShellPanel colours to the panel, for the same reason', () => {
    const root = propsFrom(compile(['base', 'light', 'dark']), /^:root$/)
    for (const token of [
      '--nb-shell-panel-bg',
      '--nb-shell-panel-border',
      '--nb-shell-panel-header-border',
    ]) {
      expect(root).not.toHaveProperty(token)
    }
    const source = readFileSync(
      resolve('src/components/ShellPanel.vue'),
      'utf8',
    )
    expect(source).toMatch(
      /background:\s*var\(--nb-shell-panel-bg,\s*var\(--nb-c-surface\)\)/,
    )
  })
})
