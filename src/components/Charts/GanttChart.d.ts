import type { IChartCommonProps } from './shared/types.d'

// Dependency relationship between two tasks.
type TDependencyType =
  | 'finish-to-start'
  | 'start-to-start'
  | 'finish-to-finish'
  | 'start-to-finish'

type TGanttTaskStatus =
  | 'default'
  | 'on-track'
  | 'at-risk'
  | 'behind'
  | 'complete'

type TGanttTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'

interface IGanttDependency {
  // ID of the predecessor task.
  from: string
  // ID of the successor task.
  to: string
  type?: TDependencyType
}

interface IGanttTask {
  id: string
  label: string
  // Start date (ISO string or Date).
  start: string | Date
  // End date (ISO string or Date). Omit for milestones.
  end?: string | Date
  // Progress percentage (0 to 100).
  progress?: number
  // Visual status for the task bar.
  status?: TGanttTaskStatus
  // Optional group/parent ID for hierarchical grouping.
  group?: string
  // Explicit color override.
  color?: string
  // When true, this task renders as a milestone diamond instead of a bar.
  milestone?: boolean
}

interface IGanttGroup {
  id: string
  label: string
  // Whether the group starts collapsed.
  collapsed?: boolean
}

interface IGanttChartProps extends IChartCommonProps {
  tasks?: IGanttTask[]
  dependencies?: IGanttDependency[]
  groups?: IGanttGroup[]
  // Time granularity for the header and grid.
  timeScale?: TGanttTimeScale
  // Height of each task row in pixels.
  rowHeight?: number
  // Width of the task list panel on the left.
  listWidth?: number
  // Show the vertical "today" marker line.
  showTodayMarker?: boolean
  // Override the date used for the today marker (useful for demos).
  today?: string | Date
  // Show task progress fill inside bars.
  showProgress?: boolean
  // Custom status color map (status name to CSS color string).
  statusColors?: Partial<Record<TGanttTaskStatus, string>>
}

export type {
  TDependencyType,
  TGanttTaskStatus,
  TGanttTimeScale,
  IGanttDependency,
  IGanttTask,
  IGanttGroup,
  IGanttChartProps,
}
