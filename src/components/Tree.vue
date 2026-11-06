<template>
  <ul
    ref="treeRef"
    role="tree"
    class="nb-tree"
    :class="{
      'nb-tree--compact': compact || size === 'sm',
    }"
    @keydown="onKeydown"
    @focusin="onFocusin"
  >
    <slot />
  </ul>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUpdated, provide, reactive, ref } from 'vue'
import type {
  ITreeProps,
  ITreeContext,
  ITreeDragState,
  ITreeDropEvent,
  TTreeDropPosition,
} from './Tree.d'
import { NB_TREE_KEY } from './TreeContext'

const props = withDefaults(defineProps<ITreeProps>(), {
  modelValue: null,
  compact: false,
  size: 'md',
  draggable: false,
})

const emit = defineEmits<{
  'update:modelValue': [id: string]
  select: [id: string]
  toggle: [id: string, expanded: boolean]
  drop: [event: ITreeDropEvent]
}>()

const expandedIds = reactive(new Set<string>())
const treeRef = ref<HTMLElement>()

/*
 * Roving tabindex. Exactly one row is in the tab order: the one last focused,
 * else the selected row, else the first. Tab reaches the tree once and lands
 * where the user left off; the arrows move inside it.
 */
const activeId = ref<string | null>(null)

// Drag-and-drop state
const drag: ITreeDragState = reactive({
  dragId: null,
  dropTargetId: null,
  dropPosition: null,
})

function select(id: string) {
  emit('update:modelValue', id)
  emit('select', id)
}

function toggle(id: string) {
  if (expandedIds.has(id)) {
    expandedIds.delete(id)
    emit('toggle', id, false)
  } else {
    expandedIds.add(id)
    emit('toggle', id, true)
  }
}

function registerNode(_id: string, _el: HTMLElement) {
  /* reserved for future focus management */
}
// A row that unmounts (its parent collapsed, or the data changed) may have
// been the tab stop. Rows re-render on their own, so the tree's onUpdated
// does not see it: the row says so here.
function unregisterNode(id: string) {
  if (activeId.value === id) nextTick(syncTabStop)
}

// Drag handlers (called by TreeNode via context)
function onDragStart(id: string) {
  drag.dragId = id
}

function onDragOver(id: string, position: TTreeDropPosition) {
  if (id === drag.dragId) return
  drag.dropTargetId = id
  drag.dropPosition = position
}

function onDragLeave(id: string) {
  if (drag.dropTargetId === id) {
    drag.dropTargetId = null
    drag.dropPosition = null
  }
}

function onDrop() {
  if (drag.dragId && drag.dropTargetId && drag.dropPosition) {
    emit('drop', {
      sourceId: drag.dragId,
      targetId: drag.dropTargetId,
      position: drag.dropPosition,
    })
  }
  resetDrag()
}

function onDragEnd() {
  resetDrag()
}

function resetDrag() {
  drag.dragId = null
  drag.dropTargetId = null
  drag.dropPosition = null
}

/**
 * Expand a set of node IDs programmatically.
 */
function expandIds(ids: string[]) {
  for (const id of ids) expandedIds.add(id)
}

/**
 * Collapse all expanded nodes.
 */
function collapseAll() {
  expandedIds.clear()
}

provide(
  NB_TREE_KEY,
  reactive({
    get selectedId() {
      return props.modelValue ?? null
    },
    get tabStopId() {
      return activeId.value
    },
    select,
    toggle,
    expandedIds,
    get compact() {
      return props.compact || props.size === 'sm'
    },
    get draggable() {
      return props.draggable
    },
    drag,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    registerNode,
    unregisterNode,
  }) as ITreeContext,
)

// Keyboard navigation: the WAI-ARIA tree view pattern.
function getVisibleNodes(): HTMLElement[] {
  if (!treeRef.value) return []
  return Array.from(
    treeRef.value.querySelectorAll<HTMLElement>('[role="treeitem"]'),
  )
}

function nodeId(el: Element | null | undefined): string | null {
  return el?.getAttribute('data-nb-tree-id') ?? null
}

/** The row's own label, not its children's. */
function nodeLabel(el: HTMLElement): string {
  const label = el.querySelector(
    ':scope > .nb-tree-node__label .nb-tree-node__label-text',
  )
  return (label?.textContent ?? '').trim().toLowerCase()
}

