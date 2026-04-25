<template>
  <ChartFrame
    :title="title"
    :subtitle="subtitle"
    :height="height"
    :show-legend="showLegend && legendItems.length > 1"
  >
    <div class="nb-gantt" :class="{ 'nb-gantt--has-groups': hasGroups }">
      <!-- Task list panel (left) -->
      <div class="nb-gantt__list" :style="{ width: `${listWidth}px` }">
        <div
          class="nb-gantt__list-header"
          :style="{ height: `${headerHeight}px` }"
        >
          Tasks
        </div>
        <div class="nb-gantt__list-body">
          <template v-for="row in visibleRows" :key="row.id">
            <div
              v-if="row.type === 'group'"
              class="nb-gantt__list-group"
              :style="{ height: `${rowHeight}px` }"
              @click="toggleGroup(row.id)"
            >
              <span
                class="nb-gantt__list-caret"
                :class="{ 'is-collapsed': collapsedGroups.has(row.id) }"
                >&#9656;</span
              >
              <span class="nb-gantt__list-group-label">{{ row.label }}</span>
            </div>
            <div
              v-else
              class="nb-gantt__list-row"
              :class="{
                'is-hovered': hoveredTask === row.id,
                'is-milestone': row.milestone,
              }"
              :style="{
                height: `${rowHeight}px`,
                paddingLeft: row.indent ? '20px' : undefined,
              }"
              @mouseenter="hoveredTask = row.id"
              @mouseleave="hoveredTask = null"
            >
              <span class="nb-gantt__list-label" :title="row.label">{{
                row.label
              }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Timeline panel (right) -->
      <div ref="timelineEl" class="nb-gantt__timeline">
        <!-- Header with time ticks -->
        <svg
          class="nb-gantt__header-svg"
          :width="timelineWidth"
          :height="headerHeight"
        >
          <g class="nb-gantt__time-header">
            <text
              v-for="(tick, i) in ticks"
              :key="`th-${i}`"
              :x="tick.x + 4"
              :y="headerHeight - 6"
              class="nb-gantt__time-label"
            >
              {{ tick.label }}
            </text>
            <line
              v-for="(tick, i) in ticks"
              :key="`tl-${i}`"
              :x1="tick.x"
              :x2="tick.x"
              :y1="0"
              :y2="headerHeight"
              class="nb-gantt__header-gridline"
            />
          </g>
        </svg>

        <!-- Chart body -->
        <svg
          class="nb-gantt__svg"
          :width="timelineWidth"
          :height="bodyHeight"
          role="img"
          :aria-label="title || 'Gantt chart'"
          @mouseleave="hoveredTask = null"
        >
          <!-- Vertical grid lines -->
          <g v-if="showGrid">
            <line
              v-for="(tick, i) in ticks"
              :key="`grid-${i}`"
              class="nb-gantt__gridline"
              :x1="tick.x"
              :x2="tick.x"
              :y1="0"
              :y2="bodyHeight"
            />
          </g>

          <!-- Row stripes -->
          <g>
            <rect
              v-for="(row, ri) in visibleRows"
              :key="`stripe-${row.id}`"
              class="nb-gantt__row-stripe"
              :class="{
                'is-even': ri % 2 === 0,
                'is-group': row.type === 'group',
              }"
              :x="0"
              :y="ri * rowHeight"
              :width="timelineWidth"
              :height="rowHeight"
            />
          </g>

          <!-- Today marker -->
          <line
            v-if="showTodayMarker && todayX !== null"
            class="nb-gantt__today-line"
            :x1="todayX"
            :x2="todayX"
            :y1="0"
            :y2="bodyHeight"
          />

          <!-- Summary bars (groups) -->
          <g v-for="bar in groupBars" :key="`summary-${bar.id}`">
            <rect
              class="nb-gantt__summary-bar"
              :x="bar.x"
              :y="bar.y + rowHeight * 0.35"
              :width="Math.max(bar.width, 2)"
              :height="rowHeight * 0.3"
              rx="2"
            />
            <!-- Summary bar end carets -->
            <polygon
              class="nb-gantt__summary-caret"
              :points="summaryCaret(bar.x, bar.y + rowHeight * 0.65)"
            />
            <polygon
              class="nb-gantt__summary-caret"
              :points="
                summaryCaret(bar.x + bar.width, bar.y + rowHeight * 0.65)
              "
            />
          </g>

          <!-- Task bars -->
          <g v-for="bar in taskBars" :key="`bar-${bar.id}`">
            <!-- Background bar -->
            <rect
              class="nb-gantt__bar"
              :class="[
                `nb-gantt__bar--${bar.status}`,
                {
                  'is-hovered': hoveredTask === bar.id,
                  'is-dim': hoveredTask !== null && hoveredTask !== bar.id,
                },
              ]"
              :x="bar.x"
              :y="bar.y + barPadding"
              :width="Math.max(bar.width, 4)"
              :height="barHeight"
              rx="3"
              :fill="bar.color"
              @mouseenter="hoveredTask = bar.id"
              @mouseleave="hoveredTask = null"
              @mousemove="(e) => updateTooltip(e, bar)"
            />
            <!-- Progress fill -->
            <rect
              v-if="showProgress && bar.progress > 0"
              class="nb-gantt__bar-progress"
              :x="bar.x"
              :y="bar.y + barPadding"
              :width="Math.max(bar.width * (bar.progress / 100), 2)"
              :height="barHeight"
              rx="3"
              :fill="bar.color"
              pointer-events="none"
            />
          </g>

          <!-- Milestone diamonds -->
          <g v-for="ms in milestoneBars" :key="`ms-${ms.id}`">
            <polygon
              class="nb-gantt__milestone"
              :class="{
                'is-hovered': hoveredTask === ms.id,
                'is-dim': hoveredTask !== null && hoveredTask !== ms.id,
              }"
              :points="
                diamondPoints(ms.x, ms.y + rowHeight / 2, milestoneRadius)
              "
              :fill="ms.color"
              @mouseenter="hoveredTask = ms.id"
              @mouseleave="hoveredTask = null"
              @mousemove="(e) => updateTooltipMilestone(e, ms)"
            />
          </g>

          <!-- Dependency arrows -->
          <g>
            <path
              v-for="(dep, di) in dependencyPaths"
              :key="`dep-${di}`"
              class="nb-gantt__dependency"
              :d="dep.path"
              fill="none"
            />
            <polygon
              v-for="(dep, di) in dependencyPaths"
              :key="`dep-arrow-${di}`"
              class="nb-gantt__dependency-arrow"
              :points="dep.arrowhead"
            />
          </g>

          <!-- Hover overlay rows (for tooltip precision) -->
          <g>
            <rect
              v-for="(row, ri) in taskRows"
              :key="`hover-${row.id}`"
              :x="0"
              :y="ri * rowHeight"
              :width="timelineWidth"
              :height="rowHeight"
              fill="transparent"
              @mouseenter="hoveredTask = row.id"
              @mouseleave="hoveredTask = null"
            />
          </g>
        </svg>

        <ChartTooltip
          :visible="showTooltip && hoveredTask !== null && tooltipData !== null"
          :x="tooltipPos.x"
          :y="tooltipPos.y"
          :title="tooltipData?.title ?? ''"
          :rows="tooltipData?.rows ?? []"
        />
      </div>
    </div>

    <template #legend>
      <ChartLegend :items="legendItems" />
    </template>
  </ChartFrame>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import ChartFrame from './shared/ChartFrame.vue'
