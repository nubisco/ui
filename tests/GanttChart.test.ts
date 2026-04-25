import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GanttChart from '../src/components/Charts/GanttChart.vue'

const baseProps = {
  tasks: [
    { id: 't1', label: 'Design', start: '2025-06-01', end: '2025-06-14' },
    { id: 't2', label: 'Develop', start: '2025-06-15', end: '2025-07-15' },
    { id: 't3', label: 'Test', start: '2025-07-16', end: '2025-07-31' },
  ],
}

describe('GanttChart', () => {
  const createWrapper = (props = {}) =>
    mount(GanttChart, {
      props: { ...baseProps, ...props },
    })

  it('renders as a figure element with chart class', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nb-gantt').exists()).toBe(true)
  })

  it('renders task rows in the list panel', () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('.nb-gantt__list-row')
    expect(rows.length).toBe(3)
    expect(rows[0].text()).toContain('Design')
    expect(rows[1].text()).toContain('Develop')
    expect(rows[2].text()).toContain('Test')
  })

  it('renders task bars in the SVG', () => {
    const wrapper = createWrapper()
    const bars = wrapper.findAll('.nb-gantt__bar')
    expect(bars.length).toBe(3)
  })

  it('renders the timeline SVG with aria-label', () => {
    const wrapper = createWrapper({ title: 'Sprint Plan' })
    const svg = wrapper.find('.nb-gantt__svg')
    expect(svg.attributes('aria-label')).toBe('Sprint Plan')
  })

  it('renders grid lines when showGrid is true', () => {
    const wrapper = createWrapper({ showGrid: true })
    expect(wrapper.findAll('.nb-gantt__gridline').length).toBeGreaterThan(0)
  })

  it('hides grid lines when showGrid is false', () => {
    const wrapper = createWrapper({ showGrid: false })
    expect(wrapper.findAll('.nb-gantt__gridline').length).toBe(0)
  })

  it('renders today marker by default', () => {
    const wrapper = createWrapper({
      showTodayMarker: true,
      today: '2025-06-20',
    })
    expect(wrapper.find('.nb-gantt__today-line').exists()).toBe(true)
  })

  it('hides today marker when showTodayMarker is false', () => {
    const wrapper = createWrapper({ showTodayMarker: false })
    expect(wrapper.find('.nb-gantt__today-line').exists()).toBe(false)
  })

  it('renders milestones as diamonds', () => {
    const wrapper = createWrapper({
      tasks: [
        { id: 'm1', label: 'Release', start: '2025-08-01', milestone: true },
      ],
    })
    expect(wrapper.find('.nb-gantt__milestone').exists()).toBe(true)
    // Milestones should not render as bars
    expect(wrapper.findAll('.nb-gantt__bar').length).toBe(0)
  })

  it('renders dependency arrows', () => {
    const wrapper = createWrapper({
      dependencies: [{ from: 't1', to: 't2', type: 'finish-to-start' }],
    })
    expect(wrapper.findAll('.nb-gantt__dependency').length).toBe(1)
    expect(wrapper.findAll('.nb-gantt__dependency-arrow').length).toBe(1)
  })

  it('renders no dependency arrows for empty deps', () => {
    const wrapper = createWrapper({ dependencies: [] })
    expect(wrapper.findAll('.nb-gantt__dependency').length).toBe(0)
  })

  it('applies status classes to bars', () => {
    const wrapper = createWrapper({
      tasks: [
        {
          id: 's1',
          label: 'On track task',
          start: '2025-06-01',
          end: '2025-06-10',
          status: 'on-track',
        },
        {
          id: 's2',
          label: 'At risk task',
          start: '2025-06-11',
          end: '2025-06-20',
          status: 'at-risk',
        },
        {
          id: 's3',
          label: 'Behind task',
          start: '2025-06-21',
          end: '2025-06-30',
          status: 'behind',
        },
      ],
    })
    expect(wrapper.find('.nb-gantt__bar--on-track').exists()).toBe(true)
    expect(wrapper.find('.nb-gantt__bar--at-risk').exists()).toBe(true)
    expect(wrapper.find('.nb-gantt__bar--behind').exists()).toBe(true)
  })

  it('renders progress fill when showProgress is true', () => {
    const wrapper = createWrapper({
      showProgress: true,
      tasks: [
        {
          id: 'p1',
          label: 'Progressing',
          start: '2025-06-01',
          end: '2025-06-30',
          progress: 60,
        },
      ],
    })
    expect(wrapper.find('.nb-gantt__bar-progress').exists()).toBe(true)
  })

  it('does not render progress fill when showProgress is false', () => {
    const wrapper = createWrapper({
      showProgress: false,
      tasks: [
        {
          id: 'p1',
          label: 'Progressing',
          start: '2025-06-01',
          end: '2025-06-30',
          progress: 60,
        },
      ],
    })
    expect(wrapper.find('.nb-gantt__bar-progress').exists()).toBe(false)
  })

  it('renders group headers and supports collapse', async () => {
    const wrapper = createWrapper({
      groups: [{ id: 'g1', label: 'Phase 1' }],
      tasks: [
        {
          id: 't1',
          label: 'Task A',
          start: '2025-06-01',
          end: '2025-06-10',
          group: 'g1',
        },
        {
          id: 't2',
          label: 'Task B',
          start: '2025-06-11',
          end: '2025-06-20',
          group: 'g1',
        },
      ],
    })

    // Group header is visible
    expect(wrapper.find('.nb-gantt__list-group').exists()).toBe(true)
    expect(wrapper.find('.nb-gantt__list-group').text()).toContain('Phase 1')

    // Both tasks visible initially
    expect(wrapper.findAll('.nb-gantt__list-row').length).toBe(2)

    // Click to collapse
    await wrapper.find('.nb-gantt__list-group').trigger('click')
    expect(wrapper.findAll('.nb-gantt__list-row').length).toBe(0)

    // Click again to expand
    await wrapper.find('.nb-gantt__list-group').trigger('click')
    expect(wrapper.findAll('.nb-gantt__list-row').length).toBe(2)
  })

  it('renders summary bars for groups', () => {
    const wrapper = createWrapper({
      groups: [{ id: 'g1', label: 'Phase 1' }],
      tasks: [
        {
          id: 't1',
          label: 'Task A',
          start: '2025-06-01',
          end: '2025-06-10',
          group: 'g1',
        },
        {
          id: 't2',
          label: 'Task B',
          start: '2025-06-11',
          end: '2025-06-20',
          group: 'g1',
        },
      ],
    })
    expect(wrapper.find('.nb-gantt__summary-bar').exists()).toBe(true)
  })

  it('renders time header labels', () => {
    const wrapper = createWrapper()
    expect(wrapper.findAll('.nb-gantt__time-label').length).toBeGreaterThan(0)
  })

  it('uses custom listWidth', () => {
    const wrapper = createWrapper({ listWidth: 300 })
    const list = wrapper.find('.nb-gantt__list')
    expect(list.attributes('style')).toContain('width: 300px')
  })

  it('falls back to chart type for aria-label when no title', () => {
    const wrapper = createWrapper({ title: undefined })
    const svg = wrapper.find('.nb-gantt__svg')
    expect(svg.attributes('aria-label')).toBe('Gantt chart')
  })

  it('supports all dependency types without errors', () => {
    const types = [
      'finish-to-start',
      'start-to-start',
      'finish-to-finish',
      'start-to-finish',
    ] as const
    for (const type of types) {
      const wrapper = createWrapper({
        dependencies: [{ from: 't1', to: 't2', type }],
      })
      expect(wrapper.findAll('.nb-gantt__dependency').length).toBe(1)
    }
  })
})
