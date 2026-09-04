<template>
  <div ref="boardRef" class="nb-board" v-bind="layerProps">
    <div class="nb-board__grid" :style="gridStyle">
      <!-- Column headers -->
      <div
        v-for="(col, colIndex) in columns"
        :key="col.id"
        class="nb-board__col-header"
        :class="{
          'nb-board__col-header--reorderable': reorderableColumns,
          'nb-board__col-header--dragging': dragColumnIndex === colIndex,
          'nb-board__col-header--drop-before': columnDropLine === colIndex,
          'nb-board__col-header--drop-after':
            columnDropLine === colIndex + 1 && colIndex === columns.length - 1,
        }"
        :style="col.color ? { borderTopColor: col.color } : undefined"
        :draggable="reorderableColumns || undefined"
        @dragstart="onColumnDragStart(colIndex, $event)"
        @dragover="onColumnDragOver(colIndex, $event)"
        @drop="onColumnDrop"
        @dragend="onColumnDragEnd"
      >
        <slot name="column-header" :column="col" :count="columnCount(col.id)">
          <span class="nb-board__col-title">{{ col.label }}</span>
          <span class="nb-board__col-count">{{ columnCount(col.id) }}</span>
        </slot>
      </div>

      <!-- Lane rows (a single pass with lane = null renders the flat board) -->
      <template v-for="lane in renderLanes" :key="renderLaneKey(lane)">
        <div
          v-if="lane"
          class="nb-board__lane-header"
          @click="toggleLane(lane.id)"
        >
          <button
            class="nb-board__collapse-btn"
            :aria-label="isCollapsed(lane.id) ? 'Expand' : 'Collapse'"
          >
            {{ isCollapsed(lane.id) ? '&#9654;' : '&#9660;' }}
          </button>
          <slot name="lane-header" :lane="lane">
            <span class="nb-board__lane-label">{{ lane.label }}</span>
          </slot>
          <span class="nb-board__lane-count">{{ laneCount(lane.id) }}</span>
        </div>

        <template v-if="!lane || !isCollapsed(lane.id)">
          <div
            v-for="col in columns"
            :key="renderLaneKey(lane) + '-' + col.id"
            class="nb-board__cell"
            :class="{ 'nb-board__cell--drag-over': isDragOver(lane, col.id) }"
            @dragover.prevent="onCellDragOver(lane, col.id)"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop(lane, col.id)"
          >
            <div
              class="nb-board__cell-items"
              role="list"
              :aria-label="cellLabel(lane, col)"
            >
              <div
                v-for="(item, index) in getCell(laneIdOf(lane), col.id)"
                :key="item.id"
                class="nb-board__card"
                :class="{
                  'nb-board__card--lifted': lifted?.item.id === item.id,
                  'nb-board__card--drop-before':
                    cellIndicator(lane, col.id) === index,
                  'nb-board__card--drop-after': isDropAfter(
                    lane,
                    col.id,
                    index,
                  ),
                }"
                role="listitem"
                tabindex="0"
                :data-item-id="item.id"
                :aria-label="cardLabel(item, lane, col)"
                :aria-describedby="`${uid}-hint`"
                draggable="true"
                @dragstart="onDragStart(item, lane, col.id)"
                @dragover.prevent.stop="
                  onCardDragOver($event, lane, col.id, index)
                "
                @dragend="onDragEnd"
                @keydown="onCardKeydown($event, item, lane, col.id)"
                @blur="onCardBlur(item)"
              >
                <slot
                  name="card"
                  :item="item"
                  :column="col"
                  :lane="lane ?? undefined"
                />
              </div>
              <div
                v-if="getCell(laneIdOf(lane), col.id).length === 0"
                class="nb-board__empty-cell"
                aria-hidden="true"
              />
            </div>
            <div v-if="$slots['column-footer']" class="nb-board__cell-footer">
              <slot
                name="column-footer"
                :column="col"
                :lane="lane ?? undefined"
              />
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- Instructions, and the live region that reports what happened. A
         pointer user watches the card move; a keyboard user gets told. -->
    <span :id="`${uid}-hint`" class="nb-board__sr">
      Press Space or Enter to pick up, arrow keys to move, Space or Enter to
      drop, Escape to cancel.
    </span>
    <span class="nb-board__sr" aria-live="assertive">{{ announcement }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type {
  IBoardProps,
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardColumnMoveEvent,
} from './Board.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { useStableId } from '@/composables/useStableId.composable'

const props = withDefaults(defineProps<IBoardProps>(), {
  lanes: undefined,
  reorderableColumns: false,
})

// Board owns the surfaces its column headers and cards paint, and those cards
// hold consumer content. It takes the current layer so the cards separate from
// whatever the board sits on, and pushes anything nested inside a card deeper.
const { layerProps } = useSurfaceLayer()

const emit = defineEmits<{
  move: [event: IBoardMoveEvent]
  'column-move': [event: IBoardColumnMoveEvent]
}>()

const uid = useStableId({})
const boardRef = ref<HTMLElement | null>(null)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns.length}, minmax(200px, 1fr))`,
}))

// One rendering pass covers both shapes: a board without lanes is a board
// with a single anonymous lane that has no header row.
const renderLanes = computed<(IBoardLane | null)[]>(() =>
  props.lanes && props.lanes.length > 0 ? props.lanes : [null],
)

function laneIdOf(lane: IBoardLane | null): string | null {
  return lane ? (lane.id ?? null) : null
}

function renderLaneKey(lane: IBoardLane | null): string {
  return lane ? laneKey(lane.id) : '__flat__'
}

function columnCount(colId: string): number {
  return props.items.filter((i) => i.columnId === colId).length
}

function laneKey(id: string | null): string {
  return id ?? '__none__'
}

function laneCount(laneId: string | null): number {
  if (!props.lanes) return 0
  return props.items.filter((i) => (i.laneId ?? null) === laneId).length
}

function getCell(laneId: string | null, colId: string): IBoardItem[] {
  if (!props.lanes || props.lanes.length === 0) {
    return props.items.filter((i) => i.columnId === colId)
  }
  return props.items.filter(
    (i) => i.columnId === colId && (i.laneId ?? null) === laneId,
  )
}

function columnOf(colId: string): IBoardColumn | undefined {
  return props.columns.find((c) => c.id === colId)
}

// Lane collapse state
const collapsedLanes = ref(new Set<string>())

function toggleLane(id: string | null) {
  const k = laneKey(id)
  const next = new Set(collapsedLanes.value)
  if (next.has(k)) next.delete(k)
  else next.add(k)
  collapsedLanes.value = next
}

function isCollapsed(id: string | null): boolean {
  return collapsedLanes.value.has(laneKey(id))
}

// ── Naming things for assistive tech ──────────────────────────────────

function labelOf(item: IBoardItem): string {
  const guess = item.label ?? item.name ?? item.title
  if (typeof guess === 'string') return guess
  return `Item ${item.id}`
}

function placeLabel(lane: IBoardLane | null, col: IBoardColumn): string {
  return lane ? `${col.label}, ${lane.label}` : col.label
}

function cellLabel(lane: IBoardLane | null, col: IBoardColumn): string {
  return placeLabel(lane, col)
}

function cardLabel(
  item: IBoardItem,
  lane: IBoardLane | null,
  col: IBoardColumn,
): string {
  const cell = getCell(laneIdOf(lane), col.id)
  const index = cell.findIndex((i) => i.id === item.id)
  const base = `${labelOf(item)}, ${index + 1} of ${cell.length} in ${placeLabel(lane, col)}`
  return lifted.value?.item.id === item.id ? `${base}, picked up` : base
}

// ── Moving ────────────────────────────────────────────────────────────

const announcement = ref('')

/** The single place a card move is emitted, so pointer and keyboard cannot
 *  drift apart in what they report. `toIndex` counts positions in the
 *  destination cell with the moved item excluded. Returns whether anything
 *  actually moved. */
function emitMove(
  drag: { item: IBoardItem; fromLaneId: string | null; fromColumnId: string },
  toLaneId: string | null,
  toColId: string,
  toIndex: number,
): boolean {
  const rest = getCell(toLaneId, toColId).filter((i) => i.id !== drag.item.id)
  const index = Math.max(0, Math.min(toIndex, rest.length))

  const sameCell = drag.fromColumnId === toColId && drag.fromLaneId === toLaneId
  if (sameCell) {
    const originalIndex = getCell(toLaneId, toColId).findIndex(
      (i) => i.id === drag.item.id,
    )
    if (index === originalIndex) return false
  }

  emit('move', {
    itemId: drag.item.id,
    fromColumnId: drag.fromColumnId,
    toColumnId: toColId,
    fromLaneId: drag.fromLaneId,
    toLaneId,
    toIndex: index,
    beforeItemId: rest[index - 1]?.id ?? null,
    afterItemId: rest[index]?.id ?? null,
  })
  return true
}

// ── Pointer drag and drop ─────────────────────────────────────────────

const dragging = ref<{
  item: IBoardItem
  fromLaneId: string | null
  fromColumnId: string
} | null>(null)
// `index` is the insertion point in the cell's rendered sequence, which still
// contains the dragged card when the drag stays in its own cell.
const dragOverTarget = ref<{
  laneId: string | null
  colId: string
  index: number
} | null>(null)

function onDragStart(item: IBoardItem, lane: IBoardLane | null, colId: string) {
  // A card picked up by keyboard is stale the moment a pointer takes over.
  lifted.value = null
  dragging.value = {
    item,
    fromLaneId: laneIdOf(lane),
    fromColumnId: colId,
  }
}

function onCardDragOver(
  event: DragEvent,
  lane: IBoardLane | null,
  colId: string,
  index: number,
) {
  if (!dragging.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const after = event.clientY >= rect.top + rect.height / 2
  dragOverTarget.value = {
    laneId: laneIdOf(lane),
    colId,
    index: index + (after ? 1 : 0),
  }
}

function onCellDragOver(lane: IBoardLane | null, colId: string) {
  if (!dragging.value) return
  const laneId = laneIdOf(lane)
  dragOverTarget.value = { laneId, colId, index: getCell(laneId, colId).length }
}

function onDragLeave() {
  dragOverTarget.value = null
}

function onDragEnd() {
  dragging.value = null
  dragOverTarget.value = null
}

function isDragOver(lane: IBoardLane | null, colId: string): boolean {
  return cellIndicator(lane, colId) !== null
}

/** Where the in-flight card would land in this cell, as an index into the
 *  cell's rendered card sequence, or null when nothing points here. Feeds the
 *  drop-line indicator for pointer and keyboard drags alike. */
function cellIndicator(lane: IBoardLane | null, colId: string): number | null {
  const laneId = laneIdOf(lane)
  const t = dragOverTarget.value
  if (dragging.value && t && t.laneId === laneId && t.colId === colId) {
    return t.index
  }
  const g = lifted.value
  if (g && g.laneId === laneId && g.colId === colId) {
    const draggedIndex = getCell(laneId, colId).findIndex(
      (i) => i.id === g.item.id,
    )
    return draggedIndex !== -1 && draggedIndex <= g.index
      ? g.index + 1
      : g.index
  }
  return null
}

function isDropAfter(
  lane: IBoardLane | null,
  colId: string,
  index: number,
): boolean {
  const cell = getCell(laneIdOf(lane), colId)
  return index === cell.length - 1 && cellIndicator(lane, colId) === index + 1
}

function onDrop(lane: IBoardLane | null, toColId: string) {
  if (dragColumnIndex.value !== null) return
  const target = dragOverTarget.value
  dragOverTarget.value = null
  const drag = dragging.value
  dragging.value = null
  if (!drag) return

  const toLaneId = laneIdOf(lane)
  const cell = getCell(toLaneId, toColId)
  const renderedIndex =
    target && target.laneId === toLaneId && target.colId === toColId
      ? target.index
      : cell.length
  // The insertion point counts positions between rendered cards, so a card
  // moving down its own cell lands one index earlier once it is removed from
  // its old place.
  const draggedIndex = cell.findIndex((i) => i.id === drag.item.id)
  const toIndex =
    draggedIndex !== -1 && draggedIndex < renderedIndex
      ? renderedIndex - 1
      : renderedIndex
  emitMove(drag, toLaneId, toColId, toIndex)
}

// ── Keyboard drag ─────────────────────────────────────────────────────
//
// Pick up, move, drop, exactly like NbReorderList. The board never mutates
// `items` itself, so a keyboard move carries a ghost position around and only
// emits when the card is dropped.
const lifted = ref<{
  item: IBoardItem
  fromLaneId: string | null
  fromColumnId: string
  laneId: string | null
  colId: string
  /** Ghost index in the current cell, counted with the card itself excluded. */
  index: number
} | null>(null)

function onCardKeydown(
  event: KeyboardEvent,
  item: IBoardItem,
  lane: IBoardLane | null,
  colId: string,
) {
  const laneId = laneIdOf(lane)

  if (event.key === 'Escape') {
    if (!lifted.value) return
    event.preventDefault()
    lifted.value = null
    announcement.value = 'Move cancelled'
    return
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    if (lifted.value?.item.id === item.id) dropLifted()
    else pickUp(item, laneId, colId)
    return
  }

  const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  if (!arrowKeys.includes(event.key)) return
  event.preventDefault()

  if (lifted.value?.item.id === item.id) moveGhost(event.key)
  else browse(event.key, item, laneId, colId)
}

function pickUp(item: IBoardItem, laneId: string | null, colId: string) {
  const cell = getCell(laneId, colId)
  const index = cell.findIndex((i) => i.id === item.id)
  lifted.value = {
    item,
    fromLaneId: laneId,
    fromColumnId: colId,
    laneId,
    colId,
    index,
  }
  announcement.value = `${labelOf(item)} picked up, ${ghostPosition()}`
}

function ghostPosition(): string {
  const g = lifted.value
  if (!g) return ''
  const rest = getCell(g.laneId, g.colId).filter((i) => i.id !== g.item.id)
  const col = columnOf(g.colId)
  const lane = props.lanes?.find((l) => (l.id ?? null) === g.laneId) ?? null
  const place = col ? placeLabel(lane, col) : g.colId
  return `position ${g.index + 1} of ${rest.length + 1} in ${place}`
}

/** Lane ids of the cells a ghost can visit, top to bottom. Collapsed lanes
 *  render no cells, so the ghost skips them. */
function visibleLaneIds(): (string | null)[] {
  if (!props.lanes || props.lanes.length === 0) return [null]
  return props.lanes.filter((l) => !isCollapsed(l.id)).map((l) => l.id ?? null)
}

function moveGhost(key: string) {
  const g = lifted.value
  if (!g) return
  const rest = getCell(g.laneId, g.colId).filter((i) => i.id !== g.item.id)

  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const delta = key === 'ArrowUp' ? -1 : 1
    const next = g.index + delta
    if (next >= 0 && next <= rest.length) {
      g.index = next
    } else {
      // Past the edge of the cell: continue into the neighbouring lane's cell
      // in the same column, when there is one.
      const laneIds = visibleLaneIds()
      const laneIndex = laneIds.indexOf(g.laneId)
      const nextIndex = laneIndex + delta
      if (laneIndex === -1 || nextIndex < 0 || nextIndex >= laneIds.length)
        return
      const nextLane = laneIds[nextIndex]
      g.laneId = nextLane
      g.index =
        delta === 1
          ? 0
          : getCell(nextLane, g.colId).filter((i) => i.id !== g.item.id).length
    }
  } else {
    const delta = key === 'ArrowLeft' ? -1 : 1
    const colIndex = props.columns.findIndex((c) => c.id === g.colId)
    const nextCol = props.columns[colIndex + delta]
    if (colIndex === -1 || !nextCol) return
    g.colId = nextCol.id
    const nextRest = getCell(g.laneId, g.colId).filter(
      (i) => i.id !== g.item.id,
    )
    g.index = Math.min(g.index, nextRest.length)
  }

  announcement.value = `${labelOf(g.item)}, ${ghostPosition()}`
}

function dropLifted() {
  const g = lifted.value
  if (!g) return
  lifted.value = null
  const moved = emitMove(
    { item: g.item, fromLaneId: g.fromLaneId, fromColumnId: g.fromColumnId },
    g.laneId,
    g.colId,
    g.index,
  )
  const col = columnOf(g.colId)
  const lane = props.lanes?.find((l) => (l.id ?? null) === g.laneId) ?? null
  const place = col ? placeLabel(lane, col) : g.colId
  announcement.value = moved
    ? `${labelOf(g.item)} dropped, position ${g.index + 1} in ${place}`
    : `${labelOf(g.item)} dropped`
  void refocusCard(g.item.id)
}

function browse(
  key: string,
  item: IBoardItem,
  laneId: string | null,
  colId: string,
) {
  const cell = getCell(laneId, colId)
  const index = cell.findIndex((i) => i.id === item.id)
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const to = index + (key === 'ArrowDown' ? 1 : -1)
    if (to >= 0 && to < cell.length) focusCard(cell[to].id)
  } else {
    const colIndex = props.columns.findIndex((c) => c.id === colId)
    const nextCol = props.columns[colIndex + (key === 'ArrowRight' ? 1 : -1)]
    if (colIndex === -1 || !nextCol) return
    const target = getCell(laneId, nextCol.id)
    if (target.length === 0) return
    focusCard(target[Math.min(index, target.length - 1)].id)
  }
}

function focusCard(id: string) {
  // Matched via dataset rather than an attribute selector: consumer ids can
  // contain characters a selector would need escaping for, and jsdom lacks
  // CSS.escape.
  const cardEls =
    boardRef.value?.querySelectorAll<HTMLElement>('[data-item-id]')
  if (!cardEls) return
  for (const el of cardEls) {
    if (el.dataset.itemId === id) {
      el.focus()
      return
    }
  }
}

async function refocusCard(id: string) {
  // The consumer moves the item in response to the event, which remounts the
  // card in its new cell; put focus back on it once the DOM settles.
  await nextTick()
  await nextTick()
  focusCard(id)
}

function onCardBlur(item: IBoardItem) {
  // Dropping the pick-up on blur rather than leaving a card held
  // indefinitely: a lifted card the user has tabbed away from is a trap, and
  // there is nothing to cancel.
  if (lifted.value?.item.id === item.id) lifted.value = null
}

// ── Column reorder ────────────────────────────────────────────────────

const dragColumnIndex = ref<number | null>(null)
const columnDropLine = ref<number | null>(null)

function onColumnDragStart(index: number, event: DragEvent) {
  if (!props.reorderableColumns) {
    event.preventDefault()
    return
  }
  dragColumnIndex.value = index
  columnDropLine.value = index
}

function onColumnDragOver(index: number, event: DragEvent) {
  if (dragColumnIndex.value === null) return
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  columnDropLine.value =
    event.clientX < rect.left + rect.width / 2 ? index : index + 1
}

function onColumnDrop(event: DragEvent) {
  const from = dragColumnIndex.value
  const line = columnDropLine.value
  onColumnDragEnd()
  if (from === null || line === null) return
  event.preventDefault()
  // The insertion line counts positions between headers, so a column moving
  // right lands one index earlier once it is removed from its old place.
  const toIndex = line > from ? line - 1 : line
  if (toIndex === from) return
  emit('column-move', { columnId: props.columns[from].id, toIndex })
}

function onColumnDragEnd() {
  dragColumnIndex.value = null
  columnDropLine.value = null
}
</script>

<style lang="scss">
.nb-board {
  overflow: auto;
  font-family: var(--nb-font-family-sans, sans-serif);
}

.nb-board__grid {
  display: grid;
  gap: 0;
  min-width: max-content;
}

.nb-board__col-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--nb-c-surface);
  border-top: 3px solid var(--nb-c-component-plain-border);
  border-bottom: 1px solid var(--nb-c-border);
  border-right: 1px solid var(--nb-c-border);
  padding: 0.6rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nb-board__col-header--reorderable {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// The header being dragged stays in place and dims; the drop line is the part
// that says what will actually happen.
.nb-board__col-header--dragging {
  opacity: 0.4;
}

.nb-board__col-header--drop-before,
.nb-board__col-header--drop-after {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    bottom: 0;
    width: 3px;
    background: var(--nb-c-primary);
    pointer-events: none;
    z-index: 1;
  }
}

.nb-board__col-header--drop-before::before {
  left: -1.5px;
}

.nb-board__col-header--drop-after::before {
  left: auto;
  right: -1.5px;
}

.nb-board__col-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--nb-c-text);
}

.nb-board__col-count {
  font-size: 0.7rem;
  background: var(--nb-c-bg-soft);
  color: var(--nb-c-text-muted);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-weight: 600;
}

.nb-board__lane-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem;
  background: var(--nb-c-bg-soft);
  border-top: 1px solid var(--nb-c-border);
  border-bottom: 1px solid var(--nb-c-border);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--nb-c-surface-hover);
  }
}

.nb-board__collapse-btn {
  background: none;
  border: none;
  font-size: 0.6rem;
  color: var(--nb-c-text-subtle);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.nb-board__lane-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--nb-c-text);
  flex: 1;
}

.nb-board__lane-count {
  font-size: 0.68rem;
  background: var(--nb-c-discrete);
  color: var(--nb-c-text-muted);
  padding: 0.05rem 0.35rem;
  border-radius: 999px;
  font-weight: 600;
  flex-shrink: 0;
}

.nb-board__cell {
  background: var(--nb-c-surface-raised);
  border-bottom: 1px solid var(--nb-c-border);
  border-right: 1px solid var(--nb-c-border);
  padding: 0.4rem;
  min-height: 60px;
  transition: background 0.1s;

  &--drag-over {
    background: color-mix(
      in srgb,
      var(--nb-c-primary) 8%,
      var(--nb-c-surface-raised)
    );
    outline: 2px dashed var(--nb-c-primary);
    outline-offset: -2px;
  }
}

.nb-board__cell-footer {
  margin-top: 0.35rem;
}

.nb-board__card {
  position: relative;
  background: var(--nb-c-surface);
  border: 1px solid var(--nb-c-border);
  border-radius: 5px;
  padding: 0.5rem 0.6rem;
  cursor: grab;
  margin-bottom: 0.35rem;
  user-select: none;
  transition: box-shadow 0.12s;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

// Picked up by keyboard: outlined, because there is no pointer to show where
// the card is going and the outline is what says "this one is in your hand".
.nb-board__card--lifted {
  border-color: var(--nb-c-primary);
  box-shadow: inset 0 0 0 1px var(--nb-c-primary);
}

// The drop indicator, a line in the gap the card would land in.
.nb-board__card--drop-before::before,
.nb-board__card--drop-after::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--nb-c-primary);
  pointer-events: none;
  z-index: 1;
}

.nb-board__card--drop-before::before {
  top: calc(-0.175rem - 1.5px);
}

.nb-board__card--drop-after::after {
  bottom: calc(-0.175rem - 1.5px);
}

.nb-board__empty-cell {
  min-height: 40px;
}

// Visually hidden, still announced.
.nb-board__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
