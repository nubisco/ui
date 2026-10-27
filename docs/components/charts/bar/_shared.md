<script setup lang="ts">
import { ref } from 'vue'

const singleSeries = [
  {
    name: 'Sign-ups',
    data: [
      { x: 'Organic', y: 320 },
      { x: 'Referral', y: 240 },
      { x: 'Paid', y: 180 },
      { x: 'Direct', y: 150 },
    ],
  },
]

const groupedSeries = [
  {
    name: 'EU',
    data: [
      { x: 'Q1', y: 32 },
      { x: 'Q2', y: 41 },
      { x: 'Q3', y: 38 },
      { x: 'Q4', y: 47 },
    ],
  },
  {
    name: 'NA',
    data: [
      { x: 'Q1', y: 28 },
      { x: 'Q2', y: 33 },
      { x: 'Q3', y: 36 },
      { x: 'Q4', y: 44 },
    ],
  },
  {
    name: 'APAC',
    data: [
      { x: 'Q1', y: 14 },
      { x: 'Q2', y: 22 },
      { x: 'Q3', y: 27 },
      { x: 'Q4', y: 31 },
    ],
  },
]

const areaSeries = [
  {
    name: 'Open issues',
    data: [
      { x: 'Authentication and access', y: 24 },
      { x: 'Billing and invoicing', y: 18 },
      { x: 'Developer documentation', y: 15 },
      { x: 'Infrastructure', y: 12 },
      { x: 'Notifications', y: 9 },
      { x: 'Onboarding', y: 7 },
      { x: 'Reporting and exports', y: 6 },
      { x: 'Search relevance', y: 4 },
      { x: 'Localisation', y: 3 },
    ],
  },
]

const euro = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const formatEuro = (value) => euro.format(value)

const revenueSeries = [
  {
    name: 'Revenue',
    data: [
      { x: 'Q1', y: 12500 },
      { x: 'Q2', y: 18200 },
      { x: 'Q3', y: 9800, label: 'Not yet closed' },
      { x: 'Q4', y: 21400 },
    ],
  },
]

const selectionNote = ref('Click a bar.')
const onSelect = (selection) => {
  selectionNote.value = `${selection.x}: ${selection.y} open`
}

const negativeSeries = [
  {
    name: 'Net profit',
    data: [
      { x: 'Q1', y: 12 },
      { x: 'Q2', y: -4 },
      { x: 'Q3', y: 8 },
      { x: 'Q4', y: -2 },
    ],
  },
]

const paletteSeries = [
  {
    name: 'Healthy',
    data: [
      { x: 'Mon', y: 24 },
      { x: 'Tue', y: 22 },
      { x: 'Wed', y: 28 },
      { x: 'Thu', y: 30 },
      { x: 'Fri', y: 26 },
    ],
  },
  {
    name: 'Warning',
    data: [
      { x: 'Mon', y: 6 },
      { x: 'Tue', y: 9 },
      { x: 'Wed', y: 7 },
      { x: 'Thu', y: 12 },
      { x: 'Fri', y: 8 },
    ],
  },
  {
    name: 'Critical',
    data: [
      { x: 'Mon', y: 1 },
      { x: 'Tue', y: 3 },
      { x: 'Wed', y: 0 },
      { x: 'Thu', y: 4 },
      { x: 'Fri', y: 2 },
    ],
  },
]
</script>

<style scoped>
.nb-chart-selection-note {
  margin: 12px 0 0;
  font-family: var(--nb-font-family-mono);
  font-size: 12px;
  color: var(--nb-c-text-muted);
}
</style>
