<script setup lang="ts">
const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    default: 'text',
    options: [
      { value: 'text', label: 'text' },
      { value: 'heading', label: 'heading' },
      { value: 'block', label: 'block' },
      { value: 'circle', label: 'circle' },
    ],
  },
  {
    label: 'Lines',
    name: 'lines',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
    step: 1,
  },
  {
    label: 'Animated',
    name: 'animated',
    type: 'boolean',
    default: true,
  },
]
</script>
