<script setup lang="ts">
const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    placeholder: 'The component label',
    default: 'Enable feature',
  },
  {
    label: 'Verbose',
    name: 'verbose',
    type: 'boolean',
    placeholder: 'Verbose mode',
    default: false,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Disable component',
    default: false,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    default: 'md',
  },
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
    ],
    default: 'primary',
  },
]
</script>
