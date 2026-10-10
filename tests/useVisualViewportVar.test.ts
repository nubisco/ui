import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import {
  useVisualViewportVar,
  visualViewportVarOwners,
} from '../src/composables/useVisualViewportVar.composable'
import { stubPhone, unstubPhone } from './__mocks__/phoneLayout'

/** A visual viewport the test can resize, like the keyboard opening. */
function stubViewport(height = 700, offsetTop = 0) {
  const target = new EventTarget() as EventTarget & {
    height: number
    offsetTop: number
  }
  target.height = height
  target.offsetTop = offsetTop
  vi.stubGlobal('visualViewport', target)
  return target
}

const vvh = () => document.documentElement.style.getPropertyValue('--nb-vvh')
const vvt = () => document.documentElement.style.getPropertyValue('--nb-vvt')

function own(active: () => boolean) {
  const scope = effectScope()
  scope.run(() => useVisualViewportVar(active))
  return scope
}

describe('useVisualViewportVar', () => {
  afterEach(() => {
    unstubPhone()
    document.documentElement.removeAttribute('style')
  })

  it('writes nothing outside the phone layout', async () => {
    stubViewport()
    const scope = own(() => true)
    await nextTick()
    expect(vvh()).toBe('')
    expect(visualViewportVarOwners()).toBe(0)
    scope.stop()
  })

  it('writes the visible height and offset while active on a phone', async () => {
    stubPhone()
    const viewport = stubViewport(700, 0)
    const scope = own(() => true)
    expect(vvh()).toBe('700px')
    expect(vvt()).toBe('0px')

    // The keyboard opens: the visible box shrinks and pans.
    viewport.height = 380
    viewport.offsetTop = 120
    viewport.dispatchEvent(new Event('resize'))
    expect(vvh()).toBe('380px')
    viewport.dispatchEvent(new Event('scroll'))
    expect(vvt()).toBe('120px')
    scope.stop()
  })

  it('removes the properties only when the last owner lets go', async () => {
    stubPhone()
    stubViewport(600)
    const first = ref(true)
    const second = ref(true)
    const a = own(() => first.value)
    const b = own(() => second.value)
    expect(visualViewportVarOwners()).toBe(2)

    first.value = false
    await nextTick()
    expect(vvh()).toBe('600px')

    second.value = false
    await nextTick()
    expect(vvh()).toBe('')
    expect(vvt()).toBe('')
    expect(visualViewportVarOwners()).toBe(0)
    a.stop()
    b.stop()
  })

  it('releases the share when the owner goes away while active', () => {
    stubPhone()
    stubViewport(500)
    const scope = own(() => true)
    expect(vvh()).toBe('500px')
    scope.stop()
    expect(vvh()).toBe('')
    expect(visualViewportVarOwners()).toBe(0)
  })

  it('stops listening once released', () => {
    stubPhone()
    const viewport = stubViewport(500)
    const scope = own(() => true)
    scope.stop()
    viewport.height = 300
    viewport.dispatchEvent(new Event('resize'))
    expect(vvh()).toBe('')
  })

  it('counts owners even without the API, and writes nothing', () => {
    stubPhone()
    vi.stubGlobal('visualViewport', undefined)
    const scope = own(() => true)
    expect(visualViewportVarOwners()).toBe(1)
    expect(vvh()).toBe('')
    scope.stop()
    expect(visualViewportVarOwners()).toBe(0)
  })
})
