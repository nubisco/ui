import { describe, it, expect } from 'vitest'
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
    // wrapper component the most expensive thing in the bundle.
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
