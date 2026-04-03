---
layout: nubisco
title: Button
tabs: ['Usage', 'Style', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

The `Button` component is a versatile, accessible button with multiple variants and sizes.

## Basic Usage

<preview :props="availableProps" v-slot="{ resultingProps }" themeable>
  <measure
    :rulers="{
      horizontal: true,
      vertical: true,
      fontSize: 10,
      strokeWidth: 1
    }"
  >
    <NbButton v-bind="resultingProps">Click me</NbButton>
  </measure>
</preview>

## Icon Button

<preview dir="row">
  <NbButton icon="plus" />
  <NbButton variant="primary" icon="minus" />
  <NbButton variant="danger" icon="trash" loading />
  <NbButton variant="danger" icon="trash" disabled />
</preview>

## Features

- **Color Tints**: Six distinct color variants (primary, secondary, success, info, warning, danger)
- **CSS Custom Properties**: Uses design system variables for theming

## Examples

### Form Integration

<preview>
  <div class="demo-container">
    <form @submit.prevent="handleFormSubmit">
      <h4>Contact Form</h4>
      <div class="form-group">
        <label>Name:</label>
        <input type="text" v-model="form.name" placeholder="Your name" />
      </div>
      <div class="form-group">
        <label>Email:</label>
        <input type="email" v-model="form.email" placeholder="your@email.com" />
      </div>
      <div class="form-group">
        <label>Message:</label>
        <textarea v-model="form.message" placeholder="Your message" rows="4"></textarea>
      </div>
      <div class="button-group">
        <NbButton type="submit" :disabled="!isFormValid">
          Send Message
        </NbButton>
        <NbButton type="button" @click="clearForm">
          Clear
        </NbButton>
      </div>
    </form>
    <div v-if="formSubmitted" class="success">
      <p>✅ Form submitted successfully!</p>
      <p><strong>Name:</strong> {{ form.name }}</p>
      <p><strong>Email:</strong> {{ form.email }}</p>
      <p><strong>Message:</strong> {{ form.message }}</p>
    </div>
  </div>
</preview>

### Contextual Usage Examples

<preview>
  <div class="demo-container">
    <div class="context-examples">
      <div class="context-section">
        <h4>Form Actions</h4>
        <div class="button-group">
          <NbButton tint="success" @click="handleSave">Save Changes</NbButton>
          <NbButton tint="secondary" @click="handleCancel">Cancel</NbButton>
        </div>
      </div>
      <div class="context-section">
        <h4>Alert Dialog</h4>
        <div class="button-group">
          <NbButton tint="danger" @click="handleDelete">Delete Permanently</NbButton>
          <NbButton tint="warning" @click="handleArchive">Archive Instead</NbButton>
          <NbButton tint="secondary" @click="handleCancel">Cancel</NbButton>
        </div>
      </div>
      <div class="context-section">
        <h4>Navigation</h4>
        <div class="button-group">
          <NbButton tint="primary" @click="handleNext">Continue</NbButton>
          <NbButton tint="info" @click="handleHelp">Get Help</NbButton>
          <NbButton tint="secondary" @click="handleBack">Go Back</NbButton>
        </div>
      </div>
    </div>
  </div>
</preview>

</doc-tab>

<doc-tab name="Style">

## Button Sizes

<preview gap="lg">
  <measure>
    <NbButton variant="primary" icon="plus" size="xxs">xxs</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xs">xs</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="sm">sm</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="md">md</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="lg">lg</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xl">xl</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary" icon="plus" size="xxl">xxl</NbButton>
  </measure>
</preview>

## Button Variants

The button component supports distinct color `variant`, each designed for specific use cases:

<preview>
  <div class="demo-container">
    <div class="flavors-grid">
      <div class="flavor-item flavor-bg-primary">
        <h5>Primary</h5>
        <p>Main actions and primary CTAs</p>
        <NbButton variant="primary">Primary Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-secondary">
        <h5>Secondary</h5>
        <p>Secondary actions and neutral options</p>
        <NbButton variant="secondary">Secondary Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-secondary">
        <h5>Ghost</h5>
        <p>No outline at all, to save space</p>
        <NbButton variant="ghost">Ghost Action</NbButton>
      </div>
      <div class="flavor-item flavor-bg-success">
        <h5>Success</h5>
        <p>Positive actions and confirmations</p>
        <NbButton variant="success">Save Changes</NbButton>
      </div>
      <div class="flavor-item flavor-bg-info">
        <h5>Info</h5>
        <p>Informational actions and details</p>
        <NbButton variant="info">Learn More</NbButton>
      </div>
      <div class="flavor-item flavor-bg-warning">
        <h5>Warning</h5>
        <p>Cautionary actions and warnings</p>
        <NbButton variant="warning">Proceed with Caution</NbButton>
      </div>
      <div class="flavor-item flavor-bg-danger">
        <h5>Danger</h5>
        <p>Destructive actions and deletions</p>
        <NbButton variant="danger">Delete Item</NbButton>
      </div>
    </div>
  </div>
</preview>

## Outlined Variants

Add `:outlined="true"` (or just `outlined`) to any variant to remove the background and show a colored border and text instead. Ghost is excluded since it already has no background.

