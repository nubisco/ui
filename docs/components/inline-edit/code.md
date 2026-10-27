---
layout: nubisco
title: Inline Edit
intro: '`NbInlineEdit` renders a value as plain text until the user chooses to edit it. Clicking the text (or pressing Enter while it has focus) swaps in an input; Enter or blur commits, Escape restores the value the edit started from. Use it wherever a permanently-rendered input would misrepresent the surface: item and record titles, dialog headings, card names.'
source: src/components/InlineEdit.vue
tab: code
pageTabs: ['usage', 'code']
---

## Empty values

With an empty value the `placeholder` renders muted in presentation mode, so the affordance stays discoverable.

<preview>
  <NbInlineEdit v-model="subtitle" label="Subtitle" placeholder="Add a subtitle..." />
</preview>

```vue
<NbInlineEdit
  v-model="subtitle"
  label="Subtitle"
  placeholder="Add a subtitle..."
/>
```

## Props

| Prop          | Type                   | Default | Description                                  |
| ------------- | ---------------------- | ------- | -------------------------------------------- |
| `modelValue`  | `string`               | —       | Current value                                |
| `label`       | `string`               | —       | Accessible name; required                    |
| `placeholder` | `string`               | —       | Muted text when the value is empty           |
| `size`        | `'md' \| 'lg' \| 'xl'` | `'md'`  | Type scale of presentation and edit modes    |
| `disabled`    | `boolean`              | `false` | Presentation only; editing cannot be entered |

## Events

| Event               | Payload  | When                                      |
| ------------------- | -------- | ----------------------------------------- |
| `update:modelValue` | `string` | Live, on every keystroke while editing    |
| `commit`            | `string` | Enter or blur ended the edit              |
| `cancel`            | —        | Escape ended the edit; the value reverted |

## Exposed

| Member    | Description                      |
| --------- | -------------------------------- |
| `start()` | Enter edit mode programmatically |

## Accessibility

- Presentation mode is a real `button` whose accessible name carries the label, the current value, and the edit affordance.
- The input takes the `label` as its `aria-label`, receives focus with the value selected, and hands focus back naturally on commit.
- `disabled` keeps the text readable while removing the interactive affordance.

<!--@include: ./_shared.md-->
