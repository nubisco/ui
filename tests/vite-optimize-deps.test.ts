import { describe, it, expect } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import nubiscoUI, { prebundleIds } from '../src/plugins/vite/index'
import { COMPONENT_MANIFEST } from '../src/components/manifest'

/*
 * The plugin rewrites tags and icon names into deep imports during
 * `transform`, after Vite's start-up scan. Anything it does not list in
 * `optimizeDeps.include` is found late, and Vite reloads the whole page to
 * bundle it. These specs pin the list.
 */

/** A dist folder with a few glyph names, under a real `node_modules`. */
function installedDist() {
  const root = mkdtempSync(path.join(tmpdir(), 'nb-app-'))
  const dist = path.join(root, 'node_modules', '@nubisco', 'ui', 'dist')
  for (const [kind, names] of [
    ['icons', ['house', 'check']],
    ['flags', ['pt', 'fr']],
  ] as const) {
    mkdirSync(path.join(dist, kind), { recursive: true })
    writeFileSync(path.join(dist, kind, 'names.json'), JSON.stringify(names))
  }
  return dist
}

const entries = new Set(Object.values(COMPONENT_MANIFEST))

describe('what the plugin pre-bundles', () => {
  const dist = installedDist()

  it('every component entry point and every icon, by default', () => {
    const ids = prebundleIds({}, dist)
    for (const file of entries) {
      expect(ids).toContain(`@nubisco/ui/components/${file}`)
    }
    expect(ids).toContain('@nubisco/ui/icons/house')
    expect(ids).toContain('@nubisco/ui/icons/check')
    // Each entry once, even where the manifest maps two tags to one file.
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.some((id) => id.includes('/flags/'))).toBe(false)
  })

  it('flags when asked, icons and components left out when asked', () => {
    const ids = prebundleIds(
      { optimizeDeps: { components: false, icons: false, flags: true } },
      dist,
    )
    expect(ids).toEqual(['@nubisco/ui/flags/pt', '@nubisco/ui/flags/fr'])
  })

  it('nothing the app has turned off', () => {
    expect(prebundleIds({ optimizeDeps: false }, dist)).toEqual([])
    expect(
      prebundleIds({ components: false, glyphs: { icons: false } }, dist),
    ).toEqual([])
  })

  it('reaches Vite through the config hook', () => {
    const plugins = nubiscoUI({ distRoot: dist }) as any[]
    const plugin = plugins.find((p) => p?.name === 'nubisco-ui:optimize-deps')
    expect(plugin.apply).toBe('serve')
    const config = plugin.config()
    expect(config.optimizeDeps.include).toContain(
      '@nubisco/ui/components/Button',
    )
    expect(config.optimizeDeps.include).toContain('@nubisco/ui/icons/house')
  })

  it('leaves a linked copy alone, so it stays source and hot-reloads', () => {
    const linked = mkdtempSync(path.join(tmpdir(), 'nb-linked-'))
    const plugins = nubiscoUI({ distRoot: linked }) as any[]
    const plugin = plugins.find((p) => p?.name === 'nubisco-ui:optimize-deps')
    expect(plugin.config()).toBeUndefined()
  })
})
