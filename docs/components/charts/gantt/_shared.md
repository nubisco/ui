<script setup lang="ts">
const basicTasks = [
  { id: 't1', label: 'Design', start: '2025-06-01', end: '2025-06-14' },
  { id: 't2', label: 'Develop', start: '2025-06-10', end: '2025-07-10' },
  { id: 't3', label: 'Test', start: '2025-07-05', end: '2025-07-25' },
  { id: 't4', label: 'Deploy', start: '2025-07-26', end: '2025-07-31' },
]

const depTasks = [
  { id: 't1', label: 'Research', start: '2025-06-01', end: '2025-06-10' },
  { id: 't2', label: 'Prototype', start: '2025-06-11', end: '2025-06-25' },
  { id: 't3', label: 'Build', start: '2025-06-26', end: '2025-07-20' },
  { id: 't4', label: 'Ship', start: '2025-07-21', end: '2025-07-31' },
]

const deps = [
  { from: 't1', to: 't2', type: 'finish-to-start' },
  { from: 't2', to: 't3', type: 'finish-to-start' },
  { from: 't3', to: 't4', type: 'finish-to-start' },
]

const milestoneTasks = [
  { id: 't1', label: 'Alpha build', start: '2025-06-01', end: '2025-06-20' },
  { id: 'm1', label: 'Alpha release', start: '2025-06-21', milestone: true },
  { id: 't2', label: 'Beta build', start: '2025-06-22', end: '2025-07-15' },
  { id: 'm2', label: 'Beta release', start: '2025-07-16', milestone: true },
]

const milestoneDeps = [
  { from: 't1', to: 'm1' },
  { from: 'm1', to: 't2' },
  { from: 't2', to: 'm2' },
]

const statusTasks = [
  { id: 't1', label: 'API integration', start: '2025-06-01', end: '2025-06-20', status: 'complete', progress: 100 },
  { id: 't2', label: 'Frontend pages', start: '2025-06-05', end: '2025-07-05', status: 'on-track', progress: 65 },
  { id: 't3', label: 'Auth system', start: '2025-06-10', end: '2025-06-28', status: 'at-risk', progress: 40 },
  { id: 't4', label: 'Deployment', start: '2025-06-20', end: '2025-07-10', status: 'behind', progress: 10 },
]

const groups = [
  { id: 'g1', label: 'Phase 1: Discovery' },
  { id: 'g2', label: 'Phase 2: Build' },
]

const groupTasks = [
  { id: 't1', label: 'User research', start: '2025-06-01', end: '2025-06-14', group: 'g1' },
  { id: 't2', label: 'Competitive audit', start: '2025-06-05', end: '2025-06-18', group: 'g1' },
  { id: 't3', label: 'Frontend', start: '2025-06-19', end: '2025-07-15', group: 'g2' },
  { id: 't4', label: 'Backend', start: '2025-06-19', end: '2025-07-20', group: 'g2' },
  { id: 't5', label: 'QA', start: '2025-07-21', end: '2025-07-31', group: 'g2' },
]

const progressTasks = [
  { id: 't1', label: 'Story A', start: '2025-06-01', end: '2025-06-20', progress: 80 },
  { id: 't2', label: 'Story B', start: '2025-06-05', end: '2025-06-25', progress: 50 },
  { id: 't3', label: 'Story C', start: '2025-06-10', end: '2025-06-30', progress: 20 },
]
</script>
