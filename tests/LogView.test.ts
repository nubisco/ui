import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogView from '../src/components/LogView.vue'
import CopyButton from '../src/components/CopyButton.vue'
import type { ILogLine } from '../src/components/LogView.d'

enableAutoUnmount(afterEach)

const flush = async () => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

function geometry(el: HTMLElement, scrollHeight: number, clientHeight = 100) {
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  })
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  })
}

describe('NbLogView', () => {
  it('is a named log that does not announce by default', () => {
    const w = mount(LogView, { props: { lines: ['a'] } })
    const log = w.find('[role="log"]')
    expect(log.attributes('aria-label')).toBe('Log')
    expect(log.attributes('aria-live')).toBe('off')
    expect(log.attributes('tabindex')).toBe('0')
    const loud = mount(LogView, { props: { lines: ['a'], announce: true } })
    expect(loud.find('[role="log"]').attributes('aria-live')).toBe('polite')
  })

  it('renders plain strings and line objects', () => {
    const lines: ILogLine[] = [
      { text: 'started', time: '2026-11-15T10:30:05Z', timeLabel: '10:30:05' },
      { text: 'disk almost full', level: 'warning' },
      { text: 'failed', level: 'error', marker: 'stderr' },
      { text: 'noise', level: 'debug' },
    ]
    const w = mount(LogView, { props: { lines: ['plain', ...lines] } })
    const rows = w.findAll('.nb-log-view__line')
    expect(rows).toHaveLength(5)
    expect(rows[0].text()).toBe('plain')
    expect(rows[1].find('time').text()).toBe('10:30:05')
    expect(rows[1].find('time').attributes('datetime')).toBe(
      '2026-11-15T10:30:05.000Z',
    )
    // A warning or error without a marker takes the level's word.
    expect(rows[2].classes()).toContain('nb-log-view__line--warning')
    expect(rows[2].find('.nb-log-view__marker').text()).toBe('warning')
    expect(rows[3].classes()).toContain('nb-log-view__line--error')
    expect(rows[3].find('.nb-log-view__marker').text()).toBe('stderr')
    expect(rows[4].classes()).toContain('nb-log-view__line--debug')
    expect(rows[4].find('.nb-log-view__marker').exists()).toBe(false)
  })

  it('formats a time with seconds in the given locale', () => {
    const w = mount(LogView, {
      props: {
        lines: [{ text: 'x', time: new Date(2026, 10, 15, 9, 5, 7) }],
        locale: 'en-GB',
      },
    })
    expect(w.find('time').text()).toBe('09:05:07')
  })

  it('reads on a 24-hour clock whatever the locale', () => {
    const w = mount(LogView, {
      props: {
        lines: [{ text: 'x', time: new Date(2026, 10, 15, 21, 5, 7) }],
        locale: 'en-US',
      },
    })
    expect(w.find('time').text()).toBe('21:05:07')
  })

  it('renders only the newest maxLines, and says how many are not shown', () => {
    const lines = Array.from({ length: 2500 }, (_, i) => `line ${i}`)
    const w = mount(LogView, { props: { lines, maxLines: 1000 } })
    const rows = w.findAll('.nb-log-view__line')
    expect(rows).toHaveLength(1000)
    expect(rows[0].text()).toBe('line 1500')
    expect(rows[999].text()).toBe('line 2499')
    expect(w.find('.nb-log-view__hidden').text()).toBe(
      '1,500 earlier lines not shown',
    )
  })

  it('renders every line with maxLines 0', () => {
    const lines = Array.from({ length: 1200 }, (_, i) => `line ${i}`)
    const w = mount(LogView, { props: { lines, maxLines: 0 } })
    expect(w.findAll('.nb-log-view__line')).toHaveLength(1200)
    expect(w.find('.nb-log-view__hidden').exists()).toBe(false)
  })

  it('copies every line, the hidden ones too', () => {
    const w = mount(LogView, {
      props: {
        lines: [
          'one',
          { text: 'two', timeLabel: '10:00:00', level: 'error' },
          'three',
        ],
        maxLines: 1,
      },
    })
    const copy = w.findComponent(CopyButton)
    expect(copy.exists()).toBe(true)
    expect(copy.props('text')).toBe('one\n10:00:00 error two\nthree')
    expect(copy.props('label')).toBe('Copy log')
  })

  it('hides the copy button when not copyable, or while empty', () => {
    const off = mount(LogView, { props: { lines: ['a'], copyable: false } })
    expect(off.find('.nb-log-view__copy').exists()).toBe(false)
    const empty = mount(LogView, { props: { lines: [] } })
    expect(empty.find('.nb-log-view__copy').exists()).toBe(false)
  })

  it('says it is empty, in its own words or the slot', () => {
    const w = mount(LogView, { props: { lines: [] } })
    expect(w.find('.nb-log-view__empty').text()).toBe('No output yet')
    const own = mount(LogView, {
      props: { lines: [] },
      slots: { empty: '<span class="waiting">Waiting for the run</span>' },
    })
    expect(own.find('.waiting').exists()).toBe(true)
  })

  it('wraps by default, and scrolls sideways with wrap off', () => {
    const w = mount(LogView, { props: { lines: ['a'] } })
    expect(w.classes()).not.toContain('nb-log-view--nowrap')
    const off = mount(LogView, { props: { lines: ['a'], wrap: false } })
    expect(off.classes()).toContain('nb-log-view--nowrap')
  })

  it('keys lines by position, so appending keeps the rendered ones', async () => {
    const w = mount(LogView, { props: { lines: ['a', 'b'] } })
    const first = w.findAll('.nb-log-view__line')[0].element
    await w.setProps({ lines: ['a', 'b', 'c'] })
    expect(w.findAll('.nb-log-view__line')[0].element).toBe(first)
  })

  it('follows the newest line, and stops when the reader scrolls up', async () => {
    const w = mount(LogView, {
      props: { lines: ['a', 'b'] },
      attachTo: document.body,
    })
    const log = w.find('[role="log"]').element as HTMLElement
    geometry(log, 300)
    log.scrollTop = 200
    await w.find('[role="log"]').trigger('scroll')
    geometry(log, 320)
    await w.setProps({ lines: ['a', 'b', 'c'] })
    await flush()
    expect(log.scrollTop).toBe(320)

    log.scrollTop = 10
    await w.find('[role="log"]').trigger('scroll')
    await w.setProps({ lines: ['a', 'b', 'c', 'd'] })
    await flush()
    expect(log.scrollTop).toBe(10)
    expect(w.find('.nb-log-view__jump').exists()).toBe(true)
  })

  it('does not move when follow is off', async () => {
    const w = mount(LogView, {
      props: { lines: ['a'], follow: false },
      attachTo: document.body,
    })
    const log = w.find('[role="log"]').element as HTMLElement
    geometry(log, 300)
    log.scrollTop = 0
    await w.setProps({ lines: ['a', 'b'] })
    await flush()
    expect(log.scrollTop).toBe(0)
  })
})
