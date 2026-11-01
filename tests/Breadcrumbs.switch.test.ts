import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import Breadcrumbs from '../src/components/Breadcrumbs.vue'
import type { IBreadcrumbItem } from '../src/components/Breadcrumbs.d'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'

enableAutoUnmount(afterEach)

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = () => {}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
})

const companies = [
  { label: 'Acme', to: '/c/acme', value: 'acme' },
  { label: 'Globex', to: '/c/globex', value: 'globex' },
  { label: "Côte d'Or", to: '/c/cote', value: 'cote' },
]

const items = (extra: Partial<IBreadcrumbItem> = {}): IBreadcrumbItem[] => [
  { label: 'Home', to: '/' },
  { label: 'Acme', to: '/c/acme', options: companies, ...extra },
  { label: 'Clients' },
]

const mountTrail = (list: IBreadcrumbItem[], props = {}, router?: unknown) =>
  mount(Breadcrumbs, {
    props: { items: list, ...props },
    global: {
      stubs: { Teleport: { template: '<div><slot /></div>' } },
      config: { globalProperties: router ? { $router: router } : {} },
    },
    attachTo: document.body,
  })

const chevron = (view: ReturnType<typeof mountTrail>, nth = 0) =>
  view.findAll('.nb-breadcrumbs__switch')[nth]

