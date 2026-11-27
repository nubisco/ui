import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NbCodeInput from '../src/components/CodeInput.vue'

enableAutoUnmount(afterEach)
afterEach(() => {
  document.body.innerHTML = ''
})

function mountCode(props: Record<string, unknown> = {}) {
  return mount(NbCodeInput, {
    props: { label: 'Verification code', ...props },
    attachTo: document.body,
  })
}

type TWrapper = ReturnType<typeof mountCode>

const input = (w: TWrapper) => w.find('input').element as HTMLInputElement
const lastValue = (w: TWrapper) => w.emitted('update:modelValue')?.at(-1)?.[0]
const slotText = (w: TWrapper) =>
  w.findAll('.nb-code-input__slot').map((s) => s.text())

/** What the browser leaves in the field after a paste or an autofill. */
async function fill(w: TWrapper, raw: string) {
  const el = input(w)
  el.value = raw
  el.setSelectionRange(raw.length, raw.length)
  await w.find('input').trigger('input')
}

/** One typed character, through beforeinput as a browser sends it. */
async function type(w: TWrapper, ch: string) {
  const el = input(w)
  const event = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: ch,
    cancelable: true,
    bubbles: true,
  })
  el.dispatchEvent(event)
  if (!event.defaultPrevented) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    el.value = el.value.slice(0, start) + ch + el.value.slice(end)
    el.setSelectionRange(start + 1, start + 1)
    await w.find('input').trigger('input')
  }
  await nextTick()
}

