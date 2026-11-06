import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * `NbIcon color` takes a token, never a literal colour.
 *
 * An icon takes the colour of its text by default (`fill: currentColor`), and
 * that is almost always right. When it has to differ, it differs by role: a
 * status token, `--nb-c-primary`, a muted text token. A hex or a named colour
 * is the one way to paint an icon off-theme in a single attribute, and it
 * survives until someone switches to dark mode or a white-label theme.
 *
 * So the library's own sources and docs are scanned for a static `color` on
 * NbIcon whose value is not a custom property (or `currentColor`/`inherit`).
 * Bound values (`:color="status.color"`) are data and are not judged here.
 */

const ROOT = join(__dirname, '..')
const SKIP = new Set(['node_modules', 'dist', '.vitepress/cache', 'generated'])

function files(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name) && !path.endsWith('.vitepress/cache'))
        files(path, out)
    } else if (/\.(vue|md)$/.test(entry.name)) out.push(path)
  }
  return out
}

const ALLOWED = /^(var\(--[a-z0-9-]+(,.*)?\)|currentColor|inherit)$/

function literalIconColours(source: string): string[] {
  const found: string[] = []
  for (const tag of source.matchAll(/<(?:NbIcon|nb-icon)\b[^>]*>/gs)) {
    for (const attr of tag[0].matchAll(/(?<![:\w-])color="([^"]*)"/g)) {
      if (!ALLOWED.test(attr[1].trim())) found.push(attr[1])
    }
  }
  return found
}

describe('NbIcon color: tokens only', () => {
  it('the detector catches literals and lets tokens through', () => {
    expect(literalIconColours('<NbIcon name="x" color="#4f46e5" />')).toEqual([
      '#4f46e5',
    ])
    expect(literalIconColours('<NbIcon color="red" name="x" />')).toEqual([
      'red',
    ])
    expect(
      literalIconColours('<NbIcon name="x" color="rgb(0, 0, 0)" />'),
    ).toEqual(['rgb(0, 0, 0)'])
    expect(
      literalIconColours('<NbIcon name="x" color="var(--nb-c-primary)" />'),
    ).toEqual([])
    expect(literalIconColours('<NbIcon name="x" :color="c" />')).toEqual([])
    expect(
      literalIconColours('<NbIcon name="x" />\n<NbBadge color="red" />'),
    ).toEqual([])
  })

  it('no NbIcon in src or docs is given a literal colour', () => {
    const offenders: string[] = []
    for (const file of [
      ...files(join(ROOT, 'src')),
      ...files(join(ROOT, 'docs')),
    ]) {
      for (const colour of literalIconColours(readFileSync(file, 'utf8'))) {
        offenders.push(`${relative(ROOT, file)}: color="${colour}"`)
      }
    }
    expect(offenders).toEqual([])
  })
})
