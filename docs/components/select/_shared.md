<script setup lang="ts">
import { ref } from 'vue'

const locale = ref('en')
const selectedLocales = ref<string[]>([])
const assignee = ref<string | null>('pt')
const clearableLocales = ref<string[]>(['en', 'fr'])
const platform = ref('linkedin')
const version = ref('fix-1120')
const country = ref('PT')

const versionOptions = [
  { label: '1.9.0', value: 'aff-190', group: 'Affects version' },
  { label: '1.11.0', value: 'aff-1110', group: 'Affects version' },
  { label: '1.12.0', value: 'aff-1120', group: 'Affects version' },
  { label: '1.9.0', value: 'fix-190', group: 'Fixes version' },
  { label: '1.12.0', value: 'fix-1120', group: 'Fixes version' },
]

const platformOptions = [
  { label: 'LinkedIn', value: 'linkedin', icon: 'linkedin-logo' },
  { label: 'Instagram', value: 'instagram', icon: 'instagram-logo' },
  { label: 'X', value: 'x', icon: 'x-logo' },
  { label: 'Anywhere', value: 'generic' },
]

const localeOptions = [
  { label: 'English', value: 'en' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
]

const countryOptions = [
  ['AU', 'Australia'],
  ['AT', 'Austria'],
  ['BE', 'Belgium'],
  ['BR', 'Brazil'],
  ['CA', 'Canada'],
  ['CI', "Côte d'Ivoire"],
  ['DK', 'Denmark'],
  ['FI', 'Finland'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['IE', 'Ireland'],
  ['IT', 'Italy'],
  ['JP', 'Japan'],
  ['NL', 'Netherlands'],
  ['NO', 'Norway'],
  ['PT', 'Portugal'],
  ['ST', 'São Tomé and Príncipe'],
  ['ES', 'Spain'],
  ['SE', 'Sweden'],
  ['CH', 'Switzerland'],
  ['GB', 'United Kingdom'],
  ['US', 'United States'],
].map(([value, label]) => ({ value, label }))

function onCreateOption(value: string) {
  localeOptions.push({ label: value, value: value.toLowerCase() })
}

const availableProps = [
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
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Locale',
    placeholder: 'Label text',
  },
  {
    label: 'Placeholder',
    name: 'placeholder',
    type: 'string',
    default: 'Select…',
    placeholder: 'Placeholder text',
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
    placeholder: 'Disable the select',
  },
  {
    label: 'Required',
    name: 'required',
    type: 'boolean',
    default: false,
    placeholder: 'Mark as required',
  },
  {
    label: 'Multiple',
    name: 'multiple',
    type: 'boolean',
    default: false,
    placeholder: 'Allow multiple selections',
  },
]
</script>
