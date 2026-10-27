<script setup lang="ts">
import { ref } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const stageValue = ref('')

const availableProps: PreviewPropDef[] = [
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
    label: 'Size',
    name: 'size',
    type: 'single',
    default: 'md',
    placeholder: 'Field height (aligns with buttons)',
    options: [
      { label: 'sm: 32px', value: 'sm' },
      { label: 'md: 40px', value: 'md' },
      { label: 'lg: 48px', value: 'lg' },
    ],
  },
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Label',
    placeholder: 'Text shown above or inside the field',
  },
  {
    label: 'Placeholder',
    name: 'placeholder',
    type: 'string',
    default: 'Placeholder…',
    placeholder: 'Input placeholder text',
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: 'I am helping a lot',
    placeholder: 'Help text shown when no error or warning',
  },
  {
    label: 'Error',
    name: 'error',
    type: 'string',
    default: undefined,
    placeholder: 'Error message: highest priority',
  },
  {
    label: 'Warning',
    name: 'warning',
    type: 'string',
    default: undefined,
    placeholder: 'Warning message: priority over helper',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Marks the field as required',
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    default: false,
    placeholder: 'Disables the input',
  },
  {
    label: 'Read-only',
    name: 'readonly',
    type: 'boolean',
    default: false,
    placeholder: 'Makes the input read-only',
  },
  {
    label: 'Multiline',
    name: 'multiline',
    type: 'boolean',
    default: false,
    placeholder: 'Renders a textarea instead of input',
  },
]

const variantDefault = ref('')
const variantFluid = ref('')
const sizeSm = ref('')
const sizeMd = ref('')
const sizeLg = ref('')
const stateError = ref('my-project')
const stateWarning = ref('A rather long description that probably exceeds the limit.')
const stateHelper = ref('')
const multilineVal = ref('')
const actionsVal = ref('')
</script>
