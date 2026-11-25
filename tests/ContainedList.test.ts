import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import ContainedList from '../src/components/ContainedList.vue'
import ContainedListItem from '../src/components/ContainedListItem.vue'

function mountList(template: string, setup?: () => Record<string, unknown>) {
  return mount(
    defineComponent({
      components: { ContainedList, ContainedListItem },
      template,
      setup,
    }),
  )
}

describe('NbContainedList', () => {
  it('is a real list of list items', () => {
    const w = mountList(`
      <ContainedList title="Waiting on you">
        <ContainedListItem title="One" />
        <ContainedListItem title="Two" />
      </ContainedList>`)
    const ul = w.find('ul')
    expect(ul.attributes('role')).toBe('list')
    expect(ul.findAll(':scope > li')).toHaveLength(2)
  })

  it('names the list after its title', () => {
    const w = mountList(
      '<ContainedList title="Waiting on you"><ContainedListItem title="One" /></ContainedList>',
    )
    const heading = w.find('.nb-contained-list__title')
    expect(heading.element.tagName).toBe('H3')
    expect(heading.attributes('id')).toBeTruthy()
    expect(w.find('ul').attributes('aria-labelledby')).toBe(
      heading.attributes('id'),
    )
  })

  it('takes an aria-label when it has no title, and renders no header', () => {
    const w = mountList(
      '<ContainedList aria-label="Recent"><ContainedListItem title="One" /></ContainedList>',
    )
    expect(w.find('.nb-contained-list__header').exists()).toBe(false)
    expect(w.find('ul').attributes('aria-label')).toBe('Recent')
  })

  it('renders meta and actions in the header', () => {
    const w = mountList(`
      <ContainedList title="Spaces">
        <template #meta><span class="count">4</span></template>
        <template #actions><button class="add">Add</button></template>
      </ContainedList>`)
    expect(w.find('.nb-contained-list__meta .count').exists()).toBe(true)
    expect(w.find('.nb-contained-list__actions .add').exists()).toBe(true)
  })

  it('is md by default and takes sm and lg', () => {
    expect(mount(ContainedList).classes()).toContain('nb-contained-list--md')
    expect(mount(ContainedList, { props: { size: 'sm' } }).classes()).toContain(
      'nb-contained-list--sm',
    )
    expect(mount(ContainedList, { props: { size: 'lg' } }).classes()).toContain(
      'nb-contained-list--lg',
    )
  })

  it('scrolls under a max height', () => {
    const w = mount(ContainedList, { props: { maxHeight: '12rem' } })
    expect(w.classes()).toContain('nb-contained-list--scroll')
    expect(w.attributes('style')).toContain('--nb-contained-list-max-h: 12rem')
  })
})

describe('NbContainedListItem', () => {
  it('renders the key, the title and the line', () => {
    const w = mount(ContainedListItem, {
      props: {
        itemKey: 'OPS-12',
        title: 'Rotate the keys',
        line: 'Due Friday',
      },
    })
    expect(w.element.tagName).toBe('LI')
    expect(w.find('.nb-contained-list-item__key').text()).toBe('OPS-12')
    expect(w.find('.nb-contained-list-item__title').text()).toBe(
      'Rotate the keys',
    )
    expect(w.find('.nb-contained-list-item__line').text()).toBe('Due Friday')
  })

  it('renders leading and trailing slots', () => {
    const w = mount(ContainedListItem, {
      props: { title: 'A' },
      slots: {
        leading: '<i class="lead" />',
        trailing: '<span class="badge">3</span>',
      },
    })
    expect(w.find('.nb-contained-list-item__leading .lead').exists()).toBe(true)
    expect(w.find('.nb-contained-list-item__trailing .badge').exists()).toBe(
      true,
    )
  })

  it('is not interactive by default', () => {
    const w = mount(ContainedListItem, { props: { title: 'A' } })
    const row = w.find('.nb-contained-list-item__row')
    expect(row.element.tagName).toBe('DIV')
    expect(row.attributes('tabindex')).toBeUndefined()
    expect(w.classes()).not.toContain('nb-contained-list-item--interactive')
  })

  it('is a link with href, inside its list item', () => {
    const w = mount(ContainedListItem, {
      props: { title: 'A', href: '/a' },
    })
    const row = w.find('a.nb-contained-list-item__row')
    expect(row.attributes('href')).toBe('/a')
    expect(w.classes()).toContain('nb-contained-list-item--interactive')
  })

  it('is keyboard reachable and acts on Enter and Space when clickable', async () => {
    const w = mount(ContainedListItem, {
      props: { title: 'A', clickable: true },
    })
    const row = w.find('.nb-contained-list-item__row')
    expect(row.attributes('role')).toBe('button')
    expect(row.attributes('tabindex')).toBe('0')
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: ' ' })
    await row.trigger('click')
    expect(w.emitted('select')).toHaveLength(3)
  })

  it('does not act when disabled', async () => {
    const w = mount(ContainedListItem, {
      props: { title: 'A', clickable: true, disabled: true },
    })
    await w.find('.nb-contained-list-item__row').trigger('click')
    expect(w.emitted('select')).toBeUndefined()
  })

  it('marks the current row: page on a link, true otherwise', () => {
    const link = mount(ContainedListItem, {
      props: { title: 'A', href: '/a', current: true },
    })
    expect(
      link.find('.nb-contained-list-item__row').attributes('aria-current'),
    ).toBe('page')
    const button = mount(ContainedListItem, {
      props: { title: 'A', clickable: true, current: true },
    })
    expect(
      button.find('.nb-contained-list-item__row').attributes('aria-current'),
    ).toBe('true')
    const other = mount(ContainedListItem, { props: { title: 'A' } })
    expect(
      other.find('.nb-contained-list-item__row').attributes('aria-current'),
    ).toBeUndefined()
  })
})

