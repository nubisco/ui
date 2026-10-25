import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import TextInput from '../src/components/TextInput.vue'
import SuggestionList from '../src/components/SuggestionList.vue'

// The list is driven from the field: focus never leaves it. So every test types
// into the real NbTextInput and asserts what the list and the field say.

const people = [
  { id: 1, label: 'Ada Lovelace' },
  { id: 2, label: 'Alan Turing' },
  { id: 3, label: 'Grace Hopper' },
]

let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

function mountComposer(
  opts: {
    items?: unknown[]
    emptyText?: string
    placement?: 'top' | 'bottom'
    outerKeydown?: (e: KeyboardEvent) => void
  } = {},
) {
  const picked = ref<unknown[]>([])
  const open = ref(true)
  const items = ref(opts.items ?? people)
  const Host = defineComponent({
    components: { TextInput, SuggestionList },
    setup: () => ({
      picked,
      open,
      items,
      emptyText: opts.emptyText ?? '',
      placement: opts.placement ?? 'bottom',
      onOuter: (e: KeyboardEvent) => opts.outerKeydown?.(e),
    }),
    template: `
      <div @keydown="onOuter">
        <TextInput label="Comment">
          <template #dropdown>
            <SuggestionList
              v-model:open="open"
              :items="items"
              :item-key="(p) => p.id"
              :empty-text="emptyText"
              :placement="placement"
              label="People"
              @select="(item) => picked.push(item)"
            />
          </template>
        </TextInput>
      </div>`,
  })
  wrapper = mount(Host, { attachTo: document.body })
  return { wrapper, picked, open, items }
}

const field = () => wrapper!.find('input')
const key = (k: string, init: KeyboardEventInit = {}) =>
  field().element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: k,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  )

