import type { Ref } from 'vue'
import { computed, useSlots } from 'vue'
import ContentTab from './ContentTab.vue'

export function useTabLabels(): Ref<string[]> {
  const slots = useSlots()
  const tabLabels = computed(() => {
    const defaultSlot = slots.default?.()
    if (!defaultSlot) {
      return []
    }

    return defaultSlot
      .filter((vnode) => vnode.type === ContentTab && vnode.props)
      .map((vnode) => vnode.props?.label)
  })
  return tabLabels
}
