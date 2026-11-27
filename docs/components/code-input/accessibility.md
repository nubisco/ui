---
layout: nubisco
title: Code Input
intro: '`NbCodeInput` takes a short code a person reads from somewhere else: a sign-in code from an email or an authenticator app, or a device code. It is one real text field drawn as a row of slots, so paste, autofill from a message and password managers all work as they do in any field.'
source: src/components/CodeInput.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: tested
  keyboard: native
  screenReader: not recorded
---

## Accessibility

- One native text input, named by `label` (or "Verification code" without
  one), and described by its length: "6 digits", or "8 characters" for an
  alphanumeric code. The drawn slots and the separator are hidden from
  assistive technology, so a screen reader meets one field, not one box per
  character.
- The keyboard is the browser's own: typing, paste, Backspace, Delete, the
  arrow keys, Home, End and selection. A character typed over a filled slot
  replaces it. It is one tab stop.
- `autocomplete="one-time-code"` lets iOS and Android offer a code from a
  message, and lets a password manager fill one from an authenticator.
  `inputmode` opens the number pad for a numeric code.
- With `state="error"` the field carries `aria-invalid="true"`, and the
  `error` message sits in a polite live region linked to the field through
  `aria-describedby`, so it is announced when it appears and read again
  whenever the field takes focus.
- Verifying and success are announced through `NbInlineLoading`'s status
  region ("Verifying", "Verified"). The field is read only in both.
- Focus is visible: the active slot carries the library's 2px focus ring,
  and the caret is drawn in the next empty slot.
- The result never rests on colour alone: an error has its message, and
  success has its check and its "Verified" text.
- Reduced motion drops the shake, the left to right stagger and the caret's
  blink. The colours and the message stay.
- After an error the value clears and focus returns to the field, so the
  next try starts where the person already is.
- On a phone the slots shrink to fit the width, and the field's text is
  never below 16px, so iOS does not zoom in when it takes focus.
- Under forced colours the hidden text of the input stays hidden, and the
  slot borders and focus ring take the system colours.
