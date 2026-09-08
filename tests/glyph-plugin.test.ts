import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolve } from 'node:path'
import { nubiscoGlyphs } from '../src/plugins/vite/glyphs'

/**
 * The plugin is the load-bearing piece of the whole packaging change: if it
 * stops rewriting a literal name, nothing breaks loudly, the page just links
 * the entire catalogue again. These specs pin the rewrites it must perform and,
 * as importantly, the ones it must not.
 */
const plugin = nubiscoGlyphs({
  glyphRoot: resolve(__dirname, '../generated'),
  catalog: 'auto',
})

const transform = async (source: string, id = '/app/src/Thing.vue') => {
  const result = await (
    plugin.transform as unknown as (
      code: string,
      id: string,
    ) => Promise<{ code: string } | undefined>
  ).call({}, source, id)
  return result?.code
}

const sfc = (template: string, script = `\nconst x = 1\n`) =>
  `<template>\n${template}\n</template>\n\n<script setup lang="ts">${script}</script>\n`

describe('glyph plugin: literal names', () => {
  it('links one weight of one icon for a literal name', async () => {
    const out = await transform(sfc('<NbIcon name="github-logo" />'))
    expect(out).toContain(
      "import { regular as __nb_icon_github_logo_regular } from '@nubisco/ui/icons/github-logo'",
    )
    expect(out).toContain(':name="__nb_icon_github_logo_regular"')
    expect(out).not.toContain('icons/all')
  })

  it('narrows the import to a statically declared weight', async () => {
    const out = await transform(sfc('<NbIcon name="check" weight="bold" />'))
    expect(out).toContain(
      "import { bold as __nb_icon_check_bold } from '@nubisco/ui/icons/check'",
    )
  })

  it('imports every weight when the weight is bound', async () => {
    const out = await transform(sfc('<NbIcon name="check" :weight="w" />'))
    expect(out).toContain(
      "import * as __nb_icon_check from '@nubisco/ui/icons/check'",
    )
  })

  it('rewrites an icon name forwarded through another component', async () => {
    const out = await transform(sfc('<NbButton icon="plus">Add</NbButton>'))
    expect(out).toContain("from '@nubisco/ui/icons/plus'")
    expect(out).toContain(':icon="__nb_icon_plus"')
  })

  it('links a flag by country code', async () => {
    const out = await transform(sfc('<NbFlag name="pt" />'))
    expect(out).toContain("from '@nubisco/ui/flags/pt'")
  })

  it('resolves both arms of a literal ternary without the catalogue', async () => {
    const out = await transform(
      sfc(`<NbIcon :name="open ? 'caret-up' : 'caret-down'" />`),
    )
    expect(out).toContain("from '@nubisco/ui/icons/caret-up'")
    expect(out).toContain("from '@nubisco/ui/icons/caret-down'")
    expect(out).not.toContain('icons/all')
  })
})

describe('glyph plugin: what it leaves alone', () => {
  it('ignores a name that is not a glyph', async () => {
    expect(await transform(sfc('<NbTextInput name="email" />'))).toBeUndefined()
  })

  it('ignores `name` on a component that is not NbIcon or NbFlag', async () => {
    // `plus` is a real icon name, but on a text input `name` is a field name.
    expect(await transform(sfc('<NbTextInput name="plus" />'))).toBeUndefined()
  })

  it('ignores plain HTML elements', async () => {
    expect(await transform(sfc('<slot name="empty" />'))).toBeUndefined()
  })

  it('leaves files with no Nubisco tags untouched', async () => {
    expect(await transform(sfc('<div class="plus" />'))).toBeUndefined()
  })

  it('skips node_modules', async () => {
    const out = await transform(
      sfc('<NbIcon name="check" />'),
      '/app/node_modules/thing/Thing.vue',
    )
    expect(out).toBeUndefined()
  })
})

describe('glyph plugin: runtime names', () => {
  it('loads the catalogue into the one file that needs it', async () => {
    const out = await transform(sfc('<NbIcon :name="chosen" />'))
    expect(out).toContain("import '@nubisco/ui/icons/all'")
  })

  it('loads the flag catalogue for a runtime country code', async () => {
    const out = await transform(sfc('<NbFlag :name="country" />'))
    expect(out).toContain("import '@nubisco/ui/flags/all'")
    expect(out).not.toContain('icons/all')
  })

  it('does not load the catalogue for a forwarded dynamic icon', async () => {
    // <NbButton :icon="x" /> says nothing about what x is: it may already be a
    // module. Pulling 1,500 icons in on that evidence would make the common
    // wrapper component the most expensive thing in the bundle. It is reported
    // instead, see below.
    const out = await transform(sfc('<NbButton :icon="whatever" />'))
    expect(out).toBeUndefined()
  })

  it('can be told not to load the catalogue at all', async () => {
    const strict = nubiscoGlyphs({
      glyphRoot: resolve(__dirname, '../generated'),
      catalog: 'off',
    })
    const out = await (
      strict.transform as unknown as (
        code: string,
        id: string,
      ) => Promise<{ code: string } | undefined>
    ).call({}, sfc('<NbIcon :name="chosen" />'), '/app/src/Thing.vue')
    expect(out).toBeUndefined()
  })
})

