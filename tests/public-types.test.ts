/**
 * A type a consumer has to name must be reachable from the package.
 *
 * `IBoardNestEvent` was declared, documented and emitted, and was not in
 * `main.ts`. The component built, its own tests passed, and the dist
 * verifiers passed, because nothing they check is about the entry point. The
 * first anybody knew was a product writing `@nest="onNest"` and being unable
 * to type its own handler.
 *
 * It started with event payloads, the one kind a product cannot work around,
 * and left 27 modules of props and helper types for later because asserting
 * them all at once would have failed on arrival. Those exports landed, so the
 * guard now covers everything a component module declares: a consumer typing
 * a wrapper around any component imports from `@nubisco/ui`, never from a
 * deep path.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = join(import.meta.dirname, '../src')
const DIRS = ['components', 'components/Charts']
const main = readFileSync(join(SRC, 'main.ts'), 'utf8')

/** What `main.ts` re-exports, as a type or a value, from one `.d` module. */
function reExportedFrom(modulePath: string): Set<string> {
  const escaped = modulePath.replace(/[./]/g, (c) => `\\${c}`)
  const names = new Set<string>()
  for (const block of main.matchAll(
    new RegExp(`export (?:type )?\\{([^}]*)\\} from '${escaped}'`, 'g'),
  )) {
    for (const raw of block[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0]
      if (name) names.add(name)
    }
  }
  return names
}

/** Every name a `.d.ts` module exports, declared inline or listed at the end. */
function declaredIn(source: string): string[] {
  const names = new Set<string>()
  for (const m of source.matchAll(
    /^export (?:interface|type|enum|const enum) ([A-Za-z0-9_]+)/gm,
  )) {
    names.add(m[1])
  }
  // `A as NbA` lists a second spelling of A. The public name is A: that is
  // what the docs import from the package, so A is what has to be reachable.
  for (const m of source.matchAll(/^export (?:type )?\{([^}]*)\}\s*$/gm)) {
    for (const raw of m[1].split(',')) {
      const name = raw.trim().split(/\s+as\s+/)[0]
      if (name) names.add(name)
    }
  }
  return [...names]
}

function modules(): { file: string; modulePath: string; source: string }[] {
  return DIRS.flatMap((dir) =>
    readdirSync(join(SRC, dir))
      .filter((f) => f.endsWith('.d.ts'))
      .map((f) => ({
        file: `${dir}/${f}`,
        modulePath: `./${relative(SRC, join(SRC, dir, f)).replace(/\.d\.ts$/, '.d')}`,
        source: readFileSync(join(SRC, dir, f), 'utf8'),
      })),
  )
}

describe('public types', () => {
  it('exports every event payload from the package entry point', () => {
    const unreachable: string[] = []
    for (const { file, modulePath, source } of modules()) {
      const exported = reExportedFrom(modulePath)
      for (const name of declaredIn(source).filter((n) =>
        n.endsWith('Event'),
      )) {
        if (!exported.has(name)) unreachable.push(`${file}: ${name}`)
      }
    }
    expect(unreachable).toEqual([])
  })

  it('exports every type and enum a component module declares', () => {
    const unreachable: string[] = []
    for (const { file, modulePath, source } of modules()) {
      const exported = reExportedFrom(modulePath)
      for (const name of declaredIn(source)) {
        if (!exported.has(name)) unreachable.push(`${file}: ${name}`)
      }
    }
    expect(unreachable).toEqual([])
  })

  it('reaches a module that has a .d file through it, not the .vue', () => {
    // A type re-exported from a `.vue` file is a second route to the same
    // name, and the two collide the moment the `.d` route is added. A
    // component that declares its types in the `.vue` alone is fine.
    const withDeclarations = new Set(
      modules().map(({ modulePath }) => modulePath.replace(/\.d$/, '.vue')),
    )
    const viaVue = [
      ...main.matchAll(
        /export type \{[^}]*\} from '(\.\/components\/[^']*\.vue)'/g,
      ),
    ]
      .filter((m) => withDeclarations.has(m[1]))
      .map((m) => m[0])
    expect(viaVue).toEqual([])
  })
})
