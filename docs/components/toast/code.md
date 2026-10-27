---
layout: nubisco
title: Toast
intro: '`NbToast` is one toast: an icon, an optional title, a message, an optional action and a close button. It is the leaf.'
source: src/components/Toast.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop          | Type                                          | Default               | Description                                                                                                                                                                                                                                                 |
| ------------- | --------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`     | `string`                                      | none                  | **Required.** The body text.                                                                                                                                                                                                                                |
| `variant`     | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`              | Accent, icon, hidden severity word, announcement politeness, and under a host the lifetime. [Choosing the variant](#choosing-the-variant).                                                                                                                  |
| `title`       | `string`                                      | none                  | Optional heading above the message.                                                                                                                                                                                                                         |
| `duration`    | `number`                                      | `4000`                | Milliseconds the countdown bar represents. Standalone, it is also the auto-dismiss timer. `0` draws no bar and never dismisses. Under a host the default comes from the variant instead (`NB_TOAST_DURATIONS`), and any toast with a `cta` defaults to `0`. |
| `cta`         | `{ label: string; action: () => void }`       | none                  | One action. Pressing it runs `action()`, emits `action`, then emits `close`.                                                                                                                                                                                |
| `role`        | `'alert' \| 'status' \| 'none'`               | `'alert'`             | ARIA role. A real prop, not a fallthrough attribute, so it cannot be lost by a later refactor. `NbToaster` passes `none` (see below).                                                                                                                       |
| `ariaLive`    | `'assertive' \| 'polite' \| 'off'`            | by variant            | Politeness. Defaults to `assertive` for `error` and `polite` otherwise.                                                                                                                                                                                     |
| `statusLabel` | `string`                                      | the variant, in words | Visually hidden severity word, read before the title. Pass your own to translate it, or `''` to suppress it.                                                                                                                                                |
| `closeLabel`  | `string`                                      | `'Close'`             | Accessible name of the close button. Translate it.                                                                                                                                                                                                          |
| `managed`     | `boolean`                                     | `false`               | `true` when a host owns the clock. The toast then runs no timer of its own and takes its pause state from `paused`.                                                                                                                                         |
| `paused`      | `boolean`                                     | `false`               | Countdown held. Only read when `managed`.                                                                                                                                                                                                                   |
| `cycle`       | `number`                                      | `0`                   | Bump it to restart the countdown bar after the message changed, so a rewritten toast does not inherit the previous message's remainder.                                                                                                                     |

## Events

| Event    | Payload | Description                                                                                                     |
| -------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `close`  | none    | The toast should be removed: the timer elapsed, the close button was pressed, or the action was taken.          |
| `action` | none    | The action was pressed. Emitted just before `close`, so a host can tell "the reader acted" from "it timed out". |

The parent removes the component. `NbToast` never removes itself from the DOM.

## Tokens

| Token                                                              | Used for                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `--nb-c-bg`, `--nb-c-border`                                       | Surface and outline.                                            |
| `--nb-c-success`, `--nb-c-danger`, `--nb-c-warning`, `--nb-c-info` | Icon and the leading accent rule, per variant.                  |
| `--nb-c-text`, `--nb-c-text-muted`, `--nb-c-text-subtle`           | Title, message, close button.                                   |
| `--nb-c-scrim`                                                     | The shadow is mixed from it, so it deepens with the dark theme. |
| `--nb-radius-md`, `--nb-radius-sm`                                 | Corners.                                                        |
| `--nb-spacing-2/4/10/12/14/16/24`                                  | Gaps, padding and the close button's box.                       |
| `--nb-font-size-12`, `--nb-font-size-13`                           | Action, and the title and message.                              |

Nothing here is a raw hex value or a token with a hardcoded fallback, and `tests/Toaster.test.ts` fails the build if one comes back.
