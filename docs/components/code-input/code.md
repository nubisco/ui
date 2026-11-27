---
layout: nubisco
title: Code Input
intro: '`NbCodeInput` takes a short code a person reads from somewhere else: a sign-in code from an email or an authenticator app, or a device code. It is one real text field drawn as a row of slots, so paste, autofill from a message and password managers all work as they do in any field.'
source: src/components/CodeInput.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop           | Type                                            | Default           | Description                                                               |
| -------------- | ----------------------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `modelValue`   | `string`                                        | `''`              | The code (`v-model`). Only the code's characters, never the separator     |
| `length`       | `number`                                        | `6`               | How many characters. Ignored when `groups` is set                         |
| `groups`       | `number[]`                                      | `undefined`       | The code split into groups, as `[4, 4]`. Overrides `length`               |
| `separator`    | `string`                                        | `'-'`             | Drawn between groups, never part of the value                             |
| `mode`         | `'numeric' \| 'alphanumeric'`                   | `'numeric'`       | What it takes. Also sets `inputmode`, so a phone opens the right keyboard |
| `uppercase`    | `boolean`                                       | `false`           | Turns letters to capitals as they are typed or pasted                     |
| `autocomplete` | `string`                                        | `'one-time-code'` | The native `autocomplete`                                                 |
| `state`        | `'idle' \| 'verifying' \| 'success' \| 'error'` | `'idle'`          | Where a check of the code stands                                          |
| `error`        | `string`                                        | `''`              | The message under the slots, linked to the field                          |
| `label`        | `string`                                        | `undefined`       | The visible label. Without it the field is named "Verification code"      |
| `size`         | `'sm' \| 'md' \| 'lg'`                          | `'md'`            | Slots 36, 44 or 52px wide. They shrink together in a narrower container   |
| `autofocus`    | `boolean`                                       | `false`           | Takes focus when mounted                                                  |
| `disabled`     | `boolean`                                       | `false`           | Takes the field out of use, in place                                      |
| `id`           | `string`                                        | generated         | The input's id                                                            |
| `name`         | `string`                                        | `undefined`       | The input's `name`, for a form submitted natively                         |

## Events

| Event               | Payload         | Fired when                                                            |
| ------------------- | --------------- | --------------------------------------------------------------------- |
| `update:modelValue` | `value: string` | The code changed, by typing, paste, autofill, `clear()` or an error   |
| `complete`          | `value: string` | The code reached its full length. Once for each value that gets there |

## Methods

Through a template ref (`ICodeInputExpose`):

| Method    | Does                                                   |
| --------- | ------------------------------------------------------ |
| `focus()` | Puts focus in the field, with the caret after the code |
| `clear()` | Empties the field and puts focus in it                 |

## States

| `state`     | What it draws                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `idle`      | The slots, the active one ringed                                                                    |
| `verifying` | The slots dimmed, `NbInlineLoading` running under them, and the field read only                     |
| `success`   | The borders turn to the success colour left to right (`--nb-motion-quick`, 30ms apart), and a check |
| `error`     | One 6px shake (`--nb-motion-long`), danger borders, then the value clears and focus returns         |

## Slots

None.

## Strings

The names it speaks come from the string catalogue, so `provideNbStrings()`
translates them: `codeInputLabel`, `codeInputDigits(count)`,
`codeInputCharacters(count)`, `codeInputVerifying` and `codeInputVerified`.

## Types

```ts
import type {
  ICodeInputProps,
  ICodeInputExpose,
  TCodeInputMode,
  TCodeInputSize,
  TCodeInputState,
} from '@nubisco/ui'
```
