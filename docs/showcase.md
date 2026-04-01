---
layout: nubisco
title: Showcase
---

A tour of NubiscoUI components. All demos are live. The components below are the real thing.

---

## Layout

`NbGrid` is the primary layout primitive. Combine `dir`, `gap`, `align`, and `justify` to build any layout without custom CSS. Every spacing value is a multiple of the 8px base unit.

<preview>
  <NbGrid dir="col" gap="md" style="width: 100%">
    <NbGrid dir="row" gap="md">
      <NbPanel style="flex: 1; padding: 16px; text-align: center;">
        <strong>Column A</strong>
      </NbPanel>
      <NbPanel style="flex: 1; padding: 16px; text-align: center;">
        <strong>Column B</strong>
      </NbPanel>
      <NbPanel style="flex: 1; padding: 16px; text-align: center;">
        <strong>Column C</strong>
      </NbPanel>
    </NbGrid>
    <NbGrid dir="row" gap="md">
      <NbPanel style="flex: 2; padding: 16px;">
        <strong>Main content</strong>
        <p style="margin: 8px 0 0; color: var(--nb-c-text-muted); font-size: 13px;">Two-thirds width. Use for primary content areas.</p>
      </NbPanel>
      <NbPanel style="flex: 1; padding: 16px;">
        <strong>Sidebar</strong>
        <p style="margin: 8px 0 0; color: var(--nb-c-text-muted); font-size: 13px;">One-third width.</p>
      </NbPanel>
    </NbGrid>
  </NbGrid>
</preview>

[Full Grid documentation →](/ui/components/grid/overview)

---

## Forms

A complete form using `NbTextInput`, `NbSelect`, `NbCheckbox`, `NbSwitch`, and `NbButton`, composed with `NbGrid`. No wrapper divs, no custom spacing.

<preview>
  <NbGrid dir="col" gap="md" style="max-width: 420px; width: 100%">
    <NbGrid dir="row" gap="md">
      <NbGrid dir="col" grow>
        <NbTextInput label="First name" placeholder="Ada" v-model="firstName" />
      </NbGrid>
      <NbGrid dir="col" grow>
        <NbTextInput label="Last name" placeholder="Lovelace" v-model="lastName" />
      </NbGrid>
    </NbGrid>
    <NbTextInput label="Email address" placeholder="you@example.com" v-model="email" />
    <NbSelect label="Role" :options="roleOptions" v-model="role" />
    <NbGrid dir="row" gap="xl" align="center">
      <NbCheckbox label="I agree to the terms" v-model="agreed" />
      <NbSwitch label="Email notifications" v-model="notifications" />
    </NbGrid>
    <NbGrid dir="row" gap="sm" justify="end">
      <NbButton variant="ghost" @click="clearForm">Cancel</NbButton>
      <NbButton variant="primary" :disabled="!agreed">Submit</NbButton>
    </NbGrid>
  </NbGrid>
</preview>

---

## Buttons

Seven variants, seven sizes, icon support, and loading/disabled states. All from a single `NbButton` component.

<preview dir="row">
  <NbButton variant="primary">Primary</NbButton>
  <NbButton variant="secondary">Secondary</NbButton>
  <NbButton variant="ghost">Ghost</NbButton>
  <NbButton variant="success">Success</NbButton>
  <NbButton variant="info">Info</NbButton>
  <NbButton variant="warning">Warning</NbButton>
  <NbButton variant="danger">Danger</NbButton>
</preview>

<preview dir="row">
  <NbButton variant="primary" icon="plus" />
  <NbButton variant="primary" icon="plus">With icon</NbButton>
  <NbButton variant="primary" loading>Loading</NbButton>
  <NbButton variant="primary" disabled>Disabled</NbButton>
</preview>

[Full Button documentation →](/ui/components/button/button)

---

## Feedback & Messaging

Contextual feedback with `NbMessage`, compact labels with `NbLabel`, and count indicators with `NbBadge`.

<preview dir="col">
  <NbMessage variant="info">Your session will expire in 10 minutes.</NbMessage>
  <NbMessage variant="success">Profile saved successfully.</NbMessage>
  <NbMessage variant="warning">This action cannot be undone.</NbMessage>
  <NbMessage variant="danger">Failed to connect. Please try again.</NbMessage>
</preview>

<preview dir="row">
  <NbBadge>Default</NbBadge>
  <NbLabel>Label</NbLabel>
</preview>

---

## Overlays

`NbModal` uses Vue's `Teleport` to render above all other content. Correct stacking, focus trap included.

<preview>
  <NbButton variant="primary" @click="isModalOpen = true">Open Modal</NbButton>
  <NbModal :open="isModalOpen">
    <template #header>Confirm deletion</template>
    <p>This will permanently delete the selected items. This action cannot be undone.</p>
    <template #footer>
      <NbGrid dir="row" gap="sm" justify="end">
        <NbButton variant="ghost" @click="isModalOpen = false">Cancel</NbButton>
        <NbButton variant="danger" @click="isModalOpen = false">Delete</NbButton>
      </NbGrid>
    </template>
  </NbModal>
</preview>

---

## Icons

Over 9,000 icons from the [Phosphor](https://phosphoricons.com) set, available in 6 weights. Icons are loaded as async Vue components via a Vite virtual module. Only the icons you reference end up in your bundle.

<preview dir="row">
  <NbIcon name="sparkle" :size="32" />
  <NbIcon name="gear" :size="32" />
  <NbIcon name="user" :size="32" />
  <NbIcon name="envelope" :size="32" />
  <NbIcon name="bell" :size="32" />
  <NbIcon name="chart-bar" :size="32" />
  <NbIcon name="lock" :size="32" />
  <NbIcon name="magnifying-glass" :size="32" />
</preview>

[Browse the full icon library →](/ui/components/icon)

---

## Flags

ISO 3166-1 country flags, loaded as async SVG components via the same virtual module pattern as icons.

<preview dir="row">
  <NbFlag name="pt" :size="32" />
  <NbFlag name="gb" :size="32" />
  <NbFlag name="us" :size="32" />
  <NbFlag name="de" :size="32" />
  <NbFlag name="fr" :size="32" />
  <NbFlag name="jp" :size="32" />
  <NbFlag name="br" :size="32" />
  <NbFlag name="in" :size="32" />
</preview>

[Browse all flags →](/ui/components/flag)

---

## Theming

Every value you saw above, the colors, spacing, type sizes, field heights, is a CSS custom property generated from a typed SCSS system. Rebrand the entire library by overriding semantic tokens:

```css
:root {
  --nb-c-primary: #1a56db;
  --nb-c-primary-hover: #1e429f;
}
```

No SCSS required for consumers. No rebuilding the library. No hunting for hardcoded values.

[Explore the theming system →](/theming)

<script setup lang="ts">
import { ref } from 'vue'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const role = ref(null)
const agreed = ref(false)
const notifications = ref(false)
const isModalOpen = ref(false)

const roleOptions = [
  { label: 'Engineer', value: 'engineer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Product Manager', value: 'pm' },
  { label: 'Other', value: 'other' },
]

function clearForm() {
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  role.value = null
  agreed.value = false
}
</script>
