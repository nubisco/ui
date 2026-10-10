import { glyphStubComputed } from './__mocks__/glyphStub'
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from '../src/components/Select.vue'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

const NbLabelStub = {
  name: 'NbLabel',
  props: ['for', 'required', 'disabled'],
  template: '<label data-testid="nb-label" v-bind="$attrs"><slot /></label>',
}

const NbMessageStub = {
  name: 'NbMessage',
  props: ['variant', 'iconOnly'],
  template:
    '<span data-testid="nb-message" :data-variant="variant"><slot /></span>',
}

const NbIconStub = {
  name: 'NbIcon',
  props: ['name', 'size'],
  computed: glyphStubComputed,
  template: '<i data-testid="nb-icon" :data-name="resolvedName"></i>',
}

const NbGridStub = {
  name: 'NbGrid',
  props: ['is', 'dir', 'align', 'justify', 'gap', 'flex', 'distributed'],
  template: '<div v-bind="$attrs"><slot /></div>',
}

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
]

describe('Select', () => {
  // A failing assertion skips the `unmount()` at the end of its test and
  // leaves a teleported dropdown in the body, which the next test then reads
  // as its own options. One real failure used to print as four.
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createWrapper = (props = {}) =>
    mount(Select, {
      props: { options, ...props },
      global: {
        stubs: {
          NbLabel: NbLabelStub,
          NbMessage: NbMessageStub,
          NbIcon: NbIconStub,
          NbGrid: NbGridStub,
          Teleport: { template: '<div><slot /></div>' },
        },
      },
      attachTo: document.body,
    })

  /**
   * NbSelect has two root nodes, the field and the teleported dropdown, so
   * `wrapper.trigger` dispatches on the fragment and the root div's own
   * `@keydown` never sees it. Press the key on the trigger button, where a
   * real keystroke would land, and let it bubble.
   */
  const press = (wrapper: ReturnType<typeof createWrapper>, key: string) =>
    wrapper.find('.nb-select__trigger').trigger('keydown', { key })

  // The shell closes a phone inspector on Escape unless something inside it
  // already handled the key. An open select handles it, and says so.
  it('marks Escape as handled when it closes the list', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select--open').exists()).toBe(true)
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
    wrapper.find('.nb-select__trigger').element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.nb-select--open').exists()).toBe(false)
    wrapper.unmount()
  })

  describe('grouped options', () => {
    /**
     * The case this was built for: two groups holding the same values, in a
     * deliberate order that is not alphabetical in either direction.
     */
    const versions = [
      { label: '1.9.0', value: 'aff-190', group: 'Affects version' },
      { label: '1.11.0', value: 'aff-1110', group: 'Affects version' },
      { label: '1.12.0', value: 'aff-1120', group: 'Affects version' },
      { label: '1.9.0', value: 'fix-190', group: 'Fixes version' },
      { label: '1.12.0', value: 'fix-1120', group: 'Fixes version' },
    ]

    it('draws one heading per run, named', async () => {
      const wrapper = createWrapper({ options: versions })
      await wrapper.find('button').trigger('click')
      const headings = [
        ...document.querySelectorAll('.nb-select__group-label'),
      ].map((h) => h.textContent?.trim())
      expect(headings).toEqual(['Affects version', 'Fixes version'])
      wrapper.unmount()
    })

    it('names the group to a screen reader', async () => {
      const wrapper = createWrapper({ options: versions })
      await wrapper.find('button').trigger('click')
      const group = document.querySelector('[role="group"][aria-labelledby]')!
      const labelId = group.getAttribute('aria-labelledby')!
      expect(document.getElementById(labelId)?.textContent?.trim()).toBe(
        'Affects version',
      )
      wrapper.unmount()
    })

    it('keeps the order it was given rather than collecting by name', async () => {
      // Runs, not buckets: the same name twice is two headings, because that
      // is what the given order says. A caller that grouped its options has
      // usually already arranged them.
      const wrapper = createWrapper({
        options: [
          { label: 'A', value: 'a', group: 'One' },
          { label: 'B', value: 'b', group: 'Two' },
          { label: 'C', value: 'c', group: 'One' },
        ],
      })
      await wrapper.find('button').trigger('click')
      expect(
        [...document.querySelectorAll('.nb-select__group-label')].map((h) =>
          h.textContent?.trim(),
        ),
      ).toEqual(['One', 'Two', 'One'])
      expect(
        [...document.querySelectorAll('.nb-select__option-label')].map((o) =>
          o.textContent?.trim(),
        ),
      ).toEqual(['A', 'B', 'C'])
      wrapper.unmount()
    })

    it('a heading is not an option', async () => {
      const wrapper = createWrapper({ options: versions })
      await wrapper.find('button').trigger('click')
      // Five options, two headings, and no heading counted among them. The
      // workaround this replaces shipped headings as disabled options, which
      // a screen reader reads as choices you may not make.
      expect(document.querySelectorAll('[role="option"]')).toHaveLength(5)
      expect(
        document.querySelectorAll('.nb-select__group-label[role="option"]'),
      ).toHaveLength(0)
      wrapper.unmount()
    })

    it('selects the right one of two options sharing a label', async () => {
      const wrapper = createWrapper({ options: versions })
      await wrapper.find('button').trigger('click')
      const rows = document.querySelectorAll('.nb-select__option')
      // The second 1.12.0, the one under "Fixes version".
      ;(rows[4] as HTMLElement).click()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['fix-1120'])
      wrapper.unmount()
    })

    it('renders a list with no groups exactly as before', async () => {
      const wrapper = createWrapper()
      await wrapper.find('button').trigger('click')
      expect(document.querySelectorAll('.nb-select__group-label')).toHaveLength(
        0,
      )
      expect(
        [...document.querySelectorAll('.nb-select__option-label')].map((o) =>
          o.textContent?.trim(),
        ),
      ).toEqual(['Apple', 'Banana', 'Cherry'])
      wrapper.unmount()
    })
  })

  describe('arrowing past what cannot be chosen', () => {
    const withDisabled = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana', disabled: true },
      { label: 'Cherry', value: 'cherry' },
    ]

    it('skips a disabled option on the way down', async () => {
      const wrapper = createWrapper({ options: withDisabled })
      await wrapper.find('button').trigger('click')
      await press(wrapper, 'ArrowDown')
      await press(wrapper, 'ArrowDown')
      // Apple, then Cherry. Landing on Banana was a keystroke that did
      // nothing, since Enter on it is already ignored.
      expect(
        document.querySelectorAll('.nb-select__option')[2].className,
      ).toContain('nb-select__option--highlighted')
      wrapper.unmount()
    })

    it('skips it on the way back up too', async () => {
      const wrapper = createWrapper({
        options: withDisabled,
        modelValue: 'cherry',
      })
      await wrapper.find('button').trigger('click')
      await press(wrapper, 'ArrowUp')
      expect(
        document.querySelectorAll('.nb-select__option')[0].className,
      ).toContain('nb-select__option--highlighted')
      wrapper.unmount()
    })

    it('stays put rather than wrapping when there is nowhere further', async () => {
      const wrapper = createWrapper({
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana', disabled: true },
        ],
      })
      await wrapper.find('button').trigger('click')
      await press(wrapper, 'ArrowDown')
      await press(wrapper, 'ArrowDown')
      expect(
        document.querySelectorAll('.nb-select__option')[0].className,
      ).toContain('nb-select__option--highlighted')
      wrapper.unmount()
    })
  })

  describe('an icon per option', () => {
    const marked = [
      { label: 'LinkedIn', value: 'linkedin', icon: 'linkedin-logo' },
      { label: 'Instagram', value: 'instagram', icon: 'instagram-logo' },
      { label: 'Anywhere', value: 'generic' },
    ]

    it('shows the mark beside each option it has one for', async () => {
      const wrapper = createWrapper({ options: marked })
      await wrapper.find('button').trigger('click')
      const rows = document.querySelectorAll('.nb-select__option')
      expect(
        rows[0]
          .querySelector('.nb-select__option-icon')
          ?.getAttribute('data-name'),
      ).toBe('linkedin-logo')
      expect(
        rows[1]
          .querySelector('.nb-select__option-icon')
          ?.getAttribute('data-name'),
      ).toBe('instagram-logo')
      // An option without one is a label, not a gap with a missing glyph.
      expect(rows[2].querySelector('.nb-select__option-icon')).toBeNull()
      wrapper.unmount()
    })

    it('shows the selected mark on the closed select', () => {
      const wrapper = createWrapper({
        options: marked,
        modelValue: 'instagram',
      })
      const icon = wrapper.find('.nb-select__value-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('data-name')).toBe('instagram-logo')
      expect(wrapper.find('.nb-select__value').classes()).toContain(
        'nb-select__value--with-icon',
      )
      wrapper.unmount()
    })

    it('leaves a select without icons exactly as it was', () => {
      const wrapper = createWrapper({ modelValue: 'apple' })
      expect(wrapper.find('.nb-select__value-icon').exists()).toBe(false)
      expect(wrapper.find('.nb-select__value').classes()).not.toContain(
        'nb-select__value--with-icon',
      )
      expect(wrapper.find('.nb-select__value').text()).toBe('Apple')
      wrapper.unmount()
    })

    it('shows no mark for a multiple select, where the count is the value', () => {
      const wrapper = createWrapper({
        options: marked,
        multiple: true,
        modelValue: ['linkedin'],
      })
      expect(wrapper.find('.nb-select__value-icon').exists()).toBe(false)
      wrapper.unmount()
    })
  })

  it('renders the trigger button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-select__trigger').exists()).toBe(true)
  })

  it('shows placeholder when no value is selected', () => {
    const wrapper = createWrapper({ placeholder: 'Pick one' })
    expect(wrapper.find('.nb-select__value').text()).toBe('Pick one')
  })

  it('shows selected option label', () => {
    const wrapper = createWrapper({ modelValue: 'banana' })
    expect(wrapper.find('.nb-select__value').text()).toBe('Banana')
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({ label: 'Fruit' })
    expect(wrapper.find('[data-testid="nb-label"]').text()).toBe('Fruit')
  })

  it('opens dropdown on trigger click', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(true)
  })

  it('renders options in dropdown when open', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts).toHaveLength(3)
    expect(opts[0].text()).toContain('Apple')
  })

  it('emits update:modelValue when option is clicked', async () => {
    const wrapper = createWrapper({ modelValue: null })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    await opts[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['banana'])
  })

  it('emits change when option is clicked', async () => {
    const wrapper = createWrapper({ modelValue: null })
    await wrapper.find('.nb-select__trigger').trigger('click')
    await wrapper.findAll('.nb-select__option')[0].trigger('click')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('closes dropdown after single selection', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(true)
    await wrapper.findAll('.nb-select__option')[0].trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(false)
  })

  it('applies error class and shows error message', () => {
    // Select has two root nodes (div + Teleport), so classes() on wrapper is empty
    const wrapper = createWrapper({ error: 'Required' })
    expect(wrapper.find('.nb-select').classes()).toContain('nb-select--error')
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('error')
    expect(msg.text()).toBe('Required')
  })

  it('applies warning class and shows warning message', () => {
    const wrapper = createWrapper({
      error: undefined,
      warning: 'Check selection',
    })
    expect(wrapper.find('.nb-select').classes()).toContain('nb-select--warning')
  })

  it('shows helper message', () => {
    const wrapper = createWrapper({ helper: 'Select an option' })
    const msg = wrapper.find('[data-testid="nb-message"]')
    expect(msg.attributes('data-variant')).toBe('helper')
  })

  it('disables the trigger button when disabled', () => {
    const wrapper = createWrapper({ disabled: true })
    expect(wrapper.find('.nb-select__trigger').element.disabled).toBe(true)
  })

  it('does not open dropdown when disabled', async () => {
    const wrapper = createWrapper({ disabled: true })
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__dropdown').exists()).toBe(false)
  })

  it('shows empty message when options array is empty', async () => {
    const wrapper = createWrapper({ options: [] })
    await wrapper.find('.nb-select__trigger').trigger('click')
    expect(wrapper.find('.nb-select__empty').text()).toBe('No options')
  })

  it('marks selected option as selected', async () => {
    const wrapper = createWrapper({ modelValue: 'apple' })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts[0].classes()).toContain('nb-select__option--selected')
    expect(opts[1].classes()).not.toContain('nb-select__option--selected')
  })

  it('supports multiple selection mode', async () => {
    const wrapper = createWrapper({ multiple: true, modelValue: ['apple'] })
    await wrapper.find('.nb-select__trigger').trigger('click')
    await wrapper.findAll('.nb-select__option')[1].trigger('click')
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as string[]
    expect(emitted).toContain('apple')
    expect(emitted).toContain('banana')
  })

  it('displays count for 3+ selections', () => {
    const wrapper = createWrapper({
      multiple: true,
      modelValue: ['apple', 'banana', 'cherry'],
    })
    expect(wrapper.find('.nb-select__value').text()).toBe('3 selected')
  })

  describe('dropdown placement', () => {
    // Patching a prototype accessor leaks across tests if left in place.
    afterEach(() => {
      delete (HTMLElement.prototype as Partial<HTMLElement>).offsetHeight
    })

    // jsdom has no layout, so drive the two inputs the placement decision
    // reads: the trigger's viewport rect and the dropdown's rendered height.
    const withGeometry = async (triggerTop: number, dropdownHeight: number) => {
      const wrapper = createWrapper()
      const trigger = wrapper.find('.nb-select__trigger')

      trigger.element.getBoundingClientRect = () =>
        ({
          top: triggerTop,
          bottom: triggerTop + 32,
          left: 0,
          width: 200,
        }) as DOMRect
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return this.classList?.contains('nb-select__dropdown')
            ? dropdownHeight
            : 0
        },
      })

      await trigger.trigger('click')
      await wrapper.vm.$nextTick()
      return wrapper
    }

    const dropdownTop = (wrapper: ReturnType<typeof createWrapper>) =>
      (wrapper.find('.nb-select__dropdown').element as HTMLElement).style.top

    it('drops down when there is room below', async () => {
      // window.innerHeight is 768 in jsdom: 200px of list fits under a
      // trigger whose bottom sits at 132.
      const wrapper = await withGeometry(100, 200)
      expect(dropdownTop(wrapper)).toBe('132px')
    })

    it('flips above the trigger when the list does not fit below', async () => {
      // Trigger bottom at 732 leaves 36px below but 700px above.
      const wrapper = await withGeometry(700, 200)
      expect(dropdownTop(wrapper)).toBe('500px')
    })

    it('stays below when neither side fits but below has more room', async () => {
      const wrapper = await withGeometry(300, 900)
      expect(dropdownTop(wrapper)).toBe('332px')
    })
  })

  it('shows disabled option as disabled', async () => {
    const optsWithDisabled = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
    ]
    const wrapper = createWrapper({ options: optsWithDisabled })
    await wrapper.find('.nb-select__trigger').trigger('click')
    const opts = wrapper.findAll('.nb-select__option')
    expect(opts[1].classes()).toContain('nb-select__option--disabled')
  })
})