function focusNode(el: HTMLElement | undefined) {
  if (!el) return
  activeId.value = nodeId(el)
  el.focus()
}

/**
 * Keeps the single tab stop on a row that exists. Runs after every render:
 * the remembered row can be collapsed away or removed, and a tree with no tab
 * stop cannot be reached at all.
 */
function syncTabStop() {
  const nodes = getVisibleNodes()
  if (nodes.length === 0) return
  const ids = nodes.map(nodeId)
  if (activeId.value && ids.includes(activeId.value)) return
  const selected = props.modelValue ?? null
  activeId.value = selected && ids.includes(selected) ? selected : ids[0]
}
onMounted(() => nextTick(syncTabStop))
onUpdated(syncTabStop)

function onFocusin(e: FocusEvent) {
  const item = (e.target as HTMLElement | null)?.closest?.('[role="treeitem"]')
  const id = nodeId(item)
  if (id) activeId.value = id
}

// First-letter typeahead: a printable key moves to the next visible row whose
// label starts with it, wrapping, so repeating the key walks the matches.
// Keys typed in quick succession build a prefix, as in a native listbox.
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | null = null

function onTypeahead(key: string, nodes: HTMLElement[], idx: number) {
  if (typeaheadTimer) clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => (typeahead = ''), 500)
  const repeat = typeahead === key.toLowerCase()
  typeahead = repeat ? typeahead : typeahead + key.toLowerCase()
  const find = (prefix: string, start: number) => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[(start + i + nodes.length) % nodes.length]
      if (nodeLabel(node).startsWith(prefix)) return node
    }
    return undefined
  }
  const start = repeat || typeahead.length === 1 ? idx + 1 : idx
  let match = find(typeahead, start)
  // A prefix nothing starts with is a new search for the key just typed.
  if (!match && typeahead.length > 1) {
    typeahead = key.toLowerCase()
    match = find(typeahead, idx + 1)
  }
  focusNode(match)
}

function onKeydown(e: KeyboardEvent) {
  const nodes = getVisibleNodes()
  if (nodes.length === 0) return

  const target = e.target as HTMLElement
  // Keys typed into a control inside a row (an inline rename field, a menu
  // button in the actions slot) belong to that control.
  if (target.getAttribute('role') !== 'treeitem') return
  const idx = nodes.indexOf(target)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (idx < nodes.length - 1) focusNode(nodes[idx + 1])
      break
    case 'ArrowUp':
      e.preventDefault()
      if (idx > 0) focusNode(nodes[idx - 1])
      break
    case 'Home':
      e.preventDefault()
      focusNode(nodes[0])
      break
    case 'End':
      e.preventDefault()
      focusNode(nodes[nodes.length - 1])
      break
    case 'ArrowRight': {
      // A closed branch opens (TreeNode does that); an open one moves to its
      // first child. The DOM still shows the state from before this key.
      if (target.getAttribute('aria-expanded') !== 'true') break
      e.preventDefault()
      const child = target.querySelector<HTMLElement>(
        ':scope > [role="group"] > [role="treeitem"]',
      )
      focusNode(child ?? undefined)
      break
    }
    case 'ArrowLeft': {
      // An open branch closes (TreeNode does that); anything else moves to
      // its parent row.
      if (target.getAttribute('aria-expanded') === 'true') break
      e.preventDefault()
      const parent =
        target.parentElement?.closest<HTMLElement>('[role="treeitem"]')
      focusNode(parent ?? undefined)
      break
    }
    default:
      if (
        e.key.length === 1 &&
        e.key !== ' ' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        onTypeahead(e.key, nodes, idx)
      }
  }
}

defineExpose({ expandIds, collapseAll })
</script>

<style lang="scss" scoped>
.nb-tree {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: var(--nb-type-body-compact-size);
  line-height: var(--nb-type-body-compact-line-height);
  user-select: none;
  overflow: hidden;
  color: var(--nb-c-text-muted);

  // xs size variant: 24px row height
  &--compact {
    font-size: var(--nb-type-body-sm-size);

    :deep(.nb-tree-node__label) {
      min-block-size: 1.5rem; // 24px
    }
  }
}
</style>
