import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import PageHeader from '../src/components/PageHeader.vue'
import Button from '../src/components/Button.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

function warningsAbout(spy: ReturnType<typeof vi.spyOn>, text: string) {
  return spy.mock.calls.filter((c: unknown[]) => String(c[0]).includes(text))
}

describe('NbPageHeader', () => {
  it('renders the title as the one h1, inside a header', () => {
    const w = mount(PageHeader, { props: { title: 'Quarterly plan' } })
    expect(w.element.tagName).toBe('HEADER')
    const h1s = w.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0].text()).toBe('Quarterly plan')
  })

  it('renders the eyebrow, status, description and facts in reading order', () => {
    const w = mount(PageHeader, {
      props: { title: 'Plan' },
      slots: {
        eyebrow: '<span class="crumb">Part of Roadmap</span>',
        status: '<span class="badge">On track</span>',
        description: '<p>Why it matters.</p>',
        facts: '<dl class="facts"></dl>',
      },
    })
    const order = Array.from(w.element.children).map((el) => el.className)
    expect(order).toEqual([
      'nb-page-header__eyebrow',
      'nb-page-header__title-row',
      'nb-page-header__description',
      'nb-page-header__facts',
    ])
    expect(w.find('.nb-page-header__status .badge').exists()).toBe(true)
  })

  it('omits the regions nobody fills', () => {
    const w = mount(PageHeader, { props: { title: 'Plan' } })
    expect(w.find('.nb-page-header__eyebrow').exists()).toBe(false)
    expect(w.find('.nb-page-header__status').exists()).toBe(false)
    expect(w.find('.nb-page-header__actions').exists()).toBe(false)
    expect(w.find('.nb-page-header__facts').exists()).toBe(false)
  })

  it('renders actions through an action group that folds on a phone', () => {
    const w = mount(PageHeader, {
      props: {
        title: 'Plan',
        actions: [
          {
            id: 'edit',
            label: 'Edit',
            icon: 'pencil-simple',
            priority: 'primary',
          },
          { id: 'archive', label: 'Archive', icon: 'archive' },
        ],
      },
    })
    const group = w.findComponent({ name: 'ActionGroup' })
    expect(group.exists()).toBe(true)
    expect(group.props('overflow')).toBe('phone')
  })

  it('is sticky only when asked', () => {
    expect(
      mount(PageHeader, { props: { title: 'A' } }).classes(),
    ).not.toContain('nb-page-header--sticky')
    expect(
      mount(PageHeader, { props: { title: 'A', sticky: true } }).classes(),
    ).toContain('nb-page-header--sticky')
  })

  it('warns when the status slot holds more than one element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(PageHeader, {
      props: { title: 'Plan' },
      slots: { status: '<span>On track</span><span>Archived</span>' },
    })
    expect(warningsAbout(warn, 'status slot')).toHaveLength(1)
  })

  it('does not warn for one badge', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(PageHeader, {
      props: { title: 'Plan' },
      slots: { status: '<span>On track</span>' },
    })
    expect(warningsAbout(warn, 'status slot')).toHaveLength(0)
  })

  it('warns when two filled primaries share its actions', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(
      defineComponent({
        components: { PageHeader, Button },
        template: `
          <PageHeader title="Plan">
            <template #actions>
              <Button variant="primary">Edit</Button>
              <Button variant="primary">Share</Button>
            </template>
          </PageHeader>`,
      }),
    )
    await nextTick()
    const calls = warningsAbout(warn, 'filled primary buttons')
    expect(calls).toHaveLength(1)
    expect(String(calls[0][0])).toContain('[NbPageHeader]')
  })
})
