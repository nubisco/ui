import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Panel from '../src/components/Panel.vue'
import Layer from '../src/components/Layer.vue'
import Modal from '../src/components/Modal.vue'
import Board from '../src/components/Board.vue'
import Calendar from '../src/components/Calendar.vue'
import DataTable from '../src/components/DataTable.vue'
import DatePicker from '../src/components/DatePicker.vue'
import FileUploader from '../src/components/FileUploader.vue'
import Shell from '../src/components/Shell.vue'
import ShellPanel from '../src/components/ShellPanel.vue'
import {
  clampLayer,
  layerClassFor,
  probeLayerFromDom,
  useLayer,
  NB_MAX_LAYER,
} from '../src/composables/useSurfaceLayer.composable'

// Mounts attach to the real document so the DOM probe has something to walk.
// A test that fails before its own unmount would otherwise leave its markup
// behind and the next `document.body` query would answer from the wreckage.
afterEach(() => {
  document.body.innerHTML = ''
})

/** Reads the layer class off an element, or null when it carries none. */
function layerOf(el: Element | null | undefined): number | null {
  if (!el) return null
  for (let level = 0; level <= NB_MAX_LAYER; level++) {
    if (el.classList.contains(layerClassFor(level as 0 | 1 | 2 | 3))) {
      return level
    }
  }
  return null
}

/** Layer of every panel in the tree, outermost first. */
function panelLayers(root: Element): (number | null)[] {
  return Array.from(root.querySelectorAll('.nb-panel')).map(layerOf)
}

/** Mounts a template into a real document node so the DOM probe can walk up. */
async function mountInBody(template: string) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(
    defineComponent({ components: { Panel, Layer }, template }),
    { attachTo: host },
  )
  await nextTick()
  await nextTick()
  return wrapper
}

describe('clampLayer', () => {
  it('clamps into the 0..3 range', () => {
    expect(clampLayer(-2)).toBe(0)
    expect(clampLayer(0)).toBe(0)
    expect(clampLayer(3)).toBe(3)
    expect(clampLayer(4)).toBe(3)
    expect(clampLayer(99)).toBe(3)
    expect(clampLayer(Number.NaN)).toBe(0)
  })
})

describe('contextual nesting', () => {
  it('paints layer 1 at the top of a tree, matching the :root default', async () => {
    const wrapper = await mountInBody('<Panel />')
    expect(layerOf(wrapper.element)).toBe(1)
    wrapper.unmount()
  })

  it('moves one layer deeper for every level of nesting', async () => {
    const wrapper = await mountInBody('<Panel><Panel><Panel /></Panel></Panel>')
    expect(panelLayers(document.body)).toEqual([1, 2, 3])
    wrapper.unmount()
  })

  it('counts nesting through plain intermediate markup', async () => {
    const wrapper = await mountInBody(
      '<Panel><div><section><Panel /></section></div></Panel>',
    )
    expect(panelLayers(document.body)).toEqual([1, 2])
    wrapper.unmount()
  })

  it('clamps at 3 and repeats instead of running out', async () => {
    const wrapper = await mountInBody(
      '<Panel><Panel><Panel><Panel><Panel /></Panel></Panel></Panel></Panel>',
    )
    expect(panelLayers(document.body)).toEqual([1, 2, 3, 3, 3])
    wrapper.unmount()
  })

  it('stamps the surface marker so the DOM carries the resolved level', async () => {
    const wrapper = await mountInBody('<Panel><Panel /></Panel>')
    const panels = Array.from(document.body.querySelectorAll('.nb-panel'))
    expect(panels.map((p) => p.getAttribute('data-nb-layer'))).toEqual([
      '1',
      '2',
    ])
    wrapper.unmount()
  })
})

