import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Walkthrough from '../src/components/Walkthrough.vue'
import { useWalkthrough } from '../src/composables/useWalkthrough.composable'
import { createMemoryWalkthroughStorage } from '../src/utils/walkthroughStorage.helper'
import { TOUR_STEP_ATTRIBUTE } from '../src/utils/tourTarget.helper'
import type { IWalkthrough } from '../src/components/Walkthrough.d'

const NbButtonStub = {
  name: 'NbButton',
  props: ['variant', 'size', 'outlined'],
  // Declaring the emit keeps the parent's @click off the root element as a
  // fallthrough listener, which would otherwise fire the handler twice.
  emits: ['click'],
  template:
    '<button class="nb-button" :data-variant="variant" @click="$emit(\'click\')"><slot /></button>',
}

const TeleportStub = { template: '<div><slot /></div>' }

/** jsdom gives every element a zero-sized box; the walkthrough treats that as
 *  "not on screen", so targets need a believable rect to be spotlighted. */
function addTarget(id: string, rect: Partial<DOMRect> = {}) {
  const el = document.createElement('div')
  el.setAttribute(TOUR_STEP_ATTRIBUTE, id)
  el.scrollIntoView = vi.fn()
  el.getBoundingClientRect = () =>
    ({
      top: 100,
      left: 200,
      width: 120,
      height: 40,
      ...rect,
    }) as DOMRect
  document.body.appendChild(el)
  return el
}

const tour: IWalkthrough = {
  id: 'intro',
  version: 1,
  steps: [
    { target: 'nav', title: 'Navigation', body: 'Everything lives here.' },
    { target: 'views', title: 'Views', body: 'Switch perspective.' },
    { target: 'controls', title: 'Controls', body: 'Act on a selection.' },
  ],
}

/** Lets the activation watcher run: nextTick, one rAF, then pending promises. */
async function settle() {
  for (let i = 0; i < 4; i++) {
    await nextTick()
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await Promise.resolve()
  }
}

async function clickButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAll('.nb-button')
    .find((candidate) => candidate.text() === label)
  if (!button) throw new Error(`No "${label}" button in the walkthrough footer`)
  await button.trigger('click')
}

const mountTour = (props: Record<string, unknown> = {}) =>
  mount(Walkthrough, {
    props: {
      walkthrough: tour,
      storage: createMemoryWalkthroughStorage(),
      ...props,
    },
    global: { stubs: { Teleport: TeleportStub, NbButton: NbButtonStub } },
    attachTo: document.body,
  })

