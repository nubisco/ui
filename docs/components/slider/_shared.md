<script setup lang="ts">
import { ref } from 'vue'

const value = ref(50)
const rangeValue = ref<[number, number]>([200, 800])

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Volume',
    placeholder: 'Label above the slider',
  },
  {
    label: 'Min',
    name: 'min',
    type: 'string',
    default: '0',
    placeholder: 'Minimum value',
  },
  {
    label: 'Max',
    name: 'max',
    type: 'string',
    default: '100',
    placeholder: 'Maximum value',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disable the slider',
  },
  {
    label: 'Show input',
    name: 'showInput',
    type: 'boolean',
    default: true,
    placeholder: 'Show number input alongside the track',
  },
]
</script>