describe('explicit control', () => {
  it('honours a class on the component itself and does not double it', async () => {
    const wrapper = await mountInBody('<Panel class="nb-layer-3" />')
    expect(layerOf(wrapper.element)).toBe(3)
    expect(wrapper.element.className).not.toContain('nb-layer-1')
    wrapper.unmount()
  })

  it('honours the layer prop', async () => {
    const wrapper = await mountInBody('<Panel :layer="0" />')
    expect(layerOf(wrapper.element)).toBe(0)
    wrapper.unmount()
  })

  it('an explicit surface still deepens what is inside it', async () => {
    const wrapper = await mountInBody('<Panel :layer="0"><Panel /></Panel>')
    expect(panelLayers(document.body)).toEqual([0, 1])
    wrapper.unmount()
  })

  it('a .nb-layer-N container resets contextual depth for its subtree', async () => {
    const wrapper = await mountInBody(
      '<Panel><Panel><div class="nb-layer-0"><Panel><Panel /></Panel></div></Panel></Panel>',
    )
    // 1, 2, then the container resets to 0 and counting restarts from there.
    expect(panelLayers(document.body)).toEqual([1, 2, 0, 1])
    wrapper.unmount()
  })

  it('the nearest container wins when containers are nested', async () => {
    const wrapper = await mountInBody(
      '<div class="nb-layer-3"><div class="nb-layer-1"><Panel /></div></div>',
    )
    expect(panelLayers(document.body)).toEqual([1])
    wrapper.unmount()
  })
})

describe('backward compatibility with hand-annotated layouts', () => {
  // Every layer a consumer can name, with a surface directly inside it. Before
  // this mechanism existed, .nb-layer-N set --nb-c-surface for its whole
  // subtree, so the panel painted exactly N. It still must.
  it.each([0, 1, 2, 3])(
    'a panel directly inside .nb-layer-%i still paints that layer',
    async (level) => {
      const wrapper = await mountInBody(
        `<div class="nb-layer-${level}"><Panel /></div>`,
      )
      expect(panelLayers(document.body)).toEqual([level])
      wrapper.unmount()
    },
  )

  it('an exhaustively annotated nesting site renders exactly as annotated', async () => {
    // The workaround this mechanism replaces: every nesting site named by hand.
    const wrapper = await mountInBody(`
      <div class="nb-layer-0">
        <Panel />
        <div class="nb-layer-1">
          <Panel />
          <div class="nb-layer-2">
            <Panel />
            <div class="nb-layer-3"><Panel /></div>
          </div>
        </div>
      </div>
    `)
    expect(panelLayers(document.body)).toEqual([0, 1, 2, 3])
    wrapper.unmount()
  })

  it('leaves the layer utility classes themselves untouched', async () => {
    const wrapper = await mountInBody(
      '<div class="nb-layer-2"><span class="probe" /></div>',
    )
    const container = document.body.querySelector('.nb-layer-2')
    expect(container?.getAttribute('data-nb-layer')).toBeNull()
    wrapper.unmount()
  })
})

describe('NbLayer', () => {
  it('with an explicit level behaves exactly like the CSS class', async () => {
    const withComponent = await mountInBody(
      '<Layer :level="2"><Panel /></Layer>',
    )
    const viaComponent = panelLayers(document.body)
    withComponent.unmount()

    const withClass = await mountInBody(
      '<div class="nb-layer-2"><Panel /></div>',
    )
    expect(viaComponent).toEqual(panelLayers(document.body))
    expect(viaComponent).toEqual([2])
    withClass.unmount()
  })

  it('without a level pushes its subtree one step deeper', async () => {
    const wrapper = await mountInBody('<Panel><Layer><Panel /></Layer></Panel>')
    expect(panelLayers(document.body)).toEqual([1, 3])
    wrapper.unmount()
  })

  it('renders as the requested element', async () => {
    const wrapper = await mountInBody('<Layer as="section" :level="1" />')
    expect(wrapper.element.tagName.toLowerCase()).toBe('section')
    wrapper.unmount()
  })
})

describe('teleported overlays', () => {
  it('a modal paints the overlay layer regardless of where it is teleported', async () => {
    const host = document.createElement('div')
    host.className = 'nb-layer-0'
    document.body.appendChild(host)

    const wrapper = mount(Modal, {
      props: { open: true },
      attachTo: host,
    })
    await nextTick()
    await nextTick()

    const content = document.body.querySelector('.nb-modal--content')
    expect(layerOf(content)).toBe(3)
    wrapper.unmount()
    host.remove()
  })

  it('surfaces inside an overlay keep counting from the overlay layer', async () => {
    const wrapper = mount(Modal, {
      props: { open: true },
      slots: { default: '<div class="nb-panel-host"></div>' },
      attachTo: document.body,
    })
    await nextTick()
    const content = document.body.querySelector('.nb-modal--content')
    expect(content?.getAttribute('data-nb-layer')).toBe('3')
    wrapper.unmount()
  })
})

