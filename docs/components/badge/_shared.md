<script setup lang="ts">
import { EBadgeVariant, EBadgeSize } from '../../../src/components/Badge.d'

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: EBadgeVariant.Grey, label: 'grey' },
      { value: EBadgeVariant.Blue, label: 'blue' },
      { value: EBadgeVariant.Orange, label: 'orange' },
      { value: EBadgeVariant.Green, label: 'green' },
      { value: EBadgeVariant.Red, label: 'red' },
      { value: EBadgeVariant.Purple, label: 'purple' },
      { value: EBadgeVariant.Primary, label: 'primary' },
    ],
    placeholder: 'The variant of the component',
    default: EBadgeVariant.Grey,
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: EBadgeSize.Small, label: 'Small' },
      { value: EBadgeSize.Medium, label: 'Medium' },
    ],
    placeholder: 'The size of the component',
    default: EBadgeSize.Medium,
  },
  {
    label: 'Dot',
    name: 'dot',
    type: 'boolean',
    placeholder: 'Render the dot',
    default: false,
  },
]
</script>
