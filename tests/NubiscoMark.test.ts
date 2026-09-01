import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import NubiscoMark from '../src/components/NubiscoMark.vue'

const ROOT = resolve(__dirname, '..')
const ASSET = resolve(ROOT, 'src/assets/nubisco-mark.svg')
const COMPONENT = resolve(ROOT, 'src/components/NubiscoMark.vue')

function artwork(source: string) {
  return {
    paths: [...source.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]),
    stops: [...source.matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]),
    transforms: [...source.matchAll(/gradientTransform="([^"]+)"/g)].map(
      (m) => m[1],
    ),
  }
}

describe('NubiscoMark', () => {
  it('renders at 20px by default', () => {
    const wrapper = mount(NubiscoMark)
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('20px')
    expect(svg.attributes('height')).toBe('20px')
    expect(svg.attributes('viewBox')).toBe('0 0 320 320')
  })

  it('takes a numeric size as pixels and a string size verbatim', () => {
    expect(
      mount(NubiscoMark, { props: { size: 13 } })
        .find('svg')
        .attributes('width'),
    ).toBe('13px')
    expect(
      mount(NubiscoMark, { props: { size: '1.5rem' } })
        .find('svg')
        .attributes('width'),
    ).toBe('1.5rem')
  })

  it('is hidden from assistive technology without a title', () => {
    const svg = mount(NubiscoMark).find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('focusable')).toBe('false')
    expect(svg.attributes('role')).toBeUndefined()
    expect(svg.find('title').exists()).toBe(false)
  })

  it('is named for assistive technology with a title', () => {
    const wrapper = mount(NubiscoMark, { props: { title: 'Nubisco' } })
    const svg = wrapper.find('svg')
    const title = svg.find('title')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-hidden')).toBeUndefined()
    expect(title.text()).toBe('Nubisco')
    expect(svg.attributes('aria-labelledby')).toBe(title.attributes('id'))
  })

  it('scopes gradient ids per instance so several marks do not collide', () => {
    const host = defineComponent({
      components: { NubiscoMark },
      template: '<div><NubiscoMark /><NubiscoMark /></div>',
    })
    const wrapper = mount(host)
    const marks = wrapper.findAll('svg')
    expect(marks.length).toBe(2)
    const ids = wrapper
      .findAll('linearGradient')
      .map((node) => node.attributes('id'))
    expect(new Set(ids).size).toBe(ids.length)
    for (const mark of marks) {
      const own = new Set(
        [...mark.element.querySelectorAll('linearGradient')].map((n) => n.id),
      )
      for (const painted of mark.element.querySelectorAll('[fill^="url("]')) {
        expect(
          own.has(String(painted.getAttribute('fill')?.slice(5, -1))),
        ).toBe(true)
      }
    }
  })

  // The component and the shipped file are two renderings of one mark. This is
  // what stops them drifting apart, which is the whole point of shipping both.
  it('draws exactly the artwork of the shipped svg asset', () => {
    const asset = artwork(readFileSync(ASSET, 'utf8'))
    const component = artwork(readFileSync(COMPONENT, 'utf8'))
    expect(asset.paths.length).toBeGreaterThan(0)
    expect(component.paths).toEqual(asset.paths)
    expect(component.stops).toEqual(asset.stops)
    expect(component.transforms).toEqual(asset.transforms)
  })

  it('ships an asset with no inner titles, which browsers show as tooltips', () => {
    const asset = readFileSync(ASSET, 'utf8')
    expect(asset).toContain('viewBox="0 0 320 320"')
    expect(asset).not.toContain('<title>')
  })
})
