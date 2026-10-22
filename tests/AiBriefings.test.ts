import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import NbAiProvider from '../src/components/AiProvider.vue'
import NbAiUsage from '../src/components/AiUsage.vue'
import NbBriefing from '../src/components/Briefing.vue'
import NbBriefingDestination from '../src/components/BriefingDestination.vue'

enableAutoUnmount(afterEach)

describe('NbAiProvider', () => {
  it('carries the static AI mark in its heading', () => {
    const wrapper = mount(NbAiProvider)
    const mark = wrapper.find('.nb-ai-provider__title [role="img"]')
    expect(mark.exists()).toBe(true)
    expect(mark.attributes('aria-label')).toBe('Written by AI')
  })

  it('shows the provider default as the model placeholder', () => {
    const wrapper = mount(NbAiProvider, {
      props: {
        provider: 'anthropic',
        defaultModels: { anthropic: 'claude-haiku-4-5' },
      },
    })
    const inputs = wrapper.findAll('input')
    expect(
      inputs.some((i) => i.attributes('placeholder') === 'claude-haiku-4-5'),
    ).toBe(true)
  })

  it('offers Remove key only when a key is stored', async () => {
    const wrapper = mount(NbAiProvider)
    expect(wrapper.text()).not.toContain('Remove key')
    await wrapper.setProps({ hasKey: true })
    expect(wrapper.text()).toContain('Remove key')
    expect(
      wrapper.find('input[type="password"]').attributes('placeholder'),
    ).toBe('Stored. Type a new key to replace it.')
  })

  it('emits save and remove', async () => {
    const wrapper = mount(NbAiProvider, { props: { hasKey: true } })
    const buttons = wrapper
      .findAll('button')
      .filter((b) => /Save AI settings|Remove key/.test(b.text()))
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('save')).toHaveLength(1)
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})

describe('NbAiUsage', () => {
  it('says nothing has been sent before a key exists', () => {
    const wrapper = mount(NbAiUsage)
    expect(wrapper.text()).toContain('No key yet')
    expect(wrapper.find('dl').exists()).toBe(false)
  })

  it('rounds tokens and sub-cent costs the same way everywhere', () => {
    const wrapper = mount(NbAiUsage, {
      props: {
        hasKey: true,
        requests: 28,
        inputTokens: 40_900,
        outputTokens: 11_800,
        estimatedCostUsd: 0.004,
        pricingVerifiedOn: '2026-08-21',
      },
    })
    const text = wrapper.text()
    expect(text).toContain('52.7k (40.9k in, 11.8k out)')
    expect(text).toContain('<$0.01 at list prices as of 2026-08-21')
  })

  it('shows the cache row only for a product that caches', async () => {
    const wrapper = mount(NbAiUsage, { props: { hasKey: true } })
    expect(wrapper.text()).not.toContain('Served from cache')
    await wrapper.setProps({ cacheHits: 3 })
    expect(wrapper.text()).toContain('Served from cache')
  })

  it('names the unpriced models instead of guessing a cost', () => {
    const wrapper = mount(NbAiUsage, {
      props: {
        hasKey: true,
        estimatedCostUsd: null,
        unpricedModels: ['claude-haiku-5-5'],
      },
    })
    expect(wrapper.text()).toContain(
      'n/a: no published price on file for claude-haiku-5-5',
    )
  })
})

describe('NbBriefing', () => {
  it('hides the run and AI switches when they are not bound', () => {
    const wrapper = mount(NbBriefing, { props: { title: 'Recurring reports' } })
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('shows the AI switch with the static mark', () => {
    const wrapper = mount(NbBriefing, {
      props: { title: 'Daily report', aiWriting: true },
    })
    expect(wrapper.find('.nb-briefing__ai [role="img"]').exists()).toBe(true)
  })

  it('emits each switch on its own model', async () => {
    const wrapper = mount(NbBriefing, {
      props: { title: 'Daily report', enabled: false, aiWriting: false },
    })
    const switches = wrapper.findAll('input[type="checkbox"]')
    await switches[0].setValue(true)
    await switches[1].setValue(true)
    expect(wrapper.emitted('update:enabled')?.[0]).toEqual([true])
    expect(wrapper.emitted('update:aiWriting')?.[0]).toEqual([true])
  })

  it('lays the preview beside the settings only when there is one', () => {
    const plain = mount(NbBriefing, { props: { title: 'A' } })
    expect(plain.classes()).not.toContain('nb-briefing--with-preview')
    const withPreview = mount(NbBriefing, {
      props: { title: 'A' },
      slots: { preview: '<pre>text</pre>' },
    })
    expect(withPreview.classes()).toContain('nb-briefing--with-preview')
    expect(withPreview.find('.nb-briefing__aside pre').exists()).toBe(true)
  })
})

describe('NbBriefingDestination', () => {
  it('labels each kind', () => {
    for (const [kind, label] of [
      ['slack', 'Slack'],
      ['email', 'Email'],
      ['webhook', 'Webhook'],
    ] as const) {
      expect(
        mount(NbBriefingDestination, { props: { kind } }).text(),
      ).toContain(label)
    }
  })

  it('cannot be tested until it is set up', async () => {
    const wrapper = mount(NbBriefingDestination, { props: { kind: 'slack' } })
    expect(wrapper.text()).toContain('Not set up')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ configured: true, summary: '#general' })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('test')).toHaveLength(1)
  })
})
