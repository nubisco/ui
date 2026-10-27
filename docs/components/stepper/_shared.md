<script setup lang="ts">
import { ref } from 'vue'

const playgroundStep = ref(1)
const navigableStep = ref(0)

const availableProps = [
  {
    label: 'Orientation',
    name: 'orientation',
    type: 'single',
    options: [
      { value: 'horizontal', label: 'Horizontal' },
      { value: 'vertical', label: 'Vertical' },
    ],
    default: 'horizontal',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
    ],
    default: 'md',
  },
  {
    label: 'Navigable',
    name: 'navigable',
    type: 'boolean',
    placeholder: 'Let the user click back',
    default: false,
  },
]
</script>
