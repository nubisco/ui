import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { mount } from '@vue/test-utils'
import PageLayout from '../src/components/PageLayout.vue'

function columnsOf(w: ReturnType<typeof mount>): string | undefined {
  return (
    w.find('.nb-page-layout__inner').element as HTMLElement
  ).style.getPropertyValue('--nb-page-layout-columns')
}

describe('NbPageLayout', () => {
  it('renders main first and the aside after it', () => {
    const w = mount(PageLayout, {
      slots: {
        default: '<p class="main">Main</p>',
        aside: '<p class="aside">Aside</p>',
      },
    })
    const regions = w.findAll('.nb-page-layout__inner > div')
    expect(regions.map((r) => r.classes()[0])).toEqual([
      'nb-page-layout__main',
      'nb-page-layout__aside',
    ])
  })

  it('renders no aside region without the slot', () => {
    const w = mount(PageLayout, { slots: { default: 'Main' } })
    expect(w.find('.nb-page-layout__aside').exists()).toBe(false)
  })

  it('shares the width 3:2 by default', () => {
    const w = mount(PageLayout)
    expect(columnsOf(w)).toBe('minmax(0, 3fr) minmax(0, 2fr)')
  })

  it('takes another ratio', () => {
    const w = mount(PageLayout, { props: { asideWidth: '2:1' } })
    expect(columnsOf(w)).toBe('minmax(0, 2fr) minmax(0, 1fr)')
  })

  it('takes a fixed aside as a CSS length', () => {
    const w = mount(PageLayout, { props: { asideWidth: '20rem' } })
    expect(columnsOf(w)).toBe('minmax(0, 1fr) minmax(0, 20rem)')
  })

  it('stacks below md by default, and takes another threshold', () => {
    expect(mount(PageLayout).classes()).toContain('nb-page-layout--stack-md')
    expect(
      mount(PageLayout, { props: { stackBelow: 'lg' } }).classes(),
    ).toContain('nb-page-layout--stack-lg')
  })

  it('marks aside-first for the stacked order', () => {
    expect(
      mount(PageLayout, { props: { asideFirst: true } }).classes(),
    ).toContain('nb-page-layout--aside-first')
  })

  it('takes its gap from the spacing ladder, xl by default', () => {
    expect(
      mount(PageLayout).find('.nb-page-layout__inner').attributes('data-gap'),
    ).toBe('xl')
    expect(
      mount(PageLayout, { props: { gap: 'lg' } })
        .find('.nb-page-layout__inner')
        .attributes('data-gap'),
    ).toBe('lg')
  })

  it('answers to its container, never to the viewport', () => {
    const source = readFileSync(
      resolve(__dirname, '../src/components/PageLayout.vue'),
      'utf8',
    )
    const style = source.slice(source.indexOf('<style'))
    expect(style).toContain('container-type: inline-size')
    expect(style).toContain('@container')
    expect(style).not.toMatch(/@media/)
  })
})
