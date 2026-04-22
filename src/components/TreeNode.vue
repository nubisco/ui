<script setup lang="ts">
import { inject, computed, provide, useSlots } from 'vue'
import NbIcon from './Icon.vue'
import { NB_TREE_KEY, NB_TREE_DEPTH_KEY } from './TreeContext'
import type { ITreeNodeProps, ITreeContext, TTreeDropPosition } from './Tree.d'

const props = withDefaults(defineProps<ITreeNodeProps>(), {
  icon: undefined,
  disabled: false,
  depth: null,
  draggable: null,
})

const emit = defineEmits<{
  select: [id: string]
  toggle: [id: string, expanded: boolean]
  contextmenu: [e: MouseEvent, id: string]
  dblclick: [id: string]
}>()

const slots = useSlots()
const tree = inject(NB_TREE_KEY) as ITreeContext
const parentDepth = inject(NB_TREE_DEPTH_KEY, 0)

const depth = computed(() => props.depth ?? parentDepth)

// Provide depth + 1 to children so nesting auto-increments
provide(NB_TREE_DEPTH_KEY, depth.value + 1)

const hasChildren = computed(() => !!slots.default)
const isExpanded = computed(() => tree?.expandedIds.has(props.id) ?? false)
const isSelected = computed(() => tree?.selectedId === props.id)
const isCompact = computed(() => tree?.compact ?? false)

const rowHeight = computed(() => (isCompact.value ? '24px' : '32px'))
// Carbon spec: 16px base padding + 16px per depth level
const indentPx = computed(() => `${16 + depth.value * 16}px`)

// Drag and drop
const isDraggable = computed(() => {
  if (props.disabled) return false
  if (props.draggable !== null) return props.draggable
  return tree?.draggable ?? false
})

const isDragging = computed(() => tree?.drag.dragId === props.id)

const isDropTarget = computed(() => tree?.drag.dropTargetId === props.id)
const dropPosition = computed(() =>
  isDropTarget.value ? tree?.drag.dropPosition : null,
)

function handleClick() {
  if (props.disabled || !tree) return
  tree.select(props.id)
  emit('select', props.id)
}

function handleChevronClick(e: Event) {
  e.stopPropagation()
  if (props.disabled || !tree) return
  tree.toggle(props.id)
  emit('toggle', props.id, !isExpanded.value)
}

function handleDblClick() {
  if (props.disabled) return
  if (hasChildren.value && tree) tree.toggle(props.id)
  emit('dblclick', props.id)
}

function handleContextMenu(e: MouseEvent) {
  emit('contextmenu', e, props.id)
}