describe('Breadcrumbs switcher', () => {
  it('adds no chevron to a crumb without options', () => {
    const view = mountTrail([{ label: 'Home', to: '/' }, { label: 'Here' }])
    expect(view.find('.nb-breadcrumbs__switch').exists()).toBe(false)
    expect(view.find('.nb-select').exists()).toBe(false)
  })

  it('puts a named chevron button after the label, beside the link', () => {
    const view = mountTrail(items())
    const button = chevron(view)
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Switch Acme')
    expect(button.attributes('aria-haspopup')).toBe('listbox')
    expect(button.attributes('aria-expanded')).toBe('false')
    // The label still links, and is not the chevron
    expect(view.find('a[href="/c/acme"]').exists()).toBe(true)
  })

  it('takes the accessible name from switchLabel', () => {
    const view = mountTrail(items({ switchLabel: 'Trocar empresa' }))
    expect(chevron(view).attributes('aria-label')).toBe('Trocar empresa')
  })

  it('works on the current crumb too', () => {
    const view = mountTrail([
      { label: 'Home', to: '/' },
      { label: 'Acme', options: companies },
    ])
    expect(view.find('[aria-current="page"]').text()).toBe('Acme')
    expect(chevron(view).exists()).toBe(true)
  })

  it('opens a searchable list under the crumb, with a check on the current option', async () => {
    const view = mountTrail(items())
    await chevron(view).trigger('click')
    expect(chevron(view).attributes('aria-expanded')).toBe('true')
    expect(view.find('.nb-select__search-input').exists()).toBe(true)
    const rows = view.findAll('.nb-select__option')
    expect(rows.map((r) => r.text())).toEqual(['Acme', 'Globex', "Côte d'Or"])
    expect(
      view.findAll('.nb-select__option--selected').map((r) => r.text()),
    ).toEqual(['Acme'])
    // A check, not a filled row
    expect(view.find('.nb-select__dropdown--check').exists()).toBe(true)
    expect(
      view
        .find('.nb-select__option--selected .nb-select__option-check svg')
        .exists(),
    ).toBe(true)
  })

  it('marks the current option by value when the label does not match', async () => {
    const view = mountTrail(items({ label: 'Acme Inc.', value: 'globex' }))
    await chevron(view).trigger('click')
    expect(
      view.findAll('.nb-select__option--selected').map((r) => r.text()),
    ).toEqual(['Globex'])
  })

  it('narrows as you type, ignoring accents, and uses the labels you give', async () => {
    const view = mountTrail(
      items({ searchPlaceholder: 'Find companies', noResultsLabel: 'None' }),
    )
    await chevron(view).trigger('click')
    const input = view.find('.nb-select__search-input')
    expect(input.attributes('placeholder')).toBe('Find companies')
    await input.setValue('cote')
    expect(view.findAll('.nb-select__option').map((r) => r.text())).toEqual([
      "Côte d'Or",
    ])
    await input.setValue('zzz')
    expect(view.find('.nb-select__empty').text()).toBe('None')
  })

  it('goes to the picked option through the router, and emits switch', async () => {
    const push = vi.fn()
    const list = items()
    const view = mountTrail(list, {}, { push })
    await chevron(view).trigger('click')
    await view.findAll('.nb-select__option')[1].trigger('click')
    expect(push).toHaveBeenCalledWith('/c/globex')
    expect(view.emitted('switch')).toEqual([[list[1], companies[1], 1]])
    // The list closed
    expect(view.find('.nb-select__dropdown').exists()).toBe(false)
  })

  it('picks the first match with Enter', async () => {
    const push = vi.fn()
    const view = mountTrail(items(), {}, { push })
    await chevron(view).trigger('click')
    const input = view.find('.nb-select__search-input')
    await input.setValue('glo')
    await input.trigger('keydown', { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/c/globex')
  })

  it('does nothing when the current option is picked again', async () => {
    const push = vi.fn()
    const view = mountTrail(items(), {}, { push })
    await chevron(view).trigger('click')
    await view.findAll('.nb-select__option')[0].trigger('click')
    expect(push).not.toHaveBeenCalled()
    expect(view.emitted('switch')).toBeUndefined()
  })

  it('only emits switch for an option that has nowhere to go', async () => {
    const view = mountTrail(
      items({
        options: [
          { label: 'Acme', value: 1 },
          { label: 'Other', value: 2 },
        ],
      }),
    )
    await chevron(view).trigger('click')
    await view.findAll('.nb-select__option')[1].trigger('click')
    expect(view.emitted('switch')).toHaveLength(1)
  })

  it('keeps the switcher on the lone crumb on a phone', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === NB_PHONE_QUERY,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const view = mountTrail(
      [
        { label: 'Home', to: '/' },
        { label: 'Acme', options: companies },
      ],
      { collapse: 'phone' },
    )
    expect(view.classes()).toContain('nb-breadcrumbs--collapsed')
    // Last crumb carries the chevron, and it still opens
    const last = view.findAll('.nb-breadcrumbs__item')[1]
    expect(last.find('.nb-breadcrumbs__switch').exists()).toBe(true)
    await last.find('.nb-breadcrumbs__switch').trigger('click')
    expect(view.find('.nb-select__search-input').exists()).toBe(true)
  })

  it('draws no picture anywhere unless one is given', async () => {
    const view = mountTrail(items())
    expect(view.find('.nb-avatar').exists()).toBe(false)
    await chevron(view).trigger('click')
    expect(view.find('.nb-breadcrumbs__option').exists()).toBe(false)
  })

  it('draws a crumb its picture, beside a label that still links', () => {
    const view = mountTrail(items({ picture: '/logo/acme.png' }))
    const crumb = view.findAll('.nb-breadcrumbs__item')[1]
    expect(crumb.find('img.nb-avatar__picture').attributes('src')).toBe(
      '/logo/acme.png',
    )
    expect(crumb.find('a[href="/c/acme"]').text()).toBe('Acme')
    // Named by the label beside it, so it is not announced again
    expect(crumb.find('.nb-avatar').attributes('role')).toBeUndefined()
  })

  it('draws initials for a null picture', () => {
    const view = mountTrail(items({ picture: null }))
    const crumb = view.findAll('.nb-breadcrumbs__item')[1]
    expect(crumb.find('img').exists()).toBe(false)
    expect(crumb.find('.nb-avatar__initials').text()).toBe('A')
  })

  it('draws the options their pictures, and initials for a null one', async () => {
    const view = mountTrail(
      items({
        options: [
          { ...companies[0], picture: '/logo/acme.png' },
          { ...companies[1], picture: null },
          companies[2],
        ],
      }),
    )
    await chevron(view).trigger('click')
    const rows = view.findAll('.nb-select__option')
    expect(
      rows.map((r) => r.find('.nb-breadcrumbs__option-label').text()),
    ).toEqual(['Acme', 'Globex', "Côte d'Or"])
    expect(rows[0].find('img').attributes('src')).toBe('/logo/acme.png')
    expect(rows[1].find('.nb-avatar__initials').exists()).toBe(true)
    expect(rows[2].find('.nb-avatar').exists()).toBe(false)
  })
})
