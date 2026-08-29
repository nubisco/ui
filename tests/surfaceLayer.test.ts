import { describe, it, expect } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import Panel from '../src/components/Panel.vue'
import Layer from '../src/components/Layer.vue'
import Modal from '../src/components/Modal.vue'
import {
  clampLayer,
  layerClassFor,
  probeLayerFromDom,
  useLayer,
  NB_MAX_LAYER,
} from '../src/composables/useSurfaceLayer.composable'

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
