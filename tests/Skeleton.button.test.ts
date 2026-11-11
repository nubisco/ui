import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from '../src/components/Skeleton.vue'

const style = (w: ReturnType<typeof mount>) => (w.element as HTMLElement).style

describe('NbSkeleton button variant', () => {
  it('stands in for a md button by default, at the labelled width', () => {
    const w = mount(Skeleton, { props: { variant: 'button' } })
    expect(w.classes()).toContain('nb-skeleton--button')
    expect(style(w).getPropertyValue('--nb-skeleton-height')).toBe(
      'calc(var(--nb-base-unit) * 5)',
    )
    expect(style(w).width).toBe('calc(var(--nb-base-unit) * 18.75)')
    expect(w.findAll('.nb-skeleton__line')).toHaveLength(1)
  })

  it.each([
    ['xxs', 2],
    ['xs', 3],
    ['sm', 4],
    ['md', 5],
    ['lg', 6],
    ['xl', 8],
    ['xxl', 10],
  ] as const)('takes the %s button height', (size, units) => {
    const w = mount(Skeleton, { props: { variant: 'button', size } })
    expect(style(w).getPropertyValue('--nb-skeleton-height')).toBe(
      `calc(var(--nb-base-unit) * ${units})`,
    )
  })

  it('is square when it stands in for an icon-only button', () => {
    const w = mount(Skeleton, {
      props: { variant: 'button', size: 'xl', iconOnly: true, width: 300 },
    })
    expect(style(w).width).toBe('calc(var(--nb-base-unit) * 8)')
  })

  it('takes an explicit width for a known long label or a full-width set', () => {
    const w = mount(Skeleton, { props: { variant: 'button', width: '100%' } })
    expect(style(w).width).toBe('100%')
  })

  it('ignores lines, and stays silent without a label', () => {
    const w = mount(Skeleton, { props: { variant: 'button', lines: 4 } })
    expect(w.findAll('.nb-skeleton__line')).toHaveLength(1)
    expect(w.attributes('aria-hidden')).toBe('true')
  })
})
