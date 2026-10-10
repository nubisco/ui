import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import InfoHint from '../src/components/InfoHint.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/**
 * NbInfoHint on a phone: a scroll of anything holding the trigger closes an
 * open hint, because a swipe means the user has moved on. A scroll inside the
 * popover is reading it. A desktop keeps following the trigger.
 */

const popover = () =>
  document.body.querySelector<HTMLElement>('.nb-info-hint--popover')

async function openHint() {
  const wrapper = mount(
    {
      components: { InfoHint },
      template:
        '<div class="scroller"><InfoHint text="Kept for 90 days." /></div><div class="other" />',
    },
    { attachTo: document.body },
  )
  await wrapper.find('.nb-info-hint--trigger').trigger('click')
  await nextTick()
  expect(popover()).not.toBeNull()
  return wrapper
}

const scroll = (target: EventTarget) =>
  target.dispatchEvent(new Event('scroll'))

describe('NbInfoHint in the phone layout', () => {
  afterEach(() => {
    unstubPhone()
    document.body.innerHTML = ''
  })

  it('closes when the page scrolls', async () => {
    stubPhone()
    const wrapper = await openHint()
    scroll(document)
    await nextTick()
    expect(popover()).toBeNull()
    wrapper.unmount()
  })

  it('closes when a container holding the trigger scrolls', async () => {
    stubPhone()
    const wrapper = await openHint()
    scroll(document.querySelector('.scroller')!)
    await nextTick()
    expect(popover()).toBeNull()
    wrapper.unmount()
  })

  it('stays open for a scroll inside the popover or an unrelated container', async () => {
    stubPhone()
    const wrapper = await openHint()
    scroll(popover()!)
    scroll(document.querySelector('.other')!)
    await nextTick()
    expect(popover()).not.toBeNull()
    wrapper.unmount()
  })

  it('stays open and follows the trigger on a desktop', async () => {
    const wrapper = await openHint()
    scroll(document)
    await nextTick()
    expect(popover()).not.toBeNull()
    wrapper.unmount()
  })
})
