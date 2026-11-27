/** Which characters a code is made of. */
type TCodeInputMode = 'numeric' | 'alphanumeric'

/**
 * Where a check of the code stands. `verifying` dims the slots, shows the
 * inline loading indicator and makes the field read only. `success` turns the
 * slots green from left to right and shows a check. `error` shakes the slots
 * once, turns them red, then clears the value and returns focus.
 */
type TCodeInputState = 'idle' | 'verifying' | 'success' | 'error'

/** The slot sizes: `sm` 36px wide, `md` 44px (the default) and `lg` 52px. */
type TCodeInputSize = 'sm' | 'md' | 'lg'

interface ICodeInputProps {
  /**
   * The code (`v-model`). It holds only the characters of the code, never the
   * separator, and it is filtered to `mode` and cut to the length.
   */
  modelValue?: string
  /** How many characters the code has. Ignored when `groups` is set. */
  length?: number
  /**
   * The code split into groups, drawn with `separator` between them: `[4, 4]`
   * is an eight character code shown as `ABCD-EFGH`. Overrides `length`.
   */
  groups?: number[]
  /** Drawn between groups. Only drawn, never part of the value. */
  separator?: string
  /**
   * `numeric` takes digits and opens the number pad on a phone.
   * `alphanumeric` takes letters and digits.
   */
  mode?: TCodeInputMode
  /** Turns letters to capitals as they are typed or pasted. */
  uppercase?: boolean
  /**
   * The native `autocomplete`. `one-time-code` lets iOS, Android and password
   * managers fill a code from a message or an authenticator.
   */
  autocomplete?: string
  /** Where a check of the code stands. */
  state?: TCodeInputState
  /** The message shown under the slots, and linked to the field, when the code is wrong. */
  error?: string
  /**
   * The visible label. Without it the field is named by the catalogue's
   * `codeInputLabel` ("Verification code").
   */
  label?: string
  /** The slot size. On a narrow screen the slots shrink to fit, at any size. */
  size?: TCodeInputSize
  /** Takes focus when mounted. */
  autofocus?: boolean
  /** Takes the field out of use, in place. */
  disabled?: boolean
  /** The id of the input. Generated when not given. */
  id?: string
  /** The `name` of the input, for a form that is submitted natively. */
  name?: string
}

/** What a template ref to `NbCodeInput` can call. */
interface ICodeInputExpose {
  /** Puts focus in the field, with the caret after the last character. */
  focus: () => void
  /** Empties the field and puts focus in it. */
  clear: () => void
}

export type {
  ICodeInputExpose,
  ICodeInputProps,
  TCodeInputMode,
  TCodeInputSize,
  TCodeInputState,
}
