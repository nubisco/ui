import { defineComponent, h } from 'vue'

const SvgStub = defineComponent({
  name: 'SvgStub',
  render() {
    return h('svg', { 'data-mock-icon': true })
  },
})

const weightMap = {
  regular: SvgStub,
  bold: SvgStub,
  duotone: SvgStub,
  fill: SvgStub,
  light: SvgStub,
  thin: SvgStub,
}

export default new Proxy({} as Record<string, typeof weightMap>, {
  get(_target, _prop: string) {
    return weightMap
  },
})

export const catalog = {} as Record<
  string,
  { name: string; tags: string[]; categories: string[] }
>
