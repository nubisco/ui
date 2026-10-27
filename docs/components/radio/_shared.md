<script setup lang="ts">
import { ref } from 'vue'

const selected = ref('')
const color = ref('')
const plan = ref('')
const cycle = ref('')

const options = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
]

const colorOptions = [
  { label: 'Red', value: 'red' },
  { label: 'Green', value: 'green' },
  { label: 'Blue', value: 'blue' },
]

const planOptions = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

const cycleOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annually', value: 'annually' },
]

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Choose an option',
    placeholder: 'Group label text',
  },
]
</script>
