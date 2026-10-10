import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import {
  NB_PHONE_QUERY,
  NB_PHONE_TOUCH_QUERY,
} from '../src/composables/usePhoneLayout.composable'

// The touch and phone rules cannot be seen in jsdom, which applies no media
// queries, so these read the compiled stylesheet instead. Two things are
// checked: the rule a phone needs is there, and the declarations that make a
// phone different (44px targets, 16px field text, the stacked table, the
// pinned batch bar) never appear outside the phone queries, which is what
// keeps a desktop exactly as it was.

const dir = join(__dirname, '../src/components')

interface IRule {
  media: string | null
  selector: string
  body: string
}

function rulesOf(file: string): IRule[] {
  const path = join(dir, file)
  const { descriptor } = parse(readFileSync(path, 'utf8'))
  const css = descriptor.styles
    .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
    .join('\n')
  const rules: IRule[] = []
  // Sass expanded output nests at most one @media level deep, which is all
  // this needs to walk.
  const walk = (text: string, media: string | null) => {
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open === -1) break
      const head = text.slice(i, open).trim()
      let depth = 1
      let j = open + 1
      while (depth && j < text.length) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      const inner = text.slice(open + 1, j - 1)
      if (head.startsWith('@media')) walk(inner, head.slice(6).trim())
      else if (!head.startsWith('@'))
        rules.push({ media, selector: head, body: inner })
      i = j
    }
  }
  walk(css.replace(/\/\*[\s\S]*?\*\//g, ''), null)
  return rules
}

const isPhone = (m: string | null) =>
  m === NB_PHONE_QUERY || m === NB_PHONE_TOUCH_QUERY

function find(
  rules: IRule[],
  media: string,
  selector: string,
  declaration: string,
) {
  return rules.some(
    (r) =>
      r.media === media &&
      r.selector.split(',').some((s) => s.trim() === selector) &&
      r.body.includes(declaration),
  )
}

const touched = [
  'Button.vue',
  'Switch.vue',
  'Checkbox.vue',
  'Radio.vue',
  'AccordionItem.vue',
  'Select.vue',
  'TreeNode.vue',
  'TextInput.vue',
  'NumberInput.vue',
  'Tabs.vue',
  'DataTable.vue',
  'Board.vue',
  'ReorderList.vue',
]

describe('phone rules stay behind the phone queries', () => {
  it.each(touched)('%s', (file) => {
    for (const r of rulesOf(file)) {
      if (isPhone(r.media)) continue
      expect(r.body, `${file}: ${r.selector}`).not.toMatch(
        /max\(16px|max\(44px|min-block-size: 44px|scroll-snap|position: fixed|100cqi/,
      )
      expect(r.selector, `${file}`).not.toMatch(
        /--stacked|nb-board--flat|nb-board--batching|__list--fade/,
      )
    }
  })
})

describe('touch targets on a phone touch screen', () => {
  const T = NB_PHONE_TOUCH_QUERY
  const cases: [string, string, string][] = [
    ['Button.vue', '.nb-button--sm::after', 'inset-block'],
    ['Button.vue', '.nb-button--xs::after', 'inset-inline'],
    ['Button.vue', ':where(.nb-button--xxs', 'position: relative'],
    ['Switch.vue', '.nb-switch-wrapper::after', 'inset-block'],
    ['Switch.vue', '.nb-switch', 'min-block-size: 44px'],
    ['Checkbox.vue', '.nb-checkbox', 'padding-block: 12px'],
    ['Radio.vue', '.nb-radio__option', 'padding-block: 12px'],
    ['AccordionItem.vue', '.nb-accordion-item__header', 'max(44px'],
    ['AccordionItem.vue', '.nb-accordion-item__heading--aside', 'max(44px'],
    ['Select.vue', '.nb-select__option', 'min-block-size: 44px'],
    ['TreeNode.vue', '.nb-tree-node__toggle::after', 'inset-block'],
    ['ReorderList.vue', '.nb-reorder-list__grab::after', 'inset-block'],
    ['Tabs.vue', '.nb-tabs__tab', 'min-block-size: 44px'],
  ]
  it.each(cases)('%s %s', (file, selector, declaration) => {
    const rules = rulesOf(file)
    const hit = rules.some(
      (r) =>
        r.media === T &&
        r.selector.split(',').some((s) => s.trim().startsWith(selector)) &&
        r.body.includes(declaration),
    )
    expect(hit).toBe(true)
  })
})

describe('16px field text on a phone touch screen', () => {
  const cases: [string, string][] = [
    ['TextInput.vue', '.nb-text-input__field'],
    ['TextInput.vue', '.nb-text-input__mirror'],
    ['TextInput.vue', '.nb-text-input--fluid .nb-text-input__field'],
    ['NumberInput.vue', '.nb-number-input__field'],
    ['NumberInput.vue', '.nb-number-input--fluid .nb-number-input__field'],
    ['Select.vue', '.nb-select__create-input'],
    ['Select.vue', '.nb-select__value'],
  ]
  it.each(cases)('%s %s', (file, selector) => {
    expect(
      find(rulesOf(file), NB_PHONE_TOUCH_QUERY, selector, 'max(16px'),
    ).toBe(true)
  })
})

describe('phone layouts', () => {
  it('lets the Tabs bar scroll, and draws the line rule inside it', () => {
    const rules = rulesOf('Tabs.vue')
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-tabs__list', 'overflow-x: auto'),
    ).toBe(true)
    expect(
      find(
        rules,
        NB_PHONE_QUERY,
        '.nb-tabs__list',
        'scroll-snap-type: x proximity',
      ),
    ).toBe(true)
    expect(
      find(
        rules,
        NB_PHONE_QUERY,
        '.nb-tabs--line .nb-tabs__list',
        'inset 0 -2px',
      ),
    ).toBe(true)
  })

  it('touch-action: none on the ReorderList grip, which a mouse ignores', () => {
    const grab = rulesOf('ReorderList.vue').find(
      (r) => r.media === null && r.selector === '.nb-reorder-list__grab',
    )
    expect(grab?.body).toContain('touch-action: none')
  })

  it('snaps Board columns to a peeking track, overriding the inline style', () => {
    const rules = rulesOf('Board.vue')
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-board', 'container-type: inline-size'),
    ).toBe(true)
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-board', 'scroll-snap-type: x mandatory'),
    ).toBe(true)
    expect(
      find(
        rules,
        NB_PHONE_QUERY,
        '.nb-board__grid',
        'min(100cqi - 40px, 22rem))) !important',
      ),
    ).toBe(true)
    expect(
      find(
        rules,
        NB_PHONE_QUERY,
        '.nb-board--flat .nb-board__cell',
        'overflow-y: auto',
      ),
    ).toBe(true)
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-board__batch', 'position: fixed'),
    ).toBe(true)
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-board__batch', 'safe-area-inset-bottom'),
    ).toBe(true)
    expect(
      find(rules, NB_PHONE_QUERY, '.nb-board__lane-header', 'position: sticky'),
    ).toBe(true)
  })

  it('stacks a DataTable only inside the phone query', () => {
    const rules = rulesOf('DataTable.vue')
    expect(
      rules.some(
        (r) =>
          r.media === NB_PHONE_QUERY &&
          r.selector.includes('.nb-data-table--stacked .nb-data-table__head') &&
          r.body.includes('display: block'),
      ),
    ).toBe(true)
    expect(
      rules.some(
        (r) =>
          r.media === NB_PHONE_QUERY &&
          r.selector.includes('.nb-data-table__td--field[data-label]') &&
          r.body.includes('attr(data-label)'),
      ),
    ).toBe(true)
  })
})
