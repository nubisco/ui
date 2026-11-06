<script setup lang="ts">
import { EBadgeVariant, EBadgeSize } from '../../../src/components/Badge.d'

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: EBadgeVariant.Neutral, label: 'neutral' },
      { value: EBadgeVariant.Info, label: 'info' },
      { value: EBadgeVariant.Success, label: 'success' },
      { value: EBadgeVariant.Warning, label: 'warning' },
      { value: EBadgeVariant.Danger, label: 'danger' },
      { value: EBadgeVariant.Primary, label: 'primary' },
    ],
    placeholder: 'What the badge means',
    default: EBadgeVariant.Neutral,
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