describe('NbCodeInput', () => {
  it('is one native input, with six slots drawn for it', () => {
    const w = mountCode()
    expect(w.findAll('input')).toHaveLength(1)
    expect(w.findAll('.nb-code-input__slot')).toHaveLength(6)
    expect(w.find('.nb-code-input__slots').attributes('aria-hidden')).toBe(
      'true',
    )
  })

  it('sets the native attributes for one-time-code autofill', () => {
    const el = input(mountCode({ name: 'otp', id: 'code' }))
    expect(el.getAttribute('autocomplete')).toBe('one-time-code')
    expect(el.getAttribute('inputmode')).toBe('numeric')
    expect(el.getAttribute('type')).toBe('text')
    expect(el.id).toBe('code')
    expect(el.name).toBe('otp')
    // No maxlength: a paste with a separator in it must reach the filter
    // whole, not cut short by the browser.
    expect(el.hasAttribute('maxlength')).toBe(false)
  })

  it('pastes a whole code, dropping separators and spaces', async () => {
    const w = mountCode()
    await fill(w, '123 456')
    expect(lastValue(w)).toBe('123456')
    expect(input(w).value).toBe('123456')
    expect(slotText(w)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('cuts a paste that is too long', async () => {
    const w = mountCode()
    await fill(w, '12345678')
    expect(lastValue(w)).toBe('123456')
  })

  it('takes only digits in numeric mode', async () => {
    const w = mountCode()
    await fill(w, '1a2-b3')
    expect(lastValue(w)).toBe('123')
    await type(w, 'x')
    expect(input(w).value).toBe('123')
    await type(w, '4')
    expect(lastValue(w)).toBe('1234')
  })

  it('takes letters and digits in alphanumeric mode, in capitals when asked', async () => {
    const w = mountCode({ mode: 'alphanumeric', uppercase: true, length: 8 })
    expect(input(w).getAttribute('inputmode')).toBe('text')
    expect(input(w).getAttribute('autocapitalize')).toBe('characters')
    await fill(w, 'ab12-cd3!')
    expect(lastValue(w)).toBe('AB12CD3')
  })

  it('keeps case in alphanumeric mode without uppercase', async () => {
    const w = mountCode({ mode: 'alphanumeric' })
    await fill(w, 'aB3')
    expect(lastValue(w)).toBe('aB3')
  })

  it('draws groups with the separator, which never reaches the value', async () => {
    const w = mountCode({ groups: [4, 4], mode: 'alphanumeric' })
    expect(w.findAll('.nb-code-input__slot')).toHaveLength(8)
    const seps = w.findAll('.nb-code-input__separator')
    expect(seps).toHaveLength(1)
    expect(seps[0].text()).toBe('-')
    await fill(w, 'WXYZ-1234')
    expect(lastValue(w)).toBe('WXYZ1234')
  })

  it('normalises a value the parent passes in', async () => {
    const w = mountCode({ modelValue: '12-34' })
    expect(input(w).value).toBe('1234')
    await w.setProps({ modelValue: '9 8 7' })
    expect(slotText(w).slice(0, 3)).toEqual(['9', '8', '7'])
  })

  it('emits complete once for a value that reaches full length', async () => {
    const w = mountCode()
    for (const ch of '12345') await type(w, ch)
    expect(w.emitted('complete')).toBeUndefined()
    await type(w, '6')
    expect(w.emitted('complete')).toEqual([['123456']])
    // A seventh key on a full code changes nothing and fires nothing.
    await type(w, '7')
    expect(w.emitted('complete')).toHaveLength(1)
    // The same value again, through input, does not fire twice.
    await fill(w, '123456')
    expect(w.emitted('complete')).toHaveLength(1)
  })

  it('emits complete again for a new value after an edit', async () => {
    const w = mountCode()
    await fill(w, '123456')
    await fill(w, '12345')
    await fill(w, '123459')
    expect(w.emitted('complete')).toEqual([['123456'], ['123459']])
  })

  it('a character typed over a filled slot replaces it', async () => {
    const w = mountCode({ modelValue: '123456' })
    input(w).focus()
    input(w).setSelectionRange(2, 2)
    await type(w, '9')
    expect(lastValue(w)).toBe('129456')
    expect(input(w).selectionStart).toBe(3)
  })

  it('focus() puts focus in the field after the last character', async () => {
    const w = mountCode({ modelValue: '123' })
    ;(w.vm as unknown as { focus: () => void }).focus()
    await nextTick()
    expect(document.activeElement).toBe(input(w))
    expect(input(w).selectionStart).toBe(3)
    // The caret is drawn in the next empty slot, which is the active one.
    const slots = w.findAll('.nb-code-input__slot')
    expect(slots[3].classes()).toContain('nb-code-input__slot--active')
    expect(slots[3].find('.nb-code-input__caret').exists()).toBe(true)
  })

  it('clear() empties the field and focuses it', async () => {
    const w = mountCode({ modelValue: '123456' })
    ;(w.vm as unknown as { clear: () => void }).clear()
    await nextTick()
    expect(lastValue(w)).toBe('')
    expect(input(w).value).toBe('')
    expect(document.activeElement).toBe(input(w))
  })

  it('autofocus focuses on mount', async () => {
    const w = mountCode({ autofocus: true })
    await nextTick()
    expect(document.activeElement).toBe(input(w))
  })

  it('is one labelled field, described by its length', () => {
    const w = mountCode()
    const el = input(w)
    const label = w.find('label')
    expect(label.attributes('for')).toBe(el.id)
    expect(label.text()).toBe('Verification code')
    const described = el.getAttribute('aria-describedby')!.split(' ')
    expect(document.getElementById(described[0])?.textContent).toBe('6 digits')
    expect(el.hasAttribute('aria-invalid')).toBe(false)
  })

  it('describes an alphanumeric code in characters', () => {
    const w = mountCode({ groups: [4, 4], mode: 'alphanumeric' })
    const id = input(w).getAttribute('aria-describedby')!
    expect(document.getElementById(id)?.textContent).toBe('8 characters')
  })

  it('is named by the catalogue without a label', () => {
    const w = mountCode({ label: undefined })
    expect(w.find('label').exists()).toBe(false)
    expect(input(w).getAttribute('aria-label')).toBe('Verification code')
  })

  it('links the error in a polite live region and marks the field invalid', async () => {
    const w = mountCode()
    await w.setProps({ state: 'error', error: 'That code is not right.' })
    const el = input(w)
    expect(el.getAttribute('aria-invalid')).toBe('true')
    const ids = el.getAttribute('aria-describedby')!.split(' ')
    const region = document.getElementById(ids[1])!
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.textContent).toContain('That code is not right.')
  })

  it('the error state clears the value and returns focus', async () => {
    const w = mountCode({ modelValue: '123456' })
    expect(document.activeElement).not.toBe(input(w))
    await w.setProps({ state: 'error', error: 'Wrong code' })
    // jsdom runs no animation, which is the reduced-motion path: at once.
    await nextTick()
    await nextTick()
    expect(lastValue(w)).toBe('')
    expect(input(w).value).toBe('')
    expect(document.activeElement).toBe(input(w))
    expect(w.classes()).toContain('nb-code-input--error')
  })

  it('verifying makes the field read only and shows progress', async () => {
    const w = mountCode({ modelValue: '123456', state: 'verifying' })
    expect(input(w).readOnly).toBe(true)
    expect(w.classes()).toContain('nb-code-input--verifying')
    expect(w.find('.nb-inline-loading--active').text()).toContain('Verifying')
  })

  it('success shows the check and keeps the field read only', async () => {
    const w = mountCode({ modelValue: '123456', state: 'success' })
    expect(input(w).readOnly).toBe(true)
    expect(w.classes()).toContain('nb-code-input--success')
    expect(w.find('.nb-inline-loading--finished').text()).toContain('Verified')
    // Each slot carries its place, for the left to right stagger.
    const slots = w.findAll('.nb-code-input__slot')
    expect(slots[5].attributes('style')).toContain('--nb-code-input-index: 5')
  })

  it('disabled disables the input', () => {
    const w = mountCode({ disabled: true })
    expect(input(w).disabled).toBe(true)
    expect(w.classes()).toContain('nb-code-input--disabled')
  })

  it('follows size', () => {
    expect(mountCode({ size: 'sm' }).classes()).toContain('nb-code-input--sm')
    expect(mountCode().classes()).toContain('nb-code-input--md')
  })
})
