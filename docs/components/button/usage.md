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
    <NbButton v-bind="resultingProps">Save changes</NbButton>
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
  <NbButton variant="ghost" icon="pencil-simple" label="Edit" />
  <NbButton variant="link">Learn more</NbButton>
  <NbButton variant="danger-tertiary">Delete</NbButton>
</preview>

| Rung      | Write                 | For                                                                                                       |
| --------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| Primary   | `variant="primary"`   | The one action a page or a region exists for, in its header. Once per page header, once per panel header. |
| Tertiary  | `variant="tertiary"`  | A standalone action of lower rank. It is `primary` outlined under its own name, and renders identically.  |
| Secondary | `variant="secondary"` | **Only beside a primary**, as its negative half: Cancel, Discard, Back. Never a positive action alone.    |
| Ghost     | `variant="ghost"`     | Rows, toolbars and dashboard tiles: an icon-only button with a `label`, per the row-action standard.      |
| Link      | `variant="link"`      | An action that reads as part of a sentence.                                                               |
| Danger    | the three below       | Destructive controls only. See [Danger buttons](#danger-buttons).                                         |

- **When the page header has a primary, regions step down.** Their actions
  become tertiary or ghost, so the page's own action stays the loudest.
- **Past three actions, prefer tertiary and ghost over secondary**, and past
  three in one place, move the rest into an
  [overflow menu](/components/overflow-menu/usage).
- **A labelled action is never bare ghost.** Without an icon it reads as grey
  text at rest. Bare ghost is for icon-only buttons.
- **Two filled primaries in one header warn in development.** `NbPanel`,
  `NbCard` and `NbPageHeader` count the filled `primary` buttons in their
  `actions` slot and warn when there are two. Outlined and tertiary buttons do
  not count.

The status variants (`success`, `info`, `warning`) say what a press means, not
how loud it is: they are not rungs. A button with no `variant` renders the
high-contrast base treatment, which is not on the ladder either: give every
button a variant. See [Information hierarchy](/principles/hierarchy#emphasis-one-filled-button-per-region).

## Anatomy

<preview dir="row" gap="xl">
  <measure>
    <NbButton variant="primary" icon="arrow-right">Continue</NbButton>
  </measure>
  <measure>
    <NbButton variant="primary">Continue</NbButton>
  </measure>
  <measure>
    <NbButton variant="ghost" icon="funnel">Filter</NbButton>
  </measure>
</preview>

- **The label starts at the left edge**, 16px in. It is never centred.
- **The icon sits at the right edge**, 16px in, never beside the label in the
  middle of the button.
- **The end of a labelled button is 64px whether it has an icon or not**: 16px
  of padding, the 16px icon, and at least 32px between the icon and the label.
  So adding an icon, or the spinner taking the icon's place while the button
  loads, never changes its width, and a row of buttons with and without icons
  lines up.
- **Ghost is the exception.** It has no box to anchor the icon to an edge, so
  it keeps 16px on both sides and its icon follows the label 8px later.
  `danger-ghost` does the same.

## Choosing a size

Every size has one job. Up to `lg` a button is one line at a fixed height.
`xl` and `xxl` are minimum heights: their label sits at the top left and wraps
onto a second line rather than overflowing (see the Style tab).

| Size  | Height | Use it                                                                                                                         |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `xxs` | 16px   | Inside a dense chip or a tag, where nothing else fits. Rare.                                                                   |
| `xs`  | 24px   | Inline in compact rows and in-canvas chrome. No field shares this height (an `xs` field is 28px).                              |
| `sm`  | 32px   | Row actions, table toolbars, and beside a `sm` field, which is the same height.                                                |
| `md`  | 40px   | The default. Forms, panel headers, and beside a `md` field, which is the same height.                                          |
| `lg`  | 48px   | **The most common size in Carbon** for a standalone action: page headers, empty states, a call to action in content.           |
| `xl`  | 64px   | Bleeds to the edge of a modal or side panel: the footer of an [NbModal](/components/modal/usage) and a panel's footer actions. |
| `xxl` | 80px   | Full-screen surfaces: a wizard's or a takeover's footer, where the actions span the bottom of the screen.                      |

A button next to a field takes the field's size, so the two line up: `sm` with
`sm`, `md` with `md`, `lg` with `lg`. Joined to the field, it is an
[NbInputGroup](/components/input-group/usage).

## Danger buttons

Three styles, all for a control that destroys something. Pick by rank, the
same way the ladder above picks.

<preview dir="row">
  <NbButton variant="danger">Delete project</NbButton>
  <NbButton variant="danger-tertiary">Delete project</NbButton>
  <NbButton variant="danger-ghost">Delete project</NbButton>
</preview>

| Variant           | Use it                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `danger`          | The region's one action is destructive: the confirm button of a delete dialog.                                       |
| `danger-tertiary` | A destructive action on a page whose main action is something else: Delete in a record header beside a primary Save. |
| `danger-ghost`    | A destructive action in a dense place: a toolbar, a settings row. Red text at rest, filled red under the pointer.    |

A danger button always has a visible label. The icon alone does not say that
the press destroys something, so danger is never icon-only.

**Combinations that work**, two buttons and three:

<preview dir="col" gap="lg">
  <NbGrid dir="row" gap="sm">
    <NbButton variant="secondary">Cancel</NbButton>
    <NbButton variant="danger">Delete</NbButton>
  </NbGrid>
  <NbGrid dir="row" gap="sm">
    <NbButton variant="danger-tertiary">Delete</NbButton>
    <NbButton variant="primary">Save</NbButton>
  </NbGrid>
  <NbGrid dir="row" gap="sm">
    <NbButton variant="danger-ghost">Delete</NbButton>
    <NbButton variant="secondary">Cancel</NbButton>
    <NbButton variant="primary">Save</NbButton>
  </NbGrid>
</preview>

- **Secondary + danger**: a confirmation dialog. The danger button is the
  dialog's one action, and Cancel is its negative half.
- **Danger tertiary + primary**: a record you can save or delete. Save is the
  point, Delete is available without competing.
- **Danger ghost + secondary + primary**: a form with three ways out.

**Combinations to avoid:**

- **Two danger buttons side by side.** If both destroy something, they are
  one choice the person has to read twice. Make it one button and say what it
  destroys.
- **A filled `danger` beside a filled `primary`.** Two filled buttons is two
  regions' worth of emphasis in one, and the person has to work out which one
  is the point. Step the danger down to `danger-tertiary` or `danger-ghost`.
- **Danger on Cancel.** Cancel destroys nothing. The button beside it might.

For a destructive action, the dialog does the guarding: see
[NbConfirm](/components/confirm/usage) and [Dialogs](/patterns/dialogs).

## Button sets

Two or three buttons that act on the same thing are a set, and
[NbButtonSet](/components/button-set/usage) lays them out. The rules it
follows:

- **At most three.** A fourth action goes into an
  [overflow menu](/components/overflow-menu/usage).
- **In a dialog, a side panel or a wizard, the primary is on the right**, at
  the end the eye reaches last, and the secondary sits to its left. A wizard's
  Back is the secondary on the left of Next.
- **On a page, the primary comes first** where the content reads from the
  left: a form's actions sit under the last field, primary first.
- **Buttons in a set are the same width.** In a modal or a side panel's
  footer they split the width evenly and bleed to its edges at `xl`.
- **They touch, or they are 8px apart, never in between.** A set that bleeds
  to an edge has no gap. A set in content has 8px.

<preview dir="col" gap="lg">
  <NbGrid dir="col" gap="xs">
    <strong>Dialog footer</strong>
    <div class="demo-set">
      <NbButton variant="secondary" size="xl">Cancel</NbButton>
      <NbButton variant="primary" size="xl">Save changes</NbButton>
    </div>
  </NbGrid>
  <NbGrid dir="col" gap="xs">
    <strong>Destructive confirmation</strong>
    <div class="demo-set">
      <NbButton variant="secondary" size="xl">Cancel</NbButton>
      <NbButton variant="danger" size="xl">Delete permanently</NbButton>
    </div>
  </NbGrid>
  <NbGrid dir="col" gap="xs">
    <strong>Table toolbar</strong>
    <NbGrid dir="row" gap="xs" align="center">
      <NbButton variant="ghost" size="sm" icon="funnel" label="Filter" />
      <NbButton variant="ghost" size="sm" icon="arrow-clockwise" label="Refresh" />
      <NbButton variant="primary" size="sm" icon="plus">New invoice</NbButton>
    </NbGrid>
  </NbGrid>
</preview>

Every group above has exactly one filled button, and the exit is always
`secondary`, beside the primary. A toolbar's tools are ghost icon-only
buttons with a `label`, and [NbToolbar](/components/toolbar/usage) lays them
out. See the whole pattern working on a real screen in
[Team management](/patterns/team-management).

## Icon-only buttons

An icon-only button has no text, so it takes a `label`. The label is two
things at once: the button's accessible name, and a tooltip anchored below the
button, which is the one place a sighted mouse user learns what an unlabelled
icon does. The two can never disagree, and no icon-only button ships without
either.

<preview dir="row">
  <NbButton variant="ghost" icon="pencil-simple" label="Edit invoice" />
  <NbButton variant="ghost" icon="copy" label="Duplicate invoice" />
  <NbButton variant="ghost" icon="trash" label="Delete invoice" />
  <NbButton variant="ghost" icon="dots-three" label="More actions" />
</preview>

```vue
<NbButton variant="ghost" icon="trash" label="Delete invoice" />
```

- **Icon-only is square at every size**, from 16px to 80px.
- **Ghost, almost always.** An icon-only button is a tool, and tools live in
  rows, toolbars and headers, where a box would be noise.
- **The label is the same verb phrase a visible label would be**:
  `Delete invoice`, not `Delete` or `Trash`.
- **Do not add `v-nb-tooltip` or `aria-label` as well.** `label` already does
  both. An explicit `aria-label` still wins for the spoken name, for the rare
  case where the spoken name should be longer than the chip.
- **To close something, use [NbCloseButton](/components/close-button/usage).**
  It is this button with the `x` icon and the right label, already decided.

## Toggles

`pressed` makes a button a toggle: it carries `aria-pressed`, and a ghost
draws a selected fill while it is on. Use it for a state that stays on after
the press, such as bold in an editor or a view that is shown. Leave `pressed`
unset on an ordinary button.

<preview dir="row">
  <NbButton variant="ghost" icon="text-b" label="Bold" :pressed="bold" @click="bold = !bold" />
  <NbButton variant="ghost" icon="text-italic" label="Italic" :pressed="italic" @click="italic = !italic" />
  <NbButton variant="ghost" icon="sidebar-simple" label="Show details" :pressed="details" @click="details = !details" />
</preview>

```vue
<NbButton
  variant="ghost"
  icon="text-b"
  label="Bold"
  :pressed="bold"
  @click="bold = !bold"
/>
```

The label names the thing being toggled and does not change with the state:
`Bold`, not `Make bold` and `Remove bold`. `aria-pressed` already says which
state it is in.

## Row actions

Rows of a table or a list follow the
[row-action standard](/principles/hierarchy#the-row-action-standard): ghost,
`sm`, icon-only buttons with a `label`. An action that does not apply to a row
stays in place, disabled, and its tooltip says why. More than three go into an
[overflow menu](/components/overflow-menu/usage).

<preview dir="row">
  <NbButton variant="ghost" size="sm" icon="pencil-simple" label="Edit invoice 2026/014" />
  <span v-nb-tooltip="{ body: 'Already sent', focusable: true }">
    <NbButton variant="ghost" size="sm" icon="paper-plane-tilt" label="Send invoice 2026/014" disabled />
  </span>
  <NbButton variant="ghost" size="sm" icon="dots-three" label="More actions" />
</preview>

```vue
<!-- A disabled button takes no pointer events, so the reason goes on a wrapper -->
<span v-nb-tooltip="{ body: 'Already sent', focusable: true }">
  <NbButton
    variant="ghost"
    size="sm"
    icon="paper-plane-tilt"
    label="Send invoice 2026/014"
    disabled
  />
</span>
```

## Examples

### Form

<preview>
  <form class="demo-form" @submit.prevent="handleFormSubmit">
    <NbTextInput v-model="form.name" label="Name" placeholder="Your name" />
    <NbTextInput v-model="form.email" type="email" label="Email" placeholder="you@example.com" />
    <NbTextInput v-model="form.message" label="Message" placeholder="What can we help with?" multiline :rows="3" />
    <NbGrid dir="row" gap="sm">
      <NbButton variant="primary" type="submit" :disabled="!isFormValid">
        Send message
      </NbButton>
      <NbButton variant="secondary" @click="clearForm">Clear form</NbButton>
    </NbGrid>
    <p v-if="formSubmitted" class="demo-form__done" role="status">
      Message sent from {{ form.email }}.
    </p>
  </form>
</preview>

The submit button is the form's one `primary`, `type="submit"` so Enter in a
field sends it. Clear is its `secondary`, beside it. On a page the primary
comes first.

## Content

- **`{verb} + {noun}`.** The label is the verb of what the button does, plus a
  noun when the verb alone is ambiguous: `Save`, `Create project`,
  `Delete environment`. The one verb per intent is in
  [Action labels](/content/action-labels).
- **Sentence case, one to three words, no period.** Never `OK`, `Done`,
  `Yes`, `Submit` or `Retry` (it is `Try again`).
- **The label never truncates.** A button's width comes from its content. If
  it does not fit, the label is too long or the layout is too tight, and the
  fix is one of those, not an ellipsis. At `xl` and `xxl` a long label wraps
  to a second line instead.
- **An icon-only button needs a `label`** that is the same verb phrase a
  visible label would use: `Delete entry`, not `Delete` or `Trash`. The button
  warns in development when it has no name.
- **`...` only when pressing it opens a dialog that asks for more**
  (`Export...`). Never on a button that raises a confirmation.

Casing, punctuation and tone are set library-wide, not by this component:
[Writing style](/content/writing-style) is the source.

## Related components

- [NbButtonSet](/components/button-set/usage): two or three buttons acting on
  one thing, ordered and sized as a set.
- [NbCloseButton](/components/close-button/usage): the icon-only close button
  every dialog, panel and banner uses.
- [NbToolbar](/components/toolbar/usage): a row of ghost tools with a primary
  at the end.
- [NbOverflowMenu](/components/overflow-menu/usage): the `dots-three` button
  that holds the fourth action and beyond.
- [NbInputGroup](/components/input-group/usage): a button joined to a field of
  the same height.
- [NbSkeleton](/components/skeleton/code#buttons): `variant="button"` holds a
  button's place, at its size, while it loads.

<!--@include: ./_shared.md-->
