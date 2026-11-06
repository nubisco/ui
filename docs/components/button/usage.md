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

## The emphasis ladder

A button's variant is its rank. Each region of a page has **one** button at
the top rung, and everything else steps down from it. If two buttons on one
screen are equally loud, neither is the point.

<preview dir="row">
  <NbButton variant="primary">Publish</NbButton>
  <NbButton variant="tertiary">Export</NbButton>
  <NbButton variant="secondary">Cancel</NbButton>
  <NbButton variant="ghost" icon="pencil-simple" aria-label="Edit" />
  <NbButton variant="link">Learn more</NbButton>
  <NbButton variant="danger" outlined>Delete</NbButton>
</preview>

| Rung      | Write                          | For                                                                                                       |
| --------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Primary   | `variant="primary"`            | The one action a page or a region exists for, in its header. Once per page header, once per panel header. |
| Tertiary  | `variant="tertiary"`           | A standalone action of lower rank. It is `primary` outlined under its own name, and renders identically.  |
| Secondary | `variant="secondary"`          | **Only beside a primary**, as its negative half: Cancel, Discard, Back. Never a positive action alone.    |
| Ghost     | `variant="ghost"`              | Rows, toolbars and dashboard tiles: an icon button with a tooltip, per the row-action standard.           |
| Link      | `variant="link"`               | An action that reads as part of a sentence.                                                               |
| Danger    | `variant="danger"`, `outlined` | Destructive controls only. Outlined unless it is the region's one action (a confirm dialog's Delete).     |

- **When the page header has a primary, regions step down.** Their actions
  become tertiary or ghost, so the page's own action stays the loudest.
- **Past three actions, prefer tertiary and ghost over secondary.**
- **A labelled action is never bare ghost.** Without an icon it reads as grey
  text at rest. Bare ghost is for icon buttons.
- **Two filled primaries in one header warn in development.** `NbPanel`,
  `NbCard` and `NbPageHeader` count the filled `primary` buttons in their
  `actions` slot and warn when there are two. Outlined and tertiary buttons do
  not count.

The status variants (`success`, `info`, `warning`) say what a press means, not
how loud it is: they are not rungs. A button with no `variant` renders the
high-contrast base treatment, which is not on the ladder either: give every
button a variant. See [Information hierarchy](/principles/hierarchy#emphasis-one-filled-button-per-region).

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

## Content

- **The label is the verb of what the button does**, plus a noun when the verb alone is ambiguous: `Save`, `Create project`, `Delete environment`. The one verb per intent is in [Action labels](/content/action-labels).
- **One or two words, sentence case, no period.** Never `OK`, `Done`, `Yes`, `Submit` or `Retry` (it is `Try again`).
- **The label never truncates.** A button's width comes from its content. If it does not fit, the label is too long or the layout is too tight, and the fix is one of those, not an ellipsis.
- **An icon-only button needs an `aria-label`** that is the same verb phrase a visible label would use: `Delete entry`, not `Delete` or `Trash`. The button warns in development when it has no name.
- **`...` only when pressing it opens a dialog that asks for more** (`Export...`). Never on a button that raises a confirmation.

Casing, punctuation and tone are the fleet's, not this component's: [Writing style](/content/writing-style) is the source.

<!--@include: ./_shared.md-->
