<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { id: 'todo', label: 'To Do' },
  { id: 'doing', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

const coloredColumns = [
  { id: 'todo', label: 'To Do', color: '#6366f1' },
  { id: 'doing', label: 'In Progress', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
]

const items = ref([
  { id: '1', columnId: 'todo', title: 'Design mockups' },
  { id: '2', columnId: 'doing', title: 'Build API' },
  { id: '3', columnId: 'done', title: 'Write specs' },
])

const lanes = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
]

const laneItems = ref([
  { id: 'l1', columnId: 'todo', laneId: 'frontend', title: 'Build form' },
  { id: 'l2', columnId: 'doing', laneId: 'backend', title: 'Auth endpoint' },
  { id: 'l3', columnId: 'done', laneId: 'frontend', title: 'Style header' },
  { id: 'l4', columnId: 'todo', laneId: 'backend', title: 'DB migration' },
])

function onMove(e: { itemId: string; toColumnId: string; toLaneId?: string | null }) {
  const item = items.value.find((i) => i.id === e.itemId)
  if (item) item.columnId = e.toColumnId
}

let nextId = 100
function addTo(columnId: string) {
  items.value.push({ id: String(nextId++), columnId, title: 'New item' })
}

function onMoveLane(e: { itemId: string; toColumnId: string; toLaneId?: string | null }) {
  const item = laneItems.value.find((i) => i.id === e.itemId)
  if (item) {
    item.columnId = e.toColumnId
    if (e.toLaneId !== undefined) item.laneId = e.toLaneId
  }
}
</script>
