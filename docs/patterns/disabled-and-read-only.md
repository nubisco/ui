---
layout: nubisco
title: Disabled and read-only
description: The difference almost everyone gets wrong, why a disabled control is never an explanation, and the read-only presentation of every input this library ships.
---

Two states, one test:

> **Is the value real, and does the user need to read it?**
>
> Yes: **read-only**. The value is true, it stays true, it is selectable and
> copyable, and it is in the tab order.
>
> No: **disabled**. There is nothing here yet, or nothing here for you, and
> something else on the screen has to say what is missing.

Almost every misuse in the fleet is the same misuse in both directions: a real
value dimmed to 45% opacity and pulled out of the tab order because `disabled`
was the prop that came to hand, or a control disabled with no clue anywhere on
the screen about how to enable it.

The worst single instance found in the audit: **a submit button disabled with no
message saying why.** The user's only route forward was to guess which of eleven
fields the form disliked. There was no error text, no summary, and no tooltip.
The button was the whole conversation, and the button said nothing.

Before any of the rules, the difference itself. This is one component,
`NbTextInput`, rendered three times with one prop changed. Tab through them, and
try to select the value in each:

<preview dir="col">
  <div class="dro-three">
    <div class="dro-cell">
      <p class="dro-cap">Normal</p>
      <NbTextInput v-model="droWorkspaceId" label="Workspace ID" name="dro-ws-normal" />
    </div>
    <div class="dro-cell">
      <p class="dro-cap">disabled</p>
      <NbTextInput :model-value="droWorkspaceId" label="Workspace ID" name="dro-ws-disabled" disabled />
    </div>
    <div class="dro-cell">
      <p class="dro-cap">readonly</p>
      <NbTextInput :model-value="droWorkspaceId" label="Workspace ID" name="dro-ws-readonly" readonly />
    </div>
  </div>
</preview>

The middle one is at 45% opacity, Tab skips it, and the text cannot be selected.
The right one keeps full contrast, takes focus, and the value can be selected and
copied. Its field background has gone transparent and nothing else about it has
changed, which is the whole of the styling `readonly` does
(`TextInput.vue:364`). They are not two flavours of "off", and the rest of this
page is what follows from that.

---

## Rule 1: four states, and `disabled` is only one of them

| State                     | Use when                                                                                                     | How                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **Read-only**             | The value is real and is not editable _here_ (a generated key, a plan tier, a field owned by another system) | `readonly` on the control, or render the value as text               |
| **Disabled**              | Editable in principle, blocked right now by something on this screen the user can resolve                    | `disabled`, **plus a visible reason** (Rule 2)                       |
| **Enabled, fails on use** | The action is legal but the input is not valid yet                                                           | Leave it enabled, validate on activation, show the error, move focus |
| **Not rendered**          | Not applicable to this user or this record, and never will be in this session                                | Leave it out of the template                                         |

The row people skip is the third. A disabled control is the answer to "you
cannot do this yet". It is a poor answer to "you have not filled this in
correctly", because it removes the only surface that could have told the user
what was wrong.

### Disabled or not rendered?

Disable when **the user can unblock it themselves, in this session**: pick an
environment before choosing a branch, tick the terms box before subscribing,
select rows before running a bulk action. The control staying visible is the
point, because it tells them the capability exists.

Do not render when **it depends on something they cannot change from here**: a
role they do not hold, a feature not on their plan, a capability the connected
provider does not have. A permanently dead control is furniture.

One exception, and it matters commercially: if the missing thing is something
they could _acquire_ (a plan upgrade, a permission they can request), do not
hide it and do not disable it either. Render it enabled and let activation
explain, or render the region with a `NbBanner status="info" variant="callout"`
that names the requirement. Hiding it silently means the user concludes the
product cannot do it at all.

---

## Rule 2: a disabled control is never the only explanation

This is the non-negotiable one.

::: danger The rule
If disabling something is the reason a user cannot proceed, **the reason must be
readable on the screen without interacting with the disabled thing.**
:::

Not negotiable because of how disabling actually works in this library:

- `NbButton` with `disabled` renders a native `<button disabled>` when it is a
  button, and its style block sets `pointer-events: none`, `cursor: not-allowed`
  and `outline-color: transparent` on `:focus-visible`. A native disabled button
  is **not focusable, not hoverable and not announced**.
- Therefore **a `v-nb-tooltip` on a disabled `NbButton` can never fire.** No
  pointer events means no hover. No focusability means no focus trigger. The
  tooltip is dead code. This has shipped more than once.

Where the reason is allowed to live, in order of preference:

1. **On the field that is at fault.** `error` on `NbTextInput`, `NbSelect`,
   `NbNumberInput`, `NbSlider`, `NbRadio`. This is the shortest distance between
   the problem and the fix. See [Building a form](/patterns/forms).
2. **In the region, as a `NbBanner`.** When the blocker affects the whole
   surface rather than one field. Use `variant="callout"` when it is a standing
   condition (a read-only environment, a trial that has ended), because a
   callout cannot be dismissed and dismissing it would not make it untrue.
   Use `variant="inline"` with `status="warning"` when it followed something the
   user just did.