// Drag event handlers
function onDragStart(e: DragEvent) {
  if (!isDraggable.value || !tree || !e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', props.id)
  tree.onDragStart(props.id)
}

function getDropPosition(e: DragEvent, el: HTMLElement): TTreeDropPosition {
  const rect = el.getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height
  if (y < height * 0.25) return 'before'
  if (y > height * 0.75) return 'after'
  return hasChildren.value ? 'inside' : y < height * 0.5 ? 'before' : 'after'
}

function onDragOver(e: DragEvent) {
  if (!tree || tree.drag.dragId === props.id || props.disabled) return
  e.preventDefault()
  e.stopPropagation()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  const row = (e.currentTarget as HTMLElement).querySelector(
    '.nb-tree-node__label',
  ) as HTMLElement
  if (row) tree.onDragOver(props.id, getDropPosition(e, row))
}

function onDragLeave(e: DragEvent) {
  if (!tree) return
  const related = e.relatedTarget as HTMLElement | null
  const current = e.currentTarget as HTMLElement
  if (!related || !current.contains(related)) {
    tree.onDragLeave(props.id)
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (!tree) return
  tree.onDrop()
}

function onDragEnd() {
  if (!tree) return
  tree.onDragEnd()
}

function onKeydown(e: KeyboardEvent) {
  if (!tree) return
  if (e.key === 'Enter') {
    e.preventDefault()
    handleClick()
  } else if (e.key === 'ArrowRight' && hasChildren.value) {
    e.preventDefault()
    if (!isExpanded.value) {
      tree.toggle(props.id)
      emit('toggle', props.id, true)
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    if (isExpanded.value) {
      tree.toggle(props.id)
      emit('toggle', props.id, false)
    }
  } else if (e.key === 'F2') {
    e.preventDefault()
    emit('dblclick', props.id)
  }
}
</script>

<template>
  <li
    role="treeitem"
    tabindex="-1"
    :draggable="isDraggable || undefined"
    :aria-expanded="hasChildren ? isExpanded : undefined"
    :aria-selected="isSelected"
    :aria-disabled="disabled || undefined"
    :aria-grabbed="isDraggable ? isDragging : undefined"
    class="nb-tree-node"
    :class="{
      'nb-tree-node--selected': isSelected,
      'nb-tree-node--disabled': disabled,
      'nb-tree-node--branch': hasChildren,
      'nb-tree-node--leaf': !hasChildren,
      'nb-tree-node--dragging': isDragging,
      'nb-tree-node--drop-before': dropPosition === 'before',
      'nb-tree-node--drop-after': dropPosition === 'after',
      'nb-tree-node--drop-inside': dropPosition === 'inside',
    }"
    @click.stop="handleClick"
    @dblclick.stop="handleDblClick"
    @contextmenu.prevent="handleContextMenu"
    @keydown="onKeydown"
    @dragstart="onDragStart"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @dragend="onDragEnd"
  >
    <div
      class="nb-tree-node__label"
      :style="{ minHeight: rowHeight, paddingInlineStart: indentPx }"
    >
      <!-- Chevron toggle (branches only) -->
      <span
        v-if="hasChildren"
        class="nb-tree-node__toggle"
        @click="handleChevronClick"
      >
        <NbIcon
          name="caret-right"
          size="xs"
          class="nb-tree-node__toggle-icon"
          :class="{ 'nb-tree-node__toggle-icon--expanded': isExpanded }"
        />
      </span>

      <!-- Leaf spacer (aligns text with branch siblings) -->
      <span v-else class="nb-tree-node__toggle-spacer" />

      <!-- Icon -->
      <NbIcon v-if="icon" :name="icon" size="sm" class="nb-tree-node__icon" />

      <!-- Label text -->
      <span class="nb-tree-node__label-text">
        <slot name="label">{{ label }}</slot>
      </span>

      <!-- Actions slot (right side, visible on hover/selected) -->
      <span v-if="$slots.actions" class="nb-tree-node__actions">
        <slot name="actions" />
      </span>
    </div>

    <!-- Children (expanded branches only) -->
    <ul
      v-if="hasChildren && isExpanded"
      role="group"
      class="nb-tree-node__children"
    >
      <slot />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
.nb-tree-node {
  list-style: none;
  outline: none;
  color: var(--nb-c-text-muted);

  &:hover {
    cursor: pointer;
  }

  // ── Label row ───────────────────────────────────────────────────────────────
  // Carbon: .cds--tree-node__label
  // Full-width row, no border-radius. 32px min height, 16px right padding.

  &__label {
    position: relative;
    display: flex;
    box-sizing: border-box;
    align-items: center;
    gap: 0;
    inline-size: 100%;
    min-block-size: 2rem; // 32px
    padding-inline-end: 1rem; // 16px
    transition: background 0.1s;

    &:hover {
      background: var(
        --nb-c-surface-hover,
        var(--nb-c-layer-hover-1, rgba(255, 255, 255, 0.06))
      );
      color: var(--nb-c-text);
    }

    &:hover .nb-tree-node__toggle-icon,
    &:hover .nb-tree-node__icon {
      color: var(--nb-c-text);
    }
  }

  // ── Focus ───────────────────────────────────────────────────────────────────
  // Carbon: focus-outline('outline') on the label

  &:focus > .nb-tree-node__label {
    outline: 2px solid var(--nb-c-focus-ring, var(--nb-c-primary));
    outline-offset: -2px;
  }

  &--disabled:focus > .nb-tree-node__label {
    outline: none;
  }

  // ── Selected state ──────────────────────────────────────────────────────────
  // Carbon: $layer-selected-01 background + 4px $interactive left bar

  &--selected > .nb-tree-node__label {
    background: color-mix(
      in srgb,
      var(--nb-c-primary) 12%,
      var(--nb-c-surface, transparent)
    );
    color: var(--nb-c-text);

    // Active indicator bar (left edge, flush, no border-radius)
    &::before {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      block-size: 100%;
      inline-size: 4px;
      background-color: var(--nb-c-primary);
      content: '';
    }

    &:hover {
      background: color-mix(
        in srgb,
        var(--nb-c-primary) 18%,
        var(--nb-c-surface, transparent)
      );
    }
  }

  &--selected > .nb-tree-node__label .nb-tree-node__toggle-icon,
  &--selected > .nb-tree-node__label .nb-tree-node__icon {
    color: var(--nb-c-text);
  }

  // ── Disabled ────────────────────────────────────────────────────────────────
  // Carbon: $field-01 bg, $text-disabled color, cursor not-allowed

  &--disabled {
    color: var(--nb-c-text-subtle, var(--nb-c-text-muted));
    cursor: not-allowed;

    .nb-tree-node__label,
    .nb-tree-node__label:hover,
    .nb-tree-node__label:hover .nb-tree-node__toggle-icon,
    .nb-tree-node__label:hover .nb-tree-node__icon {
      background: var(--nb-c-field-bg, transparent);
      color: var(--nb-c-text-subtle, var(--nb-c-text-muted));
      cursor: not-allowed;
    }
  }

  // ── Toggle (chevron) ────────────────────────────────────────────────────────
  // Carbon: 24x24 toggle, margin-inline: -$spacing-02 $spacing-02 (-4px 4px)
  // Chevron bleeds 4px into the node padding, 4px gap on right before icon/text.

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    block-size: 1.5rem; // 24px
    inline-size: 1.5rem; // 24px
    margin-inline: -0.25rem 0.25rem; // -4px 4px
    padding: 0;
    border: 0;
    cursor: pointer;

    &:focus {
      outline: none;
    }
  }

  &__toggle-icon {
    color: var(--nb-c-text-muted);
    transform: rotate(-90deg);
    transition: transform 0.1s ease;

    &--expanded {
      transform: rotate(0deg);
    }
  }

  // Leaf spacer: matches toggle effective width (24px with -4px left margin)
  // so leaf text aligns with branch text at the same depth.
  &__toggle-spacer {
    flex-shrink: 0;
    inline-size: 1.25rem; // 20px = 24px toggle - 4px left margin offset
  }

  // ── Node icon ───────────────────────────────────────────────────────────────
  // Carbon: $spacing-03 (8px) margin on each side, 16px min size

  &__icon {
    flex-shrink: 0;
    color: var(--nb-c-text-muted);
    margin-inline: 0.5rem; // 8px each side
    min-block-size: 1rem; // 16px
    min-inline-size: 1rem; // 16px
  }

  // When icon follows the toggle, reduce left margin to account for toggle right margin
  &__toggle + .nb-tree-node__label__details &__icon,
  &__toggle + &__icon {
    margin-inline-start: 0.25rem; // 4px
  }

  // ── Label text ──────────────────────────────────────────────────────────────
  // Carbon: body-compact-01, line-height 1.2, 4px left padding, ellipsis

  &__label-text {
    display: block;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    padding-inline-start: 0.25rem; // 4px
    font-size: inherit;
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  &__actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-inline-start: auto;
    opacity: 0;
    transition: opacity 0.1s;
  }

  &__label:hover .nb-tree-node__actions,
  &--selected .nb-tree-node__actions {
    opacity: 1;
  }

  // ── Children ────────────────────────────────────────────────────────────────

  &__children {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  // ── Drag and drop states ────────────────────────────────────────────────────

  &--dragging {
    opacity: 0.4;
  }

  &--drop-before > .nb-tree-node__label {
    box-shadow: inset 0 2px 0 0 var(--nb-c-primary);
  }

  &--drop-after > .nb-tree-node__label {
    box-shadow: inset 0 -2px 0 0 var(--nb-c-primary);
  }

  &--drop-inside > .nb-tree-node__label {
    background: color-mix(in srgb, var(--nb-c-primary) 15%, transparent);
    box-shadow: inset 0 0 0 2px var(--nb-c-primary);
  }
}
</style>
