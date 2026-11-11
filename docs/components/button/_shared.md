<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PreviewPropDef } from '../../ui/.vitepress/components/Preview.d'

const availableProps: PreviewPropDef[] = [
  {
    name: 'variant',
    type: 'single',
    label: 'Variant',
    placeholder: 'Rank, or what a press means',
    default: 'primary',
    options: [
      { value: 'primary', label: 'primary' },
      { value: 'tertiary', label: 'tertiary' },
      { value: 'secondary', label: 'secondary' },
      { value: 'ghost', label: 'ghost' },
      { value: 'link', label: 'link' },
      { value: 'danger', label: 'danger' },
      { value: 'danger-tertiary', label: 'danger-tertiary' },
      { value: 'danger-ghost', label: 'danger-ghost' },
      { value: 'success', label: 'success' },
      { value: 'warning', label: 'warning' },
      { value: 'info', label: 'info' },
    ],
  },
  {
    name: 'size',
    type: 'single',
    label: 'Size',
    placeholder: 'Button size',
    default: 'md',
    options: [
      { value: 'xxs', label: 'xxs (16px)' },
      { value: 'xs', label: 'xs (24px)' },
      { value: 'sm', label: 'sm (32px)' },
      { value: 'md', label: 'md (40px)' },
      { value: 'lg', label: 'lg (48px)' },
      { value: 'xl', label: 'xl (64px)' },
      { value: 'xxl', label: 'xxl (80px)' },
    ],
  },
  {
    name: 'disabled',
    type: 'boolean',
    label: 'Disabled',
    placeholder: 'Disables the button',
    default: false,
  },
  {
    name: 'loading',
    type: 'boolean',
    label: 'Loading',
    placeholder: 'Shows a spinner in the icon slot, at the same width',
    default: false,
  },
  {
    name: 'icon',
    type: 'single',
    label: 'Icon',
    placeholder: 'Optional icon, at the end',
    default: null,
    options: [
      { value: null, label: 'No icon' },
      { value: 'plus', label: 'plus' },
      { value: 'arrow-right', label: 'arrow-right' },
    ],
  },
]

// The toggles demo.
const bold = ref(true)
const italic = ref(false)
const details = ref(false)

// The form demo.
const form = ref({ name: '', email: '', message: '' })
const formSubmitted = ref(false)

const isFormValid = computed(
  () =>
    !!form.value.name.trim() &&
    !!form.value.email.trim() &&
    !!form.value.message.trim(),
)

const handleFormSubmit = () => {
  if (isFormValid.value) formSubmitted.value = true
}

const clearForm = () => {
  form.value = { name: '', email: '', message: '' }
  formSubmitted.value = false
}
</script>

<style scoped>
.demo-form {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-16);
  width: 100%;
  max-width: 28rem;
}

.demo-form__done {
  margin: 0;
  color: var(--nb-c-text-subtle);
}

/* A set that bleeds to an edge: the buttons touch and split the width. */
.demo-set {
  display: flex;
  width: 100%;
  max-width: 32rem;
}

.demo-set > * {
  flex: 1 1 0;
  max-width: none;
}

/* The variant grid on the Style tab. Tokens only, so it follows the theme. */
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--nb-spacing-16);
  width: 100%;
}

.variant-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--nb-spacing-8);
  padding: var(--nb-spacing-16);
  background: var(--nb-c-layer-1);
  border: 1px solid var(--nb-c-layer-border-1);
  border-radius: var(--nb-radius-panel);
}

.variant-cell h5 {
  margin: 0;
  font-size: var(--nb-type-heading-compact-size);
  color: var(--nb-c-text);
}

.variant-cell p {
  margin: 0;
  font-size: var(--nb-type-body-sm-size);
  color: var(--nb-c-text-subtle);
}

/* States side by side: a caption under each button. */
.state-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--nb-spacing-24);
}

.state-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--nb-spacing-8);
  font-size: var(--nb-type-body-sm-size);
  color: var(--nb-c-text-subtle);
}
</style>
