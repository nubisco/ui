---
layout: nubisco
title: Building a form
---

A form is a promise about **when the value is committed**. Everything else on
this page follows from that: where the label goes, when the red text appears,
whether there is a Save button at all, and what happens when the server says no.

We audited twelve applications built on this library. Forms came out worse than
any other surface:

- **Five applications redefine `div.field` by hand.** Same idea (label above
  control, muted helper below), five different paddings, five different label
  colours, five copies to fix when the field height changes.
- **One application binds `NbTextInput`'s `error` prop zero times across
  fifty-eight call sites.** Not "rarely". Zero. Validation in that product is a
  paragraph of red text somewhere else on the page, or nothing.
- **One application has seventy-two `NbField`s and no `<form>` element
  anywhere.** Enter does nothing in any of them. Password managers do not know
  what they are looking at.
- **Three save models live inside a single application**: debounce-on-blur here,
  a Save button there, a modal with its own Submit in a third view. Same data,
  same user, three different answers to "is my change kept?".

None of that is a taste problem. It is the absence of a written decision. This
page is the decision, heading by heading. Every heading is a ruling and the
reason for it.

The one principle the rest hangs off: **a form must never be ambiguous about
whether the user's work is safe.** Ambiguity is what a hand-rolled field, an
unbound `error` prop, a missing `<form>` and a third save model all produce.

## Anatomy

Every rule below names a part. These are the parts, with the exact slot names
and the exact element each one renders. Nothing here is a sketch: it is what
`Form.vue`, `Field.vue` and the controls emit today.

### The form

```vue
<NbForm title="Company details" @submit.prevent="submit">
  <template #message>Prose that introduces the form.</template>
  <!-- default slot: the body, one field per row -->
  <template #footer>
    <!-- actions -->
  </template>
</NbForm>
```

| Part        | How you supply it | What it renders                                                    |
| ----------- | ----------------- | ------------------------------------------------------------------ |
| **Root**    | `NbForm` itself   | A real `<form>` (`NbGrid is="form"`), column, `gap="md"` (16px)    |
| **Title**   | `title` prop      | `<h4 class="nb-form--header">`, rendered only when `title` is set  |
| **Message** | `#message` slot   | `<p class="nb-form--message">`, for prose that introduces the form |
| **Body**    | default slot      | `<div class="nb-form--body">`, column, `gap="sm"` (8px)            |
| **Footer**  | `#footer` slot    | `<footer class="nb-form--footer">`, a row, `justify="end"`         |

Two consequences you will hit within an hour:

