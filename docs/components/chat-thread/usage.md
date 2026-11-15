---
layout: nubisco
title: Chat Thread
intro: '`NbChatThread` is a conversation: a scrolling log of `NbChatMessage`s that follows the newest one unless the reader has scrolled up, and an optional composer under it. Use it where people talk to each other or to an agent.'
source: src/components/ChatThread.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview dir="col">
  <div style="height: 420px; width: 100%; max-width: 560px; display: flex; border: 1px solid var(--nb-c-border)">
    <NbChatThread v-model:draft="draft" composer :working="working" stoppable @send="onSend" @stop="working = false">
      <NbChatMessage v-for="m in messages" :key="m.id" :author="m.author" :picture="m.picture" :own="m.own" :ai="m.ai" :text="m.text" :time="m.time" ai-explain="Phrased by the workspace's model from the import's own error report." />
    </NbChatThread>
  </div>
</preview>

```vue
<template>
  <NbChatThread
    v-model:draft="draft"
    composer
    :working="agentBusy"
    stoppable
    @send="post"
    @stop="cancel"
  >
    <NbChatMessage
      v-for="m in messages"
      :key="m.id"
      :author="m.author"
      :picture="m.picture"
      :own="m.authorId === me.id"
      :ai="m.writtenByModel"
      :text="m.text"
      :time="m.createdAt"
    />
  </NbChatThread>
</template>
```

## When to use it

For an exchange read in order, where who said what matters: a support thread, a comment conversation, a session with an agent. A feed of events nobody replies to is a list or an [`NbLogView`](/components/log-view/usage), and a single notice is a [toast](/components/toast/usage) or a [banner](/components/banner/usage).

## The two sides

The viewer's own messages (`own`) sit at the end of the line on the accent surface. Everyone else's sit at the start on the plain surface, with a border. The two are told apart by place and surface, never by a status colour, so a message about an error still reads as a message. Each carries its author, an optional avatar (`picture`: a URL, or `null` for initials), and its time of day in `body-sm`, with the full date as a tooltip.

## Messages a model wrote

Set `ai` on every message a model wrote. It draws the inline [AI label](/components/ai-label/usage) after the author's name, which is where the AI label docs put it for a heading. `ai-explain`, or the `#ai-explain` slot, is what the label says when opened: the inputs the product gave the model, the provider and model, and whether a plain fallback was used. A label that needs more (`revertable`, `plain-available`) goes in the `#ai-label` slot whole. Do not label a message an automation wrote with no model in it.

## Following the newest message

While the reader is at the end, every new message, and text streamed into the last one, keeps them there. Once they scroll up to read, nothing moves under them, and a "Jump to newest" button appears when something new arrives. It scrolls smoothly, or instantly under reduced motion.

## Working

`working` shows an [`NbInlineLoading`](/components/inline-loading/usage) after the newest message ("Working", or `working-label`) and marks the log busy. With `stoppable`, a stop button joins the send button while it lasts and emits `stop`. Sending stays possible, so a follow-up can be queued.

## The composer

`composer` adds a multiline field and a send button. On a desktop <kbd>Enter</kbd> sends and <kbd>Shift</kbd>+<kbd>Enter</kbd> breaks the line. On a phone <kbd>Enter</kbd> breaks the line, as the keyboard's return key promises, and the button sends. The field starts at one row and grows with the text up to `max-rows`. `send` carries the trimmed text, and the composer empties itself. Blank text is never sent.

`disabled` turns the composer off and keeps the log readable. Always give `disabled-reason`: it is written under the field, and it is the send button's tooltip.

<preview dir="col">
  <div style="height: 200px; width: 100%; max-width: 560px; display: flex; border: 1px solid var(--nb-c-border)">
    <NbChatThread composer disabled disabled-reason="This conversation is archived. Start a new one to continue.">
      <NbChatMessage author="Sam Rivera" text="Thanks, that fixed it." time-label="Yesterday" />
    </NbChatThread>
  </div>
</preview>

## Long text

Long words, links and hashes break anywhere rather than widening the message, and the author's line breaks are kept. A message takes at most 85% of the line, and 92% on a phone.

<!--@include: ./_shared.md-->
