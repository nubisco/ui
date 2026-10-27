<script setup lang="ts">
import { computed, ref } from 'vue'

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', align: 'center' },
]

const rows = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', status: 'Active' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'Away' },
]

const selected = ref([])
const lastOpened = ref('')
const expanded = ref([2])
function detailItems(row) {
  return [
    { term: 'Name', value: row.name },
    { term: 'Role', value: row.role },
    { term: 'Status', value: row.status },
  ]
}
function onRowClick(row) {
  lastOpened.value = row.name
}
const selectedToolbar = ref([1])
const selectedNarrow = ref([])

const sortState = ref({ key: 'name', direction: 'asc' })
function onSort(state) {
  sortState.value = state
}
const sortedRows = computed(() => {
  const { key, direction } = sortState.value
  if (direction === 'none') return rows
  return [...rows].sort((a, b) => {
    const cmp = String(a[key]).localeCompare(String(b[key]))
    return direction === 'asc' ? cmp : -cmp
  })
})

const allRows = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', status: 'Active' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', status: 'Active' },
  { id: 3, name: 'Alan Turing', role: 'Researcher', status: 'Away' },
  { id: 4, name: 'Katherine Johnson', role: 'Mathematician', status: 'Active' },
  { id: 5, name: 'Margaret Hamilton', role: 'Engineer', status: 'Away' },
  { id: 6, name: 'Hedy Lamarr', role: 'Inventor', status: 'Active' },
  { id: 7, name: 'Barbara Liskov', role: 'Computer Scientist', status: 'Active' },
]
const page = ref(1)
const pageSize = ref(5)
function onPageSize(size) {
  pageSize.value = size
  page.value = 1
}
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return allRows.slice(start, start + pageSize.value)
})
</script>
