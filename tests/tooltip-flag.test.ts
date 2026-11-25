import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  defineComponent,
  h,
  resolveDirective,
  withDirectives,
  type Directive,
} from 'vue'
import { mount } from '@vue/test-utils'
import tooltipDirective from '@/directives/ToolTip.directive'
import type { ITooltipOptions } from '@/directives/ToolTip.directive'
import { registerFlags, unregisterFlag } from '@/composables/flagRegistry'

// A stand-in flag: the registry accepts any component, and the test only needs
// to see that the library's own artwork is what lands in the chip.
const TestFlag = defineComponent({
  render: () =>
    h('svg', { viewBox: '0 0 16 16', 'data-test-flag': 'pt', id: 'leaks' }, [
      h('rect', { width: 16, height: 16, fill: 'green' }),
    ]),
})

const Anchor = defineComponent({
  props: { opts: { type: Object as () => ITooltipOptions, required: true } },
  render() {
    return withDirectives(h('span', { id: 'anchor' }, 'teorema'), [
      [resolveDirective('nb-tooltip') as Directive, this.opts],
    ])
  },
})

const open = (opts: ITooltipOptions) => {
  const wrapper = mount(Anchor, {
    props: { opts },
    global: { plugins: [tooltipDirective] },
    attachTo: document.body,
  })
  wrapper.element.dispatchEvent(new MouseEvent('mouseenter'))
  vi.advanceTimersByTime(400)
  return wrapper
}

const chip = () =>
  document.querySelector('span.nb-tooltip') as HTMLElement | null

describe('v-nb-tooltip flag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    registerFlags({ 'test-pt': TestFlag })
  })
  afterEach(() => {
    unregisterFlag('test-pt')
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('draws the flag at the start of the chip, before the text', () => {
    const wrapper = open({ body: 'PT teorema de Pitágoras', flag: 'test-pt' })
    const content = chip()!.querySelector('.nb-tooltip-content')!
    expect(content.classList.contains('nb-tooltip-content--flagged')).toBe(true)
    const first = content.firstElementChild as HTMLElement
    expect(first.classList.contains('nb-tooltip-flag')).toBe(true)
    expect(first.getAttribute('aria-hidden')).toBe('true')
    expect(first.querySelector('svg[data-test-flag="pt"]')).not.toBeNull()
    expect(
      content.querySelector('.nb-tooltip-text .nb-tooltip-body')!.textContent,
    ).toBe('PT teorema de Pitágoras')
    wrapper.unmount()
  })

  it('strips the artwork id, so two chips never share one', () => {
    const wrapper = open({ body: 'x', flag: 'test-pt' })
    expect(chip()!.querySelector('svg')!.hasAttribute('id')).toBe(false)
    wrapper.unmount()
  })

  it('leaves the chip exactly as before when there is no flag', () => {
    const wrapper = open({ body: 'x' })
    const content = chip()!.querySelector('.nb-tooltip-content')!
    expect(content.classList.contains('nb-tooltip-content--flagged')).toBe(
      false,
    )
    expect(content.querySelector('.nb-tooltip-flag')).toBeNull()
    expect(
      content.firstElementChild!.classList.contains('nb-tooltip-header'),
    ).toBe(true)
    wrapper.unmount()
  })

  it('shows the text without a flag when the flag cannot be drawn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = open({ body: 'still here', flag: 'no-such-flag' })
    expect(chip()!.querySelector('.nb-tooltip-flag')).toBeNull()
    expect(chip()!.querySelector('.nb-tooltip-body')!.textContent).toBe(
      'still here',
    )
    wrapper.unmount()
    warn.mockRestore()
    error.mockRestore()
  })

  it('does not let caller content smuggle markup in through the flag slot', () => {
    const wrapper = open({ body: '<svg onload="x()"></svg>', flag: 'test-pt' })
    expect(chip()!.querySelectorAll('svg').length).toBe(1)
    expect(chip()!.querySelector('[onload]')).toBeNull()
    wrapper.unmount()
  })
})