import ChartLegend from './shared/ChartLegend.vue'
import ChartTooltip from './shared/ChartTooltip.vue'
import { timelineTicks, dateToX } from './shared/scales'
import { colorAt, DEFAULT_PALETTE } from './shared/palette'
import type {
  IGanttChartProps,
  IGanttTask,
  TGanttTimeScale,
  TGanttTaskStatus,
} from './GanttChart.d'

const props = withDefaults(defineProps<IGanttChartProps>(), {
  title: undefined,
  subtitle: undefined,
  height: 400,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  colors: () => DEFAULT_PALETTE,
  tasks: () => [],
  dependencies: () => [],
  groups: () => [],
  timeScale: 'week',
  rowHeight: 36,
  listWidth: 200,
  showTodayMarker: true,
  today: undefined,
  showProgress: true,
  statusColors: undefined,
})

// ── Status color map ────────────────────────────────────────────────────────

const STATUS_DEFAULTS: Record<TGanttTaskStatus, string> = {
  default: 'var(--nb-c-grape-hyacinth-500)',
  'on-track': 'var(--nb-c-emerald-reflection-600)',
  'at-risk': 'var(--nb-c-phoenix-flames-500)',
  behind: 'var(--nb-c-chicken-comb-500)',
  complete: 'var(--nb-c-the-blues-brothers-500)',
}

const statusColorMap = computed(() => ({
  ...STATUS_DEFAULTS,
  ...props.statusColors,
}))

