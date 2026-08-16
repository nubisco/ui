import { describe, it, expect } from 'vitest'
import { Comment, Fragment, Text, createVNode, h } from 'vue'
import {
  hasRenderableContent,
  hasSlotContent,
} from '../src/utils/slotContent.helper'

describe('hasRenderableContent', () => {
  it('ignores comment placeholders', () => {
    expect(hasRenderableContent([createVNode(Comment)])).toBe(false)
  })

  it('ignores whitespace-only text', () => {
    expect(hasRenderableContent([createVNode(Text, null, '   ')])).toBe(false)
  })

  it('counts text with actual characters', () => {
    expect(hasRenderableContent([createVNode(Text, null, 'Tabs')])).toBe(true)
  })

  it('counts elements', () => {
    expect(hasRenderableContent([h('div')])).toBe(true)
  })

  it('searches fragments recursively', () => {
    const empty = createVNode(Fragment, null, [createVNode(Comment)])
    const full = createVNode(Fragment, null, [h('span')])
    expect(hasRenderableContent([empty])).toBe(false)
    expect(hasRenderableContent([full])).toBe(true)
  })

  it('returns false for no nodes at all', () => {
    expect(hasRenderableContent([])).toBe(false)
  })

  // Documents the known limit rather than pretending it is fixed: whether a
  // component renders anything is only knowable after it renders, so a
  // component vnode always counts. Callers that only need to style the empty
  // case use a CSS :empty guard instead (see Shell's slot wrappers).
  it('counts a component vnode even when it will render nothing', () => {
    const RendersNothing = { render: () => null }
    expect(hasRenderableContent([h(RendersNothing)])).toBe(true)
  })
})

describe('hasSlotContent', () => {
  it('is false for a slot that was never passed', () => {
    expect(hasSlotContent({}, 'fixedbar')).toBe(false)
  })

  it('is false for a slot rendering only a comment', () => {
    expect(
      hasSlotContent({ fixedbar: () => [createVNode(Comment)] }, 'fixedbar'),
    ).toBe(false)
  })

  it('is true for a slot rendering an element', () => {
    expect(hasSlotContent({ fixedbar: () => [h('div')] }, 'fixedbar')).toBe(
      true,
    )
  })
})
