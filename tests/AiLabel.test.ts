import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AiLabel from '../src/components/AiLabel.vue'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

const popover = () =>
  document.body.querySelector<HTMLElement>('.nb-ai-label--popover')

/** A label with an explanation, attached so focus is real. */
function explained(props = {}, slots = {}) {
  return mount(AiLabel, {
    props,
    slots: {
      explain:
        '<p>Built from 14 cards.</p><a href="#facts" class="facts">See the facts</a>',
      ...slots,
    },
    attachTo: document.body,
  })
}

describe('AiLabel', () => {
  const createWrapper = (props = {}, attrs = {}) =>
    mount(AiLabel, { props, attrs })

  it('renders the AI glyph', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies default variant class', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-ai-label__default')
  })

  it('applies inline variant class', () => {
    const wrapper = createWrapper({ variant: 'inline' })
    expect(wrapper.classes()).toContain('nb-ai-label__inline')
  })

  it.each(['sm', 'md', 'lg'])('applies the %s size class', (size) => {
    const wrapper = createWrapper({ size })
    expect(wrapper.classes()).toContain(`nb-ai-label__${size}`)
  })

  it('applies medium size class by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.classes()).toContain('nb-ai-label__md')
  })

  it('shows dot element in inline variant', () => {
    const wrapper = createWrapper({ variant: 'inline' })
    expect(wrapper.find('.nb-ai-label--dot').exists()).toBe(true)
  })

  it('does not show dot in default variant', () => {
    const wrapper = createWrapper({ variant: 'default' })
    expect(wrapper.find('.nb-ai-label--dot').exists()).toBe(false)
  })

  describe('inline text', () => {
    it('says "AI" beside the dot by default, as text', () => {
      const wrapper = createWrapper({ variant: 'inline' })
      expect(wrapper.find('.nb-ai-label--text').text()).toBe('AI')
      expect(wrapper.find('svg').exists()).toBe(false)
    })

    it('says the word it is given, so it can be localised', () => {
      const wrapper = createWrapper({ variant: 'inline', text: 'IA' })
      expect(wrapper.find('.nb-ai-label--text').text()).toBe('IA')
    })

    it('draws the glyph when the text is empty', () => {
      const wrapper = createWrapper({ variant: 'inline', text: '' })
      expect(wrapper.find('.nb-ai-label--text').exists()).toBe(false)
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('a label with nothing to do', () => {
    it('is a mark, never an inert button', () => {
      const wrapper = createWrapper()
      expect(wrapper.element.tagName.toLowerCase()).toBe('span')
      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Written by AI')
      expect(wrapper.classes()).toContain('nb-ai-label__static')
    })

    it('names the mark with its label', () => {
      const wrapper = createWrapper({ static: true, label: 'AI summary' })
      expect(wrapper.attributes('aria-label')).toBe('AI summary')
    })

    it('hides the glyph from assistive technology', () => {
      const wrapper = createWrapper({ static: true })
      expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('a label with a click listener', () => {
    it('is a button with an accessible name', () => {
      const onClick = vi.fn()
      const wrapper = createWrapper({}, { onClick })
      expect(wrapper.element.tagName.toLowerCase()).toBe('button')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.attributes('aria-label')).toBe('AI, show information')
      expect(wrapper.attributes('role')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('nb-ai-label__static')
    })

    it('takes its name from label', () => {
      const wrapper = createWrapper(
        { label: 'About this summary' },
        { onClick: vi.fn() },
      )
      expect(wrapper.attributes('aria-label')).toBe('About this summary')
    })

    it('calls the listener on click', async () => {
      const onClick = vi.fn()
      const wrapper = createWrapper({}, { onClick })
      await wrapper.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('stays a mark when static is set', () => {
      const wrapper = createWrapper({ static: true }, { onClick: vi.fn() })
      expect(wrapper.element.tagName.toLowerCase()).toBe('span')
      expect(wrapper.attributes('role')).toBe('img')
    })
  })

  describe('the explanation', () => {
    afterEach(() => {
      unstubPhone()
      document.body.innerHTML = ''
    })

    it('makes the label a button that controls a closed region', () => {
      const wrapper = explained()
      expect(wrapper.element.tagName.toLowerCase()).toBe('button')
      expect(wrapper.attributes('aria-label')).toBe('AI, show information')
      expect(wrapper.attributes('aria-expanded')).toBe('false')
      expect(wrapper.attributes('aria-controls')).toBeTruthy()
      expect(popover()).toBeNull()
      wrapper.unmount()
    })

    it('also opens from the explain prop', async () => {
      const wrapper = mount(AiLabel, {
        props: { explain: 'Phrased by a model from computed facts.' },
        attachTo: document.body,
      })
      await wrapper.trigger('click')
      expect(popover()?.textContent).toContain('Phrased by a model')
      wrapper.unmount()
    })

    it('opens on click as a non-modal dialog, not a tooltip', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      const box = popover()!
      expect(box).not.toBeNull()
      expect(box.getAttribute('role')).toBe('dialog')
      expect(box.getAttribute('aria-modal')).toBeNull()
      expect(box.getAttribute('aria-label')).toBe('About this AI content')
      expect(box.id).toBe(wrapper.attributes('aria-controls'))
      expect(wrapper.attributes('aria-expanded')).toBe('true')
      expect(box.textContent).toContain('Built from 14 cards.')
      expect(wrapper.emitted('open')).toHaveLength(1)
      wrapper.unmount()
    })

    it('closes on a second click', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      await wrapper.trigger('click')
      expect(popover()).toBeNull()
      expect(wrapper.emitted('close')).toHaveLength(1)
      wrapper.unmount()
    })

    it('closes on a press outside, leaving focus alone', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await nextTick()
      expect(popover()).toBeNull()
      wrapper.unmount()
    })

    it('takes Tab from the label into its content', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      ;(wrapper.element as HTMLElement).focus()
      await wrapper.trigger('keydown', { key: 'Tab' })
      expect(document.activeElement?.classList.contains('facts')).toBe(true)
      wrapper.unmount()
    })

    it('closes on Escape inside it and returns focus to the label', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      const link = popover()!.querySelector<HTMLElement>('.facts')!
      link.focus()
      link.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      await nextTick()
      expect(popover()).toBeNull()
      expect(document.activeElement).toBe(wrapper.element)
      wrapper.unmount()
    })

    it('closes on Escape on the label and keeps focus there', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      ;(wrapper.element as HTMLElement).focus()
      await wrapper.trigger('keydown', { key: 'Escape' })
      expect(popover()).toBeNull()
      expect(document.activeElement).toBe(wrapper.element)
      wrapper.unmount()
    })

    it('returns focus to the label when Tab leaves the end of it', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      const link = popover()!.querySelector<HTMLElement>('.facts')!
      link.focus()
      link.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
      )
      await nextTick()
      expect(popover()).toBeNull()
      expect(document.activeElement).toBe(wrapper.element)
      wrapper.unmount()
    })

    it('is anchored on a desktop, with no scrim', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      expect(popover()!.classList).toContain('nb-ai-label--popover-bottom')
      expect(popover()!.style.top).not.toBe('')
      expect(document.querySelector('.nb-ai-label--scrim')).toBeNull()
      wrapper.unmount()
    })

    it('is a bottom sheet over a scrim on a phone', async () => {
      stubPhone()
      const wrapper = explained()
      await wrapper.trigger('click')
      const box = popover()!
      expect(box.classList).toContain('nb-ai-label--popover-sheet')
      expect(box.style.top).toBe('')
      const scrim = document.querySelector<HTMLElement>('.nb-ai-label--scrim')
      expect(scrim).not.toBeNull()
      scrim!.click()
      await nextTick()
      expect(popover()).toBeNull()
      wrapper.unmount()
    })

    it('renders slotted actions under the content', async () => {
      const wrapper = explained(
        {},
        { actions: '<button class="details">Open the report</button>' },
      )
      await wrapper.trigger('click')
      expect(
        popover()!.querySelector('.nb-ai-label--actions .details'),
      ).not.toBeNull()
      wrapper.unmount()
    })
  })

  describe('the plain version', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('makes the label a button on its own', () => {
      const wrapper = mount(AiLabel, { props: { plainAvailable: true } })
      expect(wrapper.element.tagName.toLowerCase()).toBe('button')
    })

    it('offers "Show the plain version" and emits show-plain', async () => {
      const wrapper = explained({ plainAvailable: true })
      await wrapper.trigger('click')
      const action = Array.from(
        popover()!.querySelectorAll<HTMLButtonElement>('button'),
      ).find((b) => b.textContent?.includes('Show the plain version'))
      expect(action).toBeTruthy()
      action!.click()
      await nextTick()
      expect(wrapper.emitted('show-plain')).toHaveLength(1)
      expect(popover()).toBeNull()
      wrapper.unmount()
    })

    it('takes its wording from showPlainLabel', async () => {
      const wrapper = explained({
        plainAvailable: true,
        showPlainLabel: 'Use the summary without AI',
      })
      await wrapper.trigger('click')
      expect(popover()!.textContent).toContain('Use the summary without AI')
      wrapper.unmount()
    })
  })

  describe('revert', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('becomes an undo button named "Revert to AI input"', () => {
      const wrapper = explained({ revertable: true })
      expect(wrapper.element.tagName.toLowerCase()).toBe('button')
      expect(wrapper.attributes('aria-label')).toBe('Revert to AI input')
      expect(wrapper.attributes('aria-expanded')).toBeUndefined()
      expect(wrapper.classes()).toContain('nb-ai-label__reverting')
      expect(wrapper.find('.nb-ai-label--glyph').exists()).toBe(false)
      expect(wrapper.find('.nb-ai-label--revert').exists()).toBe(true)
      wrapper.unmount()
    })

    it('emits revert on click and opens nothing', async () => {
      const wrapper = explained({ revertable: true })
      await wrapper.trigger('click')
      expect(wrapper.emitted('revert')).toHaveLength(1)
      expect(popover()).toBeNull()
      wrapper.unmount()
    })

    it('takes its name from revertLabel', () => {
      const wrapper = mount(AiLabel, {
        props: { revertable: true, revertLabel: 'Restore the AI title' },
      })
      expect(wrapper.attributes('aria-label')).toBe('Restore the AI title')
    })

    it('closes an open explanation when the person edits', async () => {
      const wrapper = explained()
      await wrapper.trigger('click')
      expect(popover()).not.toBeNull()
      await wrapper.setProps({ revertable: true })
      expect(popover()).toBeNull()
      wrapper.unmount()
    })
  })
})
