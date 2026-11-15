---
layout: nubisco
title: Log View
intro: '`NbLogView` is read-only output: a log or a terminal, in monospace, following the newest line unless the reader scrolled up, with a copy-all action. It renders only the newest lines, so a log that runs for hours stays as quick as one that just started.'
source: src/components/LogView.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

It fills the height it is given and scrolls inside it. Give it a height through its container or a `max-height`.

## Props

| Prop        | Type                                | Default   | Description                                                                                |
| ----------- | ----------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `lines`     | `ReadonlyArray<ILogLine \| string>` | required  | The lines, oldest first                                                                    |
| `maxLines`  | `number`                            | `1000`    | The most lines rendered: the newest. The rest are counted in a note. `0` renders every one |
| `follow`    | `boolean`                           | `true`    | Follows the newest line while the reader is at the end                                     |
| `wrap`      | `boolean`                           | `true`    | Wraps long lines. Off, the log scrolls sideways                                            |
| `copyable`  | `boolean`                           | `true`    | Shows the copy-all button                                                                  |
| `label`     | `string`                            | catalogue | The log's accessible name (`logViewLabel`, "Log")                                          |
| `announce`  | `boolean`                           | `false`   | Announces new lines to a screen reader                                                     |
| `emptyText` | `string`                            | catalogue | What the empty log says (`logViewEmpty`, "No output yet")                                  |
| `locale`    | `string`                            | runtime   | BCP 47 tag for formatting line times                                                       |

## ILogLine

| Field       | Type                       | Description                                                                      |
| ----------- | -------------------------- | -------------------------------------------------------------------------------- |
| `id`        | `string \| number`         | A stable key. Without it the line's position is used                             |
| `text`      | `string`                   | The line                                                                         |
| `time`      | `string \| number \| Date` | When it was written, shown as a time of day with seconds                         |
| `timeLabel` | `string`                   | A ready-made time string, used in place of the formatted `time`                  |
| `level`     | `TLogLevel`                | `'error' \| 'warning' \| 'info' \| 'debug'`                                      |
| `marker`    | `string`                   | A short word before the text. Defaults to the level's word for error and warning |

## Slots

| Slot    | Description                    |
| ------- | ------------------------------ |
| `empty` | Shown while there are no lines |

## Exposed

| Name             | Type         | Description                        |
| ---------------- | ------------ | ---------------------------------- |
| `scrollToNewest` | `() => void` | Scrolls the log to the newest line |

## Strings

From the catalogue, through `provideNbStrings()`: `logViewLabel`, `logViewEmpty`, `logViewCopy` ("Copy log"), `logViewHidden(count)` ("1,500 earlier lines not shown"), `logViewError` and `logViewWarning` (the default markers), and `jumpToNewest`, shared with `NbChatThread`.

## Copy

Copy-all copies every line in `lines`, including those not rendered, one per line, each as it is shown: time, marker and text separated by spaces.

## Appending

Push to the array. Lines are keyed by `id`, or by their position when they have none, which stays stable as long as lines are only appended. A log that trims its own oldest lines should give each one an `id`.

```ts
const output = ref<ILogLine[]>([])
source.onmessage = (event) => output.value.push(JSON.parse(event.data))
```

<!--@include: ./_shared.md-->
