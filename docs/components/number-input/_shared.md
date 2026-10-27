<script setup lang="ts">
import { ref } from 'vue'

const value = ref(2)

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Quantity',
    placeholder: 'Label text',
  },
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'default',
    placeholder: 'Layout variant',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Fluid', value: 'fluid' },
    ],
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: '',
    placeholder: 'Helper text',
  },
  {
    label: 'Error',
    name: 'error',
    type: 'string',
    default: undefined,
    placeholder: 'Error message',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disable the field',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Mark as required',
  },
]
</script>