3. **Beside the label, as a `NbInfoHint`.** This one _is_ reachable, because
   `NbInfoHint` is its own focusable trigger button next to the control, not an
   attribute on the disabled control. Use it for a nuance ("this field is
   managed by your identity provider"), never for the primary reason.
4. **As adjacent static text.** A muted sentence under a disabled group is
   perfectly good and always works.

```vue
<!-- Wrong: the tooltip cannot fire, so the reason does not exist -->
<NbButton
  v-nb-tooltip="{ body: 'Select at least one row' }"
  disabled
>Delete</NbButton>

<!-- Right: the state is visible, and so is the way out of it -->
<NbButton :disabled="selected.length === 0" variant="danger">Delete</NbButton>
<p v-if="selected.length === 0" class="hint">Select rows to delete them.</p>
```

Both buttons below are disabled, and both are correct about being disabled. Only
one of them tells you anything. Hover the left one, then try to reach it with
Tab:

<preview dir="col">
  <div class="dro-pair">
    <div class="dro-half dro-half--wrong">
      <p class="dro-label">Wrong: the reason lives in a tooltip on the disabled button</p>
      <NbButton variant="danger" disabled v-nb-tooltip="{ body: 'Select at least one row' }">Delete</NbButton>
      <p class="dro-note">The directive is bound and the sentence is in the template. It cannot open: the disabled style sets pointer-events: none, so there is no hover, and the native disabled attribute takes the button out of the tab order, so there is no focus. The explanation has shipped, and no user has ever seen it.</p>
    </div>
    <div class="dro-half dro-half--right">
      <p class="dro-label">Right: the reason is adjacent text, and it is live</p>
      <NbCheckbox v-model="droRowSelected" label="launch-hero.png" name="dro-row" />
      <NbButton variant="danger" :disabled="!droRowSelected">Delete</NbButton>
      <p v-if="!droRowSelected" class="dro-hint">Select rows to delete them.</p>
      <p class="dro-note">Tick the row. The button enables and the sentence goes away, because it stopped being true. The reason and the state are two renderings of the same condition, which is why they cannot fall out of step.</p>
    </div>
  </div>
</preview>

### The submit button

A special case of the same rule, called out because it is the most common defect
in the fleet.

::: danger Do not disable submit to express "the form is invalid"
A disabled Save gives the user nothing to press and nothing to learn. Keep it
enabled. Validate on click. Render the field errors, and move focus to the first
one. The only legitimate reason to disable a commit button is that **the request
is already in flight**, and `NbButton`'s `loading` prop already handles that: it
sets the native `disabled` attribute, blocks the `click` emit and renders a
spinner beside the label.
:::

Here is the defect and its fix, both live. Both forms hold the same invalid
value. On the left, work out why Save is dead. On the right, press Save:

<preview dir="col">
  <div class="dro-pair">
    <div class="dro-half dro-half--wrong">
      <p class="dro-label">Wrong: disabled Save, and nothing else on the screen</p>
      <NbTextInput v-model="droWrongName" label="Workspace name" name="dro-wrong-name" />
      <NbTextInput v-model="droWrongSlug" label="Slug" name="dro-wrong-slug" />
      <NbButton type="submit" variant="primary" :disabled="!droWrongValid">Save changes</NbButton>
      <p class="dro-note">The rule is that a workspace name cannot contain a slash. Nothing on this surface says so. With two fields it is a puzzle; the audited form had eleven, and users solved it by deleting characters until the button lit up.</p>
    </div>
    <div class="dro-half dro-half--right">
      <p class="dro-label">Right: Save stays enabled and answers when pressed</p>
      <NbTextInput ref="droRightNameInput" v-model="droRightName" label="Workspace name" name="dro-right-name" :error="droRightError" />
      <NbTextInput v-model="droRightSlug" label="Slug" name="dro-right-slug" />
      <NbButton type="submit" variant="primary" @click="droValidate">Save changes</NbButton>
      <NbMessage v-if="droRightSaved" variant="helper">Saved.</NbMessage>
      <p class="dro-note">One press names the field, states the rule and moves focus to the offending input. Fix the value and press again: the error clears because it is bound to the same state that decides validity.</p>
    </div>
  </div>
</preview>

```vue
<!-- The only disabled submit we accept -->
<NbButton
  type="submit"
  variant="primary"
  :loading="saving"
>Save changes</NbButton>
```

Press it. It disables itself for the 1.2 seconds the request takes, and nothing
else on the page has to know:

<preview dir="col">
  <div class="dro-stack dro-stack--narrow">
    <NbButton type="submit" variant="primary" :loading="droSaving" @click="droRunSave">Save changes</NbButton>
    <p class="dro-note">`loading` sets the native disabled attribute, blocks the click emit and renders the spinner. A second press during the flight does nothing, which is the entire reason this state is allowed to disable anything.</p>
  </div>
</preview>

---

## Rule 3: read-only is a value, so it must stay readable

Disabled and read-only differ in four things a user can feel.

|                    | Disabled                                                                         | Read-only                                                                                            |
| ------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Contrast**       | Dimmed to `--nb-field-disabled-opacity` (0.45); `NbButton` uses a literal `0.45` | Full text contrast. `NbTextInput`'s read-only style only drops the field background to `transparent` |
| **Keyboard**       | Native `disabled` removes it from the tab order entirely                         | Still focusable, still in the tab order, arrow keys and selection still work                         |
| **Screen reader**  | A native disabled control is skipped or announced as unavailable                 | Announced normally, with its value, plus "read only"                                                 |
| **Copy and paste** | Text inside a disabled input cannot be selected in most browsers                 | Selectable and copyable                                                                              |

That last row alone decides most cases. Dimming an API key the user came to the
page to copy, and then preventing them from selecting it, is user-hostile. It is
read-only.

That claim is testable in about four seconds. Try to select the key in each of
these, and then read them both at arm's length:

<preview dir="col">
  <div class="dro-pair">
    <div class="dro-half dro-half--wrong">
      <p class="dro-label">Wrong: a real value in a disabled field</p>
      <NbTextInput :model-value="droApiKey" label="Live API key" name="dro-key-disabled" disabled />
      <p class="dro-note">45% opacity, no tab stop, no selection. This shipped on a page whose only purpose was copying this string. The state says "there is nothing for you here" about the one thing the user came for.</p>
    </div>
    <div class="dro-half dro-half--right">
      <p class="dro-label">Right: a real value, read-only</p>
      <NbTextInput :model-value="droApiKey" label="Live API key" name="dro-key-readonly" readonly helper="Rotating the key invalidates the old one immediately." />
      <p class="dro-note">Full contrast, in the tab order, selectable, announced with its value and "read only". It still cannot be edited, which was the only requirement either version had.</p>
    </div>
  </div>
</preview>

The contrast row gives you a second test with no judgement in it:

> **Would you fail this element for contrast if it were normal text?** Disabled
> elements are exempt from WCAG 1.4.3 because nobody is expected to read them.
> If your user _does_ need to read it, that exemption is proof you picked the
> wrong state.

---

## Rule 4: the read-only presentation of every input we ship

Only three controls in this library have a `readonly` prop. Knowing which three
is the difference between a correct read-only view and eleven dimmed controls.

The prop comes from `IReadableFieldComponent` in `src/types/Props.d.ts`, which
extends `IFieldComponent` with exactly one member. If a component does not
extend it, it has no read-only mode.

| Control           | `disabled`                     | `readonly` | What read-only actually does, or what to do instead                                                                                                      |
| ----------------- | ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ------------------------------------ |
| `NbTextInput`     | yes                            | **yes**    | `readonly` on the native input, wrapper background goes `transparent`, cursor `default`. Focusable, selectable, copyable. The correct read-only field    |
| `NbDatePicker`    | yes                            | **yes**    | `readonly` on the text input, and the calendar trigger button gets `:disabled="disabled                                                                  |     | readonly"` so the picker cannot open |
| `NbRadio`         | yes                            | **yes**    | Guarded: the `@change` handler drops the update and the option label gets `pointer-events: none`. See the caveat below                                   |
| `NbNumberInput`   | yes                            | no         | Render the number as text (`NbDefinitionList`), or use `NbTextInput` with `readonly` if it must stay in the field grid                                   |
| `NbSelect`        | yes                            | no         | Render the selected option's label as text. Never a disabled select showing the chosen value                                                             |
| `NbCheckbox`      | yes                            | no         | Render "Yes" / "No", or the thing being enabled with a `NbBadge`. A ticked disabled checkbox reads as broken                                             |
| `NbCheckboxGroup` | yes                            | no         | Render the checked labels as a list. `disabled` on the group cascades to every child through the group context                                           |
| `NbSwitch`        | yes                            | no         | Render `On` / `Off` as text or a badge. A disabled switch uses `--nb-c-component-disabled` and looks like a bug                                          |
| `NbSlider`        | yes                            | no         | Render the value as text, or as a `NbProgressBar` if the position on the scale is the point                                                              |
| `NbFileUploader`  | **declared but unimplemented** | no         | `disabled` is on `IFileUploaderProps` and `FileUploader.vue` never reads it. Do not rely on it. A read-only file set is a list of names, not an uploader |

::: warning `readonly` on `NbRadio` is a convention, not a browser guarantee
HTML ignores `readonly` on `<input type="radio">`. `NbRadio` enforces it in the
component: `@change` only emits when `readonly` is false, and the option label
carries `pointer-events: none`. That is correct for a mouse and correct for the
model, but it is not a native barrier. Never treat it as an integrity boundary,
and always enforce the same rule on the server.
:::

### Every control we ship, in all three states

The table above as running components. Each row is one control: normal, then
`disabled`, then read-only. Only the first three rows have a third state to
show, and the remaining rows hold what the table's last column asks for instead,
which is why they are the same width as the fields above them and not dimmed
copies of them.

<preview dir="col">
  <div class="dro-scroll">
    <div class="dro-matrix">
      <p class="dro-head">Normal</p>
      <p class="dro-head">disabled</p>
      <p class="dro-head">Read-only, or the substitute</p>
      <div class="dro-mcell"><NbTextInput v-model="droMatrixName" label="Workspace name" name="dro-m-text-1" /></div>
      <div class="dro-mcell"><NbTextInput :model-value="droMatrixName" label="Workspace name" name="dro-m-text-2" disabled /></div>
      <div class="dro-mcell"><NbTextInput :model-value="droMatrixName" label="Workspace name" name="dro-m-text-3" readonly /></div>
      <div class="dro-mcell"><NbDatePicker v-model="droMatrixDate" type="single" label="Renewal date" name="dro-m-date-1" /></div>
      <div class="dro-mcell"><NbDatePicker :model-value="droMatrixDate" type="single" label="Renewal date" name="dro-m-date-2" disabled /></div>
      <div class="dro-mcell"><NbDatePicker :model-value="droMatrixDate" type="single" label="Renewal date" name="dro-m-date-3" readonly /></div>
      <div class="dro-mcell"><NbRadio v-model="droMatrixPeriod" label="Billing period" name="dro-m-radio-1" :options="droPeriodOptions" /></div>
      <div class="dro-mcell"><NbRadio :model-value="droMatrixPeriod" label="Billing period" name="dro-m-radio-2" :options="droPeriodOptions" disabled /></div>
      <div class="dro-mcell"><NbRadio :model-value="droMatrixPeriod" label="Billing period" name="dro-m-radio-3" :options="droPeriodOptions" readonly /></div>
      <div class="dro-mcell"><NbNumberInput v-model="droMatrixSeats" label="Seats" name="dro-m-num-1" :min="1" :max="500" /></div>
      <div class="dro-mcell"><NbNumberInput :model-value="droMatrixSeats" label="Seats" name="dro-m-num-2" :min="1" :max="500" disabled /></div>
      <div class="dro-mcell"><NbDefinitionList :items="droSeatFacts" layout="stacked" compact /></div>
      <div class="dro-mcell"><NbSelect v-model="droMatrixRegion" label="Region" name="dro-m-sel-1" :options="droRegionOptions" /></div>
      <div class="dro-mcell"><NbSelect :model-value="droMatrixRegion" label="Region" name="dro-m-sel-2" :options="droRegionOptions" disabled /></div>
      <div class="dro-mcell"><NbDefinitionList :items="droRegionFacts" layout="stacked" compact /></div>
      <div class="dro-mcell"><NbCheckbox v-model="droMatrixReceipts" label="Email receipts" name="dro-m-chk-1" /></div>
      <div class="dro-mcell"><NbCheckbox :model-value="droMatrixReceipts" label="Email receipts" name="dro-m-chk-2" disabled /></div>
      <div class="dro-mcell"><NbDefinitionList :items="droReceiptFacts" layout="stacked" compact /></div>
      <div class="dro-mcell"><NbCheckboxGroup label="Notifications"><NbCheckbox v-model="droMatrixChannels.email" label="Email" name="dro-m-grp-1a" /><NbCheckbox v-model="droMatrixChannels.sms" label="SMS" name="dro-m-grp-1b" /></NbCheckboxGroup></div>
      <div class="dro-mcell"><NbCheckboxGroup label="Notifications" disabled><NbCheckbox :model-value="droMatrixChannels.email" label="Email" name="dro-m-grp-2a" /><NbCheckbox :model-value="droMatrixChannels.sms" label="SMS" name="dro-m-grp-2b" /></NbCheckboxGroup></div>
      <div class="dro-mcell"><NbDefinitionList :items="droChannelFacts" layout="stacked" compact /></div>
      <div class="dro-mcell"><NbSwitch v-model="droMatrixRenew" label="Auto-renew" name="dro-m-sw-1" /></div>
      <div class="dro-mcell"><NbSwitch :model-value="droMatrixRenew" label="Auto-renew" name="dro-m-sw-2" disabled /></div>
      <div class="dro-mcell"><NbDefinitionList compact><NbDefinitionListItem term="Auto-renew"><NbBadge variant="green">On</NbBadge></NbDefinitionListItem></NbDefinitionList></div>
      <div class="dro-mcell"><NbSlider v-model="droMatrixRetention" label="Retention (days)" name="dro-m-sld-1" :min="0" :max="90" /></div>
      <div class="dro-mcell"><NbSlider :model-value="droMatrixRetention" label="Retention (days)" name="dro-m-sld-2" :min="0" :max="90" disabled /></div>
      <div class="dro-mcell"><NbProgressBar label="Retention (days)" :value="droMatrixRetention" :max="90" size="sm" :helper="droRetentionHelper" /></div>
      <div class="dro-mcell"><NbFileUploader heading="Attachments" description="PDF, up to 10 MB" button-label="Add file" /></div>
      <div class="dro-mcell"><NbFileUploader heading="Attachments" description="PDF, up to 10 MB" button-label="Add file" disabled /></div>
      <div class="dro-mcell"><NbDefinitionList :items="droAttachmentFacts" layout="stacked" compact /></div>
    </div>
  </div>
</preview>

Three things in that grid are worth stopping on, and none of them is a matter of
taste:

- **The disabled column is one visual treatment**, because it is one mechanism:
  `--nb-field-disabled-opacity` over the whole control. `NbSwitch` is the
  exception that proves it, dimming its track with
  `--nb-c-component-disabled` as well, which is why a disabled switch reads as
  broken rather than as unavailable.
- **The read-only column is not a treatment at all.** Three of the rows are the
  same control with a border removed. The other six are a different component,
  because the value is a fact and a fact is not a field.
- **The last row is a live bug.** Those two uploaders are identical, and the
  second one is passed `disabled`. Click either button and the file picker
  opens, because `FileUploader.vue` never reads the prop that
  `IFileUploaderProps` declares.

### A whole form in read-only mode is not a form

If **every** field on a surface is read-only, you no longer have a form. You have
a facts list, and rendering it as twelve inert inputs is a form the user will
keep trying to type into.

```vue
<!-- Wrong: twelve inputs nobody can use -->
<NbTextInput
  v-for="f in fields"
  :key="f.key"
  :model-value="f.value"
  readonly
  :label="f.label"
/>

<!-- Right: it is a facts list, with a way back to editing -->
<NbDefinitionList :items="fields" layout="auto" />
<NbButton variant="secondary" @click="edit">Edit details</NbButton>
```

The same six facts, twice. The left is what the audit found, down to the
disabled Save underneath it:

<preview dir="col">
  <div class="dro-pair">
    <div class="dro-half dro-half--wrong">
      <p class="dro-label">Wrong: a detail view built out of inert fields</p>
      <div class="dro-stack">
        <NbTextInput v-for="fact in droRecordFields" :key="fact.name" :model-value="fact.value" :label="fact.label" :name="`dro-ro-${fact.name}`" readonly />
        <NbButton variant="primary" disabled>Save changes</NbButton>
      </div>
      <p class="dro-note">Six field boxes and a Save button, and not one of them does anything. It offers to be typed into and it is not a form. The Save is the tell: there is nothing to save, so it is furniture that looks like a defect.</p>
    </div>
    <div class="dro-half dro-half--right">
      <p class="dro-label">Right: a facts list with a way back to editing</p>
      <div class="dro-stack">
        <NbDefinitionList :items="droRecordFacts" layout="auto" />
        <NbButton variant="secondary" @click="droEditNoticed = true">Edit details</NbButton>
        <NbMessage v-if="droEditNoticed" variant="helper">This is where editing would open.</NbMessage>
      </div>
      <p class="dro-note">Shorter, denser, readable at a glance, and it makes one promise it can keep. The empty value keeps its row, so the list never looks like it holds fewer facts than the record has.</p>
    </div>
  </div>
</preview>

`NbDefinitionList` takes `items` of `{ term, value, empty }`, or the slot form
with `NbDefinitionListItem` when a value needs a link or a badge. Its `empty`
default keeps a value-less fact on its own row, so a read-only view never looks
like it has fewer facts than it has.

**Keep the read-only field** when it is a minority inside a live form: two locked
fields among ten editable ones. Swapping those two for definition rows breaks the
field grid and makes the locked ones look like a different kind of thing, which
they are not: they are the same record, just not yours to change here.

---

## Rule 5: disabled mechanics differ by component, and you have to know which

There is no single mechanism. Some controls use the native `disabled` attribute,
some use `aria-disabled` because the element cannot take `disabled`, and some do
both depending on what they render.

| Component                                                             | Mechanism                                                                                                                                                                                    | Focusable when disabled?                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `NbButton`                                                            | Native `disabled` as a `<button>`. `aria-disabled` when `href` or `to` makes it a link or `RouterLink`                                                                                       | No as a button. **Yes as a link**          |
| `NbSidebarLink`                                                       | Same split: native `disabled` as a button, `aria-disabled` as a link                                                                                                                         | Same split                                 |
| `NbMenuItem`                                                          | `aria-disabled` only (it is an `<li role="menuitem">`), `tabindex="-1"`, and `onActivate` returns early. `NbMenu`'s roving keyboard navigation skips items whose `aria-disabled` is `"true"` | Not reachable by the menu's own arrow keys |
| `NbTabs`                                                              | Native `disabled` on the tab button, per item or on the whole component                                                                                                                      | No                                         |
| `NbSelect`                                                            | Native `disabled` and `aria-disabled` on the trigger. Per-option `disabled` is `aria-disabled` plus a guard in the click handler                                                             | Trigger no, options are not reachable      |
| `NbCheckbox`                                                          | Native `disabled` on the input; also inherits `disabled` from `NbCheckboxGroup`                                                                                                              | No                                         |
| `NbSwitch`                                                            | Native `disabled` plus `aria-disabled`, styled with `--nb-c-component-disabled`                                                                                                              | No                                         |
| `NbSlider`                                                            | Native `disabled` on the input and an early return in every pointer and key handler                                                                                                          | No                                         |
| `NbTreeNode`, `NbSidebarMenuItem`, `NbAccordionItem`, `NbStepperStep` | Guards plus `aria-disabled` or native `disabled` depending on the rendered element                                                                                                           | Varies                                     |
| `NbPagination`                                                        | Native `disabled`, and independently on the first and last page                                                                                                                              | No                                         |
| `NbLabel`                                                             | `disabled` dims the label only. It disables nothing                                                                                                                                          | Not applicable                             |

Two consequences to design around:

- **Anything that renders as a link stays focusable when disabled.** `NbButton`
  with `to` or `href` and `disabled` gets `aria-disabled="true"`, not the native
  attribute, so it is still in the tab order and still announced. That is
  acceptable (it is the accessible pattern for links), but it means you cannot
  assume "disabled" and "unreachable" are the same thing across the library.
- **Nothing in the library disables a whole region.** There is no
  `<fieldset disabled>` helper and no form-wide lock. If a whole panel is
  inert, do not loop `:disabled="true"` over every control inside it. That is
  Rule 4's read-only-form problem wearing a different hat: state the condition
  once with a `NbBanner variant="callout"` and render the region read-only.

The first of those two is one Tab press away from being obvious. Both of these
are `NbButton` with `disabled`. Put focus in the field and press Tab twice:

<preview dir="col">
  <div class="dro-stack dro-stack--narrow">
    <NbTextInput v-model="droTabProbe" label="Start here, then press Tab" name="dro-tab-probe" />
    <div class="dro-inline">
      <NbButton disabled>Disabled as a button</NbButton>
      <NbButton disabled href="#rule-5-disabled-mechanics-differ-by-component-and-you-have-to-know-which">Disabled as a link</NbButton>
    </div>
    <p class="dro-note">Focus lands on the second one and not the first. A native `&lt;button disabled&gt;` is removed from the tab order by the browser; a link cannot take the attribute at all, so the component sets `aria-disabled="true"` instead and the element stays reachable and announced. That is the correct accessible pattern for a link, and it means "disabled" and "unreachable" are not synonyms in this library.</p>
  </div>
</preview>

And the second one is the whole region case, stated once instead of forty times:

<preview dir="col">
  <div class="dro-stack">
    <NbBanner status="info" variant="callout" title="This environment is frozen">A release is being promoted to production. Editing reopens when it finishes.</NbBanner>
    <div class="dro-inline">
      <NbTextInput :model-value="droMatrixName" label="Workspace name" name="dro-frozen-1" readonly />
      <NbTextInput model-value="eu-west-1" label="Region" name="dro-frozen-2" readonly />
    </div>
    <p class="dro-note">The condition is named once, in words, and the fields below it are read-only rather than dimmed. Nothing is guessing, nothing is at 45%, and the word "frozen" appears on the screen. Compare that with looping `:disabled="true"` over the same two fields, which produces a panel that says nothing at all.</p>
  </div>
</preview>

---

## Rule 6: focus and contrast

- **Never remove the focus ring from something that is still focusable.**
  `NbButton` sets `outline-color: transparent` on `:focus-visible` only inside
  its `&:disabled, &[aria-disabled='true']` block, and that is fine for the
  native-disabled case because it cannot be focused anyway. Do not copy that
  pattern onto anything reachable.
- **Never place focus on a disabled control.** After the last item in a list is
  deleted, or a step completes and its button disables, focus is on a dead
  element and the keyboard user is stranded. Move focus to the container, the
  heading, or the next actionable control.
- **Do not disable a control the user is currently inside.** Disabling a focused
  input during an async validation drops focus to `<body>`. Use `readonly` for
  the duration, or leave it alone and reconcile after.
- **Disabled is 0.45 opacity, and that is deliberate.** It is opacity, not a
  colour, so it composites correctly on any layer and in both themes.
  `--nb-field-disabled-opacity` is the token; `--nb-c-component-disabled` is the
  companion colour for controls that dim a filled surface rather than the whole
  element (`NbSwitch`'s track, `NbTabs`' disabled tab text), and it is redefined
  under `.dark`.
- **Do not invent a third dimming level.** If 0.45 is too faint for your case,
  the content is meant to be read, and you wanted read-only.

The third of those is the one that is hard to believe until you feel it. Both
buttons below start a two-second check; the left one disables the field when it
lands, the right one makes it read-only. Press either, put the caret in the
field, and keep an eye on the focus readout:

<preview dir="col">
  <div class="dro-pair">
    <div class="dro-half dro-half--wrong">
      <p class="dro-label">Wrong: disabling the field the user is inside</p>
      <NbTextInput v-model="droAsyncWrong" label="Coupon code" name="dro-async-wrong" :disabled="droAsyncDisabled" />
      <NbButton size="sm" variant="secondary" @click="droStartWrong">Check in 2s</NbButton>
      <p class="dro-note">When it lands, the caret is gone. A disabled element cannot hold focus, so the browser drops it to the document body and the keyboard user is back at the top of the page with no announcement that anything moved.</p>
    </div>
    <div class="dro-half dro-half--right">
      <p class="dro-label">Right: readonly for the duration of the check</p>
      <NbTextInput v-model="droAsyncRight" label="Coupon code" name="dro-async-right" :readonly="droAsyncReadonly" />
      <NbButton size="sm" variant="secondary" @click="droStartRight">Check in 2s</NbButton>
      <p class="dro-note">The value stops being editable and the caret stays exactly where it was, because a read-only input is still a focusable input. When the check finishes the user carries on typing.</p>
    </div>
  </div>
  <p class="dro-readout">Focus is on: <code>{{ droFocusReadout }}</code></p>
</preview>

---

## Accessibility

|                        | Disabled                                                                      | Read-only                                                              |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Attribute              | Native `disabled`, or `aria-disabled="true"` where the element cannot take it | Native `readonly`, or `aria-readonly` where the element cannot take it |
| Tab order              | Removed (native only)                                                         | Kept                                                                   |
| Announcement           | Skipped, or "unavailable"                                                     | Value plus "read only"                                                 |
| Contrast requirement   | Exempt                                                                        | Full                                                                   |
| Where the reason lives | Somewhere else on the screen, always                                          | Not required, but say so if it is surprising                           |

Requirements on you:

- **Give the reason a home before you write `disabled`.** If you cannot name
  where the reason renders, you have not finished the state.
- **Announce a change in disabled state when it is the result of something the
  user did elsewhere.** A Delete button that quietly enables when a checkbox is
  ticked is fine (the user did it and can see it). A submit that enables because
  a background job finished is not: say so with `useToast()`.
- **Never use `aria-disabled` alone on a `<button>`.** It announces as disabled
  while remaining clickable. If it is disabled, use the attribute; if it should
  stay activatable so it can explain itself, do not mark it disabled at all.
- **Both themes.** Opacity dimming works in both by construction. A hardcoded
  grey does not, and it is how a disabled control ended up brighter than its
  enabled neighbours on a dark surface.

---

## Things we have shipped and should not ship again

- A submit button disabled by a validity computed, with no field errors and no
  summary anywhere on the page.
- A `v-nb-tooltip` on a disabled `NbButton`, which could never fire because the
  disabled style sets `pointer-events: none`.
- An API key rendered in a disabled `NbTextInput`, at 45% opacity, unselectable,
  on a page whose only purpose was copying that key.
- A read-only detail view built as eleven disabled inputs, complete with a
  disabled Save button beneath them.
- A disabled `NbCheckbox` left ticked to show a setting was on, which every
  reviewer read as a broken control.
- `:disabled="true"` looped over an entire panel to express "this environment is
  frozen", with the word "frozen" appearing nowhere in the interface.
- `NbFileUploader` passed `disabled`, which the component does not implement, so
  the uploader stayed fully live.

---

## Audit checklist

Point this at any view. Every line is answerable by reading the template.

**Choosing the state**

- [ ] Every `disabled` in the template is on something the user genuinely cannot
      use _yet_, not on something whose value they need to read.
- [ ] No real, meaningful value is rendered in a disabled control.
- [ ] Nothing is disabled because of a permission the user cannot change from
      this screen. That case is hidden, or explained.
- [ ] No entire form or panel is disabled control by control.

**Explaining it**

- [ ] Every disabled control has a visible reason on screen: a field `error`, a
      `NbBanner`, a `NbInfoHint` beside the label, or adjacent text.
- [ ] No tooltip is attached to a disabled `NbButton`.
- [ ] The submit button is not disabled to express invalidity. It is disabled
      only via `loading`, while the request is in flight.
- [ ] Disabling that happens as a result of a background event is announced.

**Read-only**

- [ ] Read-only fields use `readonly`, and only on `NbTextInput`,
      `NbDatePicker` or `NbRadio`.
- [ ] Values whose control has no `readonly` are rendered as text
      (`NbDefinitionList`), not as a disabled control.
- [ ] An all-read-only surface is a facts list with an Edit action, not a form.
- [ ] Read-only text is at full contrast, focusable and copyable.

**Focus**

- [ ] Focus never lands on, or is left on, a disabled element after an action.
- [ ] No focused control is disabled mid-interaction.
- [ ] No focus ring is suppressed on anything still reachable.
- [ ] No `aria-disabled` sits alone on a native `<button>`.

**Related:** [Building a form](/patterns/forms) ·
[Status indicators](/patterns/status-indicators) ·
[Button](/ui/components/button/button) · [Text input](/ui/components/text-input) ·
[Definition list](/ui/components/definition-list) · [Banner](/ui/components/banner)

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* The three-state primer and the read-only contrast pair. */
const droWorkspaceId = ref('ws_3f9a2b7c')
const droApiKey = ref('nb_live_7Qd2K9xR4mVt0LpZ')

/* Rule 2: the reason has to be somewhere the user can reach. */
const droRowSelected = ref(false)

/* Rule 2, the submit button. Both halves hold the same invalid value, so the
   only difference between them is where the rule is written down. */
const droWrongName = ref('Marketing/site')
const droWrongSlug = ref('marketing-site')
const droWrongValid = computed(
  () => droWrongName.value.length > 0 && !droWrongName.value.includes('/'),
)

const droRightName = ref('Marketing/site')
const droRightSlug = ref('marketing-site')
const droRightError = ref('')
const droRightSaved = ref(false)
/* NbTextInput exposes focus(), which is what moving focus to the first error
   means in practice. See defineExpose in src/components/TextInput.vue. */
const droRightNameInput = ref<{ focus: () => void } | null>(null)

function droValidate() {
  droRightSaved.value = false
  if (droRightName.value.includes('/') || droRightName.value.length === 0) {
    droRightError.value = 'A workspace name cannot contain a slash'
    droRightNameInput.value?.focus()
    return
  }
  droRightError.value = ''
  droRightSaved.value = true
}

/* The only disabled submit this page accepts. */
const droSaving = ref(false)
async function droRunSave() {
  droSaving.value = true
  await wait(1200)
  droSaving.value = false
}

/* Rule 4: every control, three states. The normal column is bound with v-model
   so it is genuinely live; the other two take :model-value, because a state
   nobody can change does not need a writer. */
const droMatrixName = ref('Marketing site')
const droMatrixDate = ref('2026-11-01')
const droMatrixPeriod = ref('yearly')
const droMatrixSeats = ref(24)
const droMatrixRegion = ref('eu-west-1')
const droMatrixReceipts = ref(true)
const droMatrixChannels = reactive({ email: true, sms: true })
const droMatrixRenew = ref(true)
const droMatrixRetention = ref(30)
const droRetentionHelper = computed(
  () => `${droMatrixRetention.value} of 90 days`,
)

const droPeriodOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const droRegionOptions = [
  { label: 'eu-west-1', value: 'eu-west-1' },
  { label: 'us-east-1', value: 'us-east-1' },
  { label: 'ap-south-1', value: 'ap-south-1' },
]

/* The substitutes for the six controls that have no readonly prop. Each one is
   the rendering the Rule 4 table asks for, not a dimmed control. */
const droSeatFacts = [{ term: 'Seats', value: '24' }]
const droRegionFacts = [{ term: 'Region', value: 'eu-west-1' }]
const droReceiptFacts = [{ term: 'Email receipts', value: 'Yes' }]
const droChannelFacts = [{ term: 'Notifications', value: 'Email, SMS' }]
const droAttachmentFacts = [
  { term: 'Attachments', value: 'contract.pdf, invoice-2026-08.pdf' },
]

/* Rule 4: the read-only surface that is a facts list, and the same six facts
   rendered as the inert form the audit found. One source, two renderings. */
const droRecordFields = [
  { name: 'name', label: 'Workspace name', value: 'Marketing site' },
  { name: 'id', label: 'Workspace ID', value: 'ws_3f9a2b7c' },
  { name: 'plan', label: 'Plan', value: 'Team' },
  { name: 'region', label: 'Region', value: 'eu-west-1' },
  { name: 'owner', label: 'Owner', value: 'ana@example.com' },
  { name: 'created', label: 'Created', value: '11 March 2026' },
]
const droRecordFacts = droRecordFields.map((field) => ({
  term: field.label,
  value: field.value,
}))
const droEditNoticed = ref(false)

/* Rule 5: a disabled button and a disabled link are not the same thing. */
const droTabProbe = ref('')

/* Rule 6: do not disable a control the user is currently inside. */
const droAsyncWrong = ref('SPRING')
const droAsyncRight = ref('SPRING')
const droAsyncDisabled = ref(false)
const droAsyncReadonly = ref(false)
const droFocusReadout = ref('nothing yet')

function droStartWrong() {
  droAsyncDisabled.value = false
  setTimeout(() => {
    droAsyncDisabled.value = true
    setTimeout(() => (droAsyncDisabled.value = false), 2500)
  }, 2000)
}

function droStartRight() {
  droAsyncReadonly.value = false
  setTimeout(() => {
    droAsyncReadonly.value = true
    setTimeout(() => (droAsyncReadonly.value = false), 2500)
  }, 2000)
}

/* The readout is polled rather than driven by focus events, because the event
   this demo is about is the one the browser does not send anywhere useful:
   focus landing on <body> after the element holding it was disabled. */
let droFocusTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  droFocusTimer = setInterval(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) {
      droFocusReadout.value = 'body (nothing focused)'
      return
    }
    const name = el.getAttribute('name')
    droFocusReadout.value = name
      ? `${el.tagName.toLowerCase()} name="${name}"`
      : el.tagName.toLowerCase()
  }, 200)
})

