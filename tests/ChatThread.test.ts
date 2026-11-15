import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import ChatThread from '../src/components/ChatThread.vue'
import ChatMessage from '../src/components/ChatMessage.vue'
import { resetPhoneLayoutForTests } from '../src/composables/usePhoneLayout.composable'

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
})

const flush = async () => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

/** Gives a jsdom element the scroll geometry jsdom does not compute. */
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

function stubPhone(matches: boolean) {
  resetPhoneLayoutForTests()
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: matches && query.includes('max-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('NbChatMessage', () => {
  it('shows the author, the time and the text', () => {
    const w = mount(ChatMessage, {
      props: {
        author: 'Ada',
        text: 'Hello\nthere',
        time: '2026-11-15T10:30:00Z',
        locale: 'en-GB',
      },
    })
    expect(w.find('.nb-chat-message__author').text()).toBe('Ada')
    const time = w.find('time')
    expect(time.attributes('datetime')).toBe('2026-11-15T10:30:00.000Z')
    expect(time.text()).toMatch(/\d{2}:\d{2}/)
    expect(time.attributes('title')).toBeTruthy()
    expect(w.find('.nb-chat-message__body').text()).toBe('Hello\nthere')
  })

  it('takes a ready-made time label', () => {
    const w = mount(ChatMessage, {
      props: { author: 'Ada', text: 'x', timeLabel: 'just now' },
    })
    expect(w.find('time').text()).toBe('just now')
  })

  it('marks the viewer’s own message', () => {
    const other = mount(ChatMessage, { props: { author: 'Ada', text: 'x' } })
    const own = mount(ChatMessage, {
      props: { author: 'You', text: 'x', own: true },
    })
    expect(other.classes()).not.toContain('nb-chat-message--own')
    expect(own.classes()).toContain('nb-chat-message--own')
  })

  it('draws an avatar only when picture is given, initials for null', () => {
    const none = mount(ChatMessage, { props: { author: 'Ada', text: 'x' } })
    expect(none.find('.nb-avatar').exists()).toBe(false)
    const initials = mount(ChatMessage, {
      props: { author: 'Ada Lovelace', text: 'x', picture: null },
    })
    const avatar = initials.find('.nb-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.text()).toContain('AL')
  })

  it('labels a message a model wrote, with its explanation', () => {
    const plain = mount(ChatMessage, { props: { author: 'Ada', text: 'x' } })
    expect(plain.find('.nb-ai-label').exists()).toBe(false)

    const ai = mount(ChatMessage, {
      props: {
        author: 'Assistant',
        text: 'x',
        ai: true,
        aiExplain: 'Written by the workspace model.',
      },
    })
    const label = ai.find('.nb-chat-message__head .nb-ai-label')
    expect(label.exists()).toBe(true)
    // With something to explain it is a control, not a bare mark.
    expect(label.element.tagName).toBe('BUTTON')
  })

  it('takes a whole AI label of the host’s own', () => {
    const w = mount(ChatMessage, {
      props: { author: 'Assistant', text: 'x' },
      slots: { 'ai-label': '<span class="own-label">AI</span>' },
    })
    expect(w.find('.own-label').exists()).toBe(true)
  })

  it('renders rich content from the default slot over text', () => {
    const w = mount(ChatMessage, {
      props: { author: 'Ada', text: 'plain' },
      slots: { default: '<strong>rich</strong>' },
    })
    expect(w.find('.nb-chat-message__body strong').text()).toBe('rich')
    expect(w.text()).not.toContain('plain')
  })
})

function thread(
  props: Record<string, unknown> = {},
  messages = ['one', 'two'],
) {
  const list = ref(messages)
  const Host = defineComponent({
    setup() {
      return () =>
        h(ChatThread, props, {
          default: () =>
            list.value.map((text, i) =>
              h(ChatMessage, { key: i, author: 'Ada', text }),
            ),
          empty: () => h('p', { class: 'empty' }, 'Say hello'),
        })
    },
  })
  const w = mount(Host, { attachTo: document.body })
  return { w, list }
}

describe('NbChatThread', () => {
  it('is a polite log with a name', () => {
    const { w } = thread()
    const log = w.find('[role="log"]')
    expect(log.attributes('aria-live')).toBe('polite')
    expect(log.attributes('aria-label')).toBe('Conversation')
    expect(log.attributes('tabindex')).toBe('0')
    expect(w.findAll('.nb-chat-message')).toHaveLength(2)
  })

  it('shows the empty slot while there are no messages', () => {
    const { w } = thread({}, [])
    expect(w.find('.empty').exists()).toBe(true)
  })

  it('shows a working indicator after the newest message', () => {
    const { w } = thread({ working: true, workingLabel: 'Thinking' })
    const log = w.find('[role="log"]')
    expect(log.attributes('aria-busy')).toBe('true')
    const working = w.find('.nb-chat-thread__working')
    expect(working.text()).toContain('Thinking')
    expect(log.element.lastElementChild).toBe(working.element)
  })

  it('follows the newest message while the reader is at the end', async () => {
    const { w, list } = thread()
    const log = w.find('[role="log"]').element as HTMLElement
    geometry(log, 400)
    log.scrollTop = 300
    await w.find('[role="log"]').trigger('scroll')
    geometry(log, 500)
    list.value = [...list.value, 'three']
    await flush()
    expect(log.scrollTop).toBe(500)
    expect(w.find('.nb-chat-thread__jump').exists()).toBe(false)
  })

  it('stays put when the reader scrolled up, and offers a jump', async () => {
    const { w, list } = thread()
    const log = w.find('[role="log"]').element as HTMLElement
    geometry(log, 400)
    log.scrollTop = 50
    await w.find('[role="log"]').trigger('scroll')
    list.value = [...list.value, 'three']
    await flush()
    expect(log.scrollTop).toBe(50)
    const jump = w.find('.nb-chat-thread__jump button')
    expect(jump.text()).toBe('Jump to newest')
    await jump.trigger('click')
    await flush()
    expect(log.scrollTop).toBe(400)
    // The button leaves through a transition, which takes a frame.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(w.find('.nb-chat-thread__jump').exists()).toBe(false)
  })

  it('has no composer unless asked', () => {
    const { w } = thread()
    expect(w.find('textarea').exists()).toBe(false)
  })
})

describe('NbChatThread composer', () => {
  function composer(props: Record<string, unknown> = {}) {
    const w = mount(ChatThread, {
      props: {
        composer: true,
        draft: '',
        'onUpdate:draft': (v: string) => w.setProps({ draft: v }),
        ...props,
      },
      attachTo: document.body,
    })
    return w
  }

  it('is a named multiline field with a send button', () => {
    const w = composer()
    const field = w.find('textarea')
    expect(field.attributes('aria-label')).toBe('Message')
    expect(field.attributes('placeholder')).toBe('Write a message')
    expect(field.attributes('enterkeyhint')).toBe('send')
    expect(w.find('.nb-chat-thread__send').attributes('aria-label')).toBe(
      'Send',
    )
  })

  it('sends the trimmed text on Enter and empties itself', async () => {
    const w = composer({ draft: '  hello  ' })
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')?.[0]).toEqual(['hello'])
    expect(w.emitted('update:draft')?.at(-1)).toEqual([''])
  })

  it('breaks the line on Shift+Enter', async () => {
    const w = composer({ draft: 'hello' })
    await w
      .find('textarea')
      .trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(w.emitted('send')).toBeUndefined()
  })

  it('leaves Enter to an input method that is composing', async () => {
    const w = composer({ draft: 'hello' })
    await w
      .find('textarea')
      .trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('send')).toBeUndefined()
  })

  it('sends on the button', async () => {
    const w = composer({ draft: 'hello' })
    await w.find('form').trigger('submit')
    expect(w.emitted('send')?.[0]).toEqual(['hello'])
  })

  it('sends nothing blank', async () => {
    const w = composer({ draft: '   ' })
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')).toBeUndefined()
  })

  it('breaks the line on Enter on a phone, and the button sends', async () => {
    stubPhone(true)
    const w = composer({ draft: 'hello' })
    expect(w.find('textarea').attributes('enterkeyhint')).toBe('enter')
    await w.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(w.emitted('send')).toBeUndefined()
    await w.find('form').trigger('submit')
    expect(w.emitted('send')?.[0]).toEqual(['hello'])
  })

  it('is disabled with a reason, and sends nothing', async () => {
    const w = composer({
      draft: 'hello',
      disabled: true,
      disabledReason: 'The agent is not running',
    })
    expect(w.find('textarea').attributes('disabled')).toBeDefined()
    expect(w.find('.nb-chat-thread__reason').text()).toBe(
      'The agent is not running',
    )
    const send = w.find('.nb-chat-thread__send')
    expect(send.attributes('aria-disabled')).toBe('true')
    await w.find('form').trigger('submit')
    expect(w.emitted('send')).toBeUndefined()
  })

  it('offers a stop button only while working and stoppable', async () => {
    const w = composer({ working: true })
    expect(w.find('.nb-chat-thread__stop').exists()).toBe(false)
    await w.setProps({ stoppable: true })
    const stop = w.find('.nb-chat-thread__stop')
    expect(stop.attributes('aria-label')).toBe('Stop')
    await stop.trigger('click')
    expect(w.emitted('stop')).toHaveLength(1)
    await w.setProps({ working: false })
    expect(w.find('.nb-chat-thread__stop').exists()).toBe(false)
  })
})
