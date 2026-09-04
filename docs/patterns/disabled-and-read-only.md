---
title: Disabled and read-only
description: The difference almost everyone gets wrong, why a disabled control is never an explanation, and the read-only presentation of every input this library ships.
---

# Disabled and read-only

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
- Therefore **a `v-tooltip` on a disabled `NbButton` can never fire.** No
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
<NbButton v-tooltip="'Select at least one row'" disabled>Delete</NbButton>

<!-- Right: the state is visible, and so is the way out of it -->
<NbButton :disabled="selected.length === 0" variant="danger">Delete</NbButton>
<p v-if="selected.length === 0" class="hint">Select rows to delete them.</p>
```

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

```vue
<!-- The only disabled submit we accept -->
<NbButton
  type="submit"
  variant="primary"
  :loading="saving"
>Save changes</NbButton>
```

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
- A `v-tooltip` on a disabled `NbButton`, which could never fire because the
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
