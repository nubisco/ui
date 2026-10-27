<script setup lang="ts">
const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Loading invoices',
    placeholder: 'What is loading',
  },
  {
    label: 'Show label',
    name: 'showLabel',
    type: 'boolean',
    default: true,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    default: 'md',
    options: [
      { value: 'xs', label: 'xs' },
      { value: 'sm', label: 'sm' },
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  {
    label: 'Tone',
    name: 'tone',
    type: 'single',
    default: 'primary',
    options: [
      { value: 'primary', label: 'primary' },
      { value: 'inherit', label: 'inherit' },
    ],
  },
]
</script>