<preview>
  <div class="demo-container">
    <div class="flavors-grid">
      <div class="flavor-item">
        <NbButton variant="primary" outlined>Primary</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="secondary" outlined>Secondary</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="success" outlined>Save</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="warning" outlined>Proceed</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="danger" outlined>Delete</NbButton>
      </div>
      <div class="flavor-item">
        <NbButton variant="info" outlined>Learn More</NbButton>
      </div>
    </div>
  </div>
</preview>

```vue
<NbButton variant="danger" outlined>Delete</NbButton>
<NbButton variant="success" outlined>Save</NbButton>
<NbButton variant="primary" outlined>Cancel</NbButton>
```

## Styling

The button uses CSS custom properties from the design system:

```css
.nb-button {
  background: var(--nb-c-contrast);
  color: var(--nb-c-surface);
}
```

</doc-tab>

<doc-tab name="Accessibility">

- Proper button semantics with `<button>` element
- Keyboard navigation support (Enter and Space keys)
- Focus indicators for keyboard users
- Screen reader friendly
- Disabled state support

## Best Practices

1. **Use descriptive button text** that clearly indicates the action
2. **Provide loading states** for async operations
3. **Use appropriate button types** (submit, button, reset)
4. **Consider button hierarchy** (primary vs secondary actions)
5. **Test with keyboard navigation** to ensure accessibility

</doc-tab>

<doc-tab name="Api">

## Props

| Prop       | Type                                                                                  | Default     | Description                                                          |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'success' \| 'warning' \| 'info'` | `'primary'` | Color and style variant                                              |
| `outlined` | `boolean`                                                                             | `false`     | Transparent bg with colored border/text                              |
| `size`     | `'sm' \| 'md' \| 'lg'`                                                                | `'md'`      | Button size                                                          |
| `disabled` | `boolean`                                                                             | `false`     | Disables the button                                                  |
| `loading`  | `boolean`                                                                             | `false`     | Shows a spinner and prevents interaction                             |
| `type`     | `'button' \| 'submit' \| 'reset'`                                                     | `'button'`  | Native `<button>` type. Ignored when `href` is set                   |
| `href`     | `string`                                                                              | -           | When provided, renders as `<a>` instead of `<button>`                |
| `target`   | `string`                                                                              | -           | Forwarded to `<a>`. Only used when `href` is set (e.g. `_blank`)     |
| `rel`      | `string`                                                                              | -           | Forwarded to `<a>`. Only used when `href` is set (e.g. `noopener`)   |
| `to`       | `string \| object`                                                                    | -           | When provided, renders as a `<RouterLink>` for Vue Router navigation |

### Link buttons

Use `href` for external links and `to` for internal Vue Router navigation.

When `href` is provided the component renders a semantic `<a>` element, preserving native browser link behaviors (right-click, middle-click, ctrl+click, `target="_blank"`).

When `to` is provided the component renders as a `<RouterLink>`, enabling client-side navigation with active-link tracking.

Disabled state is communicated via `aria-disabled` instead of the `disabled` attribute for both `<a>` and `<RouterLink>`.

```vue
<!-- External link: renders <a href="..." target="_blank" rel="noopener"> -->
<NbButton
  variant="primary"
  href="https://github.com/nubisco/verba"
  target="_blank"
  rel="noopener"
>
  View on GitHub
</NbButton>

<!-- Internal Vue Router link: renders <RouterLink to="..."> -->
<NbButton variant="ghost" to="/products">
  Explore products
</NbButton>
```

## Events

| Event   | Payload      | Description           |
| ------- | ------------ | --------------------- |
| `click` | `MouseEvent` | Fired on button click |

### Color Mapping

The button tints map to design system colors:

| Tint        | Color Variable                  | Hex Value | Use Case              |
| ----------- | ------------------------------- | --------- | --------------------- |
| `primary`   | `--nb-c-grape-hyacinth-500`     | `#5856a9` | Main actions          |
| `secondary` | `--nb-c-nouveau-gray-500`       | `#6b7280` | Secondary actions     |
| `success`   | `--nb-c-emerald-reflection-500` | `#4acf7b` | Positive actions      |
| `info`      | `--nb-c-the-blues-brothers-500` | `#214da6` | Informational actions |
| `warning`   | `--nb-c-phoenix-flames-500`     | `#f59e0b` | Cautionary actions    |
| `danger`    | `--nb-c-chicken-comb-500`       | `#dc2626` | Destructive actions   |

</doc-tab>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

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

// Contextual example handlers
const handleSave = () => {
  alert('Changes saved!')
}

const handleCancel = () => {
  alert('Action cancelled')
}

const handleDelete = () => {
  alert('Item deleted!')
}

const handleArchive = () => {
  alert('Item archived!')
}

const handleNext = () => {
  alert('Continuing to next step...')
}

const handleHelp = () => {
  alert('Opening help documentation...')
}

const handleBack = () => {
  alert('Going back...')
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

.context-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.context-section {
  padding: 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
}

.context-section h4 {
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .flavors-grid {
    grid-template-columns: 1fr;
  }

  .context-examples {
    grid-template-columns: 1fr;
  }
}
</style>
