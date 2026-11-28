import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'

/*
 * Filters in a table's #search on a phone. The fields shared one row about
 * 350px wide, and three of them were cut to about 110px each. The fix stacks
 * them, and it has to live inside the phone query and nowhere else, so a
 * desktop keeps every pixel. jsdom has no layout and no media queries, so
 * this reads the compiled stylesheet: what the rule does, and where it sits.
 */
const css = (() => {
  const path = join(__dirname, '../src/components/DataTable.vue')
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  return descriptor.styles
    .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
})()

/** Every rule as its selector, body and the at-rule it sits in (or null). */
function rulesOf(source: string) {
  const out: { selector: string; body: string; media: string | null }[] = []
  const walk = (text: string, media: string | null) => {
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open < 0) return
      const head = text.slice(i, open).trim()
      let depth = 1
      let j = open + 1
      while (depth > 0 && j < text.length) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      const inner = text.slice(open + 1, j - 1)
      if (head.startsWith('@media')) walk(inner, head)
      else out.push({ selector: head, body: inner, media })
      i = j
    }
  }
  walk(source, null)
  return out
}

const rules = rulesOf(css)
const START = '.nb-data-table__toolbar-tools--search :deep(.nb-toolbar__start)'
const phoneQuery = rules.find((r) =>
  r.selector.startsWith('.nb-data-table.nb-data-table--stacked'),
)?.media

describe('NbDataTable filters on a phone', () => {
  it('stacks the fields in #search, each the full width', () => {
    const start = rules.find((r) => r.selector === START)
    expect(start).toBeDefined()
    expect(start!.body).toMatch(/flex-direction:\s*column/)
    expect(start!.body).toMatch(/flex-basis:\s*100%/)
    expect(start!.body).toMatch(/gap:\s*var\(--nb-spacing-8\)/)
    const fields = rules.find((r) => r.selector === `${START} > *`)
    expect(fields?.body).toMatch(/width:\s*100%/)
  })

  it('only inside the phone query, the one stack-on-phone uses', () => {
    expect(phoneQuery).toBeTruthy()
    const touching = rules.filter((r) =>
      r.selector.includes('.nb-data-table__toolbar-tools--search'),
    )
    expect(touching.length).toBeGreaterThan(0)
    for (const rule of touching) expect(rule.media).toBe(phoneQuery)
  })
})