describe('NbContainedListItem lineClamp', () => {
  it('keeps one line by default', () => {
    const w = mount(ContainedListItem, {
      props: {
        title: 'Install',
        line: 'Add the package and import the styles',
      },
    })
    const line = w.find('.nb-contained-list-item__line')
    expect(line.classes()).not.toContain('nb-contained-list-item__line--wraps')
    expect(line.attributes('style')).toBeUndefined()
  })

  it('wraps up to lineClamp lines and keeps inline markup', () => {
    const w = mount(ContainedListItem, {
      props: { title: 'Install', lineClamp: 3 },
      slots: { line: 'Add the <mark>package</mark> and import the styles' },
    })
    const line = w.find('.nb-contained-list-item__line')
    expect(line.classes()).toContain('nb-contained-list-item__line--wraps')
    expect(line.attributes('style')).toContain(
      '--nb-contained-list-item-line-clamp: 3',
    )
    expect(line.find('mark').text()).toBe('package')
  })
})

describe('NbContainedListItem wrap', () => {
  const WRAP = 'nb-contained-list-item--wrap'

  it('keeps one line per title by default, in a list or alone', () => {
    expect(
      mount(ContainedListItem, { props: { title: 'One' } }).classes(),
    ).not.toContain(WRAP)
    const w = mountList(
      '<ContainedList aria-label="Files"><ContainedListItem title="One" /></ContainedList>',
    )
    expect(w.find('li').classes()).not.toContain(WRAP)
  })

  it('wraps when the item asks', () => {
    const w = mount(ContainedListItem, {
      props: { title: 'src/a/very/long/path.ts', wrap: true },
    })
    expect(w.classes()).toContain(WRAP)
  })

  it('takes the list wrap as every row default', () => {
    const w = mountList(`
      <ContainedList aria-label="Files" wrap>
        <ContainedListItem title="One" />
        <ContainedListItem title="Two" />
      </ContainedList>`)
    const items = w.findAll('li')
    expect(items).toHaveLength(2)
    for (const item of items) expect(item.classes()).toContain(WRAP)
  })

  it('lets an item override the list, either way', () => {
    const w = mountList(`
      <ContainedList aria-label="Files" wrap>
        <ContainedListItem title="One" :wrap="false" />
      </ContainedList>
      <ContainedList aria-label="Others">
        <ContainedListItem title="Two" wrap />
      </ContainedList>`)
    const [one, two] = w.findAll('li')
    expect(one.classes()).not.toContain(WRAP)
    expect(two.classes()).toContain(WRAP)
  })

  it('follows the list when the list changes', async () => {
    const w = mount(ContainedList, {
      props: { ariaLabel: 'Files', wrap: false },
      slots: { default: () => h(ContainedListItem, { title: 'One' }) },
    })
    expect(w.find('li').classes()).not.toContain(WRAP)
    await w.setProps({ wrap: true })
    expect(w.find('li').classes()).toContain(WRAP)
  })

  it('keeps a line clamp while it wraps', () => {
    const w = mount(ContainedListItem, {
      props: { title: 'One', line: 'A long passage', lineClamp: 2, wrap: true },
    })
    expect(w.classes()).toContain(WRAP)
    expect(w.find('.nb-contained-list-item__line').classes()).toContain(
      'nb-contained-list-item__line--wraps',
    )
  })
})
