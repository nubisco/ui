import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorStrip from '../src/components/ColorStrip.vue'

describe('ColorStrip', () => {
  const createWrapper = (props = {}, options = {}) => {
    return mount(ColorStrip, {
      props,
      global: {
        stubs: {
          NbLabel: {
            name: 'NbLabel',
            template:
              '<label data-testid="nb-label" v-bind="$attrs"><slot /></label>',
          },
          NbIcon: {
            name: 'NbIcon',
            props: ['name', 'weight', 'color'],
            template:
              '<i data-testid="nb-icon" :data-name="name" :data-weight="weight" :data-color="color"></i>',
          },
          NbGrid: {
            name: 'NbGrid',
            props: ['is', 'id', 'style', 'disabled'],
            template:
              '<component :is="is || \'div\'" :id="id" :style="style" :disabled="disabled" v-bind="$attrs" @click="$emit(\'click\')"><slot /></component>',
          },
        },
      },
      ...options,
    })
  }

  it('renders with default options', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findAll('button.nb-color-strip-color')).toHaveLength(4)
  })

  it('renders label when provided', () => {
    const wrapper = createWrapper({
      label: 'Select a color',
    })
    const label = wrapper.get('[data-testid="nb-label"]')
    expect(label.text()).toContain('Select a color')
  })

  it('generates unique ID when id prop not provided', () => {
    const wrapper = createWrapper()
    const element = wrapper.find('[id^="nb-color-strip-"]')
    expect(element.exists()).toBe(true)
  })

  it('uses provided id prop', () => {
    const customId = 'my-custom-color-strip'
    const wrapper = createWrapper({
      id: customId,
    })
    const element = wrapper.find(`#${customId}`)
    expect(element.exists()).toBe(true)
  })

  it('connects label to color strip via htmlFor attribute', () => {
    const customId = 'test-strip-id'
    const wrapper = createWrapper({
      label: 'Pick a color',
      id: customId,
    })
    const label = wrapper.get('[data-testid="nb-label"]')
    expect(label.attributes('for')).toBe(customId)
  })

  it('passes wrap prop correctly', () => {
    const wrapper = createWrapper({
      options: [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FF00FF',
        '#00FFFF',
        '#FFA500',
        '#800080',
        '#FFC0CB',
      ],
      wrap: true,
    })
    const strip = wrapper.get('.nb-color-strip')
    expect(strip.attributes('style')).toContain('max-width: 144px')
    expect(strip.attributes('style')).toContain('flex-wrap: wrap')
  })

  it('keeps a single horizontal row when wrap is false', () => {
    const wrapper = createWrapper({
      options: ['#FF0000', '#00FF00', '#0000FF'],
      wrap: false,
    })
    const strip = wrapper.get('.nb-color-strip')
    expect(strip.attributes('style')).toContain('flex-wrap: nowrap')
    expect(strip.attributes('style')).toContain('max-width: none')
  })

  it('normalizes string options into objects', () => {
    const options = ['#FF0000', '#00FF00', '#0000FF']
    const wrapper = createWrapper({
      options,
      modelValue: '#FF0000',
    })
    const buttons = wrapper.findAll('button.nb-color-strip-color')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].attributes('style')).toContain('background-color')
  })

  it('supports custom color objects with value and color properties', async () => {
    const options = [
      { value: 'red', color: '#FF0000' },
      { value: 'green', color: '#00FF00' },
    ]
    const wrapper = createWrapper({
      options,
      modelValue: 'red',
    })
    const buttons = wrapper.findAll('button.nb-color-strip-color')
    expect(buttons).toHaveLength(2)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['green'])
  })

  it('provides slot for custom label override', () => {
    const wrapper = createWrapper(
      {
        label: 'Default label',
      },
      {
        slots: {
          label: '<strong>Custom Label</strong>',
        },
      },
    )
    expect(wrapper.text()).toContain('Custom Label')
  })

  it('respects onlyView prop', () => {
    const wrapper = createWrapper({
      onlyView: true,
      options: ['#FF0000'],
    })
    const strip = wrapper.get('.nb-color-strip')
    expect(strip.classes()).toContain('only-view')

    const button = wrapper.get('button.nb-color-strip-color')
    button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('respects allowMultiple prop', () => {
    const wrapper = createWrapper({
      allowMultiple: true,
    })
    expect(wrapper.props('allowMultiple')).toBe(true)
  })

  it('prepends null option when showNull is true in single mode', () => {
    const wrapper = createWrapper({
      showNull: true,
      allowMultiple: false,
      options: ['#FF0000', '#00FF00'],
    })

    const buttons = wrapper.findAll('button.nb-color-strip-color')
    expect(buttons).toHaveLength(3)
    expect(
      buttons[0].find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('empty')
  })

  it('prepends null option when model is null in single mode', () => {
    const wrapper = createWrapper({
      showNull: false,
      allowMultiple: false,
      options: ['#FF0000', '#00FF00'],
      modelValue: null,
    })

    const buttons = wrapper.findAll('button.nb-color-strip-color')
    expect(buttons).toHaveLength(3)
    expect(
      buttons[0].find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('empty')
  })

  it('does not prepend null option when allowMultiple is true', () => {
    const wrapper = createWrapper({
      showNull: true,
      allowMultiple: true,
      options: ['#FF0000', '#00FF00'],
    })

    const buttons = wrapper.findAll('button.nb-color-strip-color')
    expect(buttons).toHaveLength(2)
    expect(
      wrapper.find('[data-testid="nb-icon"][data-name="empty"]').exists(),
    ).toBe(false)
  })

  it('clears selection when null option is selected in single mode', async () => {
    const wrapper = createWrapper({
      showNull: true,
      allowMultiple: false,
      modelValue: '#FF0000',
    })

    const buttons = wrapper.findAll('button.nb-color-strip-color')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })

  it('renders empty icon as duotone when null option is selected', () => {
    const wrapper = createWrapper({
      showNull: true,
      allowMultiple: false,
      modelValue: null,
      options: ['#FF0000'],
    })

    const nullIcon = wrapper.get(
      'button.nb-color-strip-color [data-testid="nb-icon"]',
    )
    expect(nullIcon.attributes('data-name')).toBe('empty')
    expect(nullIcon.attributes('data-weight')).toBe('duotone')
  })

  it('keeps null option visible after selecting a color when model starts as null', async () => {
    const wrapper = createWrapper({
      showNull: false,
      allowMultiple: false,
      modelValue: null,
      options: ['#FF0000', '#00FF00'],
    })

    const beforeButtons = wrapper.findAll('button.nb-color-strip-color')
    expect(beforeButtons).toHaveLength(3)
    expect(
      beforeButtons[0].find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('empty')

    await beforeButtons[1].trigger('click')
    await wrapper.setProps({ modelValue: '#FF0000' })

    const afterButtons = wrapper.findAll('button.nb-color-strip-color')
    expect(afterButtons).toHaveLength(3)
    expect(
      afterButtons[0].find('[data-testid="nb-icon"]').attributes('data-name'),
    ).toBe('empty')
  })
})
