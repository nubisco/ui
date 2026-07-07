import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../src/components/ProgressBar.vue'

const NbLabelStub = {
  name: 'NbLabel',
  template: '<label data-testid="nb-label" v-bind="$attrs"><slot /></label>',
}

const NbMessageStub = {
  name: 'NbMessage',
  props: ['variant'],
  template:
    '<span data-testid="nb-message" :data-variant="variant"><slot /></span>',
}

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  template: '<i data-testid="nb-icon" :data-name="name" />',
}

describe('ProgressBar', () => {
  const createWrapper = (props = {}) =>
    mount(ProgressBar, {
      props,
      global: {
        stubs: {
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbIcon: NbIconStub,
        },
      },
    })

  it('renders the label', () => {
    const wrapper = createWrapper({ label: 'Uploading' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Uploading')
  })

  it('scales the bar to the value fraction', () => {
    const wrapper = createWrapper({ value: 42 })
    expect(wrapper.find('.nb-progress-bar__bar').attributes('style')).toContain(
      'scaleX(0.42)',
    )
  })

  it('measures the value against a custom max', () => {
    const wrapper = createWrapper({ value: 5, max: 10 })
    expect(wrapper.find('.nb-progress-bar__bar').attributes('style')).toContain(
      'scaleX(0.5)',
    )
  })

  it('clamps values outside the 0..max range', () => {
    expect(
      createWrapper({ value: 250 })
        .find('.nb-progress-bar__bar')
        .attributes('style'),
    ).toContain('scaleX(1)')
    expect(
      createWrapper({ value: -10 })
        .find('.nb-progress-bar__bar')
        .attributes('style'),
    ).toContain('scaleX(0)')
  })

  it('exposes progress via aria attributes', () => {
    const track = createWrapper({ value: 30 }).find('[role="progressbar"]')
    expect(track.attributes('aria-valuemin')).toBe('0')
    expect(track.attributes('aria-valuemax')).toBe('100')
    expect(track.attributes('aria-valuenow')).toBe('30')
  })

  it('is indeterminate without a value', () => {
    const wrapper = createWrapper({ label: 'Loading' })
    expect(wrapper.classes()).toContain('nb-progress-bar--indeterminate')
    expect(
      wrapper.find('[role="progressbar"]').attributes('aria-valuenow'),
    ).toBeUndefined()
  })

  it('fills the bar and shows a check icon when finished', () => {
    const wrapper = createWrapper({
      label: 'Upload',
      value: 10,
      status: 'finished',
    })
    expect(wrapper.classes()).toContain('nb-progress-bar--finished')
    expect(wrapper.find('.nb-progress-bar__bar').attributes('style')).toContain(
      'scaleX(1)',
    )
    expect(
      wrapper.find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('check-circle')
  })

  it('fills the bar and renders the helper as an error when failed', () => {
    const wrapper = createWrapper({
      label: 'Upload',
      value: 10,
      status: 'error',
      helper: 'Connection lost',
    })
    expect(wrapper.classes()).toContain('nb-progress-bar--error')
    expect(wrapper.find('.nb-progress-bar__bar').attributes('style')).toContain(
      'scaleX(1)',
    )
    const message = wrapper.find('[data-testid="nb-message"]')
    expect(message.attributes('data-variant')).toBe('error')
    expect(message.text()).toBe('Connection lost')
  })

  it('renders the helper text below the bar', () => {
    const message = createWrapper({
      value: 10,
      helper: 'Fetching assets',
    }).find('[data-testid="nb-message"]')
    expect(message.attributes('data-variant')).toBe('helper')
    expect(message.text()).toBe('Fetching assets')
  })

  it('applies the size class', () => {
    expect(createWrapper().classes()).toContain('nb-progress-bar--md')
    expect(createWrapper({ size: 'sm' }).classes()).toContain(
      'nb-progress-bar--sm',
    )
  })
})
