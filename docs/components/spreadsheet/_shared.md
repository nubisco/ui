<script setup lang="ts">
import { computed, ref } from 'vue'
import { FORMULA_FUNCTIONS } from '@nubisco/ui/formula'
import type {
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetChange,
  TSpreadsheetCells,
  TSpreadsheetStyles,
  ISpreadsheetConditionalFormat,
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

// ── Letters, hiding and the context menu ────────────────────────────────────
const budgetColumns: ISpreadsheetColumn[] = [
  { id: 'line', label: 'Budget line', width: 180 },
  { id: 'q1', label: 'Q1', type: 'number', width: 96 },
  { id: 'q2', label: 'Q2', type: 'number', width: 96 },
  { id: 'q3', label: 'Q3', type: 'number', width: 96 },
  { id: 'q4', label: 'Q4', type: 'number', width: 96 },
  { id: 'note', label: 'Note', width: 180 },
]
const budgetRows = ref<ISpreadsheetRow[]>([
  { id: 'b1', values: { line: 'Salaries', q1: 42000, q2: 42000, q3: 44000, q4: 44000, note: '' } },
  { id: 'b2', values: { line: 'Office rent', q1: 6000, q2: 6000, q3: 6000, q4: 6000, note: 'Fixed until 2028' } },
  { id: 'b3', values: { line: 'Equipment', q1: 3500, q2: 800, q3: 1200, q4: 4100, note: '' } },
  { id: 'b4', values: { line: 'Travel', q1: 1800, q2: 2400, q3: 900, q4: 2100, note: '' } },
  { id: 'b5', values: { line: 'Training', q1: 1200, q2: 0, q3: 1500, q4: 0, note: 'Two courses' } },
])
const budgetHiddenColumns = ref<string[]>(['note'])
const budgetHiddenRows = ref<string[]>(['b2'])
function onBudgetCommit(c: ISpreadsheetChange) {
  const r = budgetRows.value.find((x) => x.id === c.rowId)
  if (r) r.values[c.columnId] = c.after
}

// ── Sheet mode ──────────────────────────────────────────────────────────────
const sheetCells = ref<TSpreadsheetCells>({
  A1: 'Week',
  B1: 'Visits',
  C1: 'Sign-ups',
  A2: 1,
  B2: 1200,
  C2: 48,
  A3: 2,
  B3: 1350,
  C3: 52,
})

// ── Styles, merges and conditional formats ──────────────────────────────────
const lookSheet = ref<{
  applyStyle(patch: Record<string, unknown>): void
  clearStyles(): void
  merge(): void
} | null>(null)
const lookCells = ref<TSpreadsheetCells>({
  A1: 'Quarterly costs',
  A2: 'Line',
  B2: 'Budget',
  C2: 'Actual',
  D2: 'Variance',
  A3: 'Hosting',
  B3: 1800,
  C3: 1650,
  D3: '=B3-C3',
  A4: 'Licences',
  B4: 2400,
  C4: 2790,
  D4: '=B4-C4',
  A5: 'Training',
  B5: 900,
  C5: 450,
  D5: '=B5-C5',
  A6: 'Total',
  B6: '=SUM(B3:B5)',
  C6: '=SUM(C3:C5)',
  D6: '=SUM(D3:D5)',
})
const money = { type: 'currency', currency: 'EUR' } as const
const lookStyles = ref<TSpreadsheetStyles>({
  A1: { bold: true, align: 'center' },
  A2: { bold: true },
  B2: { bold: true },
  C2: { bold: true },
  D2: { bold: true },
  A6: { bold: true },
  ...Object.fromEntries(
    ['B', 'C', 'D'].flatMap((c) =>
      [3, 4, 5, 6].map((r) => [`${c}${r}`, { format: money }]),
    ),
  ),
})
const lookMerges = ref<string[]>(['A1:D1'])
const lookFormats: ISpreadsheetConditionalFormat[] = [
  { range: 'D3:D6', rule: { when: 'lessThan', value: 0 }, style: { intent: 'danger' } },
  { range: 'D3:D6', rule: { when: 'greaterThan', value: 0 }, style: { intent: 'success' } },
]

// ── Formulas ────────────────────────────────────────────────────────────────
const formulaCells = ref<TSpreadsheetCells>({
  A1: 'Item',
  B1: 'Qty',
  C1: 'Unit price',
  D1: 'Amount',
  A2: 'Sensors',
  B2: 12,
  C2: 14,
  D2: '=B2*C2',
  A3: 'Cables',
  B3: 30,
  C3: 2.5,
  D3: '=B3*C3',
  A4: 'Controllers',
  B4: 4,
  C4: 39,
  D4: '=B4*C4',
  A5: 'Total',
  B5: '=SUM(B2:B4)',
  D5: '=SUM(D2:D4)',
  A6: 'Largest line',
  D6: '=INDEX(A2:A4,MATCH(MAX(D2:D4),D2:D4,0))',
})

const CATEGORY_LABELS: Record<string, string> = {
  math: 'Math',
  statistical: 'Statistical',
  logical: 'Logical',
  text: 'Text',
  date: 'Date and time',
  lookup: 'Lookup and reference',
  information: 'Information',
}
const functionGroups = computed(() =>
  Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
    category,
    label,
    functions: FORMULA_FUNCTIONS.filter((fn) => fn.category === category),
  })),
)
</script>

<style scoped>
:deep(.nb-spreadsheet__cell.weekend) {
  background: var(--nb-c-surface);
  color: var(--nb-c-text-muted);
}
</style>
