import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import Icon from '../src/components/Icon.vue'
import * as ai from '@nubisco/ui/icons/ai'

/**
 * House icons: SVGs in src/assets/icons that generate-assets.mjs turns into
 * modules shaped like the Phosphor ones. These specs hold each one to the
 * custom-icon spec in docs/components/icon/beyond-the-catalogue.md.
 */

const ROOT = join(__dirname, '..')
const SOURCES = join(ROOT, 'src/assets/icons')
const names = JSON.parse(
  readFileSync(join(ROOT, 'generated/icons/names.json'), 'utf8'),
) as string[]

describe('house icons', () => {
  const files = readdirSync(SOURCES).filter((f) => f.endsWith('.svg'))

  it.each(files)('%s is on the 256 grid and takes currentColor', (file) => {
    const source = readFileSync(join(SOURCES, file), 'utf8')
    expect(source).toContain('viewBox="0 0 256 256"')
    // No colour of its own: the generated root sets fill="currentColor".
    expect(source).not.toMatch(
      /fill\s*[:=]\s*["']?(?!none|currentColor)[#a-z(]/i,
    )
    expect(names).toContain(file.replace(/\.svg$/, ''))
  })

  it('"ai" resolves like any other icon, in every weight', () => {
    expect(ai.glyphName).toBe('ai')
    for (const weight of [
      'thin',
      'light',
      'regular',
      'bold',
      'fill',
      'duotone',
    ] as const) {
      expect(ai[weight]).toBe(ai.regular)
    }
    const wrapper = mount(Icon, { props: { name: ai, weight: 'fill' } })
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('fill')).toBe('currentColor')
    expect(svg.html()).not.toContain('rgb(')
    expect(wrapper.classes()).toContain('ai')
  })
})
