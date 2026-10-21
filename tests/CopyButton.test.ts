import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import NbCopyButton from '../src/components/CopyButton.vue'
import tooltipDirective from '@/directives/ToolTip.directive'

/** The tooltip is the app's global directive, as it is in a real host. */
const global = { plugins: [{ install: tooltipDirective }] }

enableAutoUnmount(afterEach)

const writeText = vi.fn()

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function iconOf(view: ReturnType<typeof mount>): string {
  // The drawing itself: the copy and check glyphs are different paths.
  return view.find('.nb-button__icon').html()
}

describe('NbCopyButton', () => {
  it('copies the text and turns into a checkmark, then back', async () => {
    vi.useFakeTimers()
    const view = mount(NbCopyButton, {
      props: { text: 'https://acta.test/s/MA?item=MA-123', label: 'Copy link' },
      global,
    })
    const before = iconOf(view)

    await view.find('button').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('https://acta.test/s/MA?item=MA-123')
    expect(view.emitted('copied')?.[0]).toEqual([
      'https://acta.test/s/MA?item=MA-123',
    ])
    expect(view.find('.nb-copy-button__button--copied').exists()).toBe(true)
    expect(iconOf(view)).not.toBe(before)
    expect(view.find('[role="status"]').text()).toBe('Copied')

    vi.advanceTimersByTime(1500)
    await flushPromises()
    expect(view.find('.nb-copy-button__button--copied').exists()).toBe(false)
    expect(iconOf(view)).toBe(before)
    expect(view.find('[role="status"]').text()).toBe('')
  })

  it('does not let the click reach a clickable parent', async () => {
    const parentClick = vi.fn()
    const view = mount(
      {
        components: { NbCopyButton },
        template: '<div @click="parentClick"><NbCopyButton text="x" /></div>',
        setup: () => ({ parentClick }),
      },
      { global },
    )
    await view.find('button').trigger('click')
    await view.find('button').trigger('pointerdown')
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('reports a refusal and shows no checkmark', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    // jsdom has no execCommand, so the fallback refuses too.
    const view = mount(NbCopyButton, { props: { text: 'x' }, global })
    await view.find('button').trigger('click')
    await flushPromises()
    expect(view.emitted('error')).toHaveLength(1)
    expect(view.emitted('copied')).toBeUndefined()
    expect(view.find('.nb-copy-button__button--copied').exists()).toBe(false)
  })

  it('names itself by its label', () => {
    const view = mount(NbCopyButton, {
      props: { text: 'x', label: 'Copy link to MA-123' },
      global,
    })
    expect(view.find('button').attributes('aria-label')).toBe(
      'Copy link to MA-123',
    )
  })
})
