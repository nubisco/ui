---
layout: nubisco
title: Code Input
intro: '`NbCodeInput` takes a short code a person reads from somewhere else: a sign-in code from an email or an authenticator app, or a device code. It is one real text field drawn as a row of slots, so paste, autofill from a message and password managers all work as they do in any field.'
source: src/components/CodeInput.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<script setup lang="ts">
import { ref } from 'vue'

const code = ref('')
const state = ref<'idle' | 'verifying' | 'success' | 'error'>('idle')
const error = ref('')

// The demo accepts 123456. Anything else is refused.
function verify(value: string) {
  state.value = 'verifying'
  error.value = ''
  setTimeout(() => {
    if (value === '123456') {
      state.value = 'success'
    } else {
      state.value = 'error'
      error.value = 'That code is not right. Check it and try again.'
    }
  }, 900)
}

function onType(value: string) {
  if (value && state.value === 'error') {
    state.value = 'idle'
    error.value = ''
  }
}

function reset() {
  code.value = ''
  state.value = 'idle'
  error.value = ''
}

const device = ref('')
const verifyingCode = ref('482913')
const successCode = ref('482913')

const wrong = ref('')
const wrongState = ref<'idle' | 'error'>('idle')
const wrongError = ref('')
function showWrong() {
  wrong.value = '111111'
  wrongState.value = 'error'
  wrongError.value = 'That code is not right. Check it and try again.'
}
function onWrongType(value: string) {
  if (value) {
    wrongState.value = 'idle'
    wrongError.value = ''
  }
}
</script>

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbCodeInput
      v-model="code"
      label="Sign-in code"
      :state="state"
      :error="error"
      @update:model-value="onType"
      @complete="verify"
    />
    <NbButton variant="ghost" size="sm" @click="reset">Start over</NbButton>
  </div>
</preview>

The demo accepts `123456`. Any other code is refused, shakes, and clears.

```vue
<NbCodeInput
  v-model="code"
  label="Sign-in code"
  :state="state"
  :error="error"
  @complete="verify"
/>
```

## When to use it

- For a code someone copies from somewhere else, of a fixed length: a
  sign-in code sent by email, a code from an authenticator app, a device
  code shown on a television.
- Not for a password, a PIN someone chose, or anything of open length: that
  is [`NbTextInput`](/components/text-input/usage).
- Not for a number to be counted or compared: that is
  [`NbNumberInput`](/components/number-input/usage).

## One field, drawn as slots

There is one `<input>` under the slots, not one per character. That is what
keeps everything a text field already does: pasting a whole code, the code
iOS and Android offer from a message (`autocomplete="one-time-code"`), a
password manager filling a code from an authenticator, selecting, Backspace
and the arrow keys. A screen reader meets one field with one name.

The slots mirror the field. The active slot carries the focus ring, and the
caret is drawn in the next empty slot. A character typed over a filled slot
replaces it. A paste is filtered: spaces, dashes and anything else the mode
does not take are dropped, and the rest is cut to the length.

## Submitting when the code is complete

`complete` fires when the code reaches its full length, once for each value
that gets there. Submitting on it is safe: a key pressed on a full code, or
the same code filled again, does not fire it a second time. After an edit
that brings the code below its length, a new full value fires again.

## Grouped device code

`groups` splits the code and draws `separator` between the groups. The
separator is never part of the value: the model below holds eight
characters. `mode="alphanumeric"` takes letters and digits, and `uppercase`
turns letters to capitals as they are typed or pasted.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbCodeInput
      v-model="device"
      label="Device code"
      :groups="[4, 4]"
      mode="alphanumeric"
      uppercase
    />
    <span>Value: "{{ device }}"</span>
  </div>
</preview>

```vue
<NbCodeInput
  v-model="deviceCode"
  label="Device code"
  :groups="[4, 4]"
  mode="alphanumeric"
  uppercase
/>
```

## Verifying

`state="verifying"` dims the slots, shows the inline loading indicator under
them and makes the field read only, so the code cannot change while it is
being checked.

<preview>
  <NbCodeInput v-model="verifyingCode" label="Sign-in code" state="verifying" />
</preview>

```vue
<NbCodeInput v-model="code" label="Sign-in code" state="verifying" />
```

## Success

`state="success"` turns the slot borders to the success colour from left to
right, one slot after another, and a check fades in. It is short and it
never blocks: navigate whenever you like, the component does not wait for
its own animation.

<preview>
  <NbCodeInput v-model="successCode" label="Sign-in code" state="success" />
</preview>

```vue
<NbCodeInput v-model="code" label="Sign-in code" state="success" />
```

## Error

`state="error"` with an `error` message shakes the slots once and turns
their borders to the danger colour. Then the value clears and focus returns
to the field, ready for the next try. The message stays, linked to the
field, until you take it away.

Set `state` back to `idle` and `error` to `''` when the person starts typing
again, not when the value clears: the component clears the value itself, and
the message should still be there to read.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbCodeInput
      v-model="wrong"
      label="Sign-in code"
      :state="wrongState"
      :error="wrongError"
      @update:model-value="onWrongType"
    />
    <NbButton variant="secondary" size="sm" @click="showWrong">Show a wrong code</NbButton>
  </div>
</preview>

```vue
<script setup lang="ts">
const code = ref('')
const state = ref<'idle' | 'verifying' | 'success' | 'error'>('idle')
const error = ref('')

async function verify(value: string) {
  state.value = 'verifying'
  const ok = await checkCode(value)
  state.value = ok ? 'success' : 'error'
  error.value = ok ? '' : 'That code is not right. Check it and try again.'
  if (ok) router.push('/')
}

// The next character typed puts the field back to idle.
function onType(value: string) {
  if (value && state.value === 'error') {
    state.value = 'idle'
    error.value = ''
  }
}
</script>

<template>
  <NbCodeInput
    v-model="code"
    label="Sign-in code"
    :state="state"
    :error="error"
    @update:model-value="onType"
    @complete="verify"
  />
</template>
```

## Sizes

`sm`, `md` (the default) and `lg` draw slots 36, 44 and 52px wide. When the
row is wider than its container the slots shrink together, so six slots fit
a phone at any size, and eight slots in two groups fit a 296px column. The
desktop row is never changed by this.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbCodeInput label="Small" size="sm" />
    <NbCodeInput label="Medium" />
    <NbCodeInput label="Large" size="lg" />
  </div>
</preview>

## Disabled

<preview>
  <NbCodeInput label="Sign-in code" model-value="1234" disabled />
</preview>

## Reduced motion

With reduced motion asked for, there is no shake and no left to right
stagger, and the caret holds still. The colours and the message carry the
result on their own.

## Light and dark

The slots use the field colours and the success and danger tokens, so they
follow the theme. Switch the docs theme to see both.
