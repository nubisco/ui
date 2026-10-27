<script lang="ts" setup>
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const availableProps: PreviewPropDef[] = [
  {
    name: 'variant',
    type: 'single',
    label: 'Variant',
    placeholder: 'Variant of the component',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'inline', label: 'Inline' },
    ],
  },
  {
    label: 'Static',
    name: 'static',
    type: 'boolean',
    placeholder: 'Render a mark instead of a button',
    default: false,
  },
]
</script>
