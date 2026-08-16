import { Comment, Fragment, Text, type Slots, type VNode } from 'vue'

/**
 * True when the vnodes would render something visible.
 *
 * Comments (Vue's `v-if` placeholders) and whitespace-only text do not count;
 * fragments are searched recursively.
 *
 * Note the limit: a component vnode always counts, because whether it renders
 * anything is only known after it renders. `<RouterView name="x" />` therefore
 * reads as content even on routes registering no `x` view. Consumers that only
 * need to *style* the empty case should prefer a CSS `:empty` guard, which is
 * evaluated against the real DOM and re-evaluated on navigation.
 */
export function hasRenderableContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) return false
    if (node.type === Text) {
      return (
        typeof node.children === 'string' && node.children.trim().length > 0
      )
    }
    if (node.type === Fragment) {
      return Array.isArray(node.children)
        ? hasRenderableContent(node.children as VNode[])
        : false
    }
    return true
  })
}

/** True when the named slot has renderable content. */
export function hasSlotContent(slots: Slots, name: string): boolean {
  const content = slots[name]?.()
  return content ? hasRenderableContent(content) : false
}
