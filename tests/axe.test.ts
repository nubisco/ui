/**
 * Automated markup checks with axe-core, on the components the suite already
 * mounts, gated on a baseline.
 *
 * axe is a floor, not a verdict (docs/accessibility/overview.md says so), but
 * it is the floor a buyer asks about, and the library did not run it. Three
 * decisions shape this file:
 *
 * - Colour rules are off. jsdom has no layout and no cascade from the theme,
 *   so contrast cannot be measured here. The Sass contrast tests
 *   (layerContrast, inkContrast, selectedEdgeContrast) own that, on the
 *   compiled theme, and they are stricter.
 * - Page-level rules are off (landmarks, a main, a heading one, a title):
 *   a component is not a page, and an application owns those.
 * - It gates on new violations, not zero. `axe-baseline.json` lists the
 *   rule ids each case is known to break today. A rule that appears and is
 *   not listed fails the suite. A listed rule that no longer fires also
 *   fails, so a fix shrinks the baseline instead of leaving slack in it.
 *   Update the baseline in the same commit that changes the markup, and say
 *   why in the commit.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import axe from 'axe-core'
import baseline from './axe-baseline.json'

import NbButton from '../src/components/Button.vue'
import NbTextInput from '../src/components/TextInput.vue'
import NbNumberInput from '../src/components/NumberInput.vue'
import NbSelect from '../src/components/Select.vue'
import NbCheckbox from '../src/components/Checkbox.vue'
import NbCheckboxGroup from '../src/components/CheckboxGroup.vue'
import NbRadio from '../src/components/Radio.vue'
import NbSwitch from '../src/components/Switch.vue'
import NbSlider from '../src/components/Slider.vue'
import NbTabs from '../src/components/Tabs.vue'
import NbAccordion from '../src/components/Accordion.vue'
import NbAccordionItem from '../src/components/AccordionItem.vue'
import NbTree from '../src/components/Tree.vue'
import NbTreeNode from '../src/components/TreeNode.vue'
import NbDataTable from '../src/components/DataTable.vue'
import NbPagination from '../src/components/Pagination.vue'
import NbBreadcrumbs from '../src/components/Breadcrumbs.vue'
import NbBanner from '../src/components/Banner.vue'
import NbMessage from '../src/components/Message.vue'
import NbBadge from '../src/components/Badge.vue'
import NbProgressBar from '../src/components/ProgressBar.vue'
import NbField from '../src/components/Field.vue'
import NbFileUploader from '../src/components/FileUploader.vue'
import NbModal from '../src/components/Modal.vue'
import NbMenu from '../src/components/Menu.vue'
import NbMenuItem from '../src/components/MenuItem.vue'
import NbEmptyState from '../src/components/EmptyState.vue'

const DISABLED_RULES = [
  // Colour: no layout or theme cascade in jsdom (see above).
  'color-contrast',
  'color-contrast-enhanced',
  'link-in-text-block',
  // Page-level: a component is not a page.
  'region',
  'landmark-one-main',
  'page-has-heading-one',
  'bypass',
  'document-title',
  'html-has-lang',
]

interface ICase {
  name: string
  render: () => VueWrapper
}

const cases: ICase[] = [
  {
    name: 'NbButton',
    render: () => mount(NbButton, { slots: { default: () => 'Save' } }),
  },
  {
    name: 'NbTextInput with an error',
    render: () =>
      mount(NbTextInput, { props: { label: 'Email', error: 'Required' } }),
  },
  {
    name: 'NbTextInput fluid',
    render: () =>
      mount(NbTextInput, {
        props: { label: 'Email', variant: 'fluid', helper: 'Work address' },
      }),
  },
  {
    name: 'NbNumberInput',
    render: () =>
      mount(NbNumberInput, { props: { label: 'Seats', warning: 'High' } }),
  },
  {
    name: 'NbSelect',
    render: () =>
      mount(NbSelect, {
        props: {
          label: 'Country',
          helper: 'Where you live',
          options: [
            { label: 'Portugal', value: 'pt' },
            { label: 'Spain', value: 'es' },
          ],
        },
      }),
  },
  {
    name: 'NbCheckboxGroup',
    render: () =>
      mount(NbCheckboxGroup, {
        props: { label: 'Topics', error: 'Pick one' },
        slots: {
          default: () => [
            h(NbCheckbox, { label: 'Design' }),
            h(NbCheckbox, { label: 'Code' }),
          ],
        },
      }),
  },
  {
    name: 'NbRadio',
    render: () =>
      mount(NbRadio, {
        props: {
          label: 'Plan',
          name: 'plan',
          modelValue: 'free',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
          ],
        },
      }),
  },
  {
    name: 'NbSwitch',
    render: () =>
      mount(NbSwitch, { props: { label: 'Notifications', name: 'notify' } }),
  },
  {
    name: 'NbSlider',
    render: () =>
      mount(NbSlider, { props: { label: 'Volume', modelValue: 40 } }),
  },
  {
    name: 'NbTabs',
    render: () =>
      mount(NbTabs, {
        props: {
          items: [
            { id: 'a', label: 'Settings' },
            { id: 'b', label: 'Hours' },
          ],
          modelValue: 'a',
        },
      }),
  },
  {
    name: 'NbAccordion',
    render: () =>
      mount(NbAccordion, {
        slots: {
          default: () => [
            h(NbAccordionItem, { id: 'a', title: 'One' }, () => 'Body one'),
            h(NbAccordionItem, { id: 'b', title: 'Two' }, () => 'Body two'),
          ],
        },
      }),
  },
  {
    name: 'NbTree',
    render: () =>
      mount(NbTree, {
        props: { modelValue: 'b' },
        slots: {
          default: () => [
            h(NbTreeNode, { id: 'a', label: 'Docs' }, () => [
              h(NbTreeNode, { id: 'a1', label: 'Guide' }),
            ]),
            h(NbTreeNode, { id: 'b', label: 'Design' }),
          ],
        },
      }),
  },
  {
    name: 'NbDataTable',
    render: () =>
      mount(NbDataTable, {
        props: {
          columns: [
            { key: 'name', header: 'Name', sortable: true },
            { key: 'role', header: 'Role' },
          ],
          rows: [
            { id: 1, name: 'Ada', role: 'Engineer' },
            { id: 2, name: 'Grace', role: 'Admiral' },
          ],
          rowKey: 'id',
          selectable: 'multiple',
          onRowClick: () => {},
        },
      }),
  },
  {
    name: 'NbPagination',
    render: () =>
      mount(NbPagination, { props: { page: 2, pageSize: 10, total: 95 } }),
  },
  {
    name: 'NbBreadcrumbs',
    render: () =>
      mount(NbBreadcrumbs, {
        props: {
          items: [
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Billing' },
          ],
        },
      }),
  },
  {
    name: 'NbBanner',
    render: () =>
      mount(NbBanner, {
        props: { variant: 'warning' },
        slots: { default: () => 'Maintenance tonight' },
      }),
  },
  {
    name: 'NbMessage',
    render: () =>
      mount(NbMessage, {
        props: { variant: 'error' },
        slots: { default: () => 'Failed' },
      }),
  },
  {
    name: 'NbBadge',
    render: () => mount(NbBadge, { slots: { default: () => 'New' } }),
  },
  {
    name: 'NbProgressBar',
    render: () =>
      mount(NbProgressBar, { props: { value: 40, label: 'Uploading' } }),
  },
  {
    name: 'NbField',
    render: () =>
      mount(NbField, {
        props: { label: 'Name', hint: 'As on your passport' },
        slots: {
          default: (p: { id: string; describedby?: string }) =>
            h('input', { id: p.id, 'aria-describedby': p.describedby }),
        },
      }),
  },
  {
    name: 'NbFileUploader',
    render: () =>
      mount(NbFileUploader, {
        props: { heading: 'Attachments', description: 'Up to 5MB' },
      }),
  },
  {
    name: 'NbEmptyState',
    render: () =>
      mount(NbEmptyState, {
        props: { title: 'No invoices', description: 'Create one to start.' },
      }),
  },
  {
    name: 'NbModal',
    render: () =>
      mount(NbModal, {
        props: { open: true, title: 'Rename' },
        slots: { default: () => h('p', 'Body') },
      }),
  },
  {
    name: 'NbMenu',
    render: () =>
      mount(NbMenu, {
        props: { open: true },
        slots: {
          default: () => [
            h(NbMenuItem, { label: 'Copy' }),
            h(NbMenuItem, { label: 'Paste', disabled: true }),
          ],
        },
      }),
  },
]

const mounted: VueWrapper[] = []
afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
})

// jsdom has no layout: what the components measure on mount is stubbed.
Element.prototype.scrollIntoView = vi.fn()

async function violations(c: ICase): Promise<string[]> {
  // The whole body is checked, so teleported surfaces (modal, menu) are seen.
  const w = c.render()
  mounted.push(w)
  document.body.appendChild(w.element)
  await nextTick()
  await nextTick()
  const result = await axe.run(document.body, {
    rules: Object.fromEntries(
      DISABLED_RULES.map((id) => [id, { enabled: false }]),
    ),
    resultTypes: ['violations'],
  })
  return result.violations.map((v) => v.id).sort()
}

const known = baseline as Record<string, string[]>

describe('axe, gated on the baseline', () => {
  it.each(cases)('$name', async (c) => {
    const found = await violations(c)
    const allowed = [...(known[c.name] ?? [])].sort()
    expect(
      found,
      `axe rules for ${c.name}. New ones are regressions; a listed one that ` +
        'no longer fires should be removed from tests/axe-baseline.json.',
    ).toEqual(allowed)
  })

  it('lists no case the suite does not run', () => {
    const names = new Set(cases.map((c) => c.name))
    expect(Object.keys(known).filter((k) => !names.has(k))).toEqual([])
  })
})