describe('NbWalkthrough', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    Element.prototype.scrollIntoView = vi.fn()
    addTarget('nav')
    addTarget('views')
    addTarget('controls')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing until started', () => {
    const wrapper = mountTour()
    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
  })

  it('renders the scrim and popover once started', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    expect(wrapper.find('.nb-walkthrough--scrim').exists()).toBe(true)
    const popover = wrapper.find('.nb-walkthrough--popover')
    expect(popover.exists()).toBe(true)
    expect(popover.attributes('role')).toBe('dialog')
    expect(popover.attributes('aria-modal')).toBe('true')
  })

  it('shows the current step title, body and progress', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    expect(wrapper.find('.nb-walkthrough--title').text()).toBe('Navigation')
    expect(wrapper.find('.nb-walkthrough--body').text()).toContain(
      'Everything lives here.',
    )
    expect(wrapper.find('.nb-walkthrough--progress').text()).toBe('Step 1 of 3')
  })

  it('cuts a spotlight out around the target, grown by the padding', async () => {
    const wrapper = mountTour({ padding: 10 })
    wrapper.vm.start()
    await settle()

    const cutout = wrapper.findAll('mask rect')[1]
    expect(cutout.attributes('x')).toBe('190') // 200 - 10
    expect(cutout.attributes('y')).toBe('90') // 100 - 10
    expect(cutout.attributes('width')).toBe('140') // 120 + 20
    expect(cutout.attributes('height')).toBe('60') // 40 + 20
  })

  it('scrolls the target into view', async () => {
    document.body.innerHTML = ''
    const target = addTarget('nav')
    addTarget('views')
    addTarget('controls')
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    expect(target.scrollIntoView).toHaveBeenCalled()
  })

  it('hides Back on the first step and shows Done on the last', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    let labels = wrapper.findAll('.nb-button').map((b) => b.text())
    expect(labels).toEqual(['Skip', 'Next'])

    wrapper.vm.goTo(2)
    await settle()
    labels = wrapper.findAll('.nb-button').map((b) => b.text())
    expect(labels).toEqual(['Back', 'Done'])
  })

  it('advances and rewinds from the footer buttons', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    await clickButton(wrapper, 'Next')
    await settle()
    expect(wrapper.find('.nb-walkthrough--progress').text()).toBe('Step 2 of 3')

    await clickButton(wrapper, 'Back')
    await settle()
    expect(wrapper.find('.nb-walkthrough--progress').text()).toBe('Step 1 of 3')
  })

  it('emits step-change exactly once per step', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    expect(wrapper.emitted('step-change')).toHaveLength(1)
    expect(wrapper.emitted('step-change')?.[0][1]).toBe(0)

    wrapper.vm.next()
    await settle()
    expect(wrapper.emitted('step-change')).toHaveLength(2)
    expect(wrapper.emitted('step-change')?.[1][1]).toBe(1)
  })

  it('emits finish and closes when Done is pressed', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    wrapper.vm.goTo(2)
    await settle()

    await clickButton(wrapper, 'Done')
    await settle()

    expect(wrapper.emitted('finish')).toHaveLength(1)
    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
  })

  it('emits skip with the abandoned step index', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    wrapper.vm.goTo(1)
    await settle()

    await clickButton(wrapper, 'Skip')
    await settle()

    expect(wrapper.emitted('skip')?.[0][1]).toBe(1)
    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
  })

  it('skips on Escape', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    await wrapper
      .find('.nb-walkthrough--popover')
      .trigger('keydown', { key: 'Escape' })
    await settle()

    expect(wrapper.emitted('skip')).toHaveLength(1)
  })

  it('ignores scrim clicks unless closeOnScrim is set', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    await wrapper.find('.nb-walkthrough--scrim').trigger('click')
    await settle()
    expect(wrapper.emitted('skip')).toBeUndefined()

    const opt = mountTour({ closeOnScrim: true })
    opt.vm.start()
    await settle()
    await opt.find('.nb-walkthrough--scrim').trigger('click')
    await settle()
    expect(opt.emitted('skip')).toHaveLength(1)
  })

  it('centers the popover for a step with no target', async () => {
    const wrapper = mountTour({
      walkthrough: {
        id: 'welcome',
        version: 1,
        steps: [{ title: 'Welcome', body: 'Let us show you around.' }],
      },
    })
    wrapper.vm.start()
    await settle()

    expect(wrapper.find('.nb-walkthrough--popover').classes()).toContain(
      'nb-walkthrough--popover-centered',
    )
    expect(wrapper.findAll('mask rect')).toHaveLength(1) // no cut-out
  })

  it('skips over a step whose target is not in the DOM', async () => {
    const wrapper = mountTour({
      walkthrough: {
        id: 'gaps',
        version: 1,
        steps: [
          { target: 'missing', title: 'Gone' },
          { target: 'views', title: 'Views' },
        ],
      },
    })
    wrapper.vm.start()
    await settle()

    expect(wrapper.find('.nb-walkthrough--title').text()).toBe('Views')
  })

  it('ends the run when no remaining step has a resolvable target', async () => {
    const wrapper = mountTour({
      walkthrough: {
        id: 'all-gone',
        version: 1,
        steps: [{ target: 'missing-a' }, { target: 'missing-b' }],
      },
    })
    wrapper.vm.start()
    await settle()

    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('accepts label overrides', async () => {
    const wrapper = mountTour({
      labels: {
        skip: 'Not now',
        next: 'Continue',
        progress: (current: number, total: number) => `${current} of ${total}`,
      },
    })
    wrapper.vm.start()
    await settle()

    expect(wrapper.findAll('.nb-button').map((b) => b.text())).toEqual([
      'Not now',
      'Continue',
    ])
    expect(wrapper.find('.nb-walkthrough--progress').text()).toBe('1 of 3')
  })

  it('renders rich step content through the step slot', async () => {
    const wrapper = mount(Walkthrough, {
      props: { walkthrough: tour, storage: createMemoryWalkthroughStorage() },
      slots: { step: '<em class="custom">slotted</em>' },
      global: { stubs: { Teleport: TeleportStub, NbButton: NbButtonStub } },
      attachTo: document.body,
    })
    wrapper.vm.start()
    await settle()
    expect(wrapper.find('.custom').text()).toBe('slotted')
  })

  it('moves focus into the dialog and restores it on close', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()
    expect(document.activeElement).toBe(
      wrapper.find('.nb-walkthrough--popover').element,
    )

    await wrapper.vm.skip()
    await settle()
    expect(document.activeElement).toBe(opener)
  })

  it('traps Tab inside the dialog', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    const buttons = wrapper.findAll('.nb-button')
    const last = buttons[buttons.length - 1].element as HTMLElement
    last.focus()

    await wrapper
      .find('.nb-walkthrough--popover')
      .trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(buttons[0].element)
  })

  it('runs on mount only when the version has not been completed', async () => {
    const storage = createMemoryWalkthroughStorage()
    const first = mountTour({ autoStart: true, storage })
    await settle()
    expect(first.find('.nb-walkthrough').exists()).toBe(true)
    await first.vm.finish()
    await settle()

    const second = mountTour({ autoStart: true, storage })
    await settle()
    expect(second.find('.nb-walkthrough').exists()).toBe(false)

    const bumped = mountTour({
      autoStart: true,
      storage,
      walkthrough: { ...tour, version: 2 },
    })
    await settle()
    expect(bumped.find('.nb-walkthrough').exists()).toBe(true)
  })

  it('drives an externally-supplied controller', async () => {
    const controller = useWalkthrough(tour, {
      storage: createMemoryWalkthroughStorage(),
    })
    const wrapper = mount(Walkthrough, {
      props: { controller },
      global: { stubs: { Teleport: TeleportStub, NbButton: NbButtonStub } },
      attachTo: document.body,
    })

    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
    controller.start()
    await settle()
    expect(wrapper.find('.nb-walkthrough--title').text()).toBe('Navigation')
  })

  it('does not auto-start a controller the host owns', async () => {
    const controller = useWalkthrough(tour, {
      storage: createMemoryWalkthroughStorage(),
    })
    const wrapper = mount(Walkthrough, {
      props: { controller, autoStart: true },
      global: { stubs: { Teleport: TeleportStub, NbButton: NbButtonStub } },
      attachTo: document.body,
    })
    await settle()
    expect(wrapper.find('.nb-walkthrough').exists()).toBe(false)
  })

  it('paints the overlay layer wherever it is used', async () => {
    const wrapper = mountTour()
    wrapper.vm.start()
    await settle()

    const popover = wrapper.find('.nb-walkthrough--popover')
    expect(popover.classes()).toContain('nb-layer-3')
    expect(popover.attributes('data-nb-layer')).toBe('3')
  })

  it('uses only token-driven colours in its styles', async () => {
    const { readFileSync } = await import('node:fs')
    const source = readFileSync('src/components/Walkthrough.vue', 'utf8')
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(source).not.toMatch(/rgba?\(/)
  })
})
