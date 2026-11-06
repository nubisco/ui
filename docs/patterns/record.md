---
layout: nubisco
title: Record
description: The shape of a page or inspector about one thing. A sticky header with one status badge and the facts, the one or two things the record is always open, everything else disclosed with counts, and nested relations one plane deeper.
---

A record view is about one thing: a task, an invoice, a customer. It is opened
to answer "what is this, what state is it in, and what do I do next", and then
to dig into one part of it. The page has to answer the first question in the
header and make the digging cheap, without showing everything the record knows
at the same volume.

## Before: everything at once, or everything folded

Two uniform versions are common. In one, every section is open: description,
checklist, links, history, attachments and comments in one long column, each
with the same heading, so the description is as easy to miss as the history.
In the other, every section is folded into an accordion, so the record opens
showing nothing, and the conversation, the part people come back for, is one
more click away than it should be. In both, the header is hand-built, carries
four badges ("Open", "Archived", "Past its date", "Quiet for a month") and
scrolls away with the page.

## After: the header stays, the record is open, the rest is a click away

<preview>
  <div style="width: 100%; max-width: 44rem; display: flex; flex-direction: column; gap: 24px">
    <NbPageHeader
      title="Rotate the signing keys"
      :actions="[
        { id: 'done', label: 'Mark done', icon: 'check', variant: 'primary', priority: 'primary' },
        { id: 'share', label: 'Share', icon: 'share-network', variant: 'ghost' },
      ]"
    >
      <template #eyebrow><span>Part of</span><a href="#after-the-header-stays-the-record-is-open-the-rest-is-a-click-away">Security hardening</a><code>OPS-12</code></template>
      <template #status><NbBadge variant="orange">In progress</NbBadge></template>
      <template #facts>
        <NbDefinitionList layout="auto" compact :items="[
          { term: 'Owner', value: 'Sam Rivera' },
          { term: 'Due', value: 'Friday' },
          { term: 'Priority', value: 'High' },
        ]" />
      </template>
    </NbPageHeader>
    <section>
      <h2 class="type-heading-02" style="margin: 0 0 8px">Description</h2>
      <p class="type-body-md" style="margin: 0">Replace the signing keys before the old ones expire, then revoke the old pair once every service has picked up the new one.</p>
    </section>
    <NbAccordion flush size="sm">
      <NbAccordionItem title="Checklist" meta="3 of 5">
        <NbContainedList aria-label="Checklist" size="sm">
          <NbContainedListItem title="Generate the new pair" line="Done" />
          <NbContainedListItem title="Roll out to staging" line="Done" />
          <NbContainedListItem title="Roll out to production" />
        </NbContainedList>
      </NbAccordionItem>
      <NbAccordionItem title="Linked items" meta="2">
        <NbPanel>
          <NbContainedList aria-label="Linked items" size="sm">
            <NbContainedListItem item-key="OPS-9" title="Review the backup report" href="#after-the-header-stays-the-record-is-open-the-rest-is-a-click-away" />
            <NbContainedListItem item-key="OPS-4" title="Audit service accounts" href="#after-the-header-stays-the-record-is-open-the-rest-is-a-click-away" />
          </NbContainedList>
        </NbPanel>
      </NbAccordionItem>
      <NbAccordionItem title="History" meta="14" />
    </NbAccordion>
    <section>
      <h2 class="type-heading-02" style="margin: 0 0 8px">Comments</h2>
      <p class="type-body-sm" style="margin: 0; color: var(--nb-c-text-muted)">The conversation stays open, last, where people come back to it.</p>
    </section>
  </div>
</preview>

## The anatomy

1. **A sticky [`NbPageHeader`](/components/page-header/usage).** The key and
   the parent in the eyebrow, the record's name as the `<h1>`, **one** status
   badge, three to five facts in an `NbDefinitionList` with `layout="auto"`,
   and the record's one primary action. `sticky`, so the name, the state and
   the action stay in reach while the record scrolls.
2. **The one or two things the record is, always open.** Usually the
   description, and the conversation. They are what the record is, and hiding
   them behind a disclosure means every record opens showing nothing.
3. **Everything else disclosed, with counts.** `NbAccordion flush` with each
   item's count in its `meta` ("3 of 5", "14"), so the reader knows what is
   behind a section before opening it. One open at a time. Never nested.
4. **Nested relations one plane deeper.** A linked item, a sub-record, a
   dependency: a well inside the section (an `NbPanel`, which paints one plane
   deeper on its own), not another accordion.

## Rules

- **Critical information at the higher level.** If the reader needs it to
  decide what to do next, it is in the header or always open. Everything else
  is disclosed.
- **One badge.** The record is in one state. Archived, overdue and quiet are
  facts, or a banner, not three more badges. See
  [Status indicators](/patterns/status-indicators), rule 5.
- **The always-open sections outrank the disclosed ones.** They get a
  `heading-02` heading; the accordion headers are quieter. If they look like
  peers of "History", the argument for keeping them open is lost.
- **Two planes at most.** The page, a well inside a section, and stop.

## Reference

Acta's card inspector is the screen this pattern is written against. Its
comments state the rule better than this page does: the description is what
the card is, so putting it behind a disclosure means every card opens showing
nothing, and burying the conversation behind a disclosure is the fault the
whole layout exists to fix. What it still lacks is the rank between the open
sections and the folded ones, and a library page header in place of its
hand-built sticky head.
