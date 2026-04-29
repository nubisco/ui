<template>
  <div class="nb-board">
    <div class="nb-board__grid" :style="gridStyle">
      <!-- Column headers -->
      <div
        v-for="col in columns"
        :key="col.id"
        class="nb-board__col-header"
        :style="col.color ? { borderTopColor: col.color } : undefined"
      >
        <span class="nb-board__col-title">{{ col.label }}</span>
        <span class="nb-board__col-count">{{ columnCount(col.id) }}</span>
      </div>

      <!-- Without lanes: flat grid -->
      <template v-if="!lanes || lanes.length === 0">
        <div
          v-for="col in columns"
          :key="'cell-' + col.id"
          class="nb-board__cell"
          :class="{ 'nb-board__cell--drag-over': isDragOver(null, col.id) }"
          @dragover.prevent="onDragOver(null, col.id)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop(null, col.id)"
        >
          <div
            v-for="item in getCell(null, col.id)"
            :key="item.id"
            class="nb-board__card"
            draggable="true"
            @dragstart="onDragStart(item, null, col.id)"
          >
            <slot name="card" :item="item" :column="col" />
          </div>
          <div
            v-if="getCell(null, col.id).length === 0"
            class="nb-board__empty-cell"
          />
        </div>
      </template>

      <!-- With lanes: swim lane rows -->
      <template v-else>
        <template v-for="lane in lanes" :key="laneKey(lane.id)">
          <div class="nb-board__lane-header" @click="toggleLane(lane.id)">
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

          <template v-if="!isCollapsed(lane.id)">
            <div
              v-for="col in columns"
              :key="laneKey(lane.id) + '-' + col.id"
              class="nb-board__cell"
              :class="{
                'nb-board__cell--drag-over': isDragOver(lane.id, col.id),
              }"
              @dragover.prevent="onDragOver(lane.id, col.id)"
              @dragleave="onDragLeave"
              @drop.prevent="onDrop(lane.id, col.id)"
            >
              <div
                v-for="item in getCell(lane.id, col.id)"
                :key="item.id"
                class="nb-board__card"
                draggable="true"
                @dragstart="onDragStart(item, lane.id, col.id)"
              >
                <slot name="card" :item="item" :column="col" :lane="lane" />
              </div>
              <div
                v-if="getCell(lane.id, col.id).length === 0"
                class="nb-board__empty-cell"
              />
            </div>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IBoardProps, IBoardItem, IBoardMoveEvent } from './Board.d'

const props = withDefaults(defineProps<IBoardProps>(), {
  lanes: undefined,
})

const emit = defineEmits<{
  move: [event: IBoardMoveEvent]
}>()

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns.length}, minmax(200px, 1fr))`,
}))

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

// Drag and drop
const dragging = ref<{
  item: IBoardItem
  fromLaneId: string | null
  fromColumnId: string
} | null>(null)
const dragOverTarget = ref<{ laneId: string | null; colId: string } | null>(
  null,
)

function onDragStart(item: IBoardItem, laneId: string | null, colId: string) {
  dragging.value = { item, fromLaneId: laneId, fromColumnId: colId }
}

function onDragOver(laneId: string | null, colId: string) {
  dragOverTarget.value = { laneId, colId }
}

function onDragLeave() {
  dragOverTarget.value = null
}

function isDragOver(laneId: string | null, colId: string): boolean {
  const t = dragOverTarget.value
  return t !== null && t.laneId === laneId && t.colId === colId
}

function onDrop(toLaneId: string | null, toColId: string) {
  dragOverTarget.value = null
  const drag = dragging.value
  dragging.value = null
  if (!drag) return

  const { item, fromLaneId, fromColumnId } = drag
  if (fromColumnId === toColId && fromLaneId === toLaneId) return

  emit('move', {
    itemId: item.id,
    fromColumnId,
    toColumnId: toColId,
    fromLaneId,
    toLaneId,
  })
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

.nb-board__card {
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

  &:last-child {
    margin-bottom: 0;
  }
}

.nb-board__empty-cell {
  min-height: 40px;
}
</style>