describe('useLayer', () => {
  it('reports the level the next surface would paint', async () => {
    const seen: number[] = []
    const Probe = defineComponent({
      setup() {
        const { level } = useLayer()
        seen.push(level.value)
        return () => h('i')
      },
    })

    const wrapper = mount(
      defineComponent({
        components: { Panel, Probe },
        template: '<Probe /><Panel><Probe /><Panel><Probe /></Panel></Panel>',
      }),
      { attachTo: document.body },
    )
    await nextTick()
    expect(seen).toEqual([1, 2, 3])
    wrapper.unmount()
  })
})

describe('probeLayerFromDom', () => {
  it('reports a painted surface as one level deeper', () => {
    const outer = document.createElement('div')
    outer.setAttribute('data-nb-layer', '1')
    const inner = document.createElement('div')
    outer.appendChild(inner)
    expect(probeLayerFromDom(inner)).toEqual({ level: 2, source: 'surface' })
  })

  it('reports a bare utility class as that exact level', () => {
    const outer = document.createElement('div')
    outer.className = 'nb-layer-2'
    const inner = document.createElement('div')
    outer.appendChild(inner)
    expect(probeLayerFromDom(inner)).toEqual({ level: 2, source: 'class' })
  })

  it('returns null when nothing above claims a layer', () => {
    const solo = document.createElement('div')
    expect(probeLayerFromDom(solo)).toBeNull()
  })
})

// ── Component coverage ──────────────────────────────────────────────────────
//
// Every component that owns a surface painted from `--nb-c-surface` has to
// derive its depth the same way. These mount each wired component twice: alone
// at the top of a tree, where it must reproduce the `:root` default of layer 1,
// and inside a Panel, where it must move one step deeper on its own.

/** Mounts a template into the document with an arbitrary component map. */
async function mountWith(
  components: Record<string, unknown>,
  template: string,
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(
    defineComponent({
      components: { Panel, Layer, ...components } as never,
      template,
    }),
    { attachTo: host },
  )
  await nextTick()
  await nextTick()
  return wrapper
}

const boardProps = `:columns="[{ id: 'todo', label: 'Todo' }]" :items="[{ id: 'a', columnId: 'todo' }]"`
const tableProps = `:columns="[{ key: 'name', header: 'Name' }]" :rows="[{ id: 1, name: 'Ada' }]" row-key="id"`

const wiredSurfaces: {
  name: string
  component: unknown
  tag: string
  props?: string
  selector: string
}[] = [
  {
    name: 'Board',
    component: Board,
    tag: 'Board',
    props: boardProps,
    selector: '.nb-board',
  },
  {
    name: 'Calendar',
    component: Calendar,
    tag: 'Calendar',
    selector: '.nb-calendar',
  },
  {
    name: 'DataTable',
    component: DataTable,
    tag: 'DataTable',
    props: tableProps,
    selector: '.nb-data-table',
  },
  {
    name: 'FileUploader',
    component: FileUploader,
    tag: 'FileUploader',
    selector: '.nb-file-uploader',
  },
  {
    name: 'Shell',
    component: Shell,
    tag: 'Shell',
    selector: '.nb-shell',
  },
  {
    name: 'ShellPanel',
    component: ShellPanel,
    tag: 'ShellPanel',
    selector: '.nb-shell-panel',
  },
]

