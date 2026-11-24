import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { toHexColor } from '../src/utils/codeEditorTheme.helper'

/**
 * A stand-in for Monaco: enough of `editor.create` to see what the component
 * asks of it, and to play the part of a person typing.
 */
const fake = vi.hoisted(() => {
  const state = {
    created: [] as Array<{ options: Record<string, any>; instance: any }>,
    themes: {} as Record<string, any>,
  }
  function create(host: HTMLElement, options: Record<string, any>) {
    let value = options.value as string
    const listeners: Record<string, Array<(e?: any) => void>> = {}
    const on = (name: string) => (fn: (e?: any) => void) => {
      ;(listeners[name] ??= []).push(fn)
      return { dispose() {} }
    }
    host.appendChild(document.createElement('textarea'))
    const model = {
      dispose: vi.fn(),
      getFullModelRange: () => ({ all: true }),
    }
    const instance = {
      getValue: () => value,
      getModel: () => model,
      getContentHeight: () => 40,
      onDidChangeModelContent: on('change'),
      onDidContentSizeChange: on('size'),
      onDidFocusEditorText: on('focus'),
      onDidBlurEditorText: on('blur'),
      executeEdits: vi.fn((_source: string, edits: Array<{ text: string }>) => {
        value = edits[0].text
        listeners.change?.forEach((fn) => fn())
      }),
      pushUndoStop: vi.fn(),
      updateOptions: vi.fn(),
      focus: vi.fn(),
      dispose: vi.fn(),
      getAction: vi.fn(() => ({ run: vi.fn() })),
      /** A person typing: the content changes inside Monaco. */
      type(text: string) {
        value = text
        listeners.change?.forEach((fn) => fn())
      },
      grow(contentHeight: number) {
        listeners.size?.forEach((fn) => fn({ contentHeight }))
      },
    }
    state.created.push({ options, instance })
    return instance
  }
  return { state, create }
})

vi.mock('monaco-editor', () => {
  return {
    editor: {
      create: fake.create,
      defineTheme: (name: string, theme: unknown) => {
        fake.state.themes[name] = theme
      },
      setTheme: vi.fn(),
      setModelLanguage: vi.fn(),
    },
  }
})

import NbCodeEditor from '../src/components/CodeEditor.vue'

enableAutoUnmount(afterEach)

beforeEach(() => {
  fake.state.created = []
  fake.state.themes = {}
})

async function mountEditor(props: Record<string, unknown> = {}) {
  const view = mount(NbCodeEditor, {
    props: { modelValue: '<svg/>', ...props },
    attachTo: document.body,
  })
  await flushPromises()
  return view
}

const last = () => fake.state.created.at(-1)!

describe('NbCodeEditor', () => {
  it('opens Monaco on the value, in the language asked for', async () => {
    await mountEditor({ language: 'xml', label: 'Drawing' })
    expect(last().options).toMatchObject({
      value: '<svg/>',
      language: 'xml',
      ariaLabel: 'Drawing',
      readOnly: false,
      lineNumbers: 'on',
      wordWrap: 'on',
    })
  })

  it('emits what the person types', async () => {
    const view = await mountEditor()
    last().instance.type('<svg viewBox="0 0 1 1"/>')
    expect(view.emitted('update:modelValue')?.at(-1)).toEqual([
      '<svg viewBox="0 0 1 1"/>',
    ])
  })

  it('takes a value from outside as an edit, so undo survives it', async () => {
    const view = await mountEditor()
    await view.setProps({ modelValue: '<svg id="b"/>' })
    const { instance } = last()
    expect(instance.executeEdits).toHaveBeenCalledOnce()
    expect(instance.getValue()).toBe('<svg id="b"/>')
    // Applying it is not the person typing, so it is not emitted back.
    expect(view.emitted('update:modelValue')).toBeUndefined()
  })

  it('is read-only when readonly or disabled', async () => {
    await mountEditor({ readonly: true })
    expect(last().options.readOnly).toBe(true)
    const view = await mountEditor()
    await view.setProps({ disabled: true })
    expect(last().instance.updateOptions).toHaveBeenCalledWith(
      expect.objectContaining({ readOnly: true, domReadOnly: true }),
    )
  })

  it('grows with its content between rows and maxRows', async () => {
    const view = await mountEditor({ rows: 2, maxRows: 4 })
    const field = () =>
      (view.find('.nb-code-editor__field').element as HTMLElement).style.height
    // Two lines of 20px plus 8px above and below.
    expect(field()).toBe('56px')
    last().instance.grow(70)
    await nextTick()
    expect(field()).toBe('70px')
    last().instance.grow(500)
    await nextTick()
    expect(field()).toBe('96px')
  })

  it("describes Monaco's input with the field message, and marks an error", async () => {
    const view = await mountEditor({ error: 'Not valid SVG.' })
    const input = view.find('.nb-code-editor__host textarea')
    const message = view.find('.nb-code-editor__message')
    expect(message.text()).toContain('Not valid SVG.')
    expect(input.attributes('aria-describedby')).toBe(message.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('passes options through over its own', async () => {
    await mountEditor({ options: { tabSize: 4, minimap: { enabled: true } } })
    expect(last().options).toMatchObject({
      tabSize: 4,
      minimap: { enabled: true },
    })
  })

  it('throws Monaco away when it leaves the page', async () => {
    const view = await mountEditor()
    const { instance } = last()
    view.unmount()
    expect(instance.dispose).toHaveBeenCalled()
    expect(instance.getModel().dispose).toHaveBeenCalled()
  })
})

describe('NbCodeEditor without Monaco', () => {
  it('is a plain text field with the same label, and still edits', async () => {
    vi.resetModules()
    vi.doMock('monaco-editor', () => {
      throw new Error('not installed')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { default: Editor } = await import('../src/components/CodeEditor.vue')
    const view = mount(Editor, {
      props: { modelValue: 'a', label: 'Code' },
      attachTo: document.body,
    })
    await flushPromises()
    const textarea = view.find('textarea.nb-code-editor__fallback')
    expect(textarea.exists()).toBe(true)
    expect(view.find('label').attributes('for')).toBe(textarea.attributes('id'))
    await textarea.setValue('b')
    expect(view.emitted('update:modelValue')?.at(-1)).toEqual(['b'])
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('toHexColor', () => {
  it('reads the forms a browser computes a colour to', () => {
    expect(toHexColor('rgb(15, 16, 17)')).toBe('#0f1011')
    expect(toHexColor('rgb(15 16 17)')).toBe('#0f1011')
    expect(toHexColor('rgba(255, 255, 255, 0.5)')).toBe('#ffffff80')
    expect(toHexColor('color(srgb 1 0.5 0 / 0.25)')).toBe('#ff800040')
    expect(toHexColor('#ABC')).toBe('#aabbcc')
    expect(toHexColor('#4a8a3a')).toBe('#4a8a3a')
  })

  it('leaves out what it cannot read, so Monaco keeps its own colour', () => {
    expect(toHexColor('')).toBeUndefined()
    expect(toHexColor('oklch(0.7 0.1 140)')).toBeUndefined()
  })
})
