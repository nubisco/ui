<script setup lang="ts">
const availableProps = [
  {
    label: 'Status',
    name: 'status',
    type: 'single',
    default: 'active',
    options: [
      { value: 'inactive', label: 'inactive' },
      { value: 'active', label: 'active' },
      { value: 'finished', label: 'finished' },
      { value: 'error', label: 'error' },
    ],
  },
  {
    label: 'Active label',
    name: 'label',
    type: 'string',
    default: 'Saving contact',
    placeholder: 'Present tense',
  },
  {
    label: 'Finished label',
    name: 'finishedLabel',
    type: 'string',
    default: 'Contact saved',
    placeholder: 'Past tense',
  },
  {
    label: 'Error label',
    name: 'errorLabel',
    type: 'string',
    default: 'Could not save contact',
    placeholder: 'What failed',
  },
]
</script>
