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
    name: 'size',
    type: 'single',
    label: 'Size',
    placeholder: 'Size of the label',
    default: 'md',
    options: [
      { value: 'sm', label: 'sm' },
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  {
    label: 'Explain',
    name: 'explain',
    type: 'string',
    placeholder: 'Plain-text explanation. Empty renders the static mark.',
    default:
      'Written by a model from 14 tasks and 3 goals the product selected. Every task it names was checked against that list.',
  },
  {
    label: 'Plain available',
    name: 'plainAvailable',
    type: 'boolean',
    placeholder: 'Offer the plain version in the explanation',
    default: false,
  },
  {
    label: 'Revertable',
    name: 'revertable',
    type: 'boolean',
    placeholder: 'A person edited the AI value: render the undo button',
    default: false,
  },
]
</script>
