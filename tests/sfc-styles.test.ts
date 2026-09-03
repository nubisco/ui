import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'

// Guards the failure mode that shipped a broken port label in 3.0.1: CSS was
// written above <template>, outside every SFC block, where the compiler drops
// it silently. Nothing in the component suite noticed, because those tests
// assert on rendered markup and never on the styles that actually get built.
// The lesson is that a check has to be able to tell success from silence.

const dir = join(__dirname, '../src/components')
const sfcs = readdirSync(dir).filter((f) => f.endsWith('.vue'))

describe('SFC styles reach the build', () => {
  it.each(sfcs)('%s has no content outside its blocks', (file) => {
    const src = readFileSync(join(dir, file), 'utf8')
    const { descriptor, errors } = parse(src)
    expect(errors).toEqual([])

    const blocks = [
      descriptor.template,
      descriptor.script,
      descriptor.scriptSetup,
      ...descriptor.styles,
      ...descriptor.customBlocks,
    ].flatMap((b) => (b ? [b] : []))

    // Mark each block's full extent, tags included. A block's content range
    // starts right after its open tag's '>' and ends right at its close tag's
    // '<', so the tags can be recovered from the offsets without pattern
    // matching. Scanning back for the open '<' respects quotes, because an
    // attribute like generic="T extends Record<string, unknown>" contains
    // angle brackets that naive matching would mistake for a tag boundary.
    const covered = new Array<boolean>(src.length).fill(false)
    for (const b of blocks) {
      let i = b.loc.start.offset - 1
      let quote = ''
      for (; i >= 0; i--) {
        const c = src[i]
        if (quote) {
          if (c === quote) quote = ''
        } else if (c === '"' || c === "'") {
          quote = c
        } else if (c === '<') {
          break
        }
      }
      const close = src.indexOf('>', b.loc.end.offset)
      expect(i, `${file}: cannot locate block open tag`).toBeGreaterThan(-1)
      expect(close, `${file}: cannot locate block close tag`).toBeGreaterThan(
        -1,
      )
      for (let j = i; j <= close; j++) covered[j] = true
    }

    // HTML comments between blocks are fine: they read as comments and nobody
    // mistakes one for a live rule. Discarded CSS is the opposite, it reads as
    // code and behaves as nothing.
    let gaps = ''
    for (let j = 0; j < src.length; j++) if (!covered[j]) gaps += src[j]
    // An empty block (Form.vue has an empty <style>) is dropped from the
    // descriptor entirely, so it never appears in `blocks`. Nothing was lost:
    // there was nothing in it to lose.
    const orphaned = gaps
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(template|script|style)\b[^>]*>\s*<\/\1>/g, '')
      .trim()

    expect(orphaned, `${file} has text outside every SFC block`).toBe('')
  })
})

describe('BlueprintCard port label', () => {
  const src = readFileSync(join(dir, 'BlueprintCard.vue'), 'utf8')
  const { descriptor } = parse(src)
  const css = compileString(
    descriptor.styles.map((s) => s.content).join('\n'),
    {
      syntax: 'scss',
    },
  ).css

  // The label rule is the one that went missing in 3.0.1, so assert on the
  // compiled OUTPUT rather than on the source. These assert the property that
  // has to hold in any port structure, not the declarations of one of them:
  // the rule must survive compilation, and it must not be empty.
  it('reaches the compiled stylesheet', () => {
    const rule = css
      .split('}')
      .find((r) => r.includes('.nb-blueprint-card__port-label'))
    expect(
      rule,
      'no .nb-blueprint-card__port-label rule in compiled CSS',
    ).toBeTruthy()
  })

  it('actually styles the label', () => {
    // A rule that exists but declares nothing is the same failure wearing a
    // different hat: the label would still render unstyled.
    const rules = css
      .split('}')
      .filter((r) => r.includes('.nb-blueprint-card__port-label'))
      .map((r) => r.slice(r.indexOf('{') + 1).trim())
      .filter(Boolean)
    expect(
      rules.length,
      'label rule present but declares nothing',
    ).toBeGreaterThan(0)
  })
})
