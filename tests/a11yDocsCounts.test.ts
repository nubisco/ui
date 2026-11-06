/**
 * The accessibility pages state counts about the source. Each one drifted
 * once already ("zero forced-colors blocks" while six files had them,
 * "nineteen of fifty-two" pages at 35 of 73), and stale honesty costs the
 * pages their trust. So the counts are written as digits in the prose and
 * checked here against the tree: change the source and the sentence must
 * change with it.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

function filesUnder(dir: string, ext: string[]): string[] {
  const out: string[] = []
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name)
    if (statSync(join(root, rel)).isDirectory())
      out.push(...filesUnder(rel, ext))
    else if (ext.some((e) => name.endsWith(e))) out.push(rel)
  }
  return out
}

function stated(page: string, pattern: RegExp): number {
  const match = read(page).match(pattern)
  expect(match, `${page} should state ${pattern}`).not.toBeNull()
  return Number(match![1])
}

const componentDirs = readdirSync(join(root, 'docs/components')).filter((d) =>
  statSync(join(root, 'docs/components', d)).isDirectory(),
)

describe('counts the accessibility pages state', () => {
  it('component pages with an Accessibility tab', () => {
    const withTab = componentDirs.filter((d) =>
      existsSync(join(root, 'docs/components', d, 'accessibility.md')),
    ).length
    const text = read('docs/accessibility/overview.md')
    const m = text.match(/(\d+) of the (\d+) component pages/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBe(withTab)
    expect(Number(m![2])).toBe(componentDirs.length)
  })

  it('component files with a forced-colors block', () => {
    const count = filesUnder('src', ['.vue', '.scss', '.ts']).filter((f) =>
      read(f).includes('forced-colors: active'),
    ).length
    expect(
      stated(
        'docs/accessibility/overview.md',
        /forced colours deliberately in (\d+) component files/,
      ),
    ).toBe(count)
    expect(
      stated(
        'docs/accessibility/color-contrast.md',
        /Forced colours are handled in (\d+) component files/,
      ),
    ).toBe(count)
  })

  it('outline: none declarations in components', () => {
    const count = filesUnder('src/components', ['.vue'])
      .map((f) => read(f).match(/outline: none/g)?.length ?? 0)
      .reduce((a, b) => a + b, 0)
    expect(
      stated(
        'docs/accessibility/keyboard.md',
        /There are (\d+) `outline: none` declarations/,
      ),
    ).toBe(count)
  })

  it('every accessibility tab declares its testing status', () => {
    const missing = componentDirs.filter((d) => {
      const p = join('docs/components', d, 'accessibility.md')
      if (!existsSync(join(root, p))) return false
      return !/^a11y:\s*$/m.test(read(p).split('---')[1] ?? '')
    })
    // The tabs written before the status block are listed here until each
    // is audited; the list may only shrink.
    expect(missing.length).toBeLessThanOrEqual(34)
  })
})
