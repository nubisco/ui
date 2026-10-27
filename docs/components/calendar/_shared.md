<script setup lang="ts">
const events = [
  { id: '1', label: 'Team standup', start: '2026-04-06' },
  { id: '2', label: 'Sprint review', start: '2026-04-10' },
  { id: '3', label: 'Deploy v2', start: '2026-04-18' },
]

const multiDayEvents = [
  { id: '1', label: 'Conference', start: '2026-04-13', end: '2026-04-15' },
  { id: '2', label: 'Sprint 12', start: '2026-04-06', end: '2026-04-17' },
]

const coloredEvents = [
  { id: '1', label: 'Design review', start: '2026-04-07', color: '#6366f1' },
  { id: '2', label: 'Bug bash', start: '2026-04-14', color: '#ef4444' },
  { id: '3', label: 'Release', start: '2026-04-21', color: '#22c55e' },
]
</script>
