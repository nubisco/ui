<script setup lang="ts">
import { ref } from 'vue'

const singleModel = ref('#5c35c4')
const nullModel = ref(null)
const multipleModel = ref<string[]>(['ocean'])

const options = [
  { value: 'grape', color: '#5c35c4' },
  { value: 'emerald', color: '#4acf7b' },
  { value: 'ocean', color: '#214da6' },
  { value: 'amber', color: '#f59e0b' },
  { value: 'crimson', color: '#dc2626' },
]

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'default',
    placeholder: 'Layout variant: default or fluid',
    options: [
      { label: 'default', value: 'default' },
      { label: 'fluid', value: 'fluid' },
    ],
  },
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Color Strip',
    placeholder: 'The component label',
  },
  {
    label: 'Show null value',
    name: 'showNull',
    type: 'boolean',
    default: false,
    placeholder: 'Shows a clear/null option as the first swatch in single mode',
  },
  {
    label: 'Options',
    name: 'options',
    type: 'object',
    placeholder: 'Color collection',
    default: [
      { value: 'grape', color: '#5c35c4' },
      { value: 'emerald', color: '#4acf7b' },
      { value: 'ocean', color: '#214da6' },
      { value: 'amber', color: '#f59e0b' },
      { value: 'crimson', color: '#dc2626' },
    ],
  },
]
</script>