describe.each(wiredSurfaces)(
  '$name participates in the layer system',
  ({ component, tag, props = '', selector }) => {
    const map = { [tag]: component }

    it('paints layer 1 at the top of a tree, as the :root default does', async () => {
      const wrapper = await mountWith(map, `<${tag} ${props} />`)
      expect(layerOf(document.body.querySelector(selector))).toBe(1)
      wrapper.unmount()
    })

    it('moves one layer deeper inside a panel', async () => {
      const wrapper = await mountWith(map, `<Panel><${tag} ${props} /></Panel>`)
      expect(layerOf(document.body.querySelector(selector))).toBe(2)
      wrapper.unmount()
    })

    it('stamps the surface marker so what it contains counts from it', async () => {
      // Most of these expose named slots rather than a default one, so the
      // marker is the general proof: whatever they render is one step deeper.
      const wrapper = await mountWith(map, `<Panel><${tag} ${props} /></Panel>`)
      const el = document.body.querySelector(selector)
      expect(el?.getAttribute('data-nb-layer')).toBe('2')
      wrapper.unmount()
    })

    it('still obeys a hand-written .nb-layer-N container', async () => {
      const wrapper = await mountWith(
        map,
        `<div class="nb-layer-0"><${tag} ${props} /></div>`,
      )
      expect(layerOf(document.body.querySelector(selector))).toBe(0)
      wrapper.unmount()
    })

    it('honours an explicit class on the component itself', async () => {
      const wrapper = await mountWith(
        map,
        `<Panel><${tag} class="nb-layer-3" ${props} /></Panel>`,
      )
      expect(layerOf(document.body.querySelector(selector))).toBe(3)
      wrapper.unmount()
    })
  },
)

describe('a wired surface deepens what is rendered into it', () => {
  it('puts a panel in a shell panel one layer below the shell panel', async () => {
    const wrapper = await mountWith(
      { ShellPanel },
      '<Panel><ShellPanel><Panel /></ShellPanel></Panel>',
    )
    // Outer panel 1, shell panel 2, the panel in its default slot 3.
    expect(layerOf(document.body.querySelector('.nb-shell-panel'))).toBe(2)
    expect(panelLayers(document.body)).toEqual([1, 3])
    wrapper.unmount()
  })
})

describe('Shell as the origin of depth', () => {
  it('keeps its own level at 1 so its chrome paints what it always painted', async () => {
    const wrapper = await mountWith({ Shell }, '<Shell />')
    expect(layerOf(document.body.querySelector('.nb-shell'))).toBe(1)
    wrapper.unmount()
  })

  it('separates a shell panel from the shell body it sits on', async () => {
    const wrapper = await mountWith(
      { Shell, ShellPanel },
      '<Shell><ShellPanel /></Shell>',
    )
    expect(layerOf(document.body.querySelector('.nb-shell'))).toBe(1)
    expect(layerOf(document.body.querySelector('.nb-shell-panel'))).toBe(2)
    wrapper.unmount()
  })

  it('keeps counting through a shell panel into a table', async () => {
    const wrapper = await mountWith(
      { Shell, ShellPanel, DataTable },
      `<Shell><ShellPanel><DataTable ${tableProps} /></ShellPanel></Shell>`,
    )
    expect(layerOf(document.body.querySelector('.nb-data-table'))).toBe(3)
    wrapper.unmount()
  })
})

describe('DatePicker calendar as a floating surface', () => {
  it('paints the overlay layer wherever the field is nested', async () => {
    const wrapper = await mountWith(
      { DatePicker },
      '<Panel><Panel><DatePicker label="When" /></Panel></Panel>',
    )
    await wrapper.find('input').trigger('focus')
    await nextTick()
    const calendar = document.body.querySelector('.nb-date-picker__calendar')
    expect(calendar).not.toBeNull()
    expect(layerOf(calendar)).toBe(3)
    wrapper.unmount()
  })

  it('does not take the depth of its teleport target', async () => {
    // The calendar lands in <body>, which carries no layer at all. Before it
    // used the overlay path it inherited the :root default and painted layer 1,
    // the same surface as the panel the field sits on.
    const wrapper = await mountWith(
      { DatePicker },
      '<div class="nb-layer-0"><DatePicker label="When" /></div>',
    )
    await wrapper.find('input').trigger('focus')
    await nextTick()
    const calendar = document.body.querySelector('.nb-date-picker__calendar')
    expect(layerOf(calendar)).toBe(3)
    expect(calendar?.getAttribute('data-nb-layer')).toBe('3')
    wrapper.unmount()
  })
})