describe('NbSuggestionList', () => {
  it('renders a listbox of options with the first one active', async () => {
    mountComposer()
    await nextTick()
    const list = wrapper!.find('[role="listbox"]')
    expect(list.exists()).toBe(true)
    expect(list.attributes('aria-label')).toBe('People')
    const options = wrapper!.findAll('[role="option"]')
    expect(options.map((o) => o.text())).toEqual([
      'Ada Lovelace',
      'Alan Turing',
      'Grace Hopper',
    ])
    expect(options[0].attributes('aria-selected')).toBe('true')
  })

  it('makes the field a combobox that points at the active option', async () => {
    mountComposer()
    await nextTick()
    const input = field()
    const listId = wrapper!.find('[role="listbox"]').attributes('id')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-autocomplete')).toBe('list')
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(input.attributes('aria-controls')).toBe(listId)
    expect(input.attributes('aria-activedescendant')).toBe(
      wrapper!.findAll('[role="option"]')[0].attributes('id'),
    )
  })

  it('moves the active option with the arrows, wrapping at both ends', async () => {
    mountComposer()
    await nextTick()
    key('ArrowDown')
    await nextTick()
    let options = wrapper!.findAll('[role="option"]')
    expect(options[1].attributes('aria-selected')).toBe('true')
    expect(field().attributes('aria-activedescendant')).toBe(
      options[1].attributes('id'),
    )
    key('ArrowDown')
    key('ArrowDown')
    await nextTick()
    options = wrapper!.findAll('[role="option"]')
    expect(options[0].attributes('aria-selected')).toBe('true')
    key('ArrowUp')
    await nextTick()
    expect(
      wrapper!.findAll('[role="option"]')[2].attributes('aria-selected'),
    ).toBe('true')
  })

  it('chooses the active option on Enter, and closes', async () => {
    const { picked, open } = mountComposer()
    await nextTick()
    key('ArrowDown')
    const notCancelled = key('Enter')
    await nextTick()
    expect(notCancelled).toBe(false)
    expect(picked.value).toEqual([people[1]])
    expect(open.value).toBe(false)
    expect(wrapper!.find('[role="listbox"]').exists()).toBe(false)
    expect(field().attributes('aria-expanded')).toBe('false')
  })

  it('chooses on Tab too, so the caret does not leave the field', async () => {
    const { picked } = mountComposer()
    await nextTick()
    expect(key('Tab')).toBe(false)
    expect(picked.value).toEqual([people[0]])
  })

  it('chooses an option on click without taking focus from the field', async () => {
    const { picked } = mountComposer()
    await nextTick()
    const option = wrapper!.findAll('[role="option"]')[2]
    const down = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    })
    option.element.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    await option.trigger('click')
    expect(picked.value).toEqual([people[2]])
  })

  it('closes on Escape without letting it reach the modal around it', async () => {
    let reached = false
    const { open, picked } = mountComposer({
      outerKeydown: (e) => {
        if (e.key === 'Escape') reached = true
      },
    })
    await nextTick()
    key('Escape')
    await nextTick()
    expect(open.value).toBe(false)
    expect(reached).toBe(false)
    expect(picked.value).toEqual([])
  })

  it('leaves keys alone once closed', async () => {
    let reached = false
    const { open } = mountComposer({
      outerKeydown: (e) => {
        if (e.key === 'Escape') reached = true
      },
    })
    open.value = false
    await nextTick()
    expect(key('Enter')).toBe(true)
    key('Escape')
    expect(reached).toBe(true)
  })

  it('closes when the field loses focus', async () => {
    const { open } = mountComposer()
    await nextTick()
    field().element.dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('starts from the top when the suggestions change', async () => {
    const { items } = mountComposer()
    await nextTick()
    key('ArrowDown')
    items.value = [people[2], people[0]]
    await nextTick()
    expect(
      wrapper!.findAll('[role="option"]')[0].attributes('aria-selected'),
    ).toBe('true')
  })

  it('shows the empty text when nothing matches', async () => {
    mountComposer({ items: [], emptyText: 'Nobody matches' })
    await nextTick()
    expect(wrapper!.find('.nb-suggestion-list__empty').text()).toBe(
      'Nobody matches',
    )
    expect(field().attributes('aria-activedescendant')).toBeUndefined()
  })

  it('draws nothing for an empty list without an empty state', async () => {
    mountComposer({ items: [] })
    await nextTick()
    expect(wrapper!.find('[role="listbox"]').exists()).toBe(false)
    expect(field().attributes('aria-expanded')).toBe('false')
  })

  it('opens above the field when asked', async () => {
    mountComposer({ placement: 'top' })
    await nextTick()
    expect(wrapper!.find('.nb-suggestion-list--top').exists()).toBe(true)
  })

  it('renders rows through the item slot', async () => {
    const Host = defineComponent({
      components: { TextInput, SuggestionList },
      setup: () => ({ people }),
      template: `
        <TextInput>
          <template #dropdown>
            <SuggestionList :items="people">
              <template #item="{ item, active }">
                <strong>{{ item.label }}</strong><em v-if="active">*</em>
              </template>
            </SuggestionList>
          </template>
        </TextInput>`,
    })
    wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    const first = wrapper.findAll('[role="option"]')[0]
    expect(first.find('strong').text()).toBe('Ada Lovelace')
    expect(first.find('em').exists()).toBe(true)
  })

  it('gives the field back exactly as it was when the list goes away', async () => {
    const show = ref(true)
    const Host = defineComponent({
      components: { TextInput, SuggestionList },
      setup: () => ({ people, show }),
      template: `
        <TextInput>
          <template v-if="show" #dropdown>
            <SuggestionList :items="people" />
          </template>
        </TextInput>`,
    })
    wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    expect(field().attributes('role')).toBe('combobox')
    show.value = false
    await nextTick()
    expect(field().attributes('role')).toBeUndefined()
    expect(field().attributes('aria-expanded')).toBeUndefined()
    expect(key('ArrowDown')).toBe(true)
  })

  it('handles a key before a handler the product put on the same field', async () => {
    // A composer that sends on Enter must be able to tell that this Enter
    // chose a suggestion. The list listens in capture, so it marks it first.
    const seen: boolean[] = []
    const Host = defineComponent({
      components: { TextInput, SuggestionList },
      setup: () => ({
        people,
        onKey: (e: KeyboardEvent) => seen.push(e.defaultPrevented),
      }),
      template: `
        <TextInput @keydown="onKey">
          <template #dropdown><SuggestionList :items="people" /></template>
        </TextInput>`,
    })
    wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    key('Enter')
    expect(seen).toEqual([true])
  })

  it('binds to a field outside NbTextInput by id', async () => {
    const picked = ref<unknown[]>([])
    const Host = defineComponent({
      components: { SuggestionList },
      setup: () => ({ picked, items: ['one', 'two'] }),
      template: `
        <div>
          <input id="plain-field" />
          <SuggestionList for="plain-field" :items="items" @select="(i) => picked.push(i)" />
        </div>`,
    })
    wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    key('ArrowDown')
    key('Enter')
    expect(picked.value).toEqual(['two'])
  })
})
