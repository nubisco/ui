---
layout: nubisco
title: Log View
intro: '`NbLogView` is read-only output: a log or a terminal, in monospace, following the newest line unless the reader scrolled up, with a copy-all action. It renders only the newest lines, so a log that runs for hours stays as quick as one that just started.'
source: src/components/LogView.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview dir="col">
  <NbButton variant="tertiary" size="sm" @click="toggle">{{ running ? 'Stop the feed' : 'Start a feed' }}</NbButton>
  <div style="height: 260px; width: 100%; max-width: 640px">
    <NbLogView :lines="lines" />
  </div>
</preview>

```vue
<template>
  <NbLogView :lines="run.output" style="height: 320px" />
</template>
```

## When to use it

For output a machine writes and a person reads: a build, a deploy, an agent's tool calls, a device's event stream. A conversation people reply to is an [`NbChatThread`](/components/chat-thread/usage), and structured data is a [table](/components/data-table/usage) or a [JSON tree](/components/json-tree/usage).

## Lines

A line is a plain string or an object with `text` and, optionally, a `time`, a `level` and a `marker`. The time is shown as a time of day with seconds in `body-sm`'s muted colour, in the `code-sm` set like the rest. The marker is a short word naming the line's kind or source (`stderr`, `tool`, `git`).

`level` colours the words, never the row: `error` takes the error text colour and `warning` the warning text colour, both held to 4.5:1 on every layer, and each shows its word as the marker when the line has none, so the level is never carried by colour alone. `debug` is muted. A filled row in a log would read as selected, and a log of errors would be a wall of red.

## Following the newest line

While the reader is at the end, every new line keeps them there. Once they scroll up, nothing moves under them, and a "Jump to newest" button appears when more arrives. `follow` off leaves the scroll entirely to the reader.

## Long logs

Only the newest `max-lines` (1000) are rendered, and a note at the top says how many earlier lines are not shown. They are still in `lines`, and copy-all still copies them. Lines off screen skip layout and paint (`content-visibility`), so the rendered part costs about what is visible. `max-lines` of `0` renders every line.

<preview dir="col">
  <div style="height: 200px; width: 100%; max-width: 640px">
    <NbLogView :lines="many" :max-lines="500" />
  </div>
</preview>

## Wrapping

Long lines wrap by default, breaking anywhere a path or a hash needs to. `wrap` off keeps each line on one row and scrolls the log sideways, for output whose columns line up.

## Empty

With no lines it says "No output yet", or `empty-text`, or the `#empty` slot.

<preview dir="col">
  <div style="height: 120px; width: 100%; max-width: 640px">
    <NbLogView :lines="[]" empty-text="The run has not started" />
  </div>
</preview>

<!--@include: ./_shared.md-->
