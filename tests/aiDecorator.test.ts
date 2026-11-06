import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TextInput from '../src/components/TextInput.vue'
import Card from '../src/components/Card.vue'

/**
 * The `decorator` slot: the one agreed place for an NbAiLabel on a host.
 * In a field it sits inside the field, right and centred, at the far left of
 * the trailing actions. On a card it sits in the upper right corner.
 */

describe('NbTextInput decorator', () => {
  it('renders nothing extra without the slot', () => {
    const wrapper = mount(TextInput)
    expect(wrapper.find('.nb-text-input__decorator').exists()).toBe(false)
  })

  it('places the label inside the field, before the actions', () => {
    const wrapper = mount(TextInput, {
      slots: {
        decorator: '<span class="label">AI</span>',
        actions: '<button class="action">Clear</button>',
      },
    })
    const field = wrapper.find('.nb-text-input__field-wrapper')
    const decorator = field.find('.nb-text-input__decorator')
    expect(decorator.find('.label').exists()).toBe(true)
    const children = Array.from(field.element.children)
    const at = children.indexOf(decorator.element)
    const actions = children.indexOf(
      field.find('.nb-text-input__actions').element,
    )
    const input = children.indexOf(field.find('input').element)
    expect(at).toBeGreaterThan(input)
    expect(at).toBeLessThan(actions)
  })
})

describe('NbCard decorator', () => {
  it('renders nothing extra without the slot', () => {
    const wrapper = mount(Card, { props: { title: 'Summary' } })
    expect(wrapper.find('.nb-card__decorator').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('nb-card--decorated')
  })

  it('places the label in the card and marks the card', () => {
    const wrapper = mount(Card, {
      props: { title: 'Summary' },
      slots: { decorator: '<button class="label">AI</button>' },
    })
    expect(wrapper.classes()).toContain('nb-card--decorated')
    expect(wrapper.find('.nb-card__decorator .label').exists()).toBe(true)
  })

  it('keeps a click on the label from activating a clickable card', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Card, {
      props: { title: 'Summary' },
      attrs: { onClick },
      slots: { decorator: '<button class="label">AI</button>' },
    })
    await wrapper.find('.label').trigger('click')
    expect(onClick).not.toHaveBeenCalled()
  })
})
