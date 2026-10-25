import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import {
  defineComponent,
  h,
  resolveDirective,
  withDirectives,
  type Directive,
} from 'vue'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import Button from '../src/components/Button.vue'
import tooltipDirective from '@/directives/ToolTip.directive'

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

describe('Button', () => {
  const createWrapper = (props = {}, slots = {}) =>
    mount(Button, {
      props,
      slots,
      global: { stubs: { NbIcon: NbIconStub } },
    })

  it('renders as a button element by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.element.tagName.toLowerCase()).toBe('button')
  })

  it('renders as an anchor when href is provided', () => {
    const wrapper = createWrapper({ href: 'https://example.com' })
    expect(wrapper.element.tagName.toLowerCase()).toBe('a')
    expect(wrapper.attributes('href')).toBe('https://example.com')
  })

  it('renders slot content', () => {
    const wrapper = createWrapper({}, { default: 'Click me' })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applies variant class', () => {
    const wrapper = createWrapper({ variant: 'primary' })
    expect(wrapper.classes()).toContain('nb-button--primary')
  })

  it('applies all variants', () => {
    const variants = [
      'primary',
      'secondary',
      'ghost',
      'warning',
      'danger',
      'success',
      'info',
    ]
    for (const variant of variants) {
      const wrapper = createWrapper({ variant })
      expect(wrapper.classes()).toContain(`nb-button--${variant}`)
    }
  })

  it('applies size class', () => {
    const wrapper = createWrapper({ size: 'lg' })
    expect(wrapper.classes()).toContain('nb-button--lg')
  })

  it('applies default medium size class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-button--md')
  })

  // The prop was typed ESizeShort (sm|md|lg) while the SCSS implemented all
  // seven, so four valid sizes were rejected by the compiler. Pin the full
  // scale here so the type and the stylesheet cannot drift apart again.
  it.each(['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'])(
    'accepts the %s size and emits its class',
    (size) => {
      expect(createWrapper({ size }).classes()).toContain(`nb-button--${size}`)
    },
  )

  it('applies outlined class when outlined prop is true', () => {
    const wrapper = createWrapper({ outlined: true })
    expect(wrapper.classes()).toContain('nb-button--outlined')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.element.disabled).toBe(true)
  })

  it('applies loading class when loading', () => {
    const wrapper = createWrapper({ loading: true })
    expect(wrapper.classes()).toContain('nb-button--loading')
  })

  it('shows spinner when loading', () => {
    const wrapper = createWrapper({ loading: true })
    expect(wrapper.find('.nb-button__spinner').exists()).toBe(true)
  })

  it('shows icon when icon prop provided', () => {
    const wrapper = createWrapper({ icon: 'check' })
    const icon = wrapper.find('[data-testid="nb-icon"]')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-name')).toBe('check')
  })

  it('does not show icon while loading (spinner takes precedence)', () => {
    const wrapper = createWrapper({ loading: true, icon: 'check' })
    expect(wrapper.find('.nb-button__spinner').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nb-icon"]').exists()).toBe(false)
  })

  it('applies icon-only class when icon provided without slot', () => {
    const wrapper = createWrapper({ icon: 'check' })
    expect(wrapper.classes()).toContain('nb-button--icon-only')
  })

  it('does not apply icon-only class when slot content is present', () => {
    const wrapper = createWrapper({ icon: 'check' }, { default: 'Submit' })
    expect(wrapper.classes()).not.toContain('nb-button--icon-only')
  })

  it('emits click event on click', async () => {
    const wrapper = createWrapper()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = createWrapper({ disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('sets native button type', () => {
    const wrapper = createWrapper({ type: 'submit' })
    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('sets target and rel on anchor', () => {
    const wrapper = createWrapper({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener',
    })
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener')
  })

  it('renders an anchor for a string `to` when vue-router is absent', () => {
    const wrapper = createWrapper({ to: '/dashboard' })
    expect(wrapper.element.tagName.toLowerCase()).toBe('a')
    expect(wrapper.attributes('href')).toBe('/dashboard')
  })

  it('falls back to a button (no dead anchor) for an object `to` without vue-router', () => {
    const wrapper = createWrapper({ to: { name: 'home' } })
    expect(wrapper.element.tagName.toLowerCase()).toBe('button')
    expect(wrapper.attributes('href')).toBeUndefined()
  })

  it('renders a RouterLink and passes `to` through when vue-router is installed', () => {
    const RouterLink = {
      name: 'RouterLink',
      props: { to: { type: [String, Object], required: true } },
      template: '<a class="rl" :data-to="JSON.stringify(to)"><slot /></a>',
    }
    const wrapper = mount(Button, {
      props: { to: { name: 'home' } },
      global: { stubs: { NbIcon: NbIconStub }, components: { RouterLink } },
    })
    const link = wrapper.find('.rl')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-to')).toBe(JSON.stringify({ name: 'home' }))
  })
})

describe('Button as a link', () => {
  // A <button> defaults to border-box and an <a> to content-box, so an
  // icon-only button rendered as a link was 32 + 12 + 12 wide while the button
  // beside it was 32. The component has to set box-sizing itself.
  it('renders an anchor when href is set, and still marks it icon-only', () => {
    const wrapper = mount(Button, {
      props: { href: 'https://example.com', icon: 'x', size: 'sm' },
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.classes()).toContain('nb-button--icon-only')
    expect(wrapper.classes()).toContain('nb-button--sm')
  })
})

/**
 * `variant` is optional, so it must not reach the class list unguarded.
 * Interpolating it directly put a literal `nb-button--undefined` on every
 * button that did not pass one, which is a class consumers could match on by
 * accident and a confusing thing to find in devtools.
 */
describe('variant class', () => {
  it('emits no variant class when none is given', () => {
    const wrapper = mount(Button)
    const classes = wrapper.classes()
    expect(classes).toContain('nb-button')
    expect(classes.some((c) => c.includes('undefined'))).toBe(false)
  })

  it('emits the variant class when one is given', () => {
    expect(
      mount(Button, { props: { variant: 'primary' } }).classes(),
    ).toContain('nb-button--primary')
  })
})

/**
 * `variant="link"` reads as a text link: no fill, no box, the font of the
 * line it sits in, an underline on hover and focus. It is still the same
 * element choice as every other button (button, anchor, RouterLink), so it
 * keeps the keyboard and the disabled state.
 */
describe('link variant', () => {
  const linkRule = (() => {
    const path = join(__dirname, '../src/components/Button.vue')
    const { descriptor } = parse(readFileSync(path, 'utf8'))
    return descriptor.styles
      .map((s) => compileString(s.content, { url: pathToFileURL(path) }).css)
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
  })()

  /** Every declaration block whose selector list is exactly `selector`. */
  function bodiesOf(selector: string): string {
    const escaped = selector.replace(/[.\-:()[\]]/g, '\\$&')
    const re = new RegExp(`(?:^|[}\\n])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g')
    return [...linkRule.matchAll(re)].map((m) => m[1]).join('\n')
  }

  it('renders a button that emits click', async () => {
    const wrapper = mount(Button, {
      props: { variant: 'link' },
      slots: { default: 'Select' },
    })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('nb-button--link')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders an anchor for href and a RouterLink for to', () => {
    const anchor = mount(Button, {
      props: { variant: 'link', href: '/docs' },
      slots: { default: 'Docs' },
    })
    expect(anchor.element.tagName).toBe('A')
    expect(anchor.attributes('href')).toBe('/docs')

    const RouterLink = {
      name: 'RouterLink',
      props: { to: { type: [String, Object], required: true } },
      template: '<a class="rl"><slot /></a>',
    }
    const routed = mount(Button, {
      props: { variant: 'link', to: { name: 'home' } },
      slots: { default: 'Home' },
      global: { components: { RouterLink } },
    })
    expect(routed.find('.rl').exists()).toBe(true)
    expect(routed.find('.rl').classes()).toContain('nb-button--link')
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(Button, {
      props: { variant: 'link', disabled: true },
      slots: { default: 'Select' },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('has no box: no fill, no padding, no fixed height, the font of its line', () => {
    const body = bodiesOf('.nb-button--link')
    expect(body).toMatch(/background:\s*transparent/)
    expect(body).toMatch(/padding:\s*0/)
    expect(body).toMatch(/height:\s*auto/)
    expect(body).toMatch(/font-size:\s*inherit/)
    expect(body).toMatch(/font-weight:\s*inherit/)
  })

  it('is drawn in primary ink, the colour held at AA on every layer', () => {
    // inkContrast.test.ts measures ink(primary) on all four layers of both
    // themes, so reusing the expression is what carries the guarantee here.
    expect(bodiesOf('.nb-button--link')).toMatch(
      /color:\s*var\(--nb-button-link-color,\s*color-mix\(in srgb, var\(--nb-c-primary\), var\(--nb-c-ink-toward, var\(--nb-c-white\)\) var\(--nb-c-primary-ink-lift, 0%\)\)\)/,
    )
  })

  it('underlines on hover and on keyboard focus, with a focus ring', () => {
    expect(
      bodiesOf(
        '.nb-button--link:hover:not(:disabled), .nb-button--link:focus-visible',
      ),
    ).toMatch(/text-decoration:\s*underline/)
    expect(bodiesOf('.nb-button--link:focus-visible')).toMatch(
      /outline:\s*2px solid var\(--nb-c-focus-ring\)/,
    )
  })

  it('is never given the outlined border', () => {
    expect(linkRule).toMatch(
      /\.nb-button--outlined:not\(\.nb-button--ghost\):not\(\.nb-button--link\)/,
    )
  })
})

describe('Button accessible name warning', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Warnings are remembered per icon for the whole session, so every case
  // uses an icon no other case uses.
  const warnings = () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    return () =>
      spy.mock.calls.filter((call) => String(call[0]).startsWith('[NbButton]'))
  }

  it('warns once for an icon-only button with no accessible name', async () => {
    const calls = warnings()
    mount(Button, { props: { icon: 'trash' } })
    mount(Button, { props: { icon: 'trash' } })
    await flushPromises()
    expect(calls()).toHaveLength(1)
    expect(String(calls()[0][0])).toContain('icon "trash"')
  })

  it.each([
    ['aria-label', { 'aria-label': 'Delete' }],
    ['aria-labelledby', { 'aria-labelledby': 'label-id' }],
    ['title', { title: 'Delete' }],
  ])('does not warn when named with %s', async (_, attrs) => {
    const calls = warnings()
    mount(Button, { props: { icon: 'pencil' }, attrs })
    await flushPromises()
    expect(calls()).toHaveLength(0)
  })

  it('does not warn for a button with text', async () => {
    const calls = warnings()
    mount(Button, { props: { icon: 'plus' }, slots: { default: 'Add' } })
    await flushPromises()
    expect(calls()).toHaveLength(0)
  })

  it('does not warn when v-nb-tooltip names the button', async () => {
    const calls = warnings()
    const Host = defineComponent({
      render: () =>
        withDirectives(h(Button, { icon: 'gear' }), [
          [resolveDirective('nb-tooltip') as Directive, { body: 'Settings' }],
        ]),
    })
    const wrapper = mount(Host, {
      global: { plugins: [tooltipDirective] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.element.getAttribute('aria-label')).toBe('Settings')
    expect(calls()).toHaveLength(0)
    wrapper.unmount()
  })

  it('stays silent in production builds', async () => {
    const calls = warnings()
    vi.stubEnv('NODE_ENV', 'production')
    mount(Button, { props: { icon: 'bell' } })
    await flushPromises()
    vi.unstubAllEnvs()
    expect(calls()).toHaveLength(0)
  })
})
