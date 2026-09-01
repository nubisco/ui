import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import NubiscoMark from '../src/components/NubiscoMark.vue'
import NubiscoPlatformMark from '../src/components/NubiscoPlatformMark.vue'

const ROOT = resolve(__dirname, '..')

// The corporate mark and the Nubisco Platform product mark are two different
// drawings with the same contract, so every behaviour here is asserted of both.
const MARKS = [
  {
    name: 'NubiscoMark',
    component: NubiscoMark,
    idPrefix: 'nb-nubisco-mark-',
    asset: resolve(ROOT, 'src/assets/nubisco-mark.svg'),
    source: resolve(ROOT, 'src/components/NubiscoMark.vue'),
  },
  {
    name: 'NubiscoPlatformMark',
    component: NubiscoPlatformMark,
    idPrefix: 'nb-nubisco-platform-mark-',
    asset: resolve(ROOT, 'src/assets/nubisco-platform-mark.svg'),
    source: resolve(ROOT, 'src/components/NubiscoPlatformMark.vue'),
  },
]

function artwork(source: string) {
  return {
    paths: [...source.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]),
    stops: [...source.matchAll(/stop-color="([^"]+)"/g)].map((m) => m[1]),
    transforms: [...source.matchAll(/gradientTransform="([^"]+)"/g)].map(
      (m) => m[1],
    ),
  }
}

describe.each(MARKS)(
  '$name',
  ({ component: NubiscoMark, idPrefix, asset: ASSET, source: COMPONENT }) => {
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
      for (const id of ids) expect(id).toMatch(new RegExp(`^${idPrefix}`))
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

    // The source assets carry descriptive <title>s on their gradients and paths
    // ("Left Leg Gradient", "main"). A browser renders those as hover tooltips,
    // so the inlined copy must not keep them: the lockup is a signature, and it
    // has no hover behaviour.
    it('renders no artwork titles, which browsers show as tooltips', () => {
      expect(mount(NubiscoMark).findAll('title').length).toBe(0)
      expect(
        mount(NubiscoMark, { props: { title: 'Nubisco' } }).findAll('title')
          .length,
      ).toBe(1)
    })

    it('ships a square asset on the same viewBox', () => {
      expect(readFileSync(ASSET, 'utf8')).toContain('viewBox="0 0 320 320"')
    })
  },
)

describe('the two marks', () => {
  it('are different artwork, not one drawing shipped twice', () => {
    const stops = (file: string) =>
      [...readFileSync(file, 'utf8').matchAll(/stop-color="([^"]+)"/g)].map(
        (m) => m[1],
      )
    const corporate = stops(MARKS[0].asset)
    const platform = stops(MARKS[1].asset)
    expect(corporate.length).toBeGreaterThan(0)
    expect(platform.length).toBeGreaterThan(0)
    expect(platform).not.toEqual(corporate)
  })
})
