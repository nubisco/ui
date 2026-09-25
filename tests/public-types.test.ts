/**
 * A type a consumer has to name must be reachable from the package.
 *
 * `IBoardNestEvent` was declared, documented and emitted, and was not in
 * `main.ts`. The component built, its own tests passed, and the dist
 * verifiers passed, because nothing they check is about the entry point. The
 * first anybody knew was a product writing `@nest="onNest"` and being unable
 * to type its own handler.
 *
 * Scoped to event payloads on purpose. Twenty-four component modules declare
 * props types that main.ts does not re-export, which is a real gap and a
 * separate piece of work: asserting the whole surface here would fail on all
 * of them and get skipped. An event type is the one a product CANNOT work
 * around, because it is the argument of a handler the library is calling.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const COMPONENTS = join(import.meta.dirname, '../src/components')
const main = readFileSync(join(import.meta.dirname, '../src/main.ts'), 'utf8')

/** What `main.ts` re-exports from one component's `.d` module. */
function reExportedFrom(module: string): Set<string> {
  const block = main.match(
    new RegExp(`export type \\{([^}]*)\\} from '\\./components/${module}'`),
  )
  if (!block) return new Set()
  return new Set(
    block[1]
      .split(',')
      .map((name) => name.trim().split(' as ')[0])
      .filter(Boolean),
  )
}

describe('public types', () => {
  it('exports every event payload from the package entry point', () => {
    const unreachable: string[] = []

    for (const file of readdirSync(COMPONENTS).filter((f) =>
      f.endsWith('.d.ts'),
    )) {
      const source = readFileSync(join(COMPONENTS, file), 'utf8')
      const events = [
        ...source.matchAll(
          /^(?:export )?(?:interface|type)\s+([A-Z][A-Za-z0-9_]*Event)/gm,
        ),
      ].map((m) => m[1])
      if (events.length === 0) continue

      const exported = reExportedFrom(file.replace('.d.ts', '.d'))
      for (const name of events) {
        if (!exported.has(name)) unreachable.push(`${file}: ${name}`)
      }
    }

    expect(unreachable).toEqual([])
  })
})
