<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PreviewPropDef } from '../../ui/.vitepress/components/Preview.d'

const clickCount = ref(0)

const availableProps: PreviewPropDef[] = [
  {
    name: 'variant',
    type: 'single',
    label: 'Variant',
    placeholder: 'Color and style variant',
    default: 'primary',
    options: [
      { value: 'primary', label: 'primary' },
      { value: 'secondary', label: 'secondary' },
      { value: 'ghost', label: 'ghost' },
      { value: 'link', label: 'link' },
      { value: 'danger', label: 'danger' },
      { value: 'success', label: 'success' },
      { value: 'warning', label: 'warning' },
      { value: 'info', label: 'info' },
    ],
  },
  {
    name: 'outlined',
    type: 'boolean',
    label: 'Outlined',
    placeholder: 'Transparent background with colored border and text',
    default: false,
  },
  {
    name: 'size',
    type: 'single',
    label: 'Size',
    placeholder: 'Button size',
    default: 'md',
    options: [
      { value: 'xxs', label: 'Extra Extra Small' },
      { value: 'xs', label: 'Extra Small' },
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra Large' },
      { value: 'xxl', label: 'Extra Extra Large' },
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
    placeholder: 'Shows a spinner and prevents interaction',
    default: false,
  },
  {
    name: 'icon',
    type: 'single',
    label: 'Icon',
    placeholder: 'Optional icon',
    default: null,
    options: [
      { value: null, label: 'No Icon' },
      { value: 'plus', label: 'Plus' },
    ],
  },
]

const incrementCounter = () => {
  clickCount.value++
}

const resetCounter = () => {
  clickCount.value = 0
}

const form = ref({
  name: '',
  email: '',
  message: ''
})

const formSubmitted = ref(false)

const isFormValid = computed(() => {
  return form.value.name.trim() && 
         form.value.email.trim() && 
         form.value.message.trim()
})

const handleFormSubmit = () => {
  if (isFormValid.value) {
    formSubmitted.value = true
  }
}

const clearForm = () => {
  form.value = { name: '', email: '', message: '' }
  formSubmitted.value = false
}
</script>

<style scoped>
h3, h4 {
  margin-top: 0;
  margin-bottom: 1rem;
}

p {
  margin: 0.5rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.success {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  color: var(--vp-c-text-1);
}

.success p {
  margin: 0.25rem 0;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.flavors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.flavor-item {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.flavor-bg-primary {
  background:
    radial-gradient(circle at 20% 20%, rgba(88, 86, 169, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(88, 86, 169, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-bg-secondary {
  background:
    radial-gradient(circle at 30% 30%, rgba(107, 114, 128, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(107, 114, 128, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-bg-success {
  background:
    radial-gradient(circle at 25% 25%, rgba(22, 163, 74, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(22, 163, 74, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-bg-info {
  background:
    radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-bg-warning {
  background:
    radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-bg-danger {
  background:
    radial-gradient(circle at 25% 25%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(220, 38, 38, 0.05) 0%, transparent 50%),
    var(--vp-c-bg);
}

.flavor-item h5 {
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
  font-size: 1.1rem;
}

.flavor-item p {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}




@media (max-width: 768px) {
  .flavors-grid {
    grid-template-columns: 1fr;
  }

}
</style>
