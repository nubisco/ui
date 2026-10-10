import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DatePicker from '../src/components/DatePicker.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/**
 * NbDatePicker on a phone: the calendar is a bottom sheet over a scrim
 * instead of a popover anchored under the field. A desktop keeps the anchored
 * popover and its inline position, and gets no scrim.
 */

const calendar = () =>
  document.body.querySelector<HTMLElement>('.nb-date-picker__calendar')
const scrim = () =>
  document.body.querySelector<HTMLElement>('.nb-date-picker__scrim')

function mountPicker() {
  return mount(DatePicker, {
    props: { modelValue: '2026-10-10', label: 'Due' },
    attachTo: document.body,
  })
}

describe('NbDatePicker in the phone layout', () => {
  afterEach(() => {
    unstubPhone()
    document.body.innerHTML = ''
  })

  it('opens the calendar as a sheet over a scrim', async () => {
    stubPhone()
    const wrapper = mountPicker()
    await wrapper.find('.nb-date-picker__icon').trigger('click')
    await nextTick()
    expect(calendar()!.classList).toContain('nb-date-picker__calendar--sheet')
    // The sheet's place comes from its class, so no anchored top/left.
    expect(calendar()!.getAttribute('style')).toBeNull()
    expect(scrim()).not.toBeNull()
    wrapper.unmount()
  })

  it('closes when the scrim is tapped', async () => {
    stubPhone()
    const wrapper = mountPicker()
    await wrapper.find('.nb-date-picker__icon').trigger('click')
    await nextTick()

    // The press on the scrim must not close the sheet on its own, or the
    // scrim is gone before its click and the tap lands on the page.
    scrim()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(calendar()).not.toBeNull()

    scrim()!.click()
    await nextTick()
    expect(calendar()).toBeNull()
    expect(scrim()).toBeNull()
    wrapper.unmount()
  })

  it('keeps the anchored popover on a desktop', async () => {
    const wrapper = mountPicker()
    await wrapper.find('.nb-date-picker__icon').trigger('click')
    await nextTick()
    expect(calendar()!.classList).not.toContain(
      'nb-date-picker__calendar--sheet',
    )
    expect(calendar()!.style.position).toBe('fixed')
    expect(calendar()!.style.top).toMatch(/px$/)
    expect(calendar()!.style.left).toMatch(/px$/)
    expect(scrim()).toBeNull()
    wrapper.unmount()
  })
})