- **`#message` is a paragraph.** It takes text and inline elements. It cannot
  take an `NbBanner`, an `NbPanel` or anything else whose root is a `<div>`:
  the HTML parser closes the `<p>` before the `<div>`, the server-rendered
  markup and the client-rendered markup disagree, and hydration breaks.
  Form-level errors therefore go at the top of the **default** slot. See
  [Rule 11](#rule-11-field-errors-are-the-truth-the-form-level-summary-is-a-pointer).
- **The `<form>` carries `tabindex="-1"`.** `NbGrid` gives every non-focusable
  element `-1`, so the form is out of the tab order but is programmatically
  focusable, which is what you want when moving focus after a failed submit.

### The field

A field has four parts, and which component owns each one depends on the layout
you picked in [Rule 2](#rule-2-three-layouts-are-legal-and-the-hand-rolled-one-is-not).

| Part        | Control-level layout                 | `NbField` layout                      |
| ----------- | ------------------------------------ | ------------------------------------- |
| **Label**   | `label` prop, rendered by `NbLabel`  | `label` prop or `#label` slot         |
| **Control** | the component itself                 | default slot, which receives `{ id }` |
| **Message** | `error` / `warning` / `helper` props | not available: put it on the control  |
| **Hint**    | `helper` prop (steady guidance)      | `hint` prop or `#hint` slot           |

`NbField` renders `div.nb-field` as a two-column grid: the label column is
`--nb-field-label-width` (8rem by default) and the gap is `--nb-field-col-gap`
(12px). The hint sits in the value column. `NbField` has no message slot on
purpose: a validated field belongs to the control, so it always renders its own
error.

That table is easier to believe with both of them on screen. The same field
twice, at the same content and bound to the same value, so typing in one moves
the other. Nothing else about them is the same.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half">
      <p class="fdx-label">Control-level layout</p>
      <NbTextInput id="fdx-anatomy-control" v-model="anatomyEmail" label="Work email" type="email" required error="Enter a work email address" />
      <p class="fdx-note">Label, control and message are three props on one component: <code>label</code>, <code>v-model</code>, <code>error</code>. Nothing wraps it, and there is nothing to keep in step with it.</p>
    </div>
    <div class="fdx-half">
      <p class="fdx-label">NbField layout</p>
      <NbField label="Work email" hint="We use this for billing receipts" v-slot="{ id }">
        <NbTextInput :id="id" v-model="anatomyEmail" size="xs" type="email" error="Enter a work email address" />
      </NbField>
      <p class="fdx-note"><code>NbField</code> owns the label and the hint, in the label column and the value column of one grid. The message is still the control's own <code>error</code> prop, because <code>NbField</code> has no message slot: it lands under the control, inside the value column.</p>
    </div>
  </div>
</preview>

Note what moved and what did not. The label crossed from the control to the
wrapper. The error did not, and cannot: there is no arrangement of these two
components in which `NbField` renders the validation message.

## Rule 1: choose the surface before you choose anything else

Where the form lives decides its size, its save model and its footer. Decide it
first, from the number of inputs and the size of the consequence.

| Surface                             | Inputs    | Choose it when                                                                    | Save model         |
| ----------------------------------- | --------- | --------------------------------------------------------------------------------- | ------------------ |
| **Page**                            | 5 or more | Creating a record, or editing something the user came here to edit                | Explicit submit    |
| **Modal** (`NbModal`)               | 1 to 4    | A short edit on top of a list or detail view that the user must finish or abandon | Modal submit       |
| **Shell panel** (`NbShellPanel`)    | any       | Properties of a selected object, edited alongside the thing they change           | Autosave on commit |
| **Inline** (single field, in place) | 1         | Renaming one thing, in the row or heading where it already appears                | Autosave on commit |

The thresholds are not decoration:

- **Past four inputs, a modal is the wrong surface.** A dialog cannot scroll
  comfortably, cannot be linked to, loses everything on an accidental dismissal,
  and cannot show a long error summary without covering its own fields. If a
  modal form needs sections, tabs or an accordion to fit, it is a page.
- **Anything irreversible or expensive is a page, or a confirmation, not a
  modal form.** A modal's promise is "closing discards", which is a bad promise
  to make about something that already charged a card.
- **A shell panel is a property editor, not a form.** It has no footer and no
  submit. If it needs a Save button it is a page or a modal.
- **Inline editing is one field.** Two fields edited in place is a form with no
  container, no submit and no error region, and it is the shape that produced
  the fleet's third save model.

## Rule 2: three layouts are legal, and the hand-rolled one is not

There are exactly three ways to lay out a field in this library. Pick by
surface, not by taste.

| Layout                                               | What it is                                                           | Use it for                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Control-level label** (the control's `label` prop) | Label above the control, message below, all inside the control       | Standalone forms: sign-up, settings pages, dialogs, anything with a Save button         |
| **`NbField` row** (`orientation="row"`, default)     | Label beside the control on a shared grid spine                      | Inspectors and dense property panels. See [Building an inspector](/patterns/inspectors) |
| **`NbField` stack** (`orientation="stack"`)          | Label on its own line above a full-width control, still on the spine | A tall or wide control inside an otherwise row-based panel (a text area, a slider)      |

All three, running, at the content each one is for:

<preview dir="col">
  <div class="fdx-trio">
    <div class="fdx-third">
      <p class="fdx-label">1. Control-level label</p>
      <NbTextInput id="fdx-legal-name" v-model="legal.name" label="Display name" />
      <NbSelect id="fdx-legal-region" v-model="legal.region" label="Region" :options="regionOptions" />
      <p class="fdx-note">Label above, message below, all of it inside the control. This is the standalone-form layout: a sign-up, a settings page, a dialog, anything with a Save button.</p>
    </div>
    <div class="fdx-third">
      <p class="fdx-label">2. NbField row (the default)</p>
      <NbField label="Display name" v-slot="{ id }"><NbTextInput :id="id" v-model="legal.name" size="xs" /></NbField>
      <NbField label="Region" v-slot="{ id }"><NbSelect :id="id" v-model="legal.region" size="xs" :options="regionOptions" /></NbField>
      <NbField label="Retries" v-slot="{ id }"><NbNumberInput :id="id" v-model="legal.retries" size="xs" :min="0" :max="9" /></NbField>
      <p class="fdx-note">Three controls of three different kinds, one spine. Every label sits in the same <code>--nb-field-label-width</code> column and every control shares one left edge and one right edge, because they share the token, not because anyone measured them.</p>
    </div>
    <div class="fdx-third">
      <p class="fdx-label">3. NbField stack</p>
      <NbField label="Release notes" orientation="stack" hint="Shown on the release page" v-slot="{ id }"><NbTextInput :id="id" v-model="legal.notes" size="xs" multiline :rows="4" /></NbField>
      <p class="fdx-note">Still an <code>NbField</code>, so it still belongs to the panel, but the label takes its own line and the control takes the full width. For the one text area in an otherwise row-based panel, not for the panel.</p>
    </div>
  </div>
</preview>

The fourth layout is the one five applications independently reinvented, and it
is why field height, label colour and helper spacing disagree across the fleet.

::: code-group

```vue [Wrong]
<!-- Five products shipped a variant of this. All five are subtly different. -->
<div class="field">
  <label for="email">Work email</label>
  <input id="email" v-model="email" type="email" class="input" />
  <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
</div>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.field-error {
  color: #e5484d;
  font-size: 12px;
}
</style>
```

```vue [Right]
<!-- The control owns the label, the message, the height, the focus ring and
     the dark theme. Nothing to keep in sync. -->
<NbTextInput
  id="field-email"
  v-model="email"
  label="Work email"
  type="email"
  :error="errors.email"
/>
```

:::

The wrong version loses the focus ring, the disabled and read-only treatments,
the message icon (so colour is the only carrier of meaning), the dark-theme
colours, and the `role="status"` live region that announces the error. It also
hardcodes `#e5484d` where `--nb-c-danger` exists, so the error text is the wrong
red in the dark theme.

That is a list of assertions until you put the two columns beside each other.
The left column below is the wrong markup above, rendered: the same `6px` gap,
the same `margin-bottom: 16px`, the same `#e5484d`. The right column is the same
three fields as library controls, at the same width.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">Wrong: div.field, as five products shipped it</p>
      <div class="fdx-handrolled">
        <div class="field"><label for="fdx-hr-name">Name</label><input id="fdx-hr-name" v-model="handRolled.name" class="input" /></div>
        <div class="field"><label for="fdx-hr-email">Work email</label><input id="fdx-hr-email" v-model="handRolled.email" type="email" class="input" /><span class="field-error">Enter a work email address</span></div>
        <div class="field"><label for="fdx-hr-team">Team</label><input id="fdx-hr-team" v-model="handRolled.team" class="input" disabled /></div>
      </div>
      <p class="fdx-note">Focus one of these, then focus one on the right. This column has no focus ring, no icon beside the error (so colour is the only carrier of meaning), no live region to announce it, a disabled field that is only slightly greyer, a label colour that is the browser's rather than <code>--nb-c-text-muted</code>, and a literal hex red that stays that hex with the <code>.dark</code> class on. The three rows are also three different heights, because the one with a message pushes the next field down by a value nothing else in the form knows about.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">Right: the control owns the field</p>
      <NbTextInput id="fdx-lib-name" v-model="handRolled.name" label="Name" />
      <NbTextInput id="fdx-lib-email" v-model="handRolled.email" label="Work email" type="email" error="Enter a work email address" />
      <NbTextInput id="fdx-lib-team" v-model="handRolled.team" label="Team" disabled />
      <p class="fdx-note">Same three fields, same values, no CSS on this page at all. One control height from <code>--nb-field-height-md</code>, one label-to-control gap from <code>--nb-field-label-gap</code>, one red from <code>--nb-c-danger</code>, an icon paired with that red, and a disabled state at <code>--nb-field-disabled-opacity</code>. The vertical rhythm comes from the container, so a field that gains a message does not shift the spacing rule for the fields under it.</p>
    </div>
  </div>
</preview>

Both columns are bound to the same three values, which is the point: this is not
a better-looking alternative to the left column, it is the same field with
nothing local to maintain.

::: danger Never hand-roll the field
If the layout you want is not one of the three above, you have found a gap in
the library. File it, do not fork it locally.
:::

## Rule 3: the label is declared once, in one place

`NbField` renders a `<label>`, and so does every field control with a `label`
prop. Setting both gives you the label twice, and the second one is not
associated with anything.

- **Control-level layout**: set `label` on the control. Do not wrap it in
  `NbField`.
- **`NbField` layout**: set `label` on `NbField`, and leave the control's
  `label` unset.

`NbField` generates the id and hands it to the default slot, so bind it. That is
the difference between a label that focuses the control when clicked and a label
that is decoration:

```vue
<NbField label="Name" v-slot="{ id }">
  <NbTextInput :id="id" v-model="name" size="xs" />
</NbField>
```

If you already own the id, pass it as `labelFor` instead. Fields dropped into
`NbField` without binding the id still look right, which is exactly why this is
easy to miss and worth checking in review.

Click both labels below. Only one of them puts the caret in the input.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">Wrong: the slot id is not bound</p>
      <NbField label="Name">
        <NbTextInput v-model="labelDemo.a" size="xs" />
      </NbField>
      <p class="fdx-note">It looks correct, which is the whole problem: nothing about the rendering says anything is missing. <code>NbField</code> put <code>for</code> on the id it generated, the control generated a different one for itself, and the <code>&lt;label&gt;</code> now points at an element that does not exist. Clicking it does nothing and the input has no accessible name.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">Right: the slot id is bound</p>
      <NbField label="Name" v-slot="{ id }">
        <NbTextInput :id="id" v-model="labelDemo.b" size="xs" />
      </NbField>
      <p class="fdx-note">Clicking the label focuses the input, and a screen reader says "Name" when focus arrives. The only difference between the two is <code>v-slot="{ id }"</code> and <code>:id="id"</code>.</p>
    </div>
  </div>
</preview>

Setting the label in both places is the other half of this rule, and unlike the
id it is visible the moment you render it:

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">Wrong: label on the wrapper and on the control</p>
      <NbField label="Work email" v-slot="{ id }">
        <NbTextInput :id="id" v-model="labelDemo.c" label="Work email" size="xs" />
      </NbField>
      <p class="fdx-note">Two <code>&lt;label&gt;</code> elements now point at one input, so its accessible name is the label said twice, and the row is twice as tall as every other row in the panel. In a ten-field inspector this reads as a rendering fault.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">Right: label on NbField only</p>
      <NbField label="Work email" v-slot="{ id }">
        <NbTextInput :id="id" v-model="labelDemo.c" size="xs" />
      </NbField>
      <p class="fdx-note">One label, in the layout's label column, at the row height every other field in the panel has.</p>
    </div>
  </div>
</preview>

Placeholders are not labels. `placeholder` disappears the moment the user types,
so a placeholder-only field is unlabelled for anyone who came back to it later,
and unlabelled for a screen reader. Use `placeholder` for the shape of the value
(`ABC-123`, `dd/mm/yyyy`), never for its name.

## Rule 4: know which controls can actually show an error

This is the shortest route to fixing the "zero out of fifty-eight" finding.
Not every control in the library carries messages, and pretending otherwise is
how validation silently goes missing.

| Control           | `label` | `required` asterisk | `error` / `warning` / `helper` | `readonly` |
| ----------------- | :-----: | :-----------------: | :----------------------------: | :--------: |
| `NbTextInput`     |   yes   |         yes         |     yes (see caveat below)     |    yes     |
| `NbNumberInput`   |   yes   |         yes         |              yes               |     no     |
| `NbSelect`        |   yes   |         yes         |              yes               |     no     |
| `NbDatePicker`    |   yes   |         yes         |              yes               |    yes     |
| `NbSlider`        |   yes   |         no          |              yes               |     no     |
| `NbRadio`         |   yes   |         no          |              yes               |    yes     |
| `NbCheckboxGroup` |   yes   |         no          |              yes               |     no     |
| `NbCheckbox`      |   yes   |         no          |               no               |     no     |
| `NbSwitch`        |   yes   |         no          |               no               |     no     |
| `NbFileUploader`  |   no    |         no          |         per-file only          |     no     |

Consequences you must design around:

- **A single checkbox cannot show its own error.** For "accept the terms", wrap
  it in an `NbCheckboxGroup` (which does carry `error`) or put the message in
  the form-level banner. Do not invent a red `<span>` under it.
- **`NbSwitch` cannot show an error, and its `name` prop is required.** A switch
  is a commit, not a value awaiting validation. If a switch can fail, it is a
  button pretending to be a switch.
- **`NbFileUploader` tracks status per file** (`idle` / `loading` / `success`
  with an optional `error` on the item), not one field-level message. Its
  failures belong next to the file that failed.

::: warning `NbTextInput` currently only renders `error`
`TextInput.vue` resolves its message with
`props.error ?? props.warning ?? props.helper ?? ''`, and `error` defaults to
`''`. Empty string is not nullish, so `??` never falls through: with no `error`
bound, `warning` and `helper` render nothing. `NbSelect`, `NbNumberInput` and
`NbRadio` use truthiness checks and behave as documented. Until that resolution
is fixed, bind `error` on a text input and put steady helper text in
`NbField`'s `hint` slot (or in the label), where it will actually appear.
:::

That is not something you should have to take on trust from a warning box. Both
controls below have `helper` bound and no `error`. One of them renders it.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">NbTextInput: helper bound, nothing shown</p>
      <NbTextInput id="fdx-helper-text" v-model="helperDemo.a" label="Subdomain" placeholder="acme" helper="Letters, numbers and hyphens only" />
      <p class="fdx-note">The prop is bound and the guidance is gone. <code>TextInput.vue</code> resolves its message with <code>??</code>, <code>error</code> defaults to <code>''</code>, and empty string is not nullish, so the chain stops on the first link every time.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">NbSelect: helper bound, helper shown</p>
      <NbSelect id="fdx-helper-select" v-model="helperDemo.b" label="Region" :options="regionOptions" helper="Data never leaves this region" />
      <p class="fdx-note">The same prop, on a control that tests truthiness in order (<code>error</code>, then <code>warning</code>, then <code>helper</code>), which is what the table above documents for all of them.</p>
    </div>
  </div>
</preview>

The mitigation, rendered: the same sentence in `NbField`'s `hint`, where it
appears and stays under the control.

<preview dir="col">
  <div class="fdx-stack fdx-stack--narrow">
    <NbField label="Subdomain" hint="Letters, numbers and hyphens only" v-slot="{ id }">
      <NbTextInput :id="id" v-model="helperDemo.a" size="xs" placeholder="acme" />
    </NbField>
  </div>
</preview>

## Rule 5: there must be a real `<form>` element

Seventy-two fields and no `<form>` is not a styling detail. Without a form
element you lose Enter-to-submit, the browser's autofill and password-manager
heuristics, `type="submit"` semantics, and the one DOM node assistive tech uses
to describe the group.

`NbForm` renders a real `<form>`. Attributes fall through to the element, so the
submit handler goes on the component:

```vue
<template>
  <NbForm title="Invite a teammate" @submit.prevent="submit">
    <template #message>
      They get an email with a link that expires in 7 days.
    </template>

    <NbTextInput
      id="field-email"
      v-model="values.email"
      label="Work email"
      type="email"
      required
      :error="errors.email"
      @blur="validateField('email')"
    />
    <NbSelect
      id="field-role"
      v-model="values.role"
      label="Role"
      :options="roles"
      required
      :error="errors.role"
    />

    <template #footer>
      <NbButton variant="secondary" type="button" @click="cancel">
        Cancel
      </NbButton>
      <NbButton variant="primary" type="submit" :loading="saving">
        Send invite
      </NbButton>
    </template>
  </NbForm>
</template>
```

Two details that are easy to get wrong:

- **`@submit.prevent`, always.** Without `.prevent` the browser navigates and
  your single-page application reloads itself.
- **Every button inside a form needs an explicit `type`.** A button with no type
  is a submit button. That is how a Cancel button ends up saving the record.

::: code-group

```vue [Wrong]
<!-- Shipped. Pressing this Cancel submitted the form, because a <button>
     with no type attribute is type="submit". -->
<template #footer>
  <NbButton variant="secondary" @click="close">Cancel</NbButton>
  <NbButton variant="primary" type="submit">Save changes</NbButton>
</template>
```

```vue [Right]
<template #footer>
  <NbButton variant="secondary" type="button" @click="close">Cancel</NbButton>
  <NbButton variant="primary" type="submit" :loading="saving">
    Save changes
  </NbButton>
</template>
```

:::

::: info `NbButton` already defaults to `type="button"`
The defect above is real and shipped, but it reaches a form through a raw
`<button>`, not through `NbButton`: `Button.vue` defaults `type` to
`EButtonType.Button`, so an `NbButton` with no `type` renders
`type="button"` and does not submit. The rule stands as written anyway, for two
reasons. A raw `<button>`, and any wrapper that forwards `type` without a
default, does submit. And an explicit `type` on every button in a form is the
only version of this that is checkable by reading the template, which is what
the checklist at the foot of this page asks a reviewer to do.
:::

The seventy-two-field finding at the top of this page is invisible in a
screenshot and obvious in one keypress. Put the caret in either field below and
press Enter.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">Wrong: fields in a div, with a click handler</p>
      <div class="fdx-loose">
        <NbTextInput id="fdx-loose-email" v-model="enterDemo.looseEmail" label="Work email" type="email" size="sm" placeholder="you@acme.com" />
        <NbButton size="sm" variant="primary" @click="looseSubmits++">Send invite</NbButton>
      </div>
      <p class="fdx-note">Enter does nothing. Submits so far: <strong>{{ looseSubmits }}</strong>. The button still works, so this passes a click-through review and fails every keyboard user. There is also no form element for the browser to offer to autofill, and nothing for assistive technology to describe as a group.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">Right: NbForm, which is a real &lt;form&gt;</p>
      <NbForm @submit.prevent="formSubmits++">
        <NbTextInput id="fdx-form-email" v-model="enterDemo.formEmail" label="Work email" type="email" size="sm" placeholder="you@acme.com" />
        <template #footer><NbButton size="sm" variant="primary" type="submit">Send invite</NbButton></template>
      </NbForm>
      <p class="fdx-note">Enter submits. Submits so far: <strong>{{ formSubmits }}</strong>. Nothing was added to make that happen: the element is a <code>&lt;form&gt;</code>, the commit button is <code>type="submit"</code>, and implicit submission is the browser's, not ours.</p>
    </div>
  </div>
</preview>

### Forms inside a modal

`NbModal`'s footer is a sibling of its body, so a submit button in the footer is
outside the `<form>` in the body. Give the form an `id` and point the button at
it with the native `form` attribute (it falls through `NbButton` to the
`<button>`):

```vue
<NbModal
  :open="open"
  title="Rename environment"
  size="sm"
  @close="requestClose"
>
  <NbForm id="rename-env" @submit.prevent="save">
    <NbTextInput id="field-name" v-model="name" label="Name" required :error="errors.name" />
  </NbForm>
  <template #footer>
    <NbButton variant="secondary" type="button" @click="requestClose">Cancel</NbButton>
    <NbButton variant="primary" type="submit" form="rename-env" :loading="saving">Rename</NbButton>
  </template>
</NbModal>
```

Do not add padding or an `NbPanel` inside `#footer`. `NbModal` already wraps the
footer in a right-aligned grid, and stacking another container on top of it is
the single most-copied markup defect in the fleet.

`NbModal` emits `close` from the close button, from Escape, and from the overlay
(unless `closeOnOverlay` is `false`). All three land on one handler, which is
what makes the dirty-form guard in
[Rule 17](#rule-17-a-dirty-form-is-never-lost-silently) a single function.

## Rule 6: every field that can be invalid carries an id you chose

Focus management and error association both need a handle on the control, and
neither works with a generated id you cannot predict. Adopt one convention and
use it everywhere: **`id="field-<name>"`, where `<name>` is the key in your
values object.**

```vue
<NbTextInput id="field-email" v-model="values.email" label="Work email" />
<NbSelect id="field-role" v-model="values.role" label="Role" :options="roles" />
```

`NbTextInput`, `NbNumberInput`, `NbSelect` and `NbDatePicker` all take an `id`
prop and put it on the interactive element itself (the `<input>`, or the
combobox `<button>` in `NbSelect`'s case), not on a wrapper. So
`document.getElementById('field-role')?.focus()` focuses the select trigger, and
`<label for>` resolves.

Omit the id and each control falls back to a `useId()` value such as
`nb-input-v-0-3`. It is stable within a render, unpredictable in your code, and
it is why the focus-the-first-invalid-field helper in
[Rule 11](#rule-11-field-errors-are-the-truth-the-form-level-summary-is-a-pointer)
is a no-op in half the fleet.

## Rule 7: field sizing is set by the surface, not by the field

`size` is a closed set. Pick it once per surface and apply it to every control
in that surface. Mixed sizes in one column read as a rendering bug.

| Surface                                    | `size` | Height |
| ------------------------------------------ | ------ | -----: |
| Inspectors, toolbars, dense property grids | `xs`   |   28px |
| Compact forms, table filter rows, popovers | `sm`   |   32px |
| Standalone forms (the default)             | `md`   |   40px |
| Touch-first or hero forms                  | `lg`   |   48px |

Width is a separate decision, and it is content-driven. A field's width is a
hint about the length of the answer, so a two-letter country code in a
full-bleed input is a lie. Cap the form's column (a single column around 480px
reads comfortably at `md`) and let short values take narrower cells inside it.
Never stretch a form column across a wide viewport: a 1200px-wide input is
unreadable and unfillable.

Vertical rhythm comes from one `gap` on the container, never from per-field
margins. `NbForm` already does this: its body is a column with `gap="sm"` (8px)
and the form itself stacks header, body and footer with `gap="md"` (16px). If
you are adding `margin-bottom` to a field, you are fighting the container.

## Rule 8: mark required, not optional, and never both

The fleet marks nothing, or marks both, or marks "optional" on one form and
"required" on the next.

**Default: mark the required fields.** `required` on `NbTextInput`,
`NbNumberInput`, `NbSelect` and `NbDatePicker` renders the asterisk through
`NbLabel` (in `--nb-c-danger`, `aria-hidden`, so it is decoration for the eye
only) and sets the native constraint or `aria-required` on the control.

**Invert only when most of the form is required.** On a form where nine of ten
fields are mandatory, marking nine fields is noise. Then mark the one exception
with the word "optional" in the label text and mark nothing else:

```vue
<NbTextInput id="field-team" v-model="values.team" label="Team (optional)" />
```

Three hard rules:

- **One convention per form.** Never asterisks and "(optional)" in the same
  form. The reader has to learn which one carries meaning, and they will guess
  wrong.
- **The asterisk is never the only signal.** It is `aria-hidden` by design, so
  the accessible name comes from `required` / `aria-required` on the control.
  For controls with no asterisk support (`NbCheckbox`, `NbSwitch`, `NbRadio`,
  `NbCheckboxGroup`), put the word in the label text.
- **State the convention once, at the top of the form.** An asterisk is a
  symbol the user has to already know. One line in `#message` ("Required fields
  are marked with an asterisk", or "All fields are required unless marked
  optional") costs nothing and removes the guess. This is the one place
  `#message` earns its keep.

The two legal conventions and the collision, at the same three fields. The third
panel is what happens when two people edit one form and each follows a different
one of the first two.

<preview dir="col">
  <div class="fdx-trio">
    <div class="fdx-third fdx-third--right">
      <p class="fdx-label">Default: mark what is required</p>
      <NbTextInput id="fdx-mark-a-email" v-model="marking.email" label="Work email" type="email" size="sm" required />
      <NbSelect id="fdx-mark-a-role" v-model="marking.role" label="Role" size="sm" :options="roleOptions" required />
      <NbTextInput id="fdx-mark-a-team" v-model="marking.team" label="Team" size="sm" />
      <p class="fdx-note">Two asterisks, one unmarked field. The asterisk comes from <code>NbLabel</code> in <code>--nb-c-danger</code> and is <code>aria-hidden</code>, so it is decoration for the eye. What makes it real is the same <code>required</code> prop setting the native constraint on the input and <code>aria-required</code> on the select.</p>
    </div>
    <div class="fdx-third fdx-third--right">
      <p class="fdx-label">Inverted: mark the one exception</p>
      <NbTextInput id="fdx-mark-b-email" v-model="marking.email" label="Work email" type="email" size="sm" />
      <NbSelect id="fdx-mark-b-role" v-model="marking.role" label="Role" size="sm" :options="roleOptions" />
      <NbTextInput id="fdx-mark-b-team" v-model="marking.team" label="Team (optional)" size="sm" />
      <p class="fdx-note">When nine of ten fields are mandatory, nine asterisks are noise, so the word goes in the label text of the one exception and nothing else is marked. The convention has to be stated in <code>#message</code> for this panel to be readable at all, which is the point of the rule above it.</p>
    </div>
    <div class="fdx-third fdx-third--wrong">
      <p class="fdx-label">Wrong: both, in one form</p>
      <NbTextInput id="fdx-mark-c-email" v-model="marking.email" label="Work email" type="email" size="sm" required />
      <NbSelect id="fdx-mark-c-role" v-model="marking.role" label="Role" size="sm" :options="roleOptions" required />
      <NbTextInput id="fdx-mark-c-team" v-model="marking.team" label="Team (optional)" size="sm" />
      <p class="fdx-note">Now the reader has to work out which mark carries the meaning. In a longer form, what does an unmarked field between these two mean: required, or optional? Both symbols are on screen, so neither one answers it and the user guesses.</p>
    </div>
  </div>
</preview>

## Rule 9: how form text is written

The library styles the string. It cannot write it, and the fleet shows that
unwritten strings drift further than unwritten styles.
[Writing style](/content/writing-style) is the general ruling; these are the
form-specific ones.

| String                | Rule                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Label**             | Sentence case. One to three words. A noun or a noun phrase, never a question or an instruction.   |
| **Label punctuation** | No trailing colon, ever. No trailing period.                                                      |
| **Helper text**       | One line. What the user needs before they answer, not after they get it wrong.                    |
| **Placeholder**       | The shape of the value, not its name. No period.                                                  |
| **Error**             | Says what to do. Sentence case, one sentence, no exclamation mark, no "Error", no exception text. |
| **Commit button**     | Verb plus noun. See [Rule 18](#rule-18-name-the-action-not-the-gesture).                          |

The reasons, since each of these has one:

- **One to three words** is not an aesthetic preference. `NbField`'s label
  column is `--nb-field-label-width`, 8rem by default, and the label is styled
  `overflow: hidden; text-overflow: ellipsis`. A four-word label is silently
  truncated to "Preferred contact m..." and the full text survives only in the
  `title` attribute, which a touch user never sees. Shorten the label and put
  the qualifier in the hint.
- **No trailing colon**, because the label is above or beside the control, not
  introducing it in running text. A colon after every label is eight extra
  glyphs of noise per screen, and the fleet uses them inconsistently, which
  makes them look like they mean something.
- **Helper text is guidance, not validation.** "We use this for billing
  receipts" is helper text. "Enter a valid email" is an error and belongs in
  `error`, where it turns the field red and announces itself. Note the caveat in
  Rule 4: on `NbTextInput` the `helper` prop does not currently render, so put
  steady guidance in `NbField`'s `hint`.
- **Placeholders are not instructions.** `dd/mm/yyyy` and `ACME-1024` are
  placeholders. "Enter your first name" is a label that lost its nerve, and it
  vanishes the moment the user types.
- **Error text names the fix, not the failure.** "Enter a work email address"
  beats "Invalid input". "Choose a role" beats "Required field". The user
  already knows something is wrong: the red told them. What they do not know is
  what you want.

One more, which is only a text rule by accident: **never put the only copy of
something in a tooltip.** A tooltip on a disabled control cannot be reached at
all, and a tooltip on a required field cannot be reached on touch. If the user
needs it to answer, it is helper text.

## Rule 10: validate on submit, then on correction

Validating on every keystroke tells a user their email is invalid while they are
still typing the `@`. It is the most common way a form feels hostile.

The rule, in order:

1. **Never validate a field the user has not finished with.** No error before
   first blur, ever.
2. **On blur, validate only what blur can tell you**: a format that is now
   unambiguously wrong (a malformed email, a date in the past), or a check that
   costs a request (is this subdomain taken). Do not blur-validate "required" on
   a field the user simply tabbed through on their way down the form.
3. **On submit, validate everything.** This is the moment the user asked for a
   verdict.
4. **After a failed submit, switch that field to validate on input**, so the
   error clears as soon as it is fixed. A message that stays red after the user
   corrects it teaches them to ignore messages.

Type an email address into both of these, one character at a time, then leave
the field.

<preview dir="col">
  <div class="fdx-pair">
    <div class="fdx-half fdx-half--wrong">
      <p class="fdx-label">Wrong: validates on every keystroke</p>
      <NbTextInput id="fdx-eager" v-model="eager.value" label="Work email" type="email" placeholder="you@acme.com" :error="eagerError" />
      <p class="fdx-note">Red from the first character, and red for the whole of <code>jose@nubis</code>, because an address in progress is an address that is not valid yet. The user is being corrected while they are still answering, which is the most common way a form feels hostile.</p>
    </div>
    <div class="fdx-half fdx-half--right">
      <p class="fdx-label">Right: on blur, then on input</p>
      <NbTextInput id="fdx-polite" v-model="polite.value" label="Work email" type="email" placeholder="you@acme.com" :error="polite.error" @blur="politeBlur" @input="politeInput" />
      <p class="fdx-note">Silent while you type. It speaks when you leave the field, and only if you left something in it: tab straight through without typing and it stays quiet, because "required" is a verdict for submit time, not for a field you passed over. Once it has spoken, it clears as soon as the value is right.</p>
    </div>
  </div>
</preview>

The right-hand field's `@blur` and `@input` really are on the `<input>`:
`TextInput.vue` declares `inheritAttrs: false` and binds `$attrs` on the native
element, which is the only reason a listener written at the call site fires at
all.

This is the whole state a form of this shape needs. It is complete: copy it and
it runs.

```ts
import { reactive, ref } from 'vue'

type TRule = (value: string) => string | undefined

const values = reactive({ email: '', role: '' })
const errors = reactive<Record<string, string>>({ email: '', role: '' })

// Insertion order is the visual order of the fields, which is the order the
// summary lists them in and the order focusFirstInvalid() walks.
const rules: Record<string, TRule> = {
  email: (v) =>
    /^[^@\s]+@[^@\s]+$/.test(v) ? undefined : 'Enter a work email address',
  role: (v) => (v ? undefined : 'Choose a role'),
}

const touched = new Set<string>()
const submitted = ref(false)

function validateField(name: string) {
  touched.add(name)
  // Only speak once the user has had a turn with this field, or once they
  // have asked for a verdict by submitting.
  if (!submitted.value && !touched.has(name)) return
  errors[name] = rules[name](values[name as keyof typeof values]) ?? ''
}

function validateAll(): boolean {
  for (const name of Object.keys(rules)) {
    errors[name] = rules[name](values[name as keyof typeof values]) ?? ''
  }
  return !Object.values(errors).some(Boolean)
}
```

Where the listener goes depends on the control, and this is easy to get wrong:

- **`NbTextInput`**: `@blur="validateField('email')"`. It declares
  `inheritAttrs: false` and binds `$attrs` on the native element, so your
  listener really is on the `<input>`.
- **`NbSelect` and `NbNumberInput`**: `@change="validateField('role')"`. Both
  emit a `change` event with the new value. A `@blur` on either lands on the
  wrapper `<div>`, and `blur` does not bubble, so it never fires. A select has
  no half-finished state anyway: the moment it changes, it is answerable.
- **After a failed submit**, add `@input` (or `@update:modelValue`) so the error
  clears as the user fixes it. `validateField` already gates itself on
  `submitted`, so the same function serves both phases.

The message goes **under the control it belongs to**, rendered by the control's
own `error` prop. Not in a tooltip (which requires a hover the user has no
reason to perform), not in a toast (which leaves the screen while the broken
field stays), not in a paragraph at the top on its own (see the next rule).

## Rule 11: field errors are the truth, the form-level summary is a pointer

Both exist, and they are not alternatives.

- **Field-level error**: the `error` prop on the control. Every invalid field
  has one, always. This is where the fix happens.
- **Form-level summary**: an `NbBanner` at the top of the form body. It exists
  only when the failure is not visible: a long form where the broken field is
  scrolled off screen, or a submit that failed for a reason no single field owns.

The relationship is a strict one: **every entry in the summary must correspond
to a field error that is also rendered on its field.** A summary that lists an
error the field does not show sends the user hunting.

The banner is the **first child of the default slot**, not of `#message`.

::: code-group

```vue [Wrong]
<!-- #message renders <p class="nb-form--message">. NbBanner's root is a <div>.
     The parser closes the paragraph before the div, so the server markup and
     the client markup disagree and hydration breaks. -->
<NbForm title="Company details" @submit.prevent="submit">
  <template v-if="summary" #message>
    <NbBanner status="error" variant="inline" :title="summary" />
  </template>
</NbForm>
```

```vue [Right]
<!-- The body is a <div>, so a banner is legal there, and it sits above the
     fields where the user is already looking. #message keeps prose only. -->
<NbForm title="Company details" @submit.prevent="submit">
  <template #message>Required fields are marked with an asterisk.</template>

  <NbBanner
    v-if="summary"
    ref="summaryRef"
    status="error"
    variant="inline"
    :title="summary"
  />

  <!-- fields, each with its own :error -->
</NbForm>
```

:::

`NbBanner` with `variant="inline"` reports the outcome of something the user
did, and it renders `role="alert"` with `aria-live="assertive"` for
`status="error"`, so it is announced when it appears. `variant="callout"` is a
standing fact about the page (a trial expiring, an environment that is not
production) and cannot be dismissed. A failed submit is always `inline`.

After a failed submit, move focus to the first invalid control. With the id
convention from Rule 6 this is four lines:

```ts
function focusFirstInvalid() {
  const first = Object.keys(rules).find((name) => errors[name])
  if (!first) return
  const el = document.getElementById(`field-${first}`)
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  el?.focus()
}

function submit() {
  submitted.value = true
  if (!validateAll()) return focusFirstInvalid()
  save()
}
```

`scrollIntoView` matters on any form taller than the viewport: focusing an
off-screen field moves the caret somewhere the user cannot see, and a sighted
keyboard user then types into nothing. If you honour reduced motion elsewhere,
use `useReducedMotion()` to drop `behavior: 'smooth'` here too.

Everything on this page so far, in one form. Press **Send invite** with it
empty, then fix one field at a time, then submit a form that passes and watch
the server refuse it.

<preview dir="col">
  <div class="fdx-formframe">
    <NbForm title="Invite a teammate" novalidate @submit.prevent="submitInvite">
      <template #message>Required fields are marked with an asterisk.</template>
      <NbBanner v-if="inviteBanner" status="error" variant="inline" :title="inviteBanner" />
      <NbTextInput id="fdx-invite-email" v-model="invite.values.email" label="Work email" type="email" placeholder="you@acme.com" required :error="invite.errors.email" :aria-invalid="invite.errors.email ? true : undefined" @blur="touchInvite('email')" @input="reviseInvite('email')" />
      <NbSelect id="fdx-invite-role" v-model="invite.values.role" label="Role" :options="roleOptions" required :error="invite.errors.role" @change="commitInvite('role')" />
      <template #footer>
        <NbButton variant="secondary" type="button" @click="resetInvite">Cancel</NbButton>
        <NbButton variant="primary" type="submit" :loading="invite.saving">Send invite</NbButton>
      </template>
    </NbForm>
  </div>
</preview>

Read that demo against the rules it is made of:

- The banner is the **first child of the default slot**, not of `#message`, and
  `#message` carries the one sentence that states the marking convention
  (Rule 8). Swap them and hydration breaks.
- Every entry the summary counts has a field error rendered on its own field,
  which is the strict relationship this rule sets. Fix one field and the count
  in the banner follows.
- Focus moves to the first invalid control on a failed submit, by
  `getElementById`, which only works because both controls carry an id this page
  chose (Rule 6). The demo prefixes its ids `fdx-invite-` rather than `field-`
  only so they cannot collide with the other demos on this page.
- The commit button is never disabled to express invalidity. It is disabled by
  `:loading` while the request is in flight, and by nothing else (Rule 14).
- The server refusal keeps every value the user typed, sets the field error the
  failure maps to, and does not appear in a toast (Rule 12).
- Exit is left of commit, exactly one button is `primary`, and both carry an
  explicit `type` (Rule 5, Rule 18).

::: warning `required` needs `novalidate`, or your validation never runs
That form carries `novalidate`, and the snippets above do not. `required` on
`NbTextInput` and `NbNumberInput` sets the **native** `required` attribute, and
`NbForm` renders a plain `<form>` with no `novalidate`, so the browser's own
constraint validation intercepts the submit first: it shows its own bubble in
its own colours, in the browser's UI language rather than the application's, and
your `@submit` handler is never called. No `validateAll()`, no summary banner,
no focus move. Put `novalidate` on `NbForm` (attributes fall through to the
`<form>`) whenever you validate in JavaScript, which by Rule 10 is always.
:::

## Rule 12: a server failure with no field goes in the form, not in a toast

"Payment declined", "You do not have permission to change this", "Environment is
locked by a running release": these belong to the submit, not to a field.

**Render them as an `NbBanner` with `status="error"` and `variant="inline"`, at
the top of the form body, and keep every value the user typed.**

Why not a toast: a toast is timed and dismissible, and it is delivered somewhere
other than where the work is. It is the right tool for "Draft saved" after a
successful action, and the wrong tool for a failure the user must respond to.
The audit found a fleet where success messages accumulate forever in one
hand-built toast host and failures vanish after four seconds. That is exactly
backwards.

Rules for the failure banner:

- **The form stays filled.** Never clear fields on a failed submit. Re-typing a
  form because the server was busy is the worst thing a form can do.
- **The submit button returns to its resting state**, so a retry is possible.
  While the request is in flight it carries `:loading` (which also disables it),
  and the moment the promise settles that stops.
- **Move focus to the banner** after render, so the user is standing next to the
  explanation. The banner's own `role="alert"` announces it; focus is what puts
  a keyboard user's next Tab inside the form rather than back at the top of the
  page.
- **If the failure does map to a field** (the server rejected the email as
  already registered), set the field error too, and keep the banner only if the
  field is off screen.
- **Never render the raw exception.** `TypeError: Cannot read properties of
undefined` is not a message to a user. Map it, and log the original.

For a slow submit, `NbInlineLoading` beside the button gives a live-region
status (`active` to `finished` to `error`, with its own labels) so the wait is
announced, not just spun. Four of the twelve applications show nothing at all
during a save.

## Rule 13: a form that is still loading is not an empty form

An edit form usually has to fetch the record it edits. Four states exist and
three of them get skipped.

| State       | What renders                                                                   |
| ----------- | ------------------------------------------------------------------------------ |
| **Loading** | `NbSkeleton` placeholders in the shape of the fields, inside the form's frame  |
| **Failed**  | An `NbBanner` with `status="error"` and a Retry action, no fields              |
| **Ready**   | The form, populated, with focus placed as described below                      |
| **Empty**   | Only for a form over a list (no members yet): `NbEmptyState`, not a blank body |

**Never render an editable empty form while the record is loading.** The user
starts typing, the response lands, `v-model` is overwritten, and their input
disappears. This is the most expensive bug on this page because the user cannot
tell it happened, and it is what "loading and empty look the same" produces: one
audited application renders both states through a single `.empty-text`, so a
failed fetch reads as "no contacts yet".

```vue
<NbForm title="Member profile" @submit.prevent="submit">
  <template v-if="loading">
    <NbSkeleton variant="block" height="40" label="Loading profile" />
    <NbSkeleton variant="block" height="40" />
    <NbSkeleton variant="block" height="40" />
  </template>
  <template v-else>
    <!-- fields -->
  </template>
</NbForm>
```

Set `label` on exactly one skeleton in the region. Every skeleton with a label
announces itself, and a form of eight placeholders announces itself eight times.

**Initial focus** is a decision, not a default:

- **Modal or panel form: focus the first editable control on open.** The user
  opened it to type. `NbTextInput` and `NbNumberInput` expose `focus()` through
  a template ref; anything else takes the id from Rule 6. Do this after the
  record has loaded, otherwise focus lands on a skeleton.
- **Page form: do not move focus.** Stealing focus on page load skips the
  heading and the navigation, so a screen reader user never hears where they
  are, and a browser that restored a scroll position jumps back to the top.
- **Never autofocus a field that is not the first one.** Focus into the middle
  of a form hides the fields above it from anyone tabbing forward.

## Rule 14: disabled hides interaction, read-only hides editing, and neither hides truth

Three different states get flattened into `disabled` across the fleet.

| State            | Use when                                                                  | How                                                      |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Read-only**    | The value matters and is not editable here (a plan tier, a generated key) | `readonly` on `NbTextInput` / `NbDatePicker` / `NbRadio` |
| **Disabled**     | Editable in principle, blocked right now by something on this screen      | `disabled`, plus a visible reason nearby                 |
| **Not rendered** | Not applicable to this user or this record at all                         | Leave it out                                             |

See [Disabled and read-only](/patterns/disabled-and-read-only) for the full
ruling. In a form, specifically:

- **Read-only, not disabled, for values the user must be able to read and copy.**
  Disabled controls are dimmed to `--nb-field-disabled-opacity` (0.45) and are
  skipped by the keyboard. Dimming an API key the user came to copy is
  user-hostile.
- **A disabled control must have a visible reason.** Disabled with no
  explanation is a dead end, and the explanation cannot live in a tooltip on a
  control that cannot be focused.
- **`NbSelect`, `NbCheckbox`, `NbSwitch` and `NbCheckboxGroup` have no
  `readonly`.** For a read-only rendering of those values, do not render a
  disabled control: render the value as text (`NbDefinitionList` is built for
  exactly this) and offer an Edit action.

**Do not disable the submit button to express "the form is invalid".** A
disabled Save gives the user nothing to press and nothing to learn: it does not
say which field is wrong, it cannot be focused, so it cannot carry a tooltip
either, and on a long form it is off screen when the invalid field is on screen.

::: code-group

```vue [Wrong]
<!-- The user cannot find out what is missing. There is nothing to press and
     nothing to read. Shipped in two products. -->
<NbButton variant="primary" type="submit" :disabled="!isValid">
  Save changes
</NbButton>
```

```vue [Right]
<!-- Always pressable, except while the request is in flight. The click is
     what produces the errors, the focus move and the summary. -->
<NbButton variant="primary" type="submit" :loading="saving">
  Save changes
</NbButton>
```

:::

`:loading` on `NbButton` already implies disabled, so a separate `:disabled`
binding for the in-flight case is redundant. That is the only legitimate reason
to disable a submit button.

## Rule 15: long forms are sectioned, not accordioned

Past roughly eight fields a form needs structure. In order of preference:

1. **One column, with section headings.** A heading plus a group of related
   fields, in the order the user thinks about them (identity, then contact, then
   billing). This handles almost every long form.
2. **`NbShellPanel` sections** when the surface is a panel-stack already (a
   settings sidebar, an inspector). Each section collapses independently and
   dims when collapsed.
3. **`NbStepper` / multi-step** only when the steps are genuinely sequential and
   later ones depend on earlier answers, and each step can be saved. A stepper
   over a form that could have been one page is three extra clicks and a state
   machine you now maintain. The fleet has two applications, three stepper
   implementations, and two of those disagree inside one product.

Never put a **required** field inside collapsed content. A user cannot fix an
error they cannot see, and submit-time validation will point at a hidden field.
If a section can contain errors, expand it when it does.

Keep it one column. Two-column forms make the reading order ambiguous (across or
down?) and break to one column at narrow widths anyway. The exception is a pair
of fields that are one value (city and postcode, start and end date), which read
correctly side by side because they are a single answer.

## Rule 16: one save model per surface, chosen deliberately

Three models exist in the fleet inside a single application. That is the finding
that matters most, because it means a user cannot learn the product's answer to
"is my change kept?".

| Model                         | The promise                                        | Use it when                                                                     |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Explicit submit** (default) | Nothing is saved until you press the button        | Anything creating a record, anything consequential, anything validated as a set |
| **Autosave on commit**        | Every field is saved when you leave it             | Document-like editing of an existing record, one field at a time                |
| **Modal submit**              | The dialog is the transaction; closing it discards | A short, self-contained edit on top of a list or detail view                    |

**Explicit submit is the default. Choose otherwise and be able to say why.**

If you choose autosave:

- **Save on commit, not on keystroke.** Blur, Enter, or a select's change. A
  debounce on input is an autosave that fires mid-word and can race the user's
  next character.
- **Status must be visible and per-field or per-form, not both.**
  `NbInlineLoading` beside the section header (`active` "Saving",
  `finished` "Saved") is the cheapest honest signal. Silent autosave is
  indistinguishable from a form that does nothing.
- **There is no Save button.** A Save button on an autosaving form asks the user
  to press something that changes nothing, which teaches them that the button is
  a lie.
- **Failures are loud.** An autosave that fails silently loses work. Surface the
  failure on the field that failed, keep the user's value in the control, and
  keep it visible until it is resolved or retried.

If you choose modal submit, the dialog must be dismissible without saving, and
that is the promise: closing discards. If a modal autosaves, its Cancel button
is a lie and its close button is worse.

Mixing models on one surface is the failure. If a page has a Save button, the
field in its corner must not autosave.

## Rule 17: a dirty form is never lost silently

This page opens by saying a form must never be ambiguous about whether the
user's work is safe. That obligation does not end at the submit button. A form
with unsaved input has three exits, and all three need an answer.

**Track dirtiness by comparison, not by events.** An `@input` listener that sets
`dirty = true` reports a form as dirty after the user types a character and
deletes it, and then interrupts them for nothing. Snapshot the loaded record and
compare:

```ts
import { computed, ref } from 'vue'

const pristine = ref('') // JSON of the record as loaded
const isDirty = computed(() => JSON.stringify(values) !== pristine.value)

function load(record: typeof values) {
  Object.assign(values, record)
  pristine.value = JSON.stringify(values)
}

function afterSave(record: typeof values) {
  // The saved state is the new pristine state, so leaving is now free.
  Object.assign(values, record)
  pristine.value = JSON.stringify(values)
}
```

The three exits:

- **Navigating within the application.** Guard the route and ask, using
  `useConfirm` so the question looks and behaves like every other question in
  the product.

  ```ts
  import { onBeforeRouteLeave } from 'vue-router'
  import { useConfirm } from '@nubisco/ui'

  const confirm = useConfirm()

  onBeforeRouteLeave(async () => {
    if (!isDirty.value) return true
    return confirm({
      title: 'Discard changes',
      message: 'Your edits to this profile have not been saved.',
      confirmLabel: 'Discard changes',
      cancelLabel: 'Keep editing',
    })
  })
  ```

- **Closing the tab or reloading.** Only the native `beforeunload` can do this,
  and it is the one place `window`-level browser UI is correct, because nothing
  of yours can render in time. Register it only while the form is dirty and
  remove it on unmount, otherwise every route in the product asks the question.

  ```ts
  import { watch, onBeforeUnmount } from 'vue'

  function warn(e: BeforeUnloadEvent) {
    e.preventDefault()
  }

  watch(isDirty, (dirty) => {
    if (dirty) window.addEventListener('beforeunload', warn)
    else window.removeEventListener('beforeunload', warn)
  })
  onBeforeUnmount(() => window.removeEventListener('beforeunload', warn))
  ```

- **Closing a modal.** Rule 16 says a modal's promise is that closing discards.
  That promise is honest only if the user is told they are discarding something.
  `NbModal` emits `close` from its close button, from Escape and from the
  overlay, so one handler covers all three. Turn the overlay off while dirty, so
  a stray click outside cannot throw work away:

  ```vue
  <NbModal
    :open="open"
    title="Edit member"
    :close-on-overlay="!isDirty"
    @close="requestClose"
  >
  ```

  ```ts
  async function requestClose() {
    if (!isDirty.value) return close()
    if (
      await confirm({
        title: 'Discard changes',
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
      })
    )
      close()
  }
  ```

Three things this rule does not license:

- **Do not guard a form that autosaves.** There is nothing to lose, and a
  confirmation that appears when nothing is at stake trains the user to dismiss
  the one that matters.
- **Do not guard a form the user never touched.** `isDirty` is the whole point.
- **Do not use `window.confirm` for the in-app cases.** See Rule 19.

## Rule 18: name the action, not the gesture

Across twelve applications: 25 "Cancel", 6 "Done", 5 "Delete", 4 "Close",
3 "Create", 3 "Back", 2 "Dismiss", 1 "Save", 1 "Apply". Save, Done, Apply and
Create are used interchangeably for commit; Close, Cancel, Dismiss and Back
interchangeably for exit. There is no rule anyone could have followed.

[Action labels](/content/action-labels) is the lookup table. For a form footer:

- **The commit button names what it does to the object**: "Save changes",
  "Create project", "Send invite", "Delete environment". Not "OK", not "Submit",
  not "Done". A verb plus the noun survives being read out of context, which is
  what a screen reader and a hurried user both do.
- **The exit is "Cancel"** on anything with unsaved input, because it means "undo
  my intent to do this". "Close" is for a surface with nothing pending (a
  detail sheet, a viewer). "Dismiss" is for a notification. "Back" is for a step.
- **Order: exit on the left, commit on the right**, and let `NbForm`'s footer or
  `NbModal`'s footer do the alignment. Never top-align a form's buttons, and
  never centre them.
- **Emphasis is one per footer.** One `variant="primary"`, everything else
  `secondary`. A destructive commit is `variant="danger"`, never primary. The
  modal docs taught the opposite for a while and one application copied it
  verbatim, primary-styled Delete and all.

## Rule 19: destructive actions inside forms go through `useConfirm`

A form that can delete the thing it is editing (Delete account, Remove member,
Revoke key) must confirm. Do not use `window.confirm`: it is a documented no-op
inside a Tauri webview and cannot be driven by a gamepad, and two applications
hit that wall independently.

```ts
import { useConfirm } from '@nubisco/ui'

const confirm = useConfirm()

async function remove() {
  const ok = await confirm({
    title: 'Delete environment',
    subject: env.name,
    subjectLabel: 'Environment',
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
    typeToConfirm: env.name,
    onConfirm: () => api.deleteEnvironment(env.id),
  })
  if (ok) router.push('/environments')
}
```

`onConfirm` is where the request goes, not after the `await`: the dialog locks
itself while the promise is pending, so a second click cannot fire a second
DELETE, and a rejection keeps the dialog open with the failure shown.

The destructive control sits away from the commit button, not beside it. A
"Delete account" button next to "Save changes" is one mis-click from an
unrecoverable action.

## Accessibility: what the library does, and what is yours

Only a third of the component pages carry an accessibility section, so the fleet
cannot tell whether silence means handled or your problem. For forms,
explicitly.

**The library handles:**

- Label and control association, when you bind `NbField`'s slot `id` or set the
  control's `label` (which sets `for` on `NbLabel`).
- `aria-required` on `NbSelect` and the native `required` attribute on
  `NbTextInput`, `NbNumberInput` and `NbDatePicker`.
- Message announcement: `NbMessage` renders with `role="status"` and
  `aria-live="assertive"` for `error`, `polite` otherwise, so a message that
  appears is announced without stealing focus.
- `aria-invalid` and `aria-describedby` on `NbDatePicker`, which is the only
  control that wires its message to its input today.
- `role="group"` and a group label on `NbCheckboxGroup`.
- Native radio grouping via `NbRadio`'s required `name` prop.
- `role="alert"` with `aria-live="assertive"` on `NbBanner` when
  `status="error"`.

**Yours:**

- **The id, from Rule 6.** Everything below depends on it.

- **`aria-invalid`, and only `NbTextInput` can take it today.** `TextInput.vue`
  declares `inheritAttrs: false` and binds `v-bind="$attrs"` on the native
  element, so an attribute you pass lands on the `<input>`:

  ```vue
  <NbTextInput
    id="field-email"
    v-model="values.email"
    label="Work email"
    :error="errors.email"
    :aria-invalid="errors.email ? true : undefined"
  />
  ```

  `NbNumberInput` and `NbSelect` do **not** do this. Neither sets
  `inheritAttrs: false`, so an `aria-invalid` you pass lands on the wrapper
  `<div>`, where it means nothing and is not an error you will ever see. Do not
  write it there and assume it worked. This is a library gap: the controls
  should derive `aria-invalid` from `error` themselves.

- **`aria-describedby` is missing on text, number and select fields, and you
  cannot supply it either.** The `NbMessage` those controls render for `error`,
  `warning` and `helper` carries no id, so there is no node to point at. The
  practical consequence: the error is announced when it appears (`NbMessage` is
  a live region), but a user who tabs back to that field later hears the label
  and nothing else. Until the controls expose a message id, the mitigations are:
  1. Put the constraint in the label or hint text, where it is part of the
     accessible name or is at least read on arrival.
  2. On a form-level failure, the `NbBanner` summary (Rule 11) names every
     broken field, and focus moves to it, so the information is reachable.

  Do not paper over it by hiding the visible message and rendering your own:
  that is a hand-rolled field, which Rule 2 bans.

- **Focus management after submit.** Nothing moves focus for you. First invalid
  field on a validation failure, the banner on a server failure, first editable
  control on a modal that just opened (Rule 13).

- **`NbModal` has no focus trap.** Despite what `introduction.md` says, Tab
  leaves an open modal and lands behind it. A modal form is therefore not safe
  from the keyboard yet. `NbConfirm` does trap correctly and restores focus, so
  `useConfirm` is unaffected. See [Accessibility overview](/accessibility/overview).

- **Tab order is DOM order, so keep DOM order equal to visual order.** Never
  reorder fields with `order`, `row-reverse` or a grid placement: a sighted
  keyboard user then watches focus jump backwards. This is also why the footer
  is last in the DOM and last in the tab order.

- **A name for the form itself.** `NbForm`'s `title` renders a heading but does
  not link it to the `<form>`. Add `aria-label` (or `aria-labelledby` pointing
  at your own heading) when a page carries more than one form.

- **Keyboard path to every control.** Two applications ship clickable rows and
  card `div`s that a keyboard cannot reach. If it commits a value, it is a
  button, an input or it has a key handler and a `tabindex`.

- **Both themes.** Error, warning and helper colours come from `--nb-c-danger`,
  `--nb-c-warning` and `--nb-c-text-subtle`, which are theme-aware. Any colour
  you add yourself must be checked with the `.dark` class on, and must not be
  the only carrier of meaning: `NbMessage` pairs every colour with an icon, and
  so should you.

## Tokens a form is allowed to touch

Do not hardcode pixels. One audited application carries 462 hardcoded px values
and zero spacing tokens; another 287 and zero.

| Token                                                      | What it controls                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--nb-field-height-xs/sm/md/lg`                            | Control heights (28 / 32 / 40 / 48 at the 8px base unit)                                  |
| `--nb-field-padding-h`                                     | Horizontal padding inside a control                                                       |
| `--nb-field-font-size`                                     | Value text size                                                                           |
| `--nb-field-label-gap`                                     | Gap between a label and its control, shared by every control so mixed rows align          |
| `--nb-field-disabled-opacity`                              | The dim applied to a disabled control (0.45)                                              |
| `--nb-field-label-width`                                   | `NbField`'s label column. Set on the container to move the whole spine (defaults to 8rem) |
| `--nb-field-col-gap`                                       | `NbField`'s label-to-control gap in row layout (defaults to 12px)                         |
| `--nb-c-field-border`                                      | Control outline                                                                           |
| `--nb-c-danger` / `--nb-c-warning` / `--nb-c-success`      | Message and state colour                                                                  |
| `--nb-c-text` / `--nb-c-text-muted` / `--nb-c-text-subtle` | Value / label / helper ramp                                                               |

For gaps between fields, use `NbGrid`'s `gap` scale rather than raw values:
`xxs` 2px, `xs` 4px, `sm` 8px, `md` 16px, `lg` 24px, `xl` 32px, `xxl` 48px.

## Things we have shipped and should not ship again

- A form with no `<form>`, so Enter did nothing in seventy-two fields.
- Fifty-eight text inputs, zero `error` bindings, and validation delivered as a
  paragraph somewhere else.
- Five hand-rolled `div.field` implementations with five different label colours
  and a hardcoded red.
- A Cancel button with no `type`, which submitted the form.
- A disabled Save button as the only feedback that a form was invalid, with no
  indication of which field was the problem.
- A modal footer with an `NbPanel` and inline padding inside it, fighting the
  right-aligned grid the modal already provides, with a primary-styled Delete.
- Three save models on one product, so the user could not learn the answer to
  "did that stick?".
- One `.empty-text` element rendering both the loading state and the empty
  state, so a failed fetch read as "no contacts yet".
- `window.confirm` in a Tauri webview, where it does nothing at all.

## Checklist

Apply this to an existing view. Every item is a yes/no you can check by reading
the template.

**Structure**

- [ ] The form is on the surface Rule 1 chooses for its input count, and a modal
      form has at most four inputs.
- [ ] Every field is a library control, and no view-local `div.field`, `.form-row`
      or `.input-group` styles the field by hand.
- [ ] Each field uses exactly one layout: control-level `label`, or `NbField`
      (row or stack). The label is set in exactly one of the two places.
- [ ] Where `NbField` is used, the slot `id` is bound to the control (or
      `labelFor` is set).
- [ ] Every control that can be invalid has an explicit `id="field-<name>"`.
- [ ] Every control in the surface uses the same `size`, and it matches the
      surface (`xs` inspector, `sm` compact, `md` standalone, `lg` touch).
- [ ] The form column is capped (not full-bleed at desktop width) and is one
      column, except for pairs that are a single answer.
- [ ] Vertical spacing comes from one container `gap`, not per-field margins, and
      no raw px appears where a `--nb-*` token exists.
- [ ] DOM order equals visual order: no `order`, `row-reverse` or grid placement
      reorders the fields.

**Submission**

- [ ] There is a real `<form>` (`NbForm` or a `<form>` element) around the fields.
- [ ] The submit handler is `@submit.prevent`.
- [ ] Every button inside the form has an explicit `type`; only the commit is
      `type="submit"`.
- [ ] A modal form's footer button points at the form with `form="<id>"`, and the
      footer has no extra padding wrapper.
- [ ] The commit button names the action ("Create project"), the exit says
      "Cancel", exit is left of commit, and exactly one button is `primary`.
- [ ] The submit button is not disabled to express invalidity. It is disabled
      (via `:loading`) only while the request is in flight.

**Validation and feedback**

- [ ] No field validates before its first blur, and nothing validates on every
      keystroke before the first submit.
- [ ] Submit validates everything, and after a failed submit the corrected field
      clears its error as the user types.
- [ ] Every invalid field binds `error` on its control, and the message says what
      to do, not "Invalid".
- [ ] A field whose control cannot carry a message (`NbCheckbox`, `NbSwitch`,
      `NbFileUploader`) has its error placed deliberately, not omitted.
- [ ] Focus moves to the first invalid field after a failed validation, and the
      field is scrolled into view.
- [ ] A server failure that belongs to no field renders as an inline `NbBanner`
      as the first child of the form body (never inside `#message`), with every
      value preserved and focus moved to it. It is not a toast.
- [ ] No raw exception text reaches the user.
- [ ] A save that can take more than a moment shows progress (`:loading` on the
      button, or `NbInlineLoading`), and never nothing.

**States and save model**

- [ ] While the record loads, the form renders skeletons, not an empty editable
      form, and loading is distinguishable from empty and from failed.
- [ ] A modal or panel form focuses its first editable control on open; a page
      form does not steal focus.
- [ ] Required fields are marked, or the single optional field is, never both,
      and the convention is stated once at the top of the form.
- [ ] Non-editable values use `readonly` or are rendered as text, not as a dimmed
      disabled control.
- [ ] Every disabled control has a visible reason beside it.
- [ ] The surface has exactly one save model, and it is explicit submit unless
      there is a stated reason.
- [ ] If it autosaves: no Save button, saving happens on commit not on keystroke,
      status is visible, failures are loud.
- [ ] If it is a modal: closing discards, and nothing inside it autosaves.

**Unsaved work**

- [ ] Dirtiness is computed by comparing against the loaded record, not set by an
      input listener.
- [ ] Leaving the route with a dirty form asks, through `useConfirm`.
- [ ] `beforeunload` is registered only while dirty and removed on unmount.
- [ ] A dirty modal confirms before closing, and its overlay does not dismiss.
- [ ] A successful save resets the pristine snapshot, so leaving afterwards is
      free.

**Copy**

- [ ] Every label is sentence case, one to three words, with no trailing colon.
- [ ] Helper text is guidance, not validation, and placeholders carry the shape
      of the value, not its name.
- [ ] Every error names the fix.

**Safety and access**

- [ ] Destructive actions go through `useConfirm` with the request in
      `onConfirm`, sit away from the commit button, and never use
      `window.confirm`.
- [ ] Text fields with an error also carry `aria-invalid`, and no `aria-invalid`
      is passed to `NbNumberInput` or `NbSelect` in the belief that it lands on
      the control.
- [ ] A page with more than one form gives each form an accessible name.
- [ ] Every interactive element is reachable and operable by keyboard.
- [ ] The form was checked with the `.dark` class applied, and no meaning is
      carried by colour alone.

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* Every option list here is a plain ISelectOption[] (see src/components/Select.d.ts):
   label, value. Nothing on this page invents a prop. */
const regionOptions = [
  { label: 'Europe (Frankfurt)', value: 'eu' },
  { label: 'US East (Virginia)', value: 'us' },
  { label: 'Asia (Singapore)', value: 'ap' },
]

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
]

/* Anatomy: one value behind both layouts, so the demo cannot cheat by showing
   two different fields. */
const anatomyEmail = ref('jose@')

/* Rule 2: the three legal layouts. */
const legal = reactive({
  name: 'Release pipeline',
  region: 'eu',
  retries: 3,
  notes: 'Fixes the redirect that dropped the trailing slash.',
})

/* Rule 2: the contrast pair. Both columns are bound to these three values. */
const handRolled = reactive({
  name: 'Ada Okafor',
  email: 'ada@',
  team: 'Platform',
})

/* Rule 3: the id binding, and the doubled label. */
const labelDemo = reactive({ a: '', b: '', c: 'ada@nubisco.io' })

/* Rule 4: the helper caveat. */
const helperDemo = reactive({ a: '', b: 'eu' })

/* Rule 8: required, optional, and both at once. All three panels share one set
   of values, so the only thing that differs between them is the marking. */
const marking = reactive({ email: '', role: '', team: '' })

/* Rule 5: Enter, with and without a form element. */
const enterDemo = reactive({ looseEmail: '', formEmail: '' })
const looseSubmits = ref(0)
const formSubmits = ref(0)

/* One rule, shared by every validation demo below, so they all agree about
   what a work email address is. */
const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)

/* Rule 10, the wrong half: a computed error is a validate-on-keystroke form
   with no state at all, which is exactly why products end up with one. */
const eager = reactive({ value: '' })
const eagerError = computed(() =>
  eager.value === '' || isEmail(eager.value) ? '' : 'Enter a work email address',
)

/* Rule 10, the right half: nothing before first blur, nothing on a field the
   user only tabbed through, and on input once it has spoken. */
const polite = reactive({ value: '', error: '', touched: false })

function politeBlur() {
  polite.touched = true
  if (polite.value === '') {
    polite.error = ''
    return
  }
  polite.error = isEmail(polite.value) ? '' : 'Enter a work email address'
}

function politeInput() {
  if (!polite.touched) return
  polite.error = isEmail(polite.value) ? '' : 'Enter a work email address'
}

/* Rule 11: the whole form. `rules` insertion order is the visual order of the
   fields, which is the order focusFirstInvalid walks. */
const inviteRules: Record<string, (value: string) => string> = {
  email: (value) => (isEmail(value) ? '' : 'Enter a work email address'),
  role: (value) => (value ? '' : 'Choose a role'),
}

const invite = reactive({
  values: { email: '', role: '' } as Record<string, string>,
  errors: { email: '', role: '' } as Record<string, string>,
  summary: '',
  serverError: '',
  submitted: false,
  saving: false,
})

/* Two sources, one banner: a validation summary and a server refusal are the
   same surface (Rule 11 and Rule 12) but not the same lifetime. */
const inviteBanner = computed(() => invite.summary || invite.serverError)

function countInvalid() {
  return Object.keys(inviteRules).filter((name) => invite.errors[name])
}

function refreshSummary() {
  const broken = countInvalid()
  if (!broken.length) {
    invite.summary = ''
    return
  }
  invite.summary =
    broken.length === 1
      ? 'One field needs an answer before this invite can be sent.'
      : `${broken.length} fields need an answer before this invite can be sent.`
}

/* Blur validates only what blur can tell you, and never "required" on a field
   the user tabbed through. */
function touchInvite(name: string) {
  if (!invite.values[name]) return
  invite.errors[name] = inviteRules[name](invite.values[name])
  if (invite.submitted) refreshSummary()
}

/* After a failed submit the same field validates on input, so the error clears
   as it is fixed. Before that, this is a no-op. */
function reviseInvite(name: string) {
  if (!invite.submitted) return
  invite.errors[name] = inviteRules[name](invite.values[name])
  invite.serverError = ''
  refreshSummary()
}

/* A select has no half-finished state: the moment it changes it is answerable,
   so it validates on change whether or not the form has been submitted. */
function commitInvite(name: string) {
  invite.errors[name] = inviteRules[name](invite.values[name])
  invite.serverError = ''
  if (invite.submitted) refreshSummary()
}

async function submitInvite() {
  invite.submitted = true
  invite.serverError = ''
  for (const name of Object.keys(inviteRules)) {
    invite.errors[name] = inviteRules[name](invite.values[name])
  }
  const broken = countInvalid()
  if (broken.length) {
    refreshSummary()
    const el = document.getElementById(`fdx-invite-${broken[0]}`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el?.focus()
    return
  }
  invite.summary = ''
  invite.saving = true
  await wait(1200)
  invite.saving = false
  /* Rule 12: a failure the submit owns, not a field, rendered in the form with
     every value the user typed still in place. It maps to a field here, so the
     field carries it too. */
  invite.serverError = 'That address already belongs to this workspace.'
  invite.errors.email = 'Use an address that is not already a member'
}

function resetInvite() {
  invite.values.email = ''
  invite.values.role = ''
  invite.errors.email = ''
  invite.errors.role = ''
  invite.summary = ''
  invite.serverError = ''
  invite.submitted = false
  invite.saving = false
}
</script>

<style scoped>
/* The preview area stretches its single child, so a demo with more than one
   thing in it goes in a plain stacking wrapper and each part keeps its own
   height. */
.fdx-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}

.fdx-stack--narrow {
  max-width: 340px;
}

/* Wrong on the left, right on the right, one column when there is no room for
   two. */
.fdx-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.fdx-trio {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.fdx-half,
.fdx-third {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: stretch;
  padding: calc(var(--nb-base-unit) * 1.5);
  border-radius: var(--nb-radius-md);
  border: 1px solid var(--nb-c-border);
  min-width: 0;
}

.fdx-half--wrong,
.fdx-third--wrong {
  border-color: var(--nb-c-danger-surface);
}

.fdx-half--right,
.fdx-third--right {
  border-color: var(--nb-c-success-surface);
}

.fdx-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--nb-c-text-muted);
}

.fdx-half--wrong .fdx-label,
.fdx-third--wrong .fdx-label {
  color: var(--nb-c-danger);
}

.fdx-half--right .fdx-label,
.fdx-third--right .fdx-label {
  color: var(--nb-c-success);
}

.fdx-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

.fdx-note code {
  font-size: 12px;
}

/* Rule 5: fields with no form around them, laid out the way the audited views
   lay them out. The absence of a <form> is the demo; this only stacks them. */
.fdx-loose {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 2);
  align-items: flex-start;
}

/* Rule 7: a form column is capped, never full-bleed at desktop width. */
.fdx-formframe {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* THE DEFECT, RENDERED. This is not a component and is not offered as one: it
   is the div.field five products shipped, reproduced verbatim from the [Wrong]
   block above (6px gap, 16px margin, #e5484d at 12px) so the comparison beside
   it is a comparison and not an assertion. Never copy this block. */
.fdx-handrolled .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.fdx-handrolled .field:last-child {
  margin-bottom: 0;
}

.fdx-handrolled .input {
  padding: 8px;
  border: 1px solid #cfcfcf;
  font: inherit;
  font-size: 14px;
}

.fdx-handrolled .field-error {
  color: #e5484d;
  font-size: 12px;
}
</style>
