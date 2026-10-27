<script setup lang="ts">
import { ref } from 'vue'

const rowClicks = ref(0)

const availableProps = [
  {
    label: 'Text',
    name: 'text',
    type: 'string',
    placeholder: 'The description revealed on hover or click',
    default: 'Items moved out of the active list. Kept for 90 days, then deleted.',
  },
  {
    label: 'Title',
    name: 'title',
    type: 'string',
    placeholder: 'Optional heading above the body',
    default: '',
  },
  {
    label: 'Placement',
    name: 'placement',
    type: 'single',
    options: [
      { value: 'top', label: 'top' },
      { value: 'right', label: 'right' },
      { value: 'bottom', label: 'bottom' },
      { value: 'left', label: 'left' },
    ],
    placeholder: 'Preferred side of the popover',
    default: 'top',
  },
  {
    label: 'Icon',
    name: 'icon',
    type: 'single',
    options: [
      { value: 'info', label: 'info' },
      { value: 'question', label: 'question' },
    ],
    placeholder: 'Icon glyph',
    default: 'info',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    min: 10,
    max: 24,
    step: 1,
    placeholder: 'Icon size in pixels',
    default: 14,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Renders the icon inert',
    default: false,
  },
]
</script>