// ── Layout constants ────────────────────────────────────────────────────────

const headerHeight = 40
const barPadding = computed(() => Math.round(props.rowHeight * 0.22))
const barHeight = computed(() => props.rowHeight - barPadding.value * 2)
const milestoneRadius = computed(() => Math.round(props.rowHeight * 0.28))

// ── Collapse state ──────────────────────────────────────────────────────────

const collapsedGroups = ref(
  new Set((props.groups ?? []).filter((g) => g.collapsed).map((g) => g.id)),
)

const toggleGroup = (id: string) => {
  const s = new Set(collapsedGroups.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  collapsedGroups.value = s
}

// ── Row model ───────────────────────────────────────────────────────────────

interface IVisibleRow {
  id: string
  label: string
  type: 'task' | 'group'
  milestone?: boolean
  indent?: boolean
}

const hasGroups = computed(() => (props.groups?.length ?? 0) > 0)

const visibleRows = computed<IVisibleRow[]>(() => {
  const tasks = props.tasks ?? []
  const groups = props.groups ?? []
  if (!groups.length) {
    return tasks.map((t) => ({
      id: t.id,
      label: t.label,
      type: 'task' as const,
      milestone: t.milestone,
    }))
  }

  const rows: IVisibleRow[] = []
  const groupMap = new Map(groups.map((g) => [g.id, g]))
  const tasksByGroup = new Map<string, IGanttTask[]>()
  const ungrouped: IGanttTask[] = []

  for (const t of tasks) {
    if (t.group && groupMap.has(t.group)) {
      const list = tasksByGroup.get(t.group) ?? []
      list.push(t)
      tasksByGroup.set(t.group, list)
    } else {
      ungrouped.push(t)
    }
  }

  for (const g of groups) {
    rows.push({ id: g.id, label: g.label, type: 'group' })
    if (!collapsedGroups.value.has(g.id)) {
      for (const t of tasksByGroup.get(g.id) ?? []) {
        rows.push({
          id: t.id,
          label: t.label,
          type: 'task',
          milestone: t.milestone,
          indent: true,
        })
      }
    }
  }

  for (const t of ungrouped) {
    rows.push({
      id: t.id,
      label: t.label,
      type: 'task',
      milestone: t.milestone,
    })
  }

  return rows
})

const taskRows = computed(() =>
  visibleRows.value.filter((r) => r.type === 'task'),
)

// Row index lookup: taskId -> y row index in visibleRows
const rowIndex = computed(() => {
  const map = new Map<string, number>()
  visibleRows.value.forEach((r, i) => map.set(r.id, i))
  return map
})

// ── Date extent and pixel scale ─────────────────────────────────────────────

const toMs = (d: string | Date): number =>
  typeof d === 'string' ? new Date(d).getTime() : d.getTime()

const dateExtent = computed<[number, number]>(() => {
  const tasks = props.tasks ?? []
  if (!tasks.length) {
    const now = Date.now()
    return [now, now + 7 * 86400000]
  }
  let min = Infinity
  let max = -Infinity
  for (const t of tasks) {
    const s = toMs(t.start)
    const e = t.end ? toMs(t.end) : s
    if (s < min) min = s
    if (e > max) max = e
  }
  // Add padding: 1 unit before and after
  const pad = unitMs(props.timeScale)
  return [min - pad, max + pad]
})

const unitMs = (unit: TGanttTimeScale): number => {
  const DAY = 86400000
  if (unit === 'day') return DAY
  if (unit === 'week') return 7 * DAY
  if (unit === 'month') return 30 * DAY
  if (unit === 'quarter') return 91 * DAY
  return 365 * DAY
}

// Pixels per unit
const pxPerUnit = computed(() => {
  const scale = props.timeScale
  if (scale === 'day') return 40
  if (scale === 'week') return 120
  if (scale === 'month') return 180
  if (scale === 'quarter') return 240
  return 360
})

const pxPerMs = computed(() => pxPerUnit.value / unitMs(props.timeScale))

const originMs = computed(() => dateExtent.value[0])

const timelineWidth = computed(() =>
  Math.max(
    200,
    Math.ceil((dateExtent.value[1] - dateExtent.value[0]) * pxPerMs.value),
  ),
)

const bodyHeight = computed(() => visibleRows.value.length * props.rowHeight)

// ── Ticks ───────────────────────────────────────────────────────────────────

const ticks = computed(() =>
  timelineTicks(
    new Date(dateExtent.value[0]),
    new Date(dateExtent.value[1]),
    props.timeScale,
    pxPerMs.value,
    originMs.value,
  ),
)

// ── Today marker ────────────────────────────────────────────────────────────

const todayX = computed<number | null>(() => {
  if (!props.showTodayMarker) return null
  const todayDate = props.today ? new Date(props.today) : new Date()
  const x = dateToX(todayDate, originMs.value, pxPerMs.value)
  if (x < 0 || x > timelineWidth.value) return null
  return x
})

// ── Bar geometry ────────────────────────────────────────────────────────────

interface IBarData {
  id: string
  x: number
  y: number
  width: number
  color: string
  status: TGanttTaskStatus
  progress: number
  label: string
  start: string
  end: string
}

interface IMilestoneData {
  id: string
  x: number
  y: number
  color: string
  label: string
  date: string
}

const resolveTaskColor = (task: IGanttTask, index: number): string => {
  if (task.color) return task.color
  if (task.status && task.status !== 'default')
    return statusColorMap.value[task.status]
  return colorAt(index, props.colors)
}

const formatDate = (d: string | Date): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const taskBars = computed<IBarData[]>(() => {
  const tasks = (props.tasks ?? []).filter((t) => !t.milestone && t.end)
  return tasks
    .map((t, i) => {
      const ri = rowIndex.value.get(t.id)
      if (ri === undefined) return null
      const x = dateToX(t.start, originMs.value, pxPerMs.value)
      const xEnd = dateToX(t.end!, originMs.value, pxPerMs.value)
      return {
        id: t.id,
        x,
        y: ri * props.rowHeight,
        width: Math.max(xEnd - x, 4),
        color: resolveTaskColor(t, i),
        status: t.status ?? 'default',
        progress: t.progress ?? 0,
        label: t.label,
        start: formatDate(t.start),
        end: formatDate(t.end!),
      }
    })
    .filter(Boolean) as IBarData[]
})

const milestoneBars = computed<IMilestoneData[]>(() => {
  const tasks = (props.tasks ?? []).filter((t) => t.milestone)
  return tasks
    .map((t, i) => {
      const ri = rowIndex.value.get(t.id)
      if (ri === undefined) return null
      return {
        id: t.id,
        x: dateToX(t.start, originMs.value, pxPerMs.value),
        y: ri * props.rowHeight,
        color: resolveTaskColor(t, i),
        label: t.label,
        date: formatDate(t.start),
      }
    })
    .filter(Boolean) as IMilestoneData[]
})

// ── Group summary bars ──────────────────────────────────────────────────────

interface IGroupBar {
  id: string
  x: number
  y: number
  width: number
}

const groupBars = computed<IGroupBar[]>(() => {
  const groups = props.groups ?? []
  const tasks = props.tasks ?? []
  if (!groups.length) return []

  return groups
    .map((g) => {
      const ri = rowIndex.value.get(g.id)
      if (ri === undefined) return null
      const children = tasks.filter((t) => t.group === g.id)
      if (!children.length) return null
      let min = Infinity
      let max = -Infinity
      for (const t of children) {
        const s = toMs(t.start)
        const e = t.end ? toMs(t.end) : s
        if (s < min) min = s
        if (e > max) max = e
      }
      const x = dateToX(new Date(min), originMs.value, pxPerMs.value)
      const xEnd = dateToX(new Date(max), originMs.value, pxPerMs.value)
      return {
        id: g.id,
        x,
        y: ri * props.rowHeight,
        width: Math.max(xEnd - x, 4),
      }
    })
    .filter(Boolean) as IGroupBar[]
})

const summaryCaret = (x: number, y: number): string => {
  const s = 5
  return `${x},${y} ${x - s},${y + s} ${x + s},${y + s}`
}

// ── Milestone diamond ───────────────────────────────────────────────────────

const diamondPoints = (cx: number, cy: number, r: number): string =>
  `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`

// ── Dependency arrows ───────────────────────────────────────────────────────

interface IDependencyPath {
  path: string
  arrowhead: string
}

const dependencyPaths = computed<IDependencyPath[]>(() => {
  const deps = props.dependencies ?? []
  if (!deps.length) return []

  const taskMap = new Map((props.tasks ?? []).map((t) => [t.id, t]))

  return deps
    .map((dep) => {
      const fromTask = taskMap.get(dep.from)
      const toTask = taskMap.get(dep.to)
      if (!fromTask || !toTask) return null

      const fromRi = rowIndex.value.get(dep.from)
      const toRi = rowIndex.value.get(dep.to)
      if (fromRi === undefined || toRi === undefined) return null

      const type = dep.type ?? 'finish-to-start'
      const rh = props.rowHeight

      // Compute start and end anchor points based on dependency type
      let x1: number, y1: number, x2: number, y2: number

      if (type === 'finish-to-start') {
        x1 = fromTask.milestone
          ? dateToX(fromTask.start, originMs.value, pxPerMs.value) +
            milestoneRadius.value
          : dateToX(
              fromTask.end ?? fromTask.start,
              originMs.value,
              pxPerMs.value,
            )
        y1 = fromRi * rh + rh / 2
        x2 = toTask.milestone
          ? dateToX(toTask.start, originMs.value, pxPerMs.value) -
            milestoneRadius.value
          : dateToX(toTask.start, originMs.value, pxPerMs.value)
        y2 = toRi * rh + rh / 2
      } else if (type === 'start-to-start') {
        x1 = dateToX(fromTask.start, originMs.value, pxPerMs.value)
        y1 = fromRi * rh + rh / 2
        x2 = dateToX(toTask.start, originMs.value, pxPerMs.value)
        y2 = toRi * rh + rh / 2
      } else if (type === 'finish-to-finish') {
        x1 = dateToX(
          fromTask.end ?? fromTask.start,
          originMs.value,
          pxPerMs.value,
        )
        y1 = fromRi * rh + rh / 2
        x2 = dateToX(toTask.end ?? toTask.start, originMs.value, pxPerMs.value)
        y2 = toRi * rh + rh / 2
      } else {
        // start-to-finish
        x1 = dateToX(fromTask.start, originMs.value, pxPerMs.value)
        y1 = fromRi * rh + rh / 2
        x2 = dateToX(toTask.end ?? toTask.start, originMs.value, pxPerMs.value)
        y2 = toRi * rh + rh / 2
      }

      // Build an L-shaped or S-shaped connector path
      const midX = x1 + (x2 - x1) * 0.5
      const path =
        x2 > x1 + 12
          ? `M${x1},${y1} H${midX} V${y2} H${x2}`
          : `M${x1},${y1} H${x1 + 12} V${(y1 + y2) / 2} H${x2 - 12} V${y2} H${x2}`

      // Arrowhead pointing right toward x2
      const ax = x2
      const ay = y2
      const arrowhead = `${ax},${ay} ${ax - 6},${ay - 4} ${ax - 6},${ay + 4}`

      return { path, arrowhead }
    })
    .filter(Boolean) as IDependencyPath[]
})

// ── Tooltip ─────────────────────────────────────────────────────────────────

const timelineEl = ref<HTMLElement | null>(null)
const hoveredTask = ref<string | null>(null)
const tooltipPos = reactive({ x: 0, y: 0 })

interface ITooltipData {
  title: string
  rows: { label: string; value: string; color: string }[]
}

const tooltipData = ref<ITooltipData | null>(null)

const updateTooltip = (e: MouseEvent, bar: IBarData) => {
  if (!timelineEl.value) return
  const rect = timelineEl.value.getBoundingClientRect()
  tooltipPos.x = e.clientX - rect.left + 12
  tooltipPos.y = e.clientY - rect.top + 12
  hoveredTask.value = bar.id
  tooltipData.value = {
    title: bar.label,
    rows: [
      { label: 'Start', value: bar.start, color: bar.color },
      { label: 'End', value: bar.end, color: bar.color },
      ...(bar.progress > 0
        ? [{ label: 'Progress', value: `${bar.progress}%`, color: bar.color }]
        : []),
    ],
  }
}

const updateTooltipMilestone = (e: MouseEvent, ms: IMilestoneData) => {
  if (!timelineEl.value) return
  const rect = timelineEl.value.getBoundingClientRect()
  tooltipPos.x = e.clientX - rect.left + 12
  tooltipPos.y = e.clientY - rect.top + 12
  hoveredTask.value = ms.id
  tooltipData.value = {
    title: ms.label,
    rows: [{ label: 'Date', value: ms.date, color: ms.color }],
  }
}

// ── Legend ───────────────────────────────────────────────────────────────────

const legendItems = computed(() => {
  const used = new Set<TGanttTaskStatus>()
  for (const t of props.tasks ?? []) {
    used.add(t.status ?? 'default')
  }
  const labels: Record<TGanttTaskStatus, string> = {
    default: 'Default',
    'on-track': 'On track',
    'at-risk': 'At risk',
    behind: 'Behind',
    complete: 'Complete',
  }
  return Array.from(used).map((s) => ({
    label: labels[s],
    color: statusColorMap.value[s],
  }))
})
</script>

<style lang="scss" scoped>
.nb-gantt {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--nb-font-family-sans);
  color: var(--nb-c-text);

  // ── Task list (left panel) ────────────────────────────────────────────
  &__list {
    flex: 0 0 auto;
    border-right: 1px solid var(--nb-c-border);
    background: var(--nb-c-surface);
    overflow: hidden;
    z-index: 1;
  }

  &__list-header {
    display: flex;
    align-items: flex-end;
    padding: 0 10px 6px;
    font-size: var(--nb-font-size-11, 11px);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--nb-c-text-muted);
    border-bottom: 1px solid var(--nb-c-border);
    background: var(--nb-c-surface);
  }

  &__list-body {
    overflow-y: auto;
  }

  &__list-group {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 10px;
    font-size: var(--nb-font-size-12);
    font-weight: 600;
    color: var(--nb-c-text);
    cursor: pointer;
    user-select: none;
    background: var(--nb-c-surface-raised, var(--nb-c-surface));

    &:hover {
      background: var(--nb-c-surface-hover);
    }
  }

  &__list-caret {
    font-size: 10px;
    transition: transform 120ms ease;
    color: var(--nb-c-text-muted);

    &.is-collapsed {
      transform: rotate(0deg);
    }

    &:not(.is-collapsed) {
      transform: rotate(90deg);
    }
  }

  &__list-row {
    display: flex;
    align-items: center;
    padding: 0 10px;
    font-size: var(--nb-font-size-12);
    color: var(--nb-c-text);
    transition: background 80ms ease;

    &.is-hovered {
      background: var(--nb-c-surface-hover);
    }
  }

  &__list-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ── Timeline (right panel) ────────────────────────────────────────────
  &__timeline {
    flex: 1 1 auto;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    background: var(--nb-c-surface);
  }

  &__header-svg {
    display: block;
    border-bottom: 1px solid var(--nb-c-border);
    background: var(--nb-c-surface);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  &__time-label {
    font-size: 11px;
    fill: var(--nb-c-text-muted);
    font-family: var(--nb-font-family-sans);
  }

  &__header-gridline {
    stroke: var(--nb-c-border);
    stroke-width: 1;
    opacity: 0.4;
  }

  &__svg {
    display: block;
  }

  // ── Grid ──────────────────────────────────────────────────────────────
  &__gridline {
    stroke: var(--nb-c-component-plain-border);
    stroke-dasharray: 2 3;
    stroke-width: 1;
    opacity: 0.4;
  }

  &__row-stripe {
    fill: transparent;

    &.is-even {
      fill: var(--nb-c-surface-raised, var(--nb-c-surface));
      opacity: 0.35;
    }

    &.is-group {
      fill: var(--nb-c-surface-raised, var(--nb-c-surface));
      opacity: 0.5;
    }
  }

  // ── Today marker ─────────────────────────────────────────────────────
  &__today-line {
    stroke: var(--nb-c-danger, #e53e3e);
    stroke-width: 2;
    stroke-dasharray: 4 3;
    opacity: 0.7;
  }

  // ── Task bars ─────────────────────────────────────────────────────────
  &__bar {
    transition: opacity 120ms ease;
    opacity: 0.85;
    cursor: pointer;

    &.is-hovered {
      opacity: 1;
    }

    &.is-dim {
      opacity: 0.35;
    }
  }

  &__bar-progress {
    opacity: 1;
  }

  // ── Summary bars ──────────────────────────────────────────────────────
  &__summary-bar {
    fill: var(--nb-c-text-muted);
    opacity: 0.55;
  }

  &__summary-caret {
    fill: var(--nb-c-text-muted);
    opacity: 0.55;
  }

  // ── Milestones ────────────────────────────────────────────────────────
  &__milestone {
    transition: opacity 120ms ease;
    cursor: pointer;

    &.is-hovered {
      opacity: 1;
    }

    &.is-dim {
      opacity: 0.35;
    }
  }

  // ── Dependencies ──────────────────────────────────────────────────────
  &__dependency {
    stroke: var(--nb-c-text-muted);
    stroke-width: 1.5;
    opacity: 0.5;
  }

  &__dependency-arrow {
    fill: var(--nb-c-text-muted);
    opacity: 0.5;
  }
}
</style>
