<script setup lang="ts">
import { ref } from 'vue'
import type {
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetChange,
} from '@nubisco/ui'

// ── Basic example ───────────────────────────────────────────────────────────
const basicColumns: ISpreadsheetColumn[] = [
  { id: 'name', label: 'Name', width: 200, align: 'left' },
  { id: 'qty', label: 'Qty', type: 'number', align: 'right', width: 80 },
  { id: 'unit', label: 'Unit price', type: 'number', align: 'right', width: 120 },
]
const basicRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { name: 'Hex bolt M8', qty: 50, unit: 0.42 } },
  { id: 'r2', values: { name: 'Washer M8', qty: 50, unit: 0.08 } },
  { id: 'r3', values: { name: 'Nut M8', qty: 50, unit: 0.18 } },
])
function onBasicCommit(c: ISpreadsheetChange) {
  const r = basicRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Formatted (currency) example ────────────────────────────────────────────
const formattedColumns: ISpreadsheetColumn[] = [
  { id: 'day', label: 'Day', width: 80, align: 'center', readOnly: true },
  {
    id: 'eur',
    label: 'Revenue',
    type: 'number',
    align: 'right',
    width: 140,
    format: (v) => (v == null ? '' : `€ ${Number(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
    parse: (input) => Number(input.replace(/[^0-9.,-]/g, '').replace(',', '.')),
  },
]
const formattedRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { day: 'Mon', eur: 1240.5 } },
  { id: 'r2', values: { day: 'Tue', eur: 980 } },
  { id: 'r3', values: { day: 'Wed', eur: 1115.25 } },
  { id: 'r4', values: { day: 'Thu', eur: 0 } },
  { id: 'r5', values: { day: 'Fri', eur: 0 } },
])
function onFormattedCommit(c: ISpreadsheetChange) {
  const r = formattedRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Computed totals example ─────────────────────────────────────────────────
const computedColumns: ISpreadsheetColumn[] = [
  { id: 'item', label: 'Item', width: 200, align: 'left' },
  { id: 'qty', label: 'Qty', type: 'number', align: 'right', width: 80 },
  { id: 'unit', label: 'Unit price', type: 'number', align: 'right', width: 120 },
  { id: 'amt', label: 'Amount', type: 'number', align: 'right', width: 120 },
]
const computedRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { item: 'Sensors', qty: 12, unit: 14 } },
  { id: 'r2', values: { item: 'Actuators', qty: 6, unit: 39 } },
  { id: 'r3', values: { item: 'Cables', qty: 30, unit: 2.5 } },
  { id: 'totals', pinned: 'bottom', computed: true, values: { item: 'Total' } },
])
function computeTotal(
  rowId: string,
  columnId: string,
  get: (r: string, c: string) => unknown,
): unknown {
  if (columnId === 'amt' && rowId !== 'totals') {
    return Number(get(rowId, 'qty')) * Number(get(rowId, 'unit'))
  }
  if (rowId === 'totals') {
    if (columnId === 'qty') {
      return computedRows.value
        .filter((r) => !r.pinned)
        .reduce((s, r) => s + Number(r.values.qty ?? 0), 0)
    }
    if (columnId === 'amt') {
      return computedRows.value
        .filter((r) => !r.pinned)
        .reduce((s, r) => s + Number(r.values.qty ?? 0) * Number(r.values.unit ?? 0), 0)
    }
  }
  return undefined
}
function onComputedCommit(c: ISpreadsheetChange) {
  const r = computedRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Per-cell attributes example ─────────────────────────────────────────────
const attrsColumns: ISpreadsheetColumn[] = [
  { id: 'task', label: 'Task', width: 200, align: 'left' },
  { id: 'mon', label: 'Mon', type: 'number', align: 'right', width: 80 },
  { id: 'tue', label: 'Tue', type: 'number', align: 'right', width: 80 },
  { id: 'wed', label: 'Wed', type: 'number', align: 'right', width: 80 },
  { id: 'thu', label: 'Thu', type: 'number', align: 'right', width: 80 },
  { id: 'fri', label: 'Fri', type: 'number', align: 'right', width: 80 },
  { id: 'sat', label: 'Sat', type: 'number', align: 'right', width: 80 },
  { id: 'sun', label: 'Sun', type: 'number', align: 'right', width: 80 },
]
const attrsRows = ref<ISpreadsheetRow[]>([
  { id: 'r1', values: { task: 'Design review', mon: 2, tue: 1, wed: 0, thu: 0, fri: 1 } },
  { id: 'r2', values: { task: 'Build', mon: 3, tue: 4, wed: 4, thu: 3, fri: 2 } },
  { id: 'r3', values: { task: 'Tests', mon: 1, tue: 1, wed: 2, thu: 2, fri: 2 } },
])
function attrsCallback(_rowId: string, columnId: string) {
  if (columnId === 'sat' || columnId === 'sun') {
    return { readOnly: true, className: 'weekend' }
  }
}

// ── Row labels example ─────────────────────────────────────────────────────
const labelColumns: ISpreadsheetColumn[] = [
  { id: 'jan', label: 'Jan', type: 'number', align: 'right', width: 80 },
  { id: 'feb', label: 'Feb', type: 'number', align: 'right', width: 80 },
]
const labelRows = ref<ISpreadsheetRow[]>([
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `d-${i + 1}`,
    label: String(i + 1),
    values: { jan: 8, feb: i < 4 ? 8 : null } as Record<string, unknown>,
  })),
  { id: 'total', label: 'Total', pinned: 'bottom', computed: true, values: {} },
])
function computeLabelTotal(rowId: string, columnId: string): unknown {
  if (rowId !== 'total') return undefined
  return labelRows.value
    .filter((r) => !r.pinned)
    .reduce((s, r) => s + Number(r.values[columnId] ?? 0), 0)
}
function onLabelCommit(c: ISpreadsheetChange) {
  const r = labelRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Pinned columns and rows example ─────────────────────────────────────────
const pinnedColumns: ISpreadsheetColumn[] = [
  { id: 'sku', label: 'SKU', pinned: 'left', width: 100, align: 'left' },
  { id: 'name', label: 'Name', width: 200, align: 'left' },
  { id: 'jan', label: 'Jan', type: 'number', align: 'right', width: 80 },
  { id: 'feb', label: 'Feb', type: 'number', align: 'right', width: 80 },
  { id: 'mar', label: 'Mar', type: 'number', align: 'right', width: 80 },
  { id: 'apr', label: 'Apr', type: 'number', align: 'right', width: 80 },
  { id: 'may', label: 'May', type: 'number', align: 'right', width: 80 },
  { id: 'jun', label: 'Jun', type: 'number', align: 'right', width: 80 },
  { id: 'total', label: 'Total', type: 'number', align: 'right', width: 100, pinned: 'right' },
]
const pinnedRows = ref<ISpreadsheetRow[]>([
  { id: 'p1', values: { sku: 'AX-1', name: 'Sensor pack', jan: 14, feb: 18, mar: 22, apr: 19, may: 25, jun: 27, total: 125 } },
  { id: 'p2', values: { sku: 'AX-2', name: 'Controller', jan: 9, feb: 11, mar: 7, apr: 12, may: 14, jun: 12, total: 65 } },
  { id: 'p3', values: { sku: 'AX-3', name: 'Cable set', jan: 30, feb: 30, mar: 32, apr: 28, may: 34, jun: 31, total: 185 } },
])

// ── Sortable example ────────────────────────────────────────────────────────
const sortableColumns: ISpreadsheetColumn[] = [
  { id: 'name', label: 'Country', width: 200, align: 'left', sortable: true },
  { id: 'pop', label: 'Population (M)', type: 'number', align: 'right', width: 160, sortable: true },
  { id: 'gdp', label: 'GDP per capita ($)', type: 'number', align: 'right', width: 200, sortable: true },
]
const sortableRows = ref<ISpreadsheetRow[]>([
  { id: 's1', values: { name: 'Austria', pop: 9.1, gdp: 56500 } },
  { id: 's2', values: { name: 'Canada', pop: 40.1, gdp: 53400 } },
  { id: 's3', values: { name: 'France', pop: 67.8, gdp: 47900 } },
  { id: 's4', values: { name: 'Germany', pop: 83.2, gdp: 52800 } },
  { id: 's5', values: { name: 'Switzerland', pop: 8.7, gdp: 99300 } },
])
</script>

<style scoped>
:deep(.nb-spreadsheet__cell.weekend) {
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
}
</style>
