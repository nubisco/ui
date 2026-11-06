import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import Button from '../src/components/Button.vue'
import Panel from '../src/components/Panel.vue'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NbButton tertiary', () => {
  it('renders exactly the classes of primary outlined', () => {
    const tertiary = mount(Button, {
      props: { variant: 'tertiary' },
      slots: { default: 'Export' },
    })
    const outlined = mount(Button, {
      props: { variant: 'primary', outlined: true },
      slots: { default: 'Export' },
    })
    expect(tertiary.classes().sort()).toEqual(outlined.classes().sort())
    expect(tertiary.classes()).toContain('nb-button--primary')
    expect(tertiary.classes()).toContain('nb-button--outlined')
    expect(tertiary.classes()).not.toContain('nb-button--tertiary')
  })

  it('leaves every other variant as it was', () => {
    for (const variant of [
      'primary',
      'secondary',
      'ghost',
      'danger',
    ] as const) {
      const w = mount(Button, { props: { variant } })
      expect(w.classes()).toContain(`nb-button--${variant}`)
      expect(w.classes()).not.toContain('nb-button--outlined')
    }
  })
})

describe('one primary per header', () => {
  function mountPanel(template: string, setup?: () => Record<string, unknown>) {
    return mount(
      defineComponent({ components: { Panel, Button }, template, setup }),
    )
  }

  it('warns when two filled primaries share a panel header', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountPanel(`
      <Panel title="Members">
        <template #actions>
          <Button variant="primary">Invite</Button>
          <Button variant="primary">Import</Button>
        </template>
      </Panel>`)
    await nextTick()
    const calls = warn.mock.calls.filter((c) =>
      String(c[0]).includes('filled primary buttons'),
    )
    expect(calls).toHaveLength(1)
    expect(String(calls[0][0])).toContain('[NbPanel]')
  })

  it('does not warn for one primary beside quieter buttons', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountPanel(`
      <Panel title="Members">
        <template #actions>
          <Button variant="tertiary">Export</Button>
          <Button variant="primary" outlined>Import</Button>
          <Button variant="primary">Invite</Button>
        </template>
      </Panel>`)
    await nextTick()
    expect(
      warn.mock.calls.filter((c) =>
        String(c[0]).includes('filled primary buttons'),
      ),
    ).toHaveLength(0)
  })

  it('does not count primaries in the panel body', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountPanel(`
      <Panel title="Members">
        <template #actions><Button variant="primary">Invite</Button></template>
        <Button variant="primary">Save</Button>
      </Panel>`)
    await nextTick()
    expect(
      warn.mock.calls.filter((c) =>
        String(c[0]).includes('filled primary buttons'),
      ),
    ).toHaveLength(0)
  })

  it('uncounts a primary that unmounts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const showFirst = ref(true)
    const showSecond = ref(false)
    const w = mountPanel(
      `
      <Panel title="Members">
        <template #actions>
          <Button v-if="showFirst" variant="primary">Invite</Button>
          <Button v-if="showSecond" variant="primary">Import</Button>
        </template>
      </Panel>`,
      () => ({ showFirst, showSecond }),
    )
    await nextTick()
    showFirst.value = false
    await nextTick()
    showSecond.value = true
    await nextTick()
    expect(
      warn.mock.calls.filter((c) =>
        String(c[0]).includes('filled primary buttons'),
      ),
    ).toHaveLength(0)
    w.unmount()
  })

  it('stays silent in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mountPanel(`
      <Panel title="Members">
        <template #actions>
          <Button variant="primary">Invite</Button>
          <Button variant="primary">Import</Button>
        </template>
      </Panel>`)
    await nextTick()
    vi.unstubAllEnvs()
    expect(
      warn.mock.calls.filter((c) =>
        String(c[0]).includes('filled primary buttons'),
      ),
    ).toHaveLength(0)
  })
})
