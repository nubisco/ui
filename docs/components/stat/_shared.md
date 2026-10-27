<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/theme/components/Preview.d'

const metric = ref('visitors')

const statProps: PreviewPropDef[] = [
  {
    name: 'status',
    label: 'Status',
    type: 'single',
    default: 'neutral',
    options: ['neutral', 'info', 'success', 'warning', 'danger'].map((v) => ({ value: v, label: v })),
  },
  {
    name: 'size',
    label: 'Size',
    type: 'single',
    default: 'md',
    options: [
      { value: 'sm', label: 'sm' },
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  { name: 'delta', label: 'Delta', type: 'string', default: '+12%' },
  {
    name: 'trend',
    label: 'Trend',
    type: 'single',
    default: 'up',
    options: ['up', 'down', 'flat', 'none'].map((v) => ({ value: v, label: v })),
  },
  { name: 'invertTrend', label: 'Invert trend', type: 'boolean', default: false },
  { name: 'comparison', label: 'Comparison', type: 'string', default: 'vs last week' },
  { name: 'loading', label: 'Loading', type: 'boolean', default: false },
]
</script>
