import { describe, it, expect, vi } from 'vitest'
import { nubiscoImports } from '../src/plugins/vite/imports'

/**
 * Style splitting used to ride entirely on the auto-import resolver, so an app
 * that wrote `import { NbButton } from '@nubisco/ui'` in every file linked no
 * component CSS at all. Following the upgrade guide and dropping
 * `@nubisco/ui/css` then shipped a completely unstyled app, with a green
 * typecheck, green tests and a plausibly sized CSS bundle, because the app's
 * own styles and the design tokens were still in it.
 *
 * These specs pin the rewrite that closes that hole, and the imports it must
 * leave alone.
 */
const manifest = new Map([
  ['NbButton', 'Button'],
  ['NbPanel', 'Panel'],
  ['NbDataTable', 'DataTable'],
])

const styleManifest = {
  Button: ['styles/Button.css'],
  Panel: ['styles/Panel.css'],
  DataTable: ['styles/shared.css', 'styles/DataTable.css'],
}

const make = (styles = true) => {
  let resolved = 0
  const plugin = nubiscoImports({
    manifest,
    styleManifest,
    styles,
    packageName: '@nubisco/ui',
    onResolve: (count) => {
      resolved += count
    },
  })
  const transform = (code: string, id = '/app/src/View.vue') =>
    (
      plugin.transform as unknown as (
        code: string,
        id: string,
      ) => { code: string } | undefined
    ).call({}, code, id)?.code
  return { transform, resolved: () => resolved }
}

const sfc = (script: string) =>
  `<template>\n  <NbButton>Go</NbButton>\n</template>\n\n<script setup lang="ts">\n${script}\n</script>\n`

describe('hand-written imports get their stylesheets', () => {
  it('rewrites a barrel import to the component entry point', () => {
    const { transform } = make()
    const out = transform(sfc(`import { NbButton } from '@nubisco/ui'`))
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
    expect(out).toContain("import '@nubisco/ui/dist/styles/Button.css'")
    expect(out).not.toMatch(/from '@nubisco\/ui'/)
  })

  it('splits a multi-component import, each with its own styles', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbButton, NbPanel } from '@nubisco/ui'`),
    )
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
    expect(out).toContain(
      "import { NbPanel } from '@nubisco/ui/components/Panel'",
    )
    expect(out).toContain("import '@nubisco/ui/dist/styles/Panel.css'")
  })

  it('links every sheet a component needs, in manifest order', () => {
    const { transform } = make()
    const out = transform(sfc(`import { NbDataTable } from '@nubisco/ui'`))
    const shared = out!.indexOf('styles/shared.css')
    const own = out!.indexOf('styles/DataTable.css')
    expect(shared).toBeGreaterThan(-1)
    expect(own).toBeGreaterThan(shared)
  })

  it('imports a shared sheet once per file', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbDataTable, NbButton } from '@nubisco/ui'`),
    )
    expect(out!.match(/styles\/shared\.css/g)).toHaveLength(1)
  })

  it('keeps an alias working', () => {
    const { transform } = make()
    const out = transform(sfc(`import { NbButton as Btn } from '@nubisco/ui'`))
    expect(out).toContain(
      "import { NbButton as Btn } from '@nubisco/ui/components/Button'",
    )
  })

  it('leaves non-component exports on the barrel import', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbButton, registerIcons, useTheme } from '@nubisco/ui'`),
    )
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
    expect(out).toContain(
      "import { registerIcons, useTheme } from '@nubisco/ui'",
    )
  })

  it('adds the styles for an entry point the app named itself', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbButton } from '@nubisco/ui/components/Button'`),
    )
    expect(out).toContain("import '@nubisco/ui/dist/styles/Button.css'")
    // Already the right specifier: nothing to rewrite.
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
  })

  it('works in a plain module, not only in an SFC', () => {
    const { transform } = make()
    const out = transform(
      `import { NbPanel } from '@nubisco/ui'\nexport const P = NbPanel\n`,
      '/app/src/registry.ts',
    )
    expect(out).toContain(
      "import { NbPanel } from '@nubisco/ui/components/Panel'",
    )
    expect(out).toContain("import '@nubisco/ui/dist/styles/Panel.css'")
  })
})