onBeforeUnmount(() => clearInterval(droFocusTimer))
</script>

<style scoped>
/* The preview area lays its slot out as a stretching grid, so a demo with more
   than one child goes in a plain wrapper that keeps each child its own height. */
.dro-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}

.dro-stack--narrow {
  max-width: 380px;
}

.dro-inline {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-end;
  width: 100%;
}

/* Normal, disabled, read-only: one control, three columns, collapsing to one
   on a narrow viewport where three field boxes would be unreadable. */
.dro-three {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.dro-cell {
  display: flex;
  flex-direction: column;
  gap: var(--nb-base-unit);
}

.dro-cap,
.dro-head {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--nb-c-text-subtle);
}

/* Wrong on the left, right on the right, one column when there is not room
   for two. */
.dro-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.dro-half {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: flex-start;
  padding: calc(var(--nb-base-unit) * 1.5);
  border-radius: var(--nb-radius-md);
  border: 1px solid var(--nb-c-border);
}

.dro-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.dro-half--right {
  border-color: var(--nb-c-success-surface);
}

.dro-half > .nb-text-input,
.dro-half > .dro-stack {
  width: 100%;
}

.dro-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.dro-half--wrong .dro-label {
  color: var(--nb-c-danger);
}

.dro-half--right .dro-label {
  color: var(--nb-c-success);
}

.dro-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* The adjacent sentence that a disabled control is not allowed to replace. It
   is body text at body contrast, which is the entire point of it. */
.dro-hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--nb-c-text);
}

.dro-readout {
  margin: 0;
  font-size: 13px;
  color: var(--nb-c-text-muted);
}

/* Ten controls by three states needs more width than a docs column has, so the
   grid keeps its columns and the wrapper scrolls. Squeezing the fields would
   change how they render, which is the one thing this grid cannot do. */
.dro-scroll {
  width: 100%;
  overflow-x: auto;
}

.dro-matrix {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  min-width: 640px;
  align-items: start;
}

.dro-mcell {
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--nb-base-unit) * 2);
  border-bottom: 1px solid var(--nb-c-border);
}
</style>
