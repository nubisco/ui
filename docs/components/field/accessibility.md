---
layout: nubisco
title: Field
intro: '`NbField` is a labeled row: a label and a control sharing one grid. A stack of `NbField`s lines up on a single spine automatically, with no per-field CSS, which makes it the building block of an inspector or a settings panel. Wrap any control and it falls into place.'
source: src/components/Field.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: not applicable
  screenReader: not recorded
---

## What the component guarantees

- **A real `<label>`** with `for` set to an id the field generates, or to `label-for` when you pass one.
- **That id, handed to you.** The default slot receives `id`; bind it on your control and the label names it, and clicking the label focuses it.
- **The hint, linked.** With `hint` (or the `#hint` slot), the hint gets an id of its own and the default slot receives it as `describedby`. Bind it as `aria-describedby` and the hint is read with the control. When there is no hint, `describedby` is `undefined`, so nothing points at a missing element.
- Tested in `tests/Field.test.ts` and `tests/fieldValidationAria.test.ts`, and by axe in `tests/axe.test.ts`.

```vue
<NbField label="Display name" hint="Shown on your invoices">
  <template #default="{ id, describedby }">
    <input :id="id" :aria-describedby="describedby" />
  </template>
</NbField>
```

## Keyboard

None of its own. `NbField` is layout; the control inside it takes the keys.

## What you own

- **Binding `id` and `describedby`.** A control that ignores the slot props is laid out correctly and announced with no name. Library fields take `id` as a prop.
- **Not doubling labels.** If the control inside has its own `label` (an `NbTextInput` with `label`), leave `NbField`'s off, or a reader hears two names.

## Known gaps

- The label shows a `title` tooltip with its own text for truncated labels. It is the only way to see a truncated label in full, which a keyboard user cannot trigger.
- No manual screen reader pass has been recorded for this component.
