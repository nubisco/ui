---
layout: nubisco
title: Button
tabs: ['Usage', 'Style', 'Accessibility', 'Api']
---

<doc-tab name="Usage">

`NbButton` is the library's action control. Its job on any given screen is to
make one action obvious and keep the rest available without competing.

## Action hierarchy

Three variants carry the hierarchy. Reach for these first; the status colours
below are a different tool for a different job.

<preview dir="row">
  <NbButton variant="ghost">Cancel</NbButton>
  <NbButton variant="secondary">Save draft</NbButton>
  <NbButton variant="primary">Publish</NbButton>
</preview>

```vue
<NbButton variant="ghost">Cancel</NbButton>
<NbButton variant="secondary">Save draft</NbButton>
<NbButton variant="primary">Publish</NbButton>
```

| Variant     | Use it for                                                  |
| ----------- | ----------------------------------------------------------- |
| `primary`   | The one action the screen exists for. At most one per view. |
| `secondary` | A real alternative the user might reasonably take instead.  |
| `ghost`     | Everything else: Cancel, Back, and toolbar actions.         |

**One primary per view.** Two filled buttons side by side is two screens'
worth of emphasis on one, and the eye picks neither.

**Cancel is never `danger`.** Cancel does not destroy anything; the button it
sits next to might.

### When a status colour is right

`success`, `info`, `warning` and `danger` say what a press _means_, not how
loud it should be. Use one only when the semantics match:

<preview dir="row">
  <NbButton variant="ghost">Cancel</NbButton>
  <NbButton variant="danger">Delete environment</NbButton>
</preview>

```vue
<NbButton variant="ghost">Cancel</NbButton>
<NbButton variant="danger">Delete environment</NbButton>
```

`danger` belongs on a control that destroys something. It is not a way to make
a button louder, and a screen with three red buttons has told the user nothing.
`success` on a Save button is the common mistake: saving is the primary action,
not a positive outcome, so it takes `primary`.

For a destructive action, the dialog does the guarding: see
[NbConfirm](/ui/components/confirm) and
[Dialogs](/patterns/dialogs).

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

### Realistic groups

<preview>
  <NbGrid dir="col" gap="lg">
    <NbGrid dir="col" gap="xs">
      <strong>Form footer</strong>
      <NbGrid dir="row" gap="sm">
        <NbButton variant="ghost">Cancel</NbButton>
        <NbButton variant="primary">Save changes</NbButton>
      </NbGrid>
    </NbGrid>
    <NbGrid dir="col" gap="xs">
      <strong>Destructive confirmation</strong>
      <NbGrid dir="row" gap="sm">
        <NbButton variant="ghost">Cancel</NbButton>
        <NbButton variant="danger">Delete permanently</NbButton>
      </NbGrid>
    </NbGrid>
    <NbGrid dir="col" gap="xs">
      <strong>Toolbar</strong>
      <NbGrid dir="row" gap="xs">
        <NbButton variant="ghost" size="sm" icon="funnel">Filter</NbButton>
        <NbButton variant="ghost" size="sm" icon="arrow-clockwise">Refresh</NbButton>
        <NbButton variant="primary" size="sm" icon="plus">New</NbButton>
      </NbGrid>
    </NbGrid>
  </NbGrid>
</preview>

Every group above has exactly one filled button, and the exit is always
`ghost`. See the whole pattern working on a real screen in
[Team management](/patterns/team-management).

</doc-tab>

<doc-tab name="Style">

## Button Sizes

<!--
  A row, and a large one.

  The preview defaults to a column, so its gap was vertical while the
  `<measure>` wrappers are `inline-flex` and flowed horizontally: the gap never
  applied on the axis the buttons actually sat on, and they ran together. The
  ruler overlay draws its dimension label OUTSIDE the measured element, so each
  label landed on the next button along.
-->
<preview dir="row" gap="xxl">
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

| Prop       | Type                                                                                  | Default    | Description                                                                |
| ---------- | ------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| `variant`  | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'success' \| 'warning' \| 'info'` | —          | Visual role. Omitted, the button renders the high-contrast base treatment. |
| `outlined` | `boolean`                                                                             | `false`    | Transparent bg with colored border/text                                    |
| `size`     | `'xxs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl'`                              | `'md'`     | Button size. The full scale, all seven backed by CSS (since 1.55.0)        |
| `disabled` | `boolean`                                                                             | `false`    | Disables the button                                                        |
| `loading`  | `boolean`                                                                             | `false`    | Shows a spinner and prevents interaction                                   |
| `type`     | `'button' \| 'submit' \| 'reset'`                                                     | `'button'` | Native `<button>` type. Ignored when `href` is set                         |
| `href`     | `string`                                                                              | -          | When provided, renders as `<a>` instead of `<button>`                      |
| `target`   | `string`                                                                              | -          | Forwarded to `<a>`. Only used when `href` is set (e.g. `_blank`)           |
| `rel`      | `string`                                                                              | -          | Forwarded to `<a>`. Only used when `href` is set (e.g. `noopener`)         |
| `to`       | `string \| object`                                                                    | -          | When provided, renders as a `<RouterLink>` for Vue Router navigation       |

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

### Which token each variant paints

Every variant reads a **semantic** token, never a ramp name. That is what lets
a white-label product retheme the library without the accent leaking through:

| Variant     | Token              | Means               |
| ----------- | ------------------ | ------------------- |
| `primary`   | `--nb-c-primary`   | The screen's action |
| `secondary` | `--nb-c-secondary` | An alternative      |
| `ghost`     | `--nb-c-contrast`  | Text only, no fill  |
| `success`   | `--nb-c-success`   | A positive outcome  |
| `info`      | `--nb-c-info`      | Informational       |
| `warning`   | `--nb-c-warning`   | Proceed with care   |
| `danger`    | `--nb-c-danger`    | Destroys something  |

Each also uses the matching `-hover`, `-active` and `-a11y` tokens, so a
retheme moves the whole state set together. Override the semantic token, not
the button.

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
