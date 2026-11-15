---
layout: nubisco
title: Chat Thread
intro: '`NbChatThread` is a conversation: a scrolling log of `NbChatMessage`s that follows the newest one unless the reader has scrolled up, and an optional composer under it. Use it where people talk to each other or to an agent.'
source: src/components/ChatThread.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## NbChatThread

It fills the height it is given and scrolls inside it. Give it a height through its container: a flex column, a panel body, a grid row.

### Props

| Prop             | Type      | Default   | Description                                                                 |
| ---------------- | --------- | --------- | --------------------------------------------------------------------------- |
| `draft`          | `string`  | `''`      | The composer's text (`v-model:draft`)                                       |
| `label`          | `string`  | catalogue | The log's accessible name (`chatThreadLabel`, "Conversation")               |
| `working`        | `boolean` | `false`   | Shows the working indicator after the newest message and marks the log busy |
| `workingLabel`   | `string`  | catalogue | What the indicator says (`chatThreadWorking`, "Working")                    |
| `composer`       | `boolean` | `false`   | Shows the composer under the log                                            |
| `composerLabel`  | `string`  | catalogue | The field's accessible name (`chatThreadMessage`, "Message")                |
| `placeholder`    | `string`  | catalogue | The field's placeholder (`chatThreadPlaceholder`, "Write a message")        |
| `disabled`       | `boolean` | `false`   | Turns the composer off. The log stays readable                              |
| `disabledReason` | `string`  | -         | Why: under the field and as the send button's tooltip                       |
| `stoppable`      | `boolean` | `false`   | While `working`, shows a stop button that emits `stop`                      |
| `sendLabel`      | `string`  | catalogue | The send button's name and tooltip (`chatThreadSend`, "Send")               |
| `stopLabel`      | `string`  | catalogue | The stop button's name and tooltip (`chatThreadStop`, "Stop")               |
| `maxRows`        | `number`  | `6`       | Rows the field grows to before it scrolls                                   |

### Events

| Event          | Payload        | Description                                                    |
| -------------- | -------------- | -------------------------------------------------------------- |
| `send`         | `text: string` | The trimmed text. The composer empties itself after emitting   |
| `stop`         | -              | The stop button was pressed                                    |
| `update:draft` | `string`       | On every keystroke, and when the composer empties after a send |

### Slots

| Slot      | Description                                  |
| --------- | -------------------------------------------- |
| `default` | The messages, oldest first                   |
| `empty`   | Shown in the log while there are no messages |

### Exposed

| Name             | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| `scrollToNewest` | `() => void` | Scrolls the log to the newest message |
| `focus`          | `() => void` | Moves focus into the composer         |

The "Jump to newest" button is named by the catalogue's `jumpToNewest`, shared with `NbLogView`.

## NbChatMessage

### Props

| Prop        | Type                       | Default  | Description                                                                        |
| ----------- | -------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `author`    | `string`                   | required | Who said it                                                                        |
| `picture`   | `string \| null`           | -        | A URL draws the picture, `null` the author's initials. Left out, no avatar         |
| `own`       | `boolean`                  | `false`  | The viewer's own message: at the end of the line, on the accent surface            |
| `text`      | `string`                   | `''`     | The message as plain text. Line breaks are kept                                    |
| `time`      | `string \| number \| Date` | -        | When it was said: a `<time>`, as a short time of day, the full date as its tooltip |
| `timeLabel` | `string`                   | -        | A ready-made time string, used in place of the formatted `time`                    |
| `locale`    | `string`                   | runtime  | BCP 47 tag for formatting `time`                                                   |
| `ai`        | `boolean`                  | `false`  | A model wrote it: draws the inline AI label after the author                       |
| `aiExplain` | `string`                   | -        | What the AI label explains when opened                                             |

### Slots

| Slot         | Description                                                                                |
| ------------ | ------------------------------------------------------------------------------------------ |
| `default`    | Rich content in place of `text`                                                            |
| `ai-explain` | Rich content for the AI label's explanation                                                |
| `ai-label`   | Replaces the AI label whole, for one that needs `revertable`, `plain-available` or actions |

## Streaming a reply

Text streamed into the last message is followed like a new message, because the thread watches what it renders rather than a prop. Push the message once and grow its `text`.

```ts
const reply = reactive({
  id: crypto.randomUUID(),
  author: 'Assistant',
  ai: true,
  text: '',
})
messages.value.push(reply)
for await (const chunk of stream) reply.text += chunk
```

<!--@include: ./_shared.md-->
