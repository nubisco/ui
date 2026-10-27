<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/theme/components/Preview.d'
import DemoFrame from '../../shared/DemoFrame.vue'

const variant = ref<'compact' | 'verbose'>('verbose')
const toggle = () => {
  variant.value = variant.value === 'compact' ? 'verbose' : 'compact'
}

const headerProps: PreviewPropDef[] = [
  {
    name: 'position',
    label: 'Position',
    type: 'single',
    default: 'start',
    options: [
      { value: 'none', label: 'none (bottom row, today)' },
      { value: 'start', label: 'start' },
      { value: 'end', label: 'end' },
      { value: 'edge', label: 'edge' },
    ],
  },
  {
    name: 'compact',
    label: 'Collapsed rail',
    type: 'single',
    default: 'swap',
    options: [
      { value: 'stack', label: 'stack' },
      { value: 'swap', label: 'swap' },
      { value: 'replace', label: 'replace' },
    ],
  },
]
</script>
