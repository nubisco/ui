import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '../src/components/Pagination.vue'

function mountPagination(props: Record<string, unknown> = {}) {
  return mount(Pagination, {
    props: { page: 1, pageSize: 10, total: 95, ...props },
  })
}

describe('NbPagination', () => {
  it('renders the item range and page-of read-out', () => {
    const wrapper = mountPagination({ page: 2, pageSize: 10, total: 95 })
    expect(
      wrapper.find('.nb-data-table__range, .nb-pagination__range').text(),
    ).toContain('11–20 of 95 items')
    expect(wrapper.find('.nb-pagination__page-of').text()).toBe('Page 2 of 10')
  })

  it('shows 0 range when total is zero', () => {
    const wrapper = mountPagination({ total: 0 })
    expect(wrapper.find('.nb-pagination__range').text()).toContain(
      '0–0 of 0 items',
    )
  })

  it('disables previous on the first page and next on the last', () => {
    const first = mountPagination({ page: 1 })
    const navs = first.findAll('.nb-pagination__nav')
    expect((navs[0].element as HTMLButtonElement).disabled).toBe(true)
    expect((navs[1].element as HTMLButtonElement).disabled).toBe(false)

    const last = mountPagination({ page: 10 })
    const lastNavs = last.findAll('.nb-pagination__nav')
    expect((lastNavs[1].element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits update:page on next / previous', async () => {
    const wrapper = mountPagination({ page: 2 })
    const navs = wrapper.findAll('.nb-pagination__nav')
    await navs[0].trigger('click')
    expect(wrapper.emitted('update:page')![0]).toEqual([1])
    await navs[1].trigger('click')
    expect(wrapper.emitted('update:page')![1]).toEqual([3])
  })

  it('does not emit past the bounds', async () => {
    const wrapper = mountPagination({ page: 1 })
    await wrapper.findAll('.nb-pagination__nav')[0].trigger('click')
    expect(wrapper.emitted('update:page')).toBeUndefined()
  })

  it('renders the page-size options', () => {
    const wrapper = mountPagination({ pageSizeOptions: [5, 25] })
    const opts = wrapper.findAll('.nb-pagination__select option')
    expect(opts.map((o) => o.text())).toEqual(['5', '25'])
  })

  it('emits update:pageSize and resets to page 1 on page-size change', async () => {
    const wrapper = mountPagination({ page: 3, pageSize: 10 })
    await wrapper.find('.nb-pagination__select').setValue('20')
    expect(wrapper.emitted('update:pageSize')![0]).toEqual([20])
    expect(wrapper.emitted('update:page')![0]).toEqual([1])
  })

  it('applies the size modifier class', () => {
    expect(mountPagination({ size: 'sm' }).classes()).toContain(
      'nb-pagination--sm',
    )
  })
})