describe('what the rewrite leaves alone', () => {
  it('a type-only import, which links nothing at runtime', () => {
    const { transform } = make()
    expect(
      transform(sfc(`import type { NbButton } from '@nubisco/ui'`)),
    ).toBeUndefined()
  })

  it('a type specifier inside a value import', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbButton, type IButtonProps } from '@nubisco/ui'`),
    )
    expect(out).toContain("import { type IButtonProps } from '@nubisco/ui'")
  })

  it('a namespace import, which names no components', () => {
    const { transform } = make()
    expect(transform(sfc(`import * as UI from '@nubisco/ui'`))).toBeUndefined()
  })

  it('a default import', () => {
    const { transform } = make()
    expect(
      transform(sfc(`import NubiscoUI from '@nubisco/ui'`)),
    ).toBeUndefined()
  })

  it('imports of other packages', () => {
    const { transform } = make()
    expect(transform(sfc(`import { ref } from 'vue'`))).toBeUndefined()
  })

  it('files in node_modules', () => {
    const { transform } = make()
    expect(
      transform(
        sfc(`import { NbButton } from '@nubisco/ui'`),
        '/app/node_modules/thing/Thing.vue',
      ),
    ).toBeUndefined()
  })

  it('the stylesheets, when styles are turned off', () => {
    const { transform } = make(false)
    const out = transform(sfc(`import { NbButton } from '@nubisco/ui'`))
    // Still split, for the smaller bundle, but no CSS: the app is importing
    // the whole sheet itself.
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
    expect(out).not.toContain('.css')
  })
})

describe('what the build can tell from it', () => {
  it('counts the components it linked, so a build that linked none can say so', () => {
    const { transform, resolved } = make()
    transform(sfc(`import { NbButton, NbPanel } from '@nubisco/ui'`))
    expect(resolved()).toBe(2)
  })

  it('counts nothing for a file that imports no components', () => {
    const { transform, resolved } = make()
    transform(sfc(`import { registerIcons } from '@nubisco/ui'`))
    expect(resolved()).toBe(0)
  })
})

/**
 * The mirror image of the bug above.
 *
 * Before per-component stylesheets existed, importing `@nubisco/ui/css` was
 * the correct thing to do, so an upgraded app still has that line. Now that
 * the plugin also links per-component sheets, the two together put every
 * component rule in the bundle twice: byte-identical, same specificity,
 * nothing renders differently, and the only symptom is a CSS bundle at
 * roughly double the size it should be.
 *
 * It cost a downstream team a measured investigation to find, which is the
 * definition of a diagnostic worth emitting.
 */
describe('full-stylesheet duplication warning', () => {
  const stylesCheck = async (styles = true) => {
    const { default: nubiscoUI } = await import('../src/plugins/vite/index')
    const plugins = nubiscoUI({ styles }) as any[]
    return plugins.find((p) => p?.name === 'nubisco-ui:styles-check')
  }

  /**
   * `resolved` stands in for the plugin having actually linked a
   * per-component stylesheet in this build, which is half the condition.
   */
  const run = async (
    code: string,
    id = '/app/src/main.ts',
    resolved = true,
  ) => {
    const { default: nubiscoUI } = await import('../src/plugins/vite/index')
    const plugins = nubiscoUI({ styles: true }) as any[]
    const check = plugins.find((p) => p?.name === 'nubisco-ui:styles-check')
    const imports = plugins.find((p) => p?.name === 'nubisco-ui:imports')

    // Drive the real counter the diagnostic reads, rather than faking it.
    if (resolved && imports?.transform) {
      imports.transform.call(
        {},
        "import { NbButton } from '@nubisco/ui'\n",
        '/app/src/Uses.ts',
      )
    }

    const warnings: string[] = []
    const spy = vi
      .spyOn(console, 'warn')
      .mockImplementation((m: string) => void warnings.push(m))
    check.transform.call({}, code, id)
    check.closeBundle.call({})
    spy.mockRestore()
    return warnings.join('\n')
  }

  it('warns when the full stylesheet is imported alongside the plugin', async () => {
    const out = await run("import '@nubisco/ui/css'\n")
    expect(out).toContain('twice')
    expect(out).toContain('src/main.ts')
  })

  it('recognises the dist path spelling too', async () => {
    const out = await run("import '@nubisco/ui/dist/ui.css'\n")
    expect(out).toContain('twice')
  })

  it('stays silent when the full stylesheet is not imported', async () => {
    const out = await run("import { NbButton } from '@nubisco/ui'\n")
    expect(out).not.toContain('twice')
  })

  // A per-component sheet is exactly what the plugin itself emits. Matching it
  // would make the warning fire on every build that is doing the right thing.
  it('does not mistake a per-component stylesheet for the full one', async () => {
    const out = await run("import '@nubisco/ui/dist/styles/Button.css'\n")
    expect(out).not.toContain('twice')
  })

  it('ignores the import when it comes from a dependency', async () => {
    const out = await run(
      "import '@nubisco/ui/css'\n",
      '/app/node_modules/some-kit/index.js',
    )
    expect(out).not.toContain('twice')
  })

  it('says nothing when the app opted out of style injection', async () => {
    const plugin = await stylesCheck(false)
    expect(plugin).toBeUndefined()
  })

  /*
   * The case a downstream team hit: a second entry point that is built WITHOUT
   * this plugin, where the full sheet is the only source of component styles
   * and importing it is correct. Nothing must be linking per-component sheets
   * for the warning to make sense.
   */
  it('stays silent when no per-component stylesheet was linked', async () => {
    const out = await run(
      "import '@nubisco/ui/css'\n",
      '/app/src/demo.ts',
      false,
    )
    expect(out).not.toContain('twice')
  })

  it('gives the opposite advice, not both, when nothing was linked', async () => {
    const out = await run(
      "import '@nubisco/ui/css'\n",
      '/app/src/demo.ts',
      false,
    )
    expect(out).toContain('no components were linked')
    expect(out).not.toContain('twice')
  })
})
