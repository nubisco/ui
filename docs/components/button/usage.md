---
layout: nubisco
title: Button
intro: "`NbButton` is the library's action control. Its job on any given screen is to make one action obvious and keep the rest available without competing."
source: src/components/Button.vue
tab: usage
pageTabs: ['usage', 'style', 'code', 'accessibility']
---

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

<!--@include: ./_shared.md-->
