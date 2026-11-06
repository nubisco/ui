/**
 * Library components set type through the type sets, never by hand.
 *
 * An audit found 101 literal font sizes (34 distinct values, down to 8px) and
 * 76 reads of the raw `--nb-font-size-N` scale in `src/components`, against
 * 23 reads of a type set. Every product inherits those sizes, so a product
 * that uses the type sets perfectly still looked inconsistent. The rule the
 * typography docs state ("components use type sets, never raw scale values")
 * is enforced here: a `font-size` in a component reads `--nb-type-{set}-size`,
 * a component's own custom property, or inherits.
 *
 * The same scan holds the weights to the three the fonts plugin loads.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '../src/components')

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return vueFiles(path)
    return name.endsWith('.vue') ? [path] : []
  })
}

/** The style blocks of an SFC, with their line offset in the file. */
function styleLines(src: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = []
  const lines = src.split('\n')
  let inStyle = false
  lines.forEach((text, i) => {
    if (/^<style\b/.test(text)) inStyle = true
    else if (/^<\/style>/.test(text)) inStyle = false
    else if (inStyle) out.push({ line: i + 1, text })
  })
  return out
}

// A font-size declaration, or a component custom property that carries one.
const FONT_SIZE = /^\s*(font-size|--nb-[a-z0-9-]*font-size):\s*([^;]+);/

// What a component may set a font size to.
const ALLOWED = [
  /^var\(--nb-type-[a-z0-9#{}$-]+-size\)$/,
  // The iOS no-zoom floor on a touch phone (see logic/_touch.scss).
  /^max\(16px, var\(--nb-(type-[a-z0-9#{}$-]+-size|[a-z-]+-font-size)\)\)$/,
  // A component's own knob, which is itself set from a type set.
  /^var\(--nb-(?!font-size-)[a-z0-9-]+\)$/,
  /^inherit$/,
  /^1em$/,
]

// Reviewed exceptions, `path:value`. Keep this short and say why.
const ALLOWLIST = new Set([
  // A monospace chip inside a crumb, sized relative to the crumb it sits in.
  'Breadcrumbs.vue:0.88em',
])

const files = vueFiles(root)

describe('component type', () => {
  it('finds the components', () => {
    expect(files.length).toBeGreaterThan(80)
  })

  it('sets every font size through a type set', () => {
    const offenders: string[] = []
    for (const file of files) {
      const rel = relative(root, file)
      for (const { line, text } of styleLines(readFileSync(file, 'utf8'))) {
        const m = FONT_SIZE.exec(text)
        if (!m) continue
        const value = m[2].trim()
        if (ALLOWED.some((re) => re.test(value))) continue
        if (ALLOWLIST.has(`${rel}:${value}`)) continue
        offenders.push(`${rel}:${line}: ${m[1]}: ${value}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('uses only light, regular and semibold', () => {
    const offenders: string[] = []
    for (const file of files) {
      const rel = relative(root, file)
      for (const { line, text } of styleLines(readFileSync(file, 'utf8'))) {
        if (
          /font-weight:\s*(500|700|800|900|bold|bolder)\b/.test(text) ||
          /--nb-font-weight-bold\b/.test(text)
        ) {
          offenders.push(`${rel}:${line}: ${text.trim()}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('type scale', () => {
  const type = readFileSync(
    join(import.meta.dirname, '../src/styles/variables/_type.scss'),
    'utf8',
  )
  const sets = type.slice(
    type.indexOf('$typeSets:'),
    type.indexOf(') !default;', type.indexOf('$typeSets:')),
  )

  it('puts no type set below 12px', () => {
    const sizes = [...sets.matchAll(/size:\s*(\d+),/g)].map((m) => Number(m[1]))
    expect(sizes.length).toBeGreaterThan(20)
    expect(sizes.filter((s) => s < 12)).toEqual([])
  })

  it('gives every type set an integer pixel line height on the 4px rhythm', () => {
    const heights = [...sets.matchAll(/line-height:\s*([^,\n]+),/g)].map((m) =>
      m[1].trim(),
    )
    expect(heights.length).toBeGreaterThan(20)
    for (const h of heights) {
      expect(h).toMatch(/^\d+px$/)
      // 22 and 50 are Carbon's, on its 2px grid. Everything else is on 4.
      expect(Number.parseInt(h) % 2).toBe(0)
    }
  })
})