describe('glyph plugin: bound names on forwarding components', () => {
  // A forwarded `:icon` was skipped outright: no rewrite, no catalogue, no
  // message. `<NbButton icon="plus">` linked its icon and
  // `<NbButton :icon="copied ? 'check' : 'copy'">` linked nothing, so the
  // second one worked only when some other chunk had already loaded the
  // catalogue, which made it depend on navigation order.
  it('links the literals in a forwarded ternary', async () => {
    const out = await transform(
      sfc(`<NbButton :icon="copied ? 'check' : 'copy'">Copy</NbButton>`),
    )
    expect(out).toContain(
      "import * as __nb_icon_check from '@nubisco/ui/icons/check'",
    )
    expect(out).toContain(
      "import * as __nb_icon_copy from '@nubisco/ui/icons/copy'",
    )
    expect(out).toContain(':icon="copied ? __nb_icon_check : __nb_icon_copy"')
    expect(out).not.toContain('icons/all')
  })

  it('links a forwarded flag literal in an expression', async () => {
    const out = await transform(sfc(`<NbSelect :flag="open ? 'pt' : 'es'" />`))
    expect(out).toContain("from '@nubisco/ui/flags/pt'")
    expect(out).toContain("from '@nubisco/ui/flags/es'")
  })

  it('leaves `name` alone on a forwarding component', async () => {
    // On a text input `name` is the form field name, not a glyph.
    expect(
      await transform(sfc(`<NbTextInput :name="open ? 'plus' : 'check'" />`)),
    ).toBeUndefined()
  })
})

describe('glyph plugin: reporting what it could not link', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  // Cleared before each test rather than after: the spy is installed when this
  // block is collected, so it would otherwise carry warnings from the specs
  // above it.
  beforeEach(() => warn.mockClear())

  it('names the file and the expression it could not resolve', async () => {
    await transform(sfc('<NbButton :icon="actionIcon" />'))
    expect(warn).toHaveBeenCalledOnce()
    const message = warn.mock.calls[0][0] as string
    expect(message).toContain('Thing.vue')
    expect(message).toContain(':icon="actionIcon"')
    expect(message).toContain('registerIcons()')
    expect(message).toContain("'@nubisco/ui/icons/all'")
  })

  it('says nothing when the binding is a glyph module the file imported', async () => {
    // The documented no-plugin path. Warning here would be noise, and linking
    // a catalogue on top of an already-linked module would be waste.
    const out = await transform(
      sfc(
        '<NbButton :icon="GithubLogo" />',
        `\nimport GithubLogo from '@nubisco/ui/icons/github-logo'\n`,
      ),
    )
    expect(warn).not.toHaveBeenCalled()
    expect(out).toBeUndefined()
  })

  it('does not warn about NbIcon, which gets the catalogue instead', async () => {
    const out = await transform(sfc('<NbIcon :name="chosen" />'))
    expect(out).toContain("import '@nubisco/ui/icons/all'")
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('glyph plugin: expressions that only look resolved', () => {
  // Rewriting a literal used to be taken as proof the whole expression was
  // covered, as long as no quoted string survived. So `x || 'cube'` was called
  // resolved while `x || fallback` was not, meaning adding a literal fallback
  // silently removed coverage from the same expression.
  it('still loads the catalogue for a literal fallback', async () => {
    const out = await transform(sfc(`<NbIcon :name="block?.icon || 'cube'" />`))
    expect(out).toContain("from '@nubisco/ui/icons/cube'")
    expect(out).toContain("import '@nubisco/ui/icons/all'")
  })

  it('treats ?? and && the same way', async () => {
    for (const expression of [
      `block.icon ?? 'cube'`,
      `enabled && 'cube'`,
      `(block.icon || 'cube')`,
    ]) {
      const out = await transform(sfc(`<NbIcon :name="${expression}" />`))
      expect(out, expression).toContain("import '@nubisco/ui/icons/all'")
    }
  })

  it('keeps a ternary of literals resolved, however nested', async () => {
    const out = await transform(
      sfc(`<NbIcon :name="a ? 'check' : b ? 'copy' : 'cube'" />`),
    )
    expect(out).toContain("from '@nubisco/ui/icons/check'")
    expect(out).toContain("from '@nubisco/ui/icons/cube'")
    expect(out).not.toContain('icons/all')
  })

  it('resolves a ternary between two imported modules', async () => {
    const out = await transform(
      sfc(
        '<NbIcon :name="on ? Check : Copy" />',
        `\nimport Check from '@nubisco/ui/icons/check'\nimport Copy from '@nubisco/ui/icons/copy'\n`,
      ),
    )
    expect(out).toBeUndefined()
  })

  it('loads the catalogue when one arm is a runtime value', async () => {
    const out = await transform(
      sfc(
        `<NbIcon :name="on ? Check : whatever" />`,
        `\nimport Check from '@nubisco/ui/icons/check'\n`,
      ),
    )
    expect(out).toContain("import '@nubisco/ui/icons/all'")
  })

  it('leaves an unparsable expression to the Vue plugin to report', async () => {
    // vue/compiler-sfc rejects the template before we see it, and a broken
    // build is not ours to half-fix.
    expect(await transform(sfc(`<NbIcon :name="a ===" />`))).toBeUndefined()
  })
})
