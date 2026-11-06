---
layout: nubisco
title: Page Header
intro: "`NbPageHeader` is the top of a page: where it sits, what it is called, the one state it is in, the few facts that define it, and what can be done to it. It renders the page's one `<h1>`."
source: src/components/PageHeader.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <NbPageHeader
    title="Migrate the billing service"
    :actions="[
      { id: 'edit', label: 'Edit', icon: 'pencil-simple', variant: 'primary', priority: 'primary' },
      { id: 'share', label: 'Share', icon: 'share-network', variant: 'ghost' },
    ]"
    style="width: 100%"
  >
    <template #eyebrow>
      <span>Part of</span><a href="#anatomy">Platform roadmap</a><span>·</span><code>PLAT-14</code>
    </template>
    <template #status><NbBadge variant="green">On track</NbBadge></template>
    <template #description>Move invoicing off the old service before the contract renews.</template>
    <template #facts>
      <NbDefinitionList layout="auto" compact :items="[
        { term: 'Owner', value: 'Sam Rivera' },
        { term: 'Target', value: '30 June' },
        { term: 'Started', value: '2 March' },
      ]" />
    </template>
  </NbPageHeader>
</preview>

## Anatomy

| Part           | Holds                                                           | Never holds                               |
| -------------- | --------------------------------------------------------------- | ----------------------------------------- |
| `#eyebrow`     | Where the thing sits: its parent ("Part of"), its key           | A second breadcrumb trail                 |
| `title`        | The page's name, as its one `<h1>`, at `heading-03`, regular    | A string that only repeats the last crumb |
| `#status`      | **Exactly one** `NbBadge`: the state the thing is in            | A second badge, a flag, a warning         |
| `#description` | One or two sentences on why it exists                           | Instructions, help text                   |
| `#facts`       | An `NbDefinitionList` with `layout="auto"`: three to five facts | Everything the record knows               |
| `actions`      | The page's one primary and its quieter siblings                 | A second filled button                    |

## One `<h1>`, and the trail names the page

The app frame has one rule for every page: **exactly one `<h1>`**, in the
page, and **one breadcrumb trail**, in `topbar-left`, whose last crumb is the
current page. See [The app frame](/patterns/app-frame).

`NbPageHeader` is that `<h1>`. So:

- **Do not render a second title** above or below it, and do not put another
  `<h1>` in the view.
- **Do not repeat the last crumb.** A title that is only the page's location
  ("Settings" under a trail ending in "Settings") spends the best line of the
  screen on nothing. The header is for pages whose title is content: a
  record's name, a document's title, a person.
- **The eyebrow is not a trail.** It says what the thing belongs to, in a
  phrase ("Part of Platform roadmap"), not the path to it. The path is the
  frame's job.

## One badge

The status slot takes one `NbBadge`, and warns in development when it is given
more than one element. A record that is "On track", "Archived", "Past its
date" and "Quiet for a month" all at once is in one state, and the others are
facts or a banner. See
[Status indicators](/patterns/status-indicators), rule 5.

## One primary

The header's actions hold the page's one primary action. A second filled
`primary` in the same header warns in development. Prefer `topbar-right` for
page actions in a product that already puts them there: use one place per
product, not both.

On a phone the `actions` prop folds through
[`NbActionGroup`](/components/action-group/usage) with `overflow="phone"`: the
main action stays as an icon and the rest go into one menu.

## Sticky, for records

`sticky` keeps the header at the top of the shell's scroll container as the
page scrolls, with a surface and a rule under it. Use it on a record view,
where the name, the state and the actions should stay in reach. Not on a
dashboard or a settings page, where the header is read once.

See [Record](/patterns/record) for the whole page shape.
