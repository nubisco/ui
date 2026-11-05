import { describe, it, expect, vi } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  nubiscoImports,
  PROGRAMMATIC_MOUNTS,
} from '../src/plugins/vite/imports'

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
  Confirm: ['styles/Button.css', 'styles/Modal.css', 'styles/Confirm.css'],
}

const make = (styles = true) => {
  let resolved = 0
  const plugin = nubiscoImports({
    manifest,
    styleManifest,
    styles,
    mounts: { useConfirm: ['Confirm'] },
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

/**
 * `useConfirm()` mounts NbConfirm in an app of its own, so no template names
 * NbConfirm and neither the resolver nor the rewrite above ever saw it. Every
 * confirm dialog opened through it rendered unstyled, and nothing failed.
 */
describe('composables that mount a component get its stylesheets', () => {
  it('links Confirm.css for useConfirm from the barrel', () => {
    const { transform, resolved } = make()
    const out = transform(
      `import { useConfirm } from '@nubisco/ui'\nexport const c = useConfirm()\n`,
      '/app/src/composables/useThing.ts',
    )
    expect(out).toContain("import { useConfirm } from '@nubisco/ui'")
    expect(out).toContain("import '@nubisco/ui/dist/styles/Modal.css'")
    expect(out).toContain("import '@nubisco/ui/dist/styles/Confirm.css'")
    expect(resolved()).toBe(1)
  })

  it('links it next to a split component import, each sheet once', () => {
    const { transform } = make()
    const out = transform(
      sfc(`import { NbButton, useConfirm, useToast } from '@nubisco/ui'`),
    )
    expect(out).toContain(
      "import { NbButton } from '@nubisco/ui/components/Button'",
    )
    expect(out).toContain("import { useConfirm, useToast } from '@nubisco/ui'")
    expect(out).toContain("import '@nubisco/ui/dist/styles/Confirm.css'")
    expect(out!.match(/styles\/Button\.css/g)).toHaveLength(1)
  })

  it('links it for the composable entry point too', () => {
    const { transform } = make()
    const out = transform(
      `import { useConfirm } from '@nubisco/ui/composables/useConfirm.composable'\n`,
      '/app/src/a.ts',
    )
    expect(out).toContain("import '@nubisco/ui/dist/styles/Confirm.css'")
  })

  it('links nothing for a type-only or non-mounting import', () => {
    const { transform } = make()
    expect(
      transform(`import type { TConfirmFn } from '@nubisco/ui'\n`, '/a.ts'),
    ).toBeUndefined()
    expect(
      transform(`import { type useConfirm } from '@nubisco/ui'\n`, '/a.ts'),
    ).toBeUndefined()
    expect(
      transform(`import { dismissConfirms } from '@nubisco/ui'\n`, '/a.ts'),
    ).toBeUndefined()
  })

  it('links no CSS when styles are turned off', () => {
    const { transform } = make(false)
    expect(
      transform(`import { useConfirm } from '@nubisco/ui'\n`, '/a.ts'),
    ).toBeUndefined()
  })

  it('is wired into nubiscoUI() with the real map', async () => {
    const distRoot = mkdtempSync(path.join(tmpdir(), 'nb-dist-'))
    writeFileSync(
      path.join(distRoot, 'component-styles.json'),
      JSON.stringify({ Confirm: ['styles/Confirm.css'] }),
    )
    const { default: nubiscoUI } = await import('../src/plugins/vite/index')
    const plugins = nubiscoUI({ distRoot, glyphs: false }) as any[]
    const imports = plugins.find((p) => p?.name === 'nubisco-ui:imports')
    const out = imports.transform.call(
      {},
      `import { useConfirm } from '@nubisco/ui'\n`,
      '/app/src/a.ts',
    )?.code
    expect(out).toContain("import '@nubisco/ui/dist/styles/Confirm.css'")
  })

  /*
   * The map is hand-written, so pin it to the source: any composable that
   * imports a styled component must have that component (or one that renders
   * it) in PROGRAMMATIC_MOUNTS, or the next one ships unstyled the same way.
   */
  it('covers every styled component a composable imports', () => {
    const root = path.resolve(__dirname, '../src')
    const read = (file: string) => readFileSync(file, 'utf8')
    const componentImports = (code: string) =>
      [...code.matchAll(/from '(?:@\/components\/|\.\/)([A-Z]\w*)\.vue'/g)].map(
        (m) => m[1],
      )
    const styled = (name: string) =>
      /<style/.test(read(path.join(root, 'components', `${name}.vue`)))

    const mounted = new Set(Object.values(PROGRAMMATIC_MOUNTS).flat())
    const covered = new Set(mounted)
    for (const name of mounted) {
      const code = read(path.join(root, 'components', `${name}.vue`))
      componentImports(code).forEach((dep) => covered.add(dep))
    }

    const dir = path.join(root, 'composables')
    const missing: string[] = []
    for (const file of readdirSync(dir)) {
      if (!/\.ts$/.test(file) || file.endsWith('.d.ts')) continue
      for (const name of componentImports(read(path.join(dir, file)))) {
        if (styled(name) && !covered.has(name)) missing.push(`${file}: ${name}`)
      }
    }
    expect(missing).toEqual([])
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
