import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'
import TextInput from '../src/components/TextInput.vue'
import SuggestionList from '../src/components/SuggestionList.vue'

/**
 * Suggestions that come from a server are not there yet when the list opens.
 * Every hand-rolled picker in the fleet composed a field, a list and a
 * loading state; the list now owns the third one too.
 */
let wrapper: VueWrapper | null = null
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

function mountPicker(opts: { emptyText?: string; items?: unknown[] } = {}) {
  const loading = ref(true)
  const items = ref(opts.items ?? [])
  const Host = defineComponent({
    components: { TextInput, SuggestionList },
    setup: () => ({ loading, items, emptyText: opts.emptyText ?? '' }),
    template: `
      <TextInput label="Assign to">
        <template #dropdown>
          <SuggestionList
            :items="items"
            :loading="loading"
            :empty-text="emptyText"
            loading-text="Searching"
            label="People"
          />
        </template>
      </TextInput>`,
  })
  wrapper = mount(Host, { attachTo: document.body })
  return { loading, items }
}

describe('NbSuggestionList loading', () => {
  it('stays open with a loading row while nothing has arrived', async () => {
    mountPicker({ emptyText: 'No one matches' })
    await nextTick()
    const list = wrapper!.find('[role="listbox"]')
    expect(list.exists()).toBe(true)
    expect(list.attributes('aria-busy')).toBe('true')
    expect(wrapper!.find('.nb-suggestion-list__loading').text()).toContain(
      'Searching',
    )
    expect(wrapper!.find('.nb-suggestion-list__empty').exists()).toBe(false)
    expect(wrapper!.findAll('[role="option"]')).toHaveLength(0)
  })

  it('opens for loading alone, without an empty text', async () => {
    mountPicker()
    await nextTick()
    expect(wrapper!.find('[role="listbox"]').exists()).toBe(true)
  })

  it('shows the empty state only once loading is over', async () => {
    const { loading } = mountPicker({ emptyText: 'No one matches' })
    await nextTick()
    loading.value = false
    await nextTick()
    expect(wrapper!.find('.nb-suggestion-list__loading').exists()).toBe(false)
    expect(wrapper!.find('.nb-suggestion-list__empty').text()).toBe(
      'No one matches',
    )
    expect(
      wrapper!.find('[role="listbox"]').attributes('aria-busy'),
    ).toBeUndefined()
  })

  it('keeps the rows it has while a refinement is pending', async () => {
    mountPicker({ items: [{ label: 'Ada Lovelace' }] })
    await nextTick()
    expect(wrapper!.findAll('[role="option"]')).toHaveLength(1)
    expect(wrapper!.find('.nb-suggestion-list__loading').exists()).toBe(true)
  })
})
