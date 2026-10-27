<script setup lang="ts">
const trafficData = [
  { label: 'Organic',  value: 48 },
  { label: 'Referral', value: 22 },
  { label: 'Paid',     value: 18 },
  { label: 'Direct',   value: 12 },
]

const browserData = [
  { label: 'Chrome',  value: 64 },
  { label: 'Safari',  value: 19 },
  { label: 'Firefox', value: 8 },
  { label: 'Edge',    value: 6 },
  { label: 'Other',   value: 3 },
]

const statusData = [
  { label: 'Passing', value: 142, color: 'var(--nb-c-success)' },
  { label: 'Warning', value: 23,  color: 'var(--nb-c-warning)' },
  { label: 'Failing', value: 6,   color: 'var(--nb-c-danger)' },
]
</script>
