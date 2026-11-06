import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  provideNbStrings,
  useNbStrings,
  resetNbStrings,
  NB_DEFAULT_STRINGS,
} from '../src/composables/useNbStrings.composable'
import { createToastQueue } from '../src/composables/useToast.composable'
import Pagination from '../src/components/Pagination.vue'
import NumberInput from '../src/components/NumberInput.vue'

afterEach(() => resetNbStrings())

function withStrings(
  overrides: Parameters<typeof provideNbStrings>[0],
  child: ReturnType<typeof defineComponent>,
  props: Record<string, unknown> = {},
) {
  return mount(
    defineComponent({
      setup() {
        provideNbStrings(overrides)
        return () => h(child, props)
      },
    }),
  )
}

describe('useNbStrings', () => {
  it('returns the en-US defaults with no provider', () => {
    const Probe = defineComponent({
      setup() {
        const strings = useNbStrings()
        return () => h('span', strings.value.paginationNext)
      },
    })
    expect(mount(Probe).text()).toBe(NB_DEFAULT_STRINGS.paginationNext)
  })

  it('works outside a component', () => {
    expect(useNbStrings().value.modalClose).toBe('Close')
  })

  it('reaches a component through provideNbStrings', () => {
    const wrapper = withStrings(
      {
        paginationPrevious: 'Vorherige Seite',
        paginationPageOf: (page, total) => `Seite ${page} von ${total}`,
      },
      Pagination,
      { page: 2, pageSize: 10, total: 95 },
    )
    const prev = wrapper.findAll('.nb-pagination__nav')[0]
    expect(prev.attributes('aria-label')).toBe('Vorherige Seite')
    expect(wrapper.find('.nb-pagination__page-of').text()).toBe(
      'Seite 2 von 10',
    )
    // Keys that were not overridden keep their default.
    const next = wrapper.findAll('.nb-pagination__nav')[1]
    expect(next.attributes('aria-label')).toBe('Next page')
  })

  it('merges a nested provider over its parent', () => {
    const Inner = defineComponent({
      setup() {
        provideNbStrings({ numberInputIncrease: 'Plus' })
        return () => h(NumberInput, { modelValue: 1, label: 'Qty' })
      },
    })
    const wrapper = withStrings({ numberInputDecrease: 'Minus' }, Inner)
    const names = wrapper
      .findAll('button')
      .map((button) => button.attributes('aria-label'))
    expect(names).toContain('Minus')
    expect(names).toContain('Plus')
  })

  it('follows a ref, so the language can switch at runtime', async () => {
    const strings = ref({ paginationNext: 'Weiter' })
    const wrapper = withStrings(strings, Pagination, {
      page: 1,
      pageSize: 10,
      total: 95,
    })
    const next = () =>
      wrapper.findAll('.nb-pagination__nav')[1].attributes('aria-label')
    expect(next()).toBe('Weiter')
    strings.value = { paginationNext: 'Suivant' }
    await nextTick()
    expect(next()).toBe('Suivant')
  })

  it('sets the global catalogue when called outside a component', () => {
    provideNbStrings({ modalClose: 'Schließen' })
    expect(useNbStrings().value.modalClose).toBe('Schließen')
  })

  it('feeds the toast status words, under a queue override', () => {
    provideNbStrings({ toastError: 'Fehler', toastInfo: 'Hinweis' })
    const queue = createToastQueue({ statusLabels: { info: 'Info' } })
    expect(queue.labels.status.error).toBe('Fehler')
    expect(queue.labels.status.info).toBe('Info')
    expect(queue.labels.status.success).toBe('Success')
  })

  it('pluralizes the counted defaults', () => {
    expect(NB_DEFAULT_STRINGS.boardCardsSelected(1)).toBe('1 card selected')
    expect(NB_DEFAULT_STRINGS.boardCardsSelected(2)).toBe('2 cards selected')
    expect(NB_DEFAULT_STRINGS.blueprintInputs(1)).toBe('1 input')
  })
})
