import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NbMenu from '../src/components/Menu.vue'
import NbSelect from '../src/components/Select.vue'

/**
 * A menu holding a form: a filter panel, a quick edit. The select's list is
 * teleported to <body>, outside the menu. Pressing one of its options used to
 * count as a press outside: the menu closed on mousedown, the select went with
 * it, and the pick never landed. Acta's board filter lost every goal picked
 * in it this way, and so did its card quick edit.
 */

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

const mounted: VueWrapper[] = []

afterEach(async () => {
  mounted.splice(0).forEach((w) => w.unmount())
  await new Promise((resolve) => setTimeout(resolve, 50))
  document.body.innerHTML = ''
})

async function mountMenuWithSelect() {
  const open = ref(false)
  const picked = ref<unknown>(null)
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          NbMenu,
          {
            open: open.value,
            'onUpdate:open': (value: boolean) => (open.value = value),
          },
          () => [
            h(NbSelect, {
              id: 'goal',
              modelValue: picked.value as string | null,
              options: [
                { label: 'G-1 Ship it', value: 1 },
                { label: 'G-2 Sell it', value: 2 },
              ],
              'onUpdate:modelValue': (value: unknown) => (picked.value = value),
            }),
          ],
        )
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  mounted.push(wrapper)
  open.value = true
  await nextTick()
  await nextTick()
  return { open, picked }
}

describe('a select inside a menu', () => {
  it('picks an option without the menu closing under it', async () => {
    const { open, picked } = await mountMenuWithSelect()
    document.querySelector<HTMLElement>('#goal')!.click()
    await vi.waitFor(() => {
      if (document.querySelectorAll('.nb-select__option').length === 0)
        throw new Error('list not open yet')
    })
    const option = [
      ...document.querySelectorAll<HTMLElement>('.nb-select__option'),
    ].find((o) => o.textContent?.includes('G-2'))!
    // The order a pointer produces: mousedown first, which is when the menu
    // decides whether the press was outside it.
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(open.value).toBe(true)
    option.click()
    await nextTick()
    expect(picked.value).toBe(2)
  })

  it('still closes on a press that really is outside', async () => {
    const { open } = await mountMenuWithSelect()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('closes on Escape, though it holds a form and no items', async () => {
    const { open } = await mountMenuWithSelect()
    const trigger = document.querySelector<HTMLElement>('#goal')!
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('lets the first Escape close the open list, not the menu', async () => {
    const { open } = await mountMenuWithSelect()
    const trigger = document.querySelector<HTMLElement>('#goal')!
    trigger.click()
    await vi.waitFor(() => {
      if (document.querySelectorAll('.nb-select__option').length === 0)
        throw new Error('list not open yet')
    })
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    )
    await nextTick()
    expect(open.value).toBe(true)
    expect(document.querySelectorAll('.nb-select__option')).toHaveLength(0)
  })
})
