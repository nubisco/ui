import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { defineComponent, h, ref, type Ref } from 'vue'
import tooltipDirective from '@/directives/ToolTip.directive'
import SidebarStatus from '../src/components/SidebarStatus.vue'
import SidebarMenuItem from '../src/components/SidebarMenuItem.vue'

enableAutoUnmount(afterEach)

const tooltip = { install: tooltipDirective }

/** Renders a component the way the rail does: under a provided variant. */
function inRail(
  variant: Ref<'compact' | 'verbose'>,
  component: unknown,
  props: Record<string, unknown>,
) {
  const Host = defineComponent({
    provide: { 'nb-shell-sidebar-variant': variant },
    render: () => h(component as never, props),
  })
  return mount(Host, { global: { plugins: [tooltip] as never[] } })
}

describe('NbSidebarStatus', () => {
  it('shows its label beside the dot on the expanded rail', () => {
    const view = inRail(ref('verbose'), SidebarStatus, {
      label: 'Daemon connected',
      status: 'success',
    })
    const row = view.find('[role="status"]')
    expect(row.attributes('aria-label')).toBe('Daemon connected')
    expect(row.classes()).toContain('nb-sidebar-status--success')
    expect(view.find('.nb-sidebar-status__label').text()).toBe(
      'Daemon connected',
    )
  })

  it('is the dot alone when collapsed, still named', () => {
    const view = inRail(ref('compact'), SidebarStatus, {
      label: 'Daemon disconnected',
      status: 'danger',
    })
    expect(view.find('.nb-sidebar-status__label').exists()).toBe(false)
    expect(view.find('.nb-sidebar-status__dot').exists()).toBe(true)
    expect(view.find('[role="status"]').attributes('aria-label')).toBe(
      'Daemon disconnected',
    )
  })
})

describe('NbSidebarMenuItem badge on the collapsed rail', () => {
  it('puts a count on the icon instead of beside it', () => {
    const view = inRail(ref('compact'), SidebarMenuItem, {
      label: 'Notifications',
      icon: 'bell',
      badge: 3,
      badgeVariant: 'danger',
    })
    const count = view.find('.nb-sidebar-menu-item__badge-count')
    expect(count.text()).toBe('3')
    expect(count.classes()).toContain(
      'nb-sidebar-menu-item__badge-count--danger',
    )
    expect(view.find('.nb-sidebar-menu-item__badge').exists()).toBe(false)
    expect(view.find('[role="menuitem"]').attributes('aria-label')).toBe(
      'Notifications (3)',
    )
  })

  it('caps a large count', () => {
    const view = inRail(ref('compact'), SidebarMenuItem, {
      label: 'Inbox',
      icon: 'tray',
      badge: '250',
    })
    expect(view.find('.nb-sidebar-menu-item__badge-count').text()).toBe('99+')
  })

  it('keeps a text badge as a dot', () => {
    const view = inRail(ref('compact'), SidebarMenuItem, {
      label: 'Insights',
      icon: 'sparkle',
      badge: 'AI',
      badgeVariant: 'accent',
    })
    expect(view.find('.nb-sidebar-menu-item__badge-count').exists()).toBe(false)
    expect(view.find('.nb-sidebar-menu-item__badge-dot').exists()).toBe(true)
  })
})
