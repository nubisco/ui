<script setup lang="ts">
import { provide, reactive, ref } from 'vue'
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
function unregisterNode(_id: string) {
  /* reserved */
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

// Keyboard navigation -- WAI-ARIA TreeView pattern
function getVisibleNodes(): HTMLElement[] {
  if (!treeRef.value) return []
  return Array.from(treeRef.value.querySelectorAll('[role="treeitem"]'))
}

function onKeydown(e: KeyboardEvent) {
  const nodes = getVisibleNodes()
  if (nodes.length === 0) return

  const active = document.activeElement as HTMLElement
  const idx = nodes.indexOf(active)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (idx < nodes.length - 1) nodes[idx + 1].focus()
      else if (idx === -1) nodes[0].focus()
      break
    case 'ArrowUp':
      e.preventDefault()
      if (idx > 0) nodes[idx - 1].focus()
      break
    case 'Home':
      e.preventDefault()
      nodes[0]?.focus()
      break
    case 'End':
      e.preventDefault()
      nodes[nodes.length - 1]?.focus()
      break
  }
}

defineExpose({ expandIds, collapseAll })
</script>

<template>
  <ul
    ref="treeRef"
    role="tree"
    class="nb-tree"
    :class="{
      'nb-tree--compact': compact || size === 'sm',
    }"
    @keydown="onKeydown"
  >
    <slot />
  </ul>
</template>

<style lang="scss" scoped>
.nb-tree {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem; // 14px, Carbon body-compact-01
  line-height: 1.2;
  user-select: none;
  overflow: hidden;
  color: var(--nb-c-text-muted);

  // xs size variant: 24px row height
  &--compact {
    font-size: 0.75rem; // 12px

    :deep(.nb-tree-node__label) {
      min-block-size: 1.5rem; // 24px
    }
  }
}
</style>
