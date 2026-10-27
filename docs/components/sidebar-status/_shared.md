<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/theme/components/Preview.d'
import DemoFrame from '../../shared/DemoFrame.vue'

const variant = ref<'compact' | 'verbose'>('verbose')
const toggle = () => {
  variant.value = variant.value === 'compact' ? 'verbose' : 'compact'
}

const statusProps: PreviewPropDef[] = [
  { name: 'label', label: 'Label', type: 'string', default: 'Daemon connected' },
  {
    name: 'status',
    label: 'Status',
    type: 'single',
    default: 'success',
    options: [
      { value: 'success', label: 'success' },
      { value: 'warning', label: 'warning' },
      { value: 'danger', label: 'danger' },
      { value: 'neutral', label: 'neutral' },
    ],
  },
]
</script>
