---
layout: nubisco
title: Empty states
description: The four reasons a view has nothing to show, why they must never share one message, and where the empty state sits relative to the chrome around it.
---

An empty state answers one question: **why is there nothing here, and what do I
do about it?** There are exactly four answers, and the whole cost of this pattern
comes from products that ship one message for all four.

`NbEmptyState` already exists, already types the four cases, and already has a
[component page](/ui/components/empty-state). Across the twelve applications
built on this library it is used **zero times**. Not misused. Not used. Every
product wrote its own muted paragraph instead, and each one lost something
different in the process:

- **One application renders a single `.empty-text` element for both the loading
  state and the empty state.** A request that fails leaves the list empty, so the
  view says `No contacts yet`. The user has contacts. The interface told them
  they do not. That is not a styling defect, it is the UI stating something false
  about the user's own data.
- **One application renders a table with its header row and an empty `<tbody>`,
  and no message at all.** Column headings over a void. Nothing tells the reader
  whether the filter is too narrow, the fetch failed, or they are the first
  person here.
- **`NbDataTable`'s own fallback string is `No data to display`.** It is a
  library default, not copy: it names no noun, offers no action, and cannot tell
  "you have not made one yet" apart from "your search excluded all of them". Any
  table that ships that string in production has not written its empty state.

This page is therefore about placement and honesty, not styling. The component
does the layout. What products keep getting wrong is _which_ of the four states
they are in, _when_ they are entitled to claim it, and _what stays on screen
around it_.

---

## Rule 1: name the case before you write a word

The four cases differ in what is true, in what the user is owed, and in what you
are forbidden from offering. Find the row that is true and the rest follows.

| `kind`       | What is true                                          | The user must be told                                  | Offer                                                           | Never offer                                                   |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------- |
| `empty`      | Nothing exists yet and this user may create the first | what this space is for, once it is filled              | one call to action that creates the first one                   | an apology, or a filter control over an empty set             |
| `no-results` | Data exists; this search or filter matched none of it | what was searched for, and how to widen it             | a way to clear the filter or the search                         | a create action: the thing may already exist, just hidden     |
| `error`      | The request failed and we do not know what exists     | that the failure is ours, and that it may be temporary | a retry                                                         | blame, a raw stack trace, or a create action on unloaded data |
| `forbidden`  | It exists and this user may not see it                | that access, not data, is the missing piece            | usually nothing; a request-access route only if it truly exists | an invented action that does nothing                          |

The single most common defect is a `no-results` state wearing an `empty` state's
call to action. The user filters a list of 400 invoices down to zero, is offered
`Create invoice`, and creates a duplicate of something the filter is hiding.

The four kinds in the live component, each carrying only the action its row
allows. They separate before a word is read: a tray, a magnifier, a warning
circle and a padlock, with colour on exactly one of them. `forbidden` has no
action at all, which is the right number.

<preview dir="col">
  <div class="esx-quad">
    <div class="esx-cell">
      <p class="esx-kind">kind="empty"</p>
      <NbEmptyState size="sm" title="Start by adding a contact" description="Contacts are the people you send campaigns to.">
        <template #actions><NbButton size="sm" icon="plus">Add contact</NbButton></template>
      </NbEmptyState>
    </div>
    <div class="esx-cell">
      <p class="esx-kind">kind="no-results"</p>
      <NbEmptyState size="sm" kind="no-results" title="No contacts match “acme”" description="Try a shorter search, or clear the filters to see all contacts.">
        <template #actions><NbButton size="sm" variant="secondary">Clear filters</NbButton></template>
      </NbEmptyState>
    </div>
    <div class="esx-cell">
      <p class="esx-kind">kind="error"</p>
      <NbEmptyState size="sm" kind="error" title="Could not load contacts" description="The request did not complete. This is usually temporary.">
        <template #actions><NbButton size="sm" variant="secondary" icon="arrow-clockwise">Try again</NbButton></template>
      </NbEmptyState>
    </div>
    <div class="esx-cell">
      <p class="esx-kind">kind="forbidden"</p>
      <NbEmptyState size="sm" kind="forbidden" title="You cannot see these contacts" description="An administrator of this workspace can grant access." />
    </div>
  </div>
</preview>

Both of the states below are `kind="no-results"`, on the same filtered set of
400 invoices. Only one of them is safe to press.

<preview dir="col">
  <div class="esx-pair">
    <div class="esx-half esx-half--wrong">
      <p class="esx-label">Wrong: a create action over a filtered set</p>
      <NbEmptyState size="sm" kind="no-results" title="No invoices match “acme”" description="You have 400 invoices. This filter matched none of them.">
        <template #actions><NbButton size="sm" icon="plus" @click="duplicates++">New invoice</NbButton></template>
      </NbEmptyState>
      <p class="esx-note">Pressed {{ duplicates }} times here, which in the audited product is {{ duplicates }} new invoice{{ duplicates === 1 ? '' : 's' }} duplicating records the filter is hiding.</p>
    </div>
    <div class="esx-half esx-half--right">
      <p class="esx-label">Right: the way out is the control that caused it</p>
      <NbEmptyState size="sm" kind="no-results" title="No invoices match “acme”" description="Try a broader search, or clear the filters to see everything.">
        <template #actions><NbButton size="sm" variant="secondary">Clear filters</NbButton></template>
      </NbEmptyState>
      <p class="esx-note">Same kind, same copy shape, and an action that widens the set instead of adding to it.</p>
    </div>
  </div>
</preview>

### Deriving the kind, once

Do not scatter these decisions across the template. Compute the kind once, and
only reach the computation when the request has settled.

```ts
type TViewState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'forbidden' }
  | { status: 'ready'; rows: IInvoice[] }

const kind = computed<'empty' | 'no-results'>(() =>
  hasActiveFilters.value ? 'no-results' : 'empty',
)
```

`error` and `forbidden` are not derived from the row count, because a row count
of zero is not evidence of anything when the fetch did not return. They come from
the response. `empty` and `no-results` are the only two the row count can decide
between, and only once the response is in.

If your data layer collapses a 403 into the same "failed" branch as a 500,
`forbidden` is unreachable and every access problem reads as a transient error
with a retry button that will never succeed. Keep the status code.

---

## Rule 2: never render an empty state while you do not yet know

This is the rule the fleet breaks most expensively, and it is worth stating
plainly: **an empty state is a claim about reality.** `No contacts yet` asserts
that the user has no contacts. You are only allowed to assert it after the server
has told you so.

Absence of data is not the same as knowledge of absence. Before the response
lands, you have absence of data and nothing else.

```vue
<!-- Wrong. This is the audited defect, reduced to its two lines. -->
<div v-if="contacts.length">…</div>
<p v-else class="empty-text">No contacts yet</p>
```

That template has three real states and two branches. Loading falls into the
`v-else`. A failed fetch falls into the `v-else`. A 403 falls into the `v-else`.
All three say `No contacts yet`.

```vue
<!-- Right. One branch per state, in precedence order, and the empty state
     is the last thing reached rather than the default. -->
<template>
  <NbSkeleton
    v-if="state.status === 'loading'"
    variant="text"
    type="body-md"
    :lines="6"
    label="Loading contacts"
  />

  <NbEmptyState
    v-else-if="state.status === 'error'"
    kind="error"
    title="Could not load contacts"
    description="The request did not complete. This is usually temporary."
  >
    <template #actions>
      <NbButton variant="secondary" icon="arrow-clockwise" @click="reload">
        Try again
      </NbButton>
    </template>
  </NbEmptyState>

  <NbEmptyState
    v-else-if="state.status === 'forbidden'"
    kind="forbidden"
    title="You do not have access to these contacts"
    description="An administrator of this workspace can grant it."
  />

  <NbEmptyState
    v-else-if="!state.rows.length && hasActiveFilters"
    kind="no-results"
    :title="`No contacts match “${query}”`"
    description="Try a shorter search, or clear the filters to see all contacts."
  >
    <template #actions>
      <NbButton variant="secondary" @click="clearFilters"
        >Clear filters</NbButton
      >
    </template>
  </NbEmptyState>

  <NbEmptyState
    v-else-if="!state.rows.length"
    title="Start by adding a contact"
    description="Contacts are the people you send campaigns to. You can import a list later."
  >
    <template #actions>
      <NbButton icon="plus" @click="addContact">Add contact</NbButton>
    </template>
  </NbEmptyState>

  <ContactList v-else :rows="state.rows" />
</template>
```

The order is not cosmetic. `loading` outranks everything, `error` and
`forbidden` outrank the row count, and `empty` is last because it is the only
one of the five that is a statement about the user rather than about the
request.

Both templates, live. One button starts the same failing 1.4 second request in
both halves. Watch the left one while the request is still in flight, and then
again once it has failed: it says the same thing three times, and only one of
the three is a fact.

<preview dir="col">
  <div class="esx-stack">
    <div class="esx-runner">
      <NbButton icon="arrow-clockwise" @click="loadContacts">Load contacts (this request will fail)</NbButton>
      <span class="esx-note">Request: <strong>{{ contactStatus }}</strong></span>
    </div>
    <div class="esx-pair">
      <div class="esx-half esx-half--wrong">
        <p class="esx-label">Wrong: one branch for three states</p>
        <NbEmptyState v-if="!contacts.length" size="sm" title="No contacts yet" description="Add your first contact to start a campaign.">
          <template #actions><NbButton size="sm" icon="plus">Add contact</NbButton></template>
        </NbEmptyState>
        <p class="esx-note">Rendered on the row count alone, so it is on screen before the request returns and still on screen after it fails. The audited product says this in a bare paragraph; the component states the same false thing more legibly, which is the only difference.</p>
      </div>
      <div class="esx-half esx-half--right">
        <p class="esx-label">Right: precedence order, empty state last</p>
        <NbSkeleton v-if="contactStatus === 'loading'" variant="text" type="body-md" :lines="4" label="Loading contacts" />
        <NbEmptyState v-else-if="contactStatus === 'error'" size="sm" kind="error" title="Could not load contacts" description="The request did not complete. This is usually temporary.">
          <template #actions><NbButton size="sm" variant="secondary" icon="arrow-clockwise" @click="loadContacts">Try again</NbButton></template>
        </NbEmptyState>
        <NbEmptyState v-else size="sm" title="No contacts yet" description="Add your first contact to start a campaign.">
          <template #actions><NbButton size="sm" icon="plus">Add contact</NbButton></template>
        </NbEmptyState>
        <p class="esx-note">Three moments, three branches. The claim about the user's contacts is only reached when nothing else is true.</p>
      </div>
    </div>
  </div>
</preview>

### Four more consequences of the same rule

- **A refetch of data you already have keeps the old data.** Filtering a loaded
  table re-queries the server; dropping to an empty state for 200ms between the
  keystroke and the response makes the list flash `No contacts yet` while the
  user is typing. Keep the previous rows and mark the region busy. See
  [status indicators](/patterns/status-indicators) for the transitional-state
  vocabulary.
- **A short request needs no placeholder at all.** `NbSpinner`'s `delay` prop
  exists for this: a spinner that appears for 80ms is noise. See
  [spinner](/ui/components/spinner).
- **Optimistic states are not empty states.** If you have created the first item
  locally and are waiting for the server, the view has one row, not zero.
- **Never use an empty state as an error banner.** A page that loaded fine but
  whose _save_ failed still has content. Report that with `NbBanner`
  `variant="inline"`, not by replacing the view. See
  [banner](/ui/components/banner).

### Inside `NbDataTable` this is already done for you

`NbDataTable` implements the precedence internally: `loading` renders skeleton
rows, `error` renders in place of the body, and the empty branch is only reached
when neither is true. It also sets `aria-busy` on the `<table>` while loading.

What it does **not** do is choose between `empty` and `no-results`. That is
yours, through the `empty` slot.

---

## Rule 3: the empty state replaces the content, not the chrome

An empty state is placed _inside_ the region that has nothing in it. Everything
that lets the user change the situation stays exactly where it was.

**Keep:** the page header and its primary action, the tabs, the breadcrumb, the
table's toolbar, the search field, the filter controls, the table's `<thead>`,
and the pagination summary if it is reporting a real zero.

**Remove:** only the rows, cards, or items themselves.

The reason is mechanical. A `no-results` state is caused by a control. If the
empty state unmounts the control that caused it, the user is stuck in a state
they can see and cannot leave, and the only exit is a page reload. One audited
table does exactly this: the toolbar is inside the `v-if` that tests the row
count, so filtering to zero removes the filter field.

Both tables below hold the same four invoices and run the same filter. Type
`zzz` into each search field, and then try to get back.

<preview dir="col">
  <div class="esx-pair esx-pair--stack">
    <div class="esx-half esx-half--wrong">
      <p class="esx-label">Wrong: the empty state replaces the table and its toolbar</p>
      <div v-if="wrongRows.length" class="esx-table">
        <NbDataTable :columns="invoiceColumns" :rows="wrongRows" row-key="id" title="Invoices" size="sm" :sticky-header="false">
          <template #search><NbTextInput v-model="wrongQuery" name="esx-wrong-query" size="sm" placeholder="Search invoices" /></template>
        </NbDataTable>
      </div>
      <NbEmptyState v-else size="sm" kind="no-results" title="No invoices match your filters" description="Try a broader search, or clear the filters to see everything." />
      <p class="esx-note">The search field was inside the branch that tested the row count, so filtering to zero unmounted it. Nothing on screen can widen the filter now. <NbButton size="sm" variant="ghost" @click="wrongQuery = ''">Reset the demo</NbButton> stands in for the page reload, which is the only exit the audited product leaves.</p>
    </div>
    <div class="esx-half esx-half--right">
      <p class="esx-label">Right: the empty state replaces the rows only</p>
      <div class="esx-table">
        <NbDataTable :columns="invoiceColumns" :rows="rightRows" row-key="id" title="Invoices" size="sm" :sticky-header="false">
          <template #search><NbTextInput v-model="rightQuery" name="esx-right-query" size="sm" placeholder="Search invoices" /></template>
          <template #empty>
            <NbEmptyState size="sm" kind="no-results" :title="rightEmptyTitle" description="Try a broader search, or clear the filters to see everything.">
              <template #actions><NbButton size="sm" variant="secondary" @click="rightQuery = ''">Clear filters</NbButton></template>
            </NbEmptyState>
          </template>
        </NbDataTable>
      </div>
      <p class="esx-note">The title, the toolbar, the search field and the three headings all survive, the message sits under the columns it is about, and there are two ways out: the field that caused it, and the button in the empty state.</p>
    </div>
  </div>
</preview>

There is one deliberate exception. On a genuine `kind="empty"` first use, where
nothing has ever existed, a filter bar is furniture for a set of zero. Hiding
the _filters_ there is fine. The page header, the tabs and the primary action
still stay.

| Chrome                         | `empty`                  | `no-results` | `error`        | `forbidden` |
| ------------------------------ | ------------------------ | ------------ | -------------- | ----------- |
| Page header and primary action | keep                     | keep         | keep           | keep        |
| Tabs and breadcrumb            | keep                     | keep         | keep           | keep        |
| Search and filter controls     | may hide                 | **keep**     | keep, disabled | hide        |
| Table `<thead>`                | keep                     | keep         | keep           | keep        |
| Bulk-action bar                | hide (nothing to select) | hide         | hide           | hide        |
| Pagination                     | hide                     | hide         | hide           | hide        |

The table header stays even on first use, because the columns are the clearest
statement of what will be here when the space fills. This is the fix for the
audited "headered table, empty body, no message" case: that product had the
right chrome and no message. Keep the chrome, add the message.

---

## Rule 4: the container decides the size, not the mood

`NbEmptyState` has two sizes and one border option. The container picks them.

| Container                 | Size | `bordered` | Icon       | Actions            |
| ------------------------- | ---- | ---------- | ---------- | ------------------ |
| Whole page or route       | `md` | no         | yes        | one primary        |
| Table body                | `sm` | no         | yes        | one, `size="sm"`   |
| Card grid                 | `md` | no         | yes        | one primary        |
| Side panel or inspector   | `sm` | no         | often none | one, or none       |
| Card or dashboard tile    | `sm` | no         | none       | none, or one ghost |
| Drop zone or empty column | `sm` | **yes**    | yes        | none               |

The controls under this frame are the real props. `size` moves the padding and
the measure together (`44ch` at `md`, `36ch` at `sm`), `bordered` is for a
region with no edges of its own, and `icon` is the one a small container usually
decides against. Every combination here is a container decision, not a mood.

<preview :props="containerProps" v-slot="{ resultingProps }">
  <div class="esx-stack">
    <NbEmptyState :kind="resultingProps.kind" :size="resultingProps.size" :bordered="resultingProps.bordered" :icon="resultingProps.mark === 'none' ? null : undefined" title="Start by creating an environment" description="Environments hold content independently, so you can draft against staging without touching production." />
  </div>
</preview>

### In a table

Use `NbDataTable`'s `empty` slot rather than `emptyMessage`, because
`emptyMessage` is a single string and cannot express two different situations.
The component already emits the `<tr>` and the `colspan`, so the slot receives a
correctly stretched cell; give it an `sm` empty state and nothing else.

```vue
<NbDataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  title="Invoices"
  :loading="state.status === 'loading'"
  :error="state.status === 'error' ? 'Could not load invoices.' : undefined"
>
  <template #search>
    <NbTextInput v-model="query" placeholder="Search invoices" />
  </template>

  <template #empty>
    <NbEmptyState
      v-if="hasActiveFilters"
      size="sm"
      kind="no-results"
      title="No invoices match your filters"
      description="Try a broader search, or clear the filters to see everything."
    >
      <template #actions>
        <NbButton size="sm" variant="secondary" @click="clearFilters">
          Clear filters
        </NbButton>
      </template>
    </NbEmptyState>

    <NbEmptyState
      v-else
      size="sm"
      title="Start by issuing an invoice"
      description="Invoices you issue to this customer appear here."
    >
      <template #actions>
        <NbButton size="sm" icon="plus" @click="newInvoice">New invoice</NbButton>
      </template>
    </NbEmptyState>
  </template>
</NbDataTable>
```

The `error` slot is available on the same component if you want more than the
default line, and it receives the `error` string. Prefer a `kind="error"` empty
state there for anything the user can retry.

Do not place an empty state above or below the table. Inside the body, spanning
the columns, is the only position where the empty message sits under the
headings that describe what is missing.

### In a card grid

The empty state replaces the grid, it does not join it. A grid of one ghost card
reads as a real item with no content.

```vue
<NbCardGrid v-if="projects.length" min="18rem" gap="md">
  <NbCard v-for="p in projects" :key="p.id" :title="p.name" :href="p.url" />
</NbCardGrid>

<NbEmptyState
  v-else
  title="Start by creating a project"
  description="A project holds an environment, its content types and everything published from them."
>
  <template #actions>
    <NbButton icon="plus" @click="createProject">Create project</NbButton>
  </template>
</NbEmptyState>
```

Give the replacement region a `min-height` roughly equal to one card row so the
page does not jump in height between the empty and the populated state. Do not
stretch it to the viewport.

### As a whole page

`size="md"`, inside the content region, and **not** centred against the whole
viewport. The component centres itself within whatever box you give it, so the
box is the decision. A box of `min-height: 24rem` puts the copy in the upper
third of a tall screen, where it is read. `min-height: 100vh` puts it below the
fold on a laptop.

```vue
<!-- NbShell's default slot is the main content region. -->
<NbShell>
  <!-- The page's own header component. It stays. -->
  <EnvironmentsHeader />

  <div class="environments__empty">
    <NbEmptyState
      title="Start by creating an environment"
      description="Environments hold content independently, so you can draft against staging without touching production."
    >
      <template #actions>
        <NbButton icon="plus" @click="createEnvironment">
          Create environment
        </NbButton>
      </template>
    </NbEmptyState>
  </div>
</NbShell>
```

```scss
.environments__empty {
  display: flex;
  min-height: 24rem;
  padding: var(--nb-spacing-24) 0;
}
```

A page-level empty state does not replace the page header. The header carries
the page's identity and its primary action, and both are still true when the
page is empty. Duplicating that action inside the empty state is correct and
expected, with the same label in both places. See
[action labels](/content/action-labels).

Both frames below are the real `NbShell` at a fixed height, the way
[shell](/ui/components/shell) demonstrates itself: the frame stands in for the
viewport, and nothing about the component is changed. The heading row inside the
content is the application's own markup, because the library ships no
page-header component, and it is exactly the part that has to survive.

<preview dir="col">
  <div class="esx-pair esx-pair--stack">
    <div class="esx-half esx-half--wrong">
      <p class="esx-label">Wrong: centred against the viewport, header replaced</p>
      <div class="esx-shell-frame">
        <NbShell style="height: 100%">
          <template #topbar-left><strong>Environments</strong></template>
          <div class="esx-page-empty esx-page-empty--viewport">
            <NbEmptyState title="Start by creating an environment" description="Environments hold content independently, so you can draft against staging without touching production."><template #actions><NbButton icon="plus">Create environment</NbButton></template></NbEmptyState>
          </div>
        </NbShell>
      </div>
      <p class="esx-note">The box is twice the height of the frame, so the component centres itself below the fold and the call to action is off the bottom. The page heading and its primary action were inside the branch the empty state replaced, so there is nothing above it either.</p>
    </div>
    <div class="esx-half esx-half--right">
      <p class="esx-label">Right: the header stays, the box is 24rem</p>
      <div class="esx-shell-frame">
        <NbShell style="height: 100%">
          <template #topbar-left><strong>Environments</strong></template>
          <div class="esx-page-header"><div class="esx-page-title">Environments</div><NbButton size="sm" icon="plus">Create environment</NbButton></div>
          <div class="esx-page-empty">
            <NbEmptyState title="Start by creating an environment" description="Environments hold content independently, so you can draft against staging without touching production."><template #actions><NbButton icon="plus">Create environment</NbButton></template></NbEmptyState>
          </div>
        </NbShell>
      </div>
      <p class="esx-note">The copy lands in the upper third, the action is on screen, and the same action is still in the header where it belongs once environments exist. Two buttons with one label, which is correct.</p>
    </div>
  </div>
</preview>

### In a panel or inspector

`size="sm"`, and usually `:icon="null"`. A panel is narrow, already framed, and
the reader is looking at it because they clicked something: they need one line,
not a landing page.

```vue
<NbShellPanel title="Comments">
  <NbEmptyState
    size="sm"
    :icon="null"
    title="No comments yet"
    description="Select text in the document to leave the first one."
  />
</NbShellPanel>
```

An inspector with no selection is a different thing again, and it belongs with
the rest of the selection rules in [inspectors](/patterns/inspectors).

Two real `NbShellPanel`s, side by side, at the width a panel actually gets.

<preview dir="col">
  <div class="esx-pair">
    <div class="esx-half esx-half--wrong">
      <p class="esx-label">Wrong: md, a mark, and a border inside a border</p>
      <div class="esx-panel-frame"><NbShellPanel title="Comments" fluid><NbEmptyState class="esx-panel-child" bordered title="No comments yet" description="Select text in the document to leave the first one." /></NbShellPanel></div>
      <p class="esx-note">Two outlines around one message, and a 32px mark taking the width a narrow column needed for the sentence. The panel header already said where the edges are.</p>
    </div>
    <div class="esx-half esx-half--right">
      <p class="esx-label">Right: sm, no mark, no border</p>
      <div class="esx-panel-frame"><NbShellPanel title="Comments" fluid><NbEmptyState class="esx-panel-child" size="sm" :icon="null" title="No comments yet" description="Select text in the document to leave the first one." /></NbShellPanel></div>
      <p class="esx-note">One line, in a frame that is already framed. Note the binding is a real <code>:icon="null"</code>: the string <code>"null"</code> resolves to a missing icon instead of to no icon.</p>
    </div>
  </div>
</preview>

### A drop zone or an empty column

This is the one case for `bordered`. A dashed outline tells the reader how big
the empty region is, which matters when the empty thing is a target.

```vue
<NbEmptyState
  bordered
  size="sm"
  :icon="null"
  title="Drop a block here"
  description="Blocks in this zone render in order, top to bottom."
/>
```

Skip `bordered` inside anything that already has an edge: a panel, a card, or a
table cell. Two nested outlines around one message read as a defect.

The dashed outline is the size of the target, which is the information a drop
zone owes the reader:

<preview dir="col">
  <div class="esx-stack esx-stack--narrow">
    <NbEmptyState bordered size="sm" :icon="null" title="Drop a block here" description="Blocks in this zone render in order, top to bottom." />
  </div>
</preview>

---

## Rule 5: a mark, not an illustration

`NbEmptyState` renders one `NbIcon`, chosen by `kind`: a tray for `empty`, a
magnifier for `no-results`, a warning circle for `error`, a padlock for
`forbidden`. `error` is the only kind whose mark takes colour, from
`--nb-c-status-error`, because it is the only one where something went wrong
rather than simply not existing yet.

We do not ship spot illustrations, and the reason is not taste:

- There is no illustration set. Twelve products would each commission their own,
  and a fleet with twelve illustration styles has none.
- Every one of them would need a dark-theme variant, and flat art with baked-in
  light backgrounds is the most common dark-theme regression there is.
- Illustration eats the vertical space that the copy and the action need, and
  pushes the button below the fold on a short viewport.
- A drawing cannot distinguish `no-results` from `error`. The words carry the
  meaning, so the more decoration there is, the more the reader has to skip.

If a product genuinely has brand art for a first-run screen, the `icon` slot
replaces the mark entirely. The constraints are: it must stay under about 96px
tall, it must be legible in both themes, it must be `aria-hidden` because the
title already says everything it says, and it is only ever used on
`kind="empty"`. Never illustrate a failure.

Drop the mark with `:icon="null"` when the empty state is small enough that the
icon crowds the copy: panels, cards, table cells with one line. Note that this
must be a real `null` binding, not the string `"null"`.

---

## Rule 6: what it says

The general rules live in [writing style](/content/writing-style), and the
button text lives in [action labels](/content/action-labels), including the
per-kind table of titles and calls to action. Read those. Only four things are
specific to this pattern:

1. **An error never blames the user.** `Could not load invoices` is ours to own.
   `You failed to load invoices` and `Your connection is bad` are not statements
   we are entitled to make, and one of them is usually wrong.
2. **A `no-results` state repeats what was excluded.** The user typed a query
   and picked filters, then looked away; the title is where they find out which
   of those is responsible. `No invoices match “acme”` beats `No results` because
   it shows the search term, and a typo becomes visible.
3. **A `forbidden` state names who can grant access,** if you know. `Ask an
administrator of this workspace` is actionable. `Access denied` is a wall.
4. **If the existence of the resource is itself confidential,** do not use
   `forbidden`, because the message confirms the thing exists. Say it was not
   found, in the same words you would use for a real 404. This is the one case
   where the interface is deliberately less specific, and it is a security
   decision, not a copy decision.

Nothing in an empty state ends in an exclamation mark. The user has not achieved
anything and is not being congratulated.

---

## Rule 7: accessibility

`NbEmptyState` renders `<div>`s. It is not a heading, not a landmark, and not a
live region, and each of those is a deliberate decision with a consequence you
have to handle.

- **The mark is decorative.** `NbIcon` renders its glyph `aria-hidden`, so a
  screen reader gets the title and the description and nothing else. The kind
  must be carried by the words. `No results` with a magnifier is fine visually
  and is a bare `No results` in audio.
- **The title is not an `<h2>`.** That is right for a table cell and a panel,
  and wrong for a whole route where the empty state is the page's only content.
  Where the empty state is the main content of a route, render the page's real
  heading above it in your own layout rather than trying to promote the title.
- **A state that appears in response to typing must be announced, once.** The
  empty state itself is not a live region, and making the whole block one would
  re-announce a paragraph on every keystroke. Announce a short count instead,
  and let the visible empty state stay silent:

  ```vue
  <!-- `sr-only` is your application's own visually-hidden utility: the
       library does not export one. -->
  <p class="sr-only" role="status">{{ rows.length }} results</p>
  ```

- **Mark the region busy while it loads,** so the swap is not silent.
  `NbDataTable` sets `aria-busy` on its `<table>` for you. On a region you built
  yourself, set it on the region. `NbSkeleton`'s `label` prop covers the
  announcement, and it goes on exactly one skeleton in the group.
- **Do not move focus to the empty state.** The user's focus is very often still
  in the search field that caused it, and stealing focus stops them typing.
  The exception is nothing: even the retry button does not earn a focus steal.
- **Actions are real buttons.** `NbButton` in the `actions` slot, never a click
  handler on the description text. The whole block is not clickable.
- The description uses `--nb-c-text-subtle`. It is body text at a subdued
  weight, and it is the piece most at risk on a tinted surface. See
  [colour contrast](/accessibility/color-contrast).

---

## Rule 8: things that are not empty states

| Situation                               | Not this                  | This                                                           |
| --------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| A metric whose value is zero            | empty state               | render `0`. Zero is data, and it is often the good news        |
| A chart with no series in range         | empty state at page level | an `sm` empty state inside the plot area, keeping the axes     |
| A form that has not been filled in yet  | empty state               | the form. Fields with no value are the normal state of a form  |
| A save that failed                      | empty state               | `NbBanner` `variant="inline"` above the form                   |
| A page still loading                    | empty state               | `NbSkeleton`, or a delayed `NbSpinner`                         |
| An optional section with no content     | empty state               | omit the section, or render a single quiet line                |
| A collapsed or disabled feature         | empty state               | see [disabled and read-only](/patterns/disabled-and-read-only) |
| A 404 on a record the user navigated to | `kind="empty"`            | `kind="error"`: the record was expected to exist               |

Three empty states stacked on one dashboard is a layout problem, not a content
problem. When several tiles are empty at once, say it once at the page level.

---

## Migrations

Three conversions, one per audited defect.

### The conflated message

```vue
<!-- Before: loading, error and empty all say the same false thing. -->
<p v-if="!contacts.length" class="empty-text">No contacts yet</p>
```

```vue
<!-- After: see rule 2. Four branches, precedence order, error first. -->
```

### The silent table

```vue
<!-- Before: headings over nothing. -->
<NbDataTable :columns="columns" :rows="rows" row-key="id" />
```

```vue
<!-- After -->
<NbDataTable :columns="columns" :rows="rows" row-key="id" :loading="loading">
  <template #empty>
    <NbEmptyState
      size="sm"
      title="Start by adding a member"
      description="Members can sign in to this workspace and see its projects."
    >
      <template #actions>
        <NbButton size="sm" icon="plus" @click="invite">Invite member</NbButton>
      </template>
    </NbEmptyState>
  </template>
</NbDataTable>
```

### The library default

```vue
<!-- Before: a system string, not copy. -->
<NbDataTable ... empty-message="No data to display" />
```

`emptyMessage` is a fallback for tables that are still being built. Anything a
customer will see gets the `empty` slot and a real sentence naming the noun.

The same table, the same columns, the same zero rows, twice. The only difference
is whether anybody wrote the empty state.

<preview dir="col">
  <div class="esx-pair">
    <div class="esx-half esx-half--wrong">
      <p class="esx-label">Wrong: the library fallback, shipped</p>
      <div class="esx-table"><NbDataTable :columns="memberColumns" :rows="[]" row-key="id" title="Members" size="sm" :sticky-header="false" /></div>
      <p class="esx-note">This is what the component prints when the slot is left alone. It names no noun, offers nothing, and cannot tell "nobody has been invited yet" apart from "your filter excluded everyone".</p>
    </div>
    <div class="esx-half esx-half--right">
      <p class="esx-label">Right: the empty slot, with a sentence</p>
      <div class="esx-table"><NbDataTable :columns="memberColumns" :rows="[]" row-key="id" title="Members" size="sm" :sticky-header="false"><template #empty><NbEmptyState size="sm" title="Start by inviting a member" description="Members can sign in to this workspace and see its projects."><template #actions><NbButton size="sm" icon="plus">Invite member</NbButton></template></NbEmptyState></template></NbDataTable></div>
      <p class="esx-note">The headings still describe what will be here, and now something says why it is not here yet, and what to press.</p>
    </div>
  </div>
</preview>

---

## Tokens an empty state is allowed to touch

The component owns its own spacing and type. There is exactly one knob.

| Custom property            | What it does                                                     | How to set it                                                     |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--nb-empty-state-measure` | Maximum width of the description. `44ch` at `md`, `36ch` at `sm` | inline on the component: `style="--nb-empty-state-measure: 52ch"` |

It has to be set inline (or from a rule more specific than a single class),
because the component declares the default on its own root element. Raise it
only for a genuinely wide container, and never past about `60ch`: centred prose
gets hard to track well before the container runs out.

The one knob, on the live component. The container is the same width at every
setting: only the description's measure changes, and `80ch` is in the list to
show what "hard to track" looks like rather than to recommend it.

<preview :props="measureProps" v-slot="{ resultingProps }">
  <div class="esx-stack">
    <NbEmptyState :style="{ '--nb-empty-state-measure': resultingProps.measure }" title="Nothing scheduled this week" description="Runs you schedule appear here with the environment they will run against, their owner, and the time of the next execution." />
  </div>
</preview>

Everything else the component paints comes from existing tokens and is not
yours to override: `--nb-c-text` and `--nb-c-text-subtle` for the copy,
`--nb-c-status-error` for the error mark, `--nb-c-border` and `--nb-radius-xs`
for the dashed outline, and the `--nb-spacing-*` scale for the gaps. Both themes
work because all six are theme-aware. See [design tokens](/design-tokens).

Do not restyle `.nb-empty-state` from an application stylesheet. If the default
does not fit, the container is wrong, not the component.

---

## Things we have shipped and should not ship again

- One element rendering both "loading" and "empty", so a failed request reports
  the user's data as absent.
- A table with headings, an empty body and no message.
- `No data to display` in a customer-facing view.
- `Create` offered on a `no-results` state, one click away from a duplicate of
  the record the filter is hiding.
- A filter control unmounted by the empty state it caused.
- A 403 rendered as a retry button that can never succeed.
- An empty state centred in `100vh`, with its call to action below the fold.
- Twelve products, twelve hand-written empty paragraphs, and zero uses of the
  component that solves it.

---

## Checklist

Before a view with a possible zero-item state ships:

1. Are all four kinds reachable in the code, or does one branch serve several?
2. Is the empty state impossible to reach while the request is in flight?
3. Does a failed request produce `kind="error"`, never `kind="empty"`?
4. Does a 403 survive the data layer as `forbidden` rather than a generic error?
5. Does the `no-results` state keep the control that caused it?
6. Does the table keep its `<thead>` and its toolbar?
7. Does the title name the noun, and does the description say what will be here?
8. Is there exactly one action, and is it the right one for the kind?
9. Is `size` the container's size, not the amount of empty space?
10. Does a refetch keep the previous rows instead of flashing empty?
11. Does the block read correctly with the icon removed, since a screen reader
    will not get it?
12. Does it work in the dark theme, which it does for free if you did not
    restyle it?

<script setup lang="ts">
import { computed, ref } from 'vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* Rule 1: how many duplicates the wrong call to action has produced on this
   page. The count is the whole point of the demo, so it is real state. */
const duplicates = ref(0)

/* Rule 2: one failing request, driving both halves of the pair. `contacts`
   stays empty because a failed fetch leaves it empty, which is exactly why a
   row count of zero is not evidence of anything. */
const contacts = ref<{ id: string }[]>([])
const contactStatus = ref<'idle' | 'loading' | 'error'>('idle')

async function loadContacts() {
  contactStatus.value = 'loading'
  await wait(1400)
  contactStatus.value = 'error'
}

/* Rule 3: the same four invoices and the same filter, run twice. */
const invoiceColumns = [
  { key: 'id', header: 'Invoice' },
  { key: 'customer', header: 'Customer' },
  { key: 'amount', header: 'Amount', align: 'right' as const },
]

const invoices = [
  { id: 'INV-1041', customer: 'Northwind', amount: '€ 1,240.00' },
  { id: 'INV-1042', customer: 'Contoso', amount: '€ 320.50' },
  { id: 'INV-1043', customer: 'Fabrikam', amount: '€ 88.00' },
  { id: 'INV-1044', customer: 'Northwind', amount: '€ 2,010.75' },
]

const filterInvoices = (query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return invoices
  return invoices.filter(
    (row) =>
      row.id.toLowerCase().includes(q) || row.customer.toLowerCase().includes(q),
  )
}

const wrongQuery = ref('')
const rightQuery = ref('')
const wrongRows = computed(() => filterInvoices(wrongQuery.value))
const rightRows = computed(() => filterInvoices(rightQuery.value))
const rightEmptyTitle = computed(
  () => 'No invoices match “' + rightQuery.value.trim() + '”',
)

/* Migrations: the library default against a written empty state. */
const memberColumns = [
  { key: 'name', header: 'Member' },
  { key: 'role', header: 'Role' },
  { key: 'seen', header: 'Last seen' },
]

/* Rule 4. `mark` is a control, not a prop: it picks between the default icon
   and a real `null`, and is read from `resultingProps` in the template so
   nothing invented reaches the component. */
const containerProps = [
  {
    label: 'Kind',
    name: 'kind',
    type: 'single',
    options: [
      { value: 'empty', label: 'empty' },
      { value: 'no-results', label: 'no-results' },
      { value: 'error', label: 'error' },
      { value: 'forbidden', label: 'forbidden' },
    ],
    default: 'empty',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'md', label: 'md' },
      { value: 'sm', label: 'sm' },
    ],
    default: 'md',
  },
  { label: 'Bordered', name: 'bordered', type: 'boolean', default: false },
  {
    label: 'Mark',
    name: 'mark',
    type: 'single',
    options: [
      { value: 'default', label: 'the icon for the kind' },
      { value: 'none', label: 'no icon (:icon="null")' },
    ],
    default: 'default',
  },
]

const measureProps = [
  {
    label: 'Measure',
    name: 'measure',
    type: 'single',
    options: [
      { value: '36ch', label: '36ch (the sm default)' },
      { value: '44ch', label: '44ch (the md default)' },
      { value: '52ch', label: '52ch' },
      { value: '60ch', label: '60ch (the ceiling)' },
      { value: '80ch', label: '80ch (too wide)' },
    ],
    default: '44ch',
  },
]
</script>

<style scoped>
/* The preview area stretches its single child, so anything showing more than
   one thing goes in a plain stacking wrapper. */
.esx-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}

.esx-stack--narrow {
  max-width: 26rem;
}

.esx-runner {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 1.5);
  flex-wrap: wrap;
}

/* Four kinds, four cells, and as many columns as the page has room for. */
.esx-quad {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
  align-items: start;
}

.esx-cell {
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  padding: calc(var(--nb-base-unit) * 1.5);
}

.esx-kind {
  margin: 0;
  font-family: var(--nb-font-family-mono, monospace);
  font-size: 12px;
  color: var(--nb-c-text-muted);
}

/* Wrong on the left, right on the right, one column when there is no room. */
.esx-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.esx-pair--stack {
  grid-template-columns: 1fr;
}

.esx-half {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  align-items: stretch;
  padding: calc(var(--nb-base-unit) * 1.5);
  border-radius: var(--nb-radius-md);
  border: 1px solid var(--nb-c-border);
}

.esx-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.esx-half--right {
  border-color: var(--nb-c-success-surface);
}

.esx-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.esx-half--wrong .esx-label {
  color: var(--nb-c-danger);
}

.esx-half--right .esx-label {
  color: var(--nb-c-success);
}

.esx-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* The tables are the real component. The frame only stops a docs column from
   letting them run to the full page width. */
.esx-table {
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  overflow: hidden;
}

/* NbShell fills its parent, so it can only be shown at a size a docs column
   has. Nothing about the shell is changed; it is given a viewport. */
.esx-shell-frame {
  height: 300px;
  overflow: hidden;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

/* The box the empty state is centred in, which is the decision rule 4 is
   about. `24rem` puts the copy in the upper third of the frame. */
.esx-page-empty {
  display: flex;
  min-height: 24rem;
  padding: var(--nb-spacing-24) 0;
}

/* Twice the height of the frame, standing in for `min-height: 100vh` on a
   laptop: the component centres itself below the fold. */
.esx-page-empty--viewport {
  min-height: 200%;
}

.esx-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--nb-base-unit) * 2);
  padding-bottom: var(--nb-spacing-8);
  border-bottom: 1px solid var(--nb-c-border);
}

.esx-page-title {
  font-size: var(--nb-font-size-16);
  font-weight: 600;
  color: var(--nb-c-text);
}

.esx-panel-frame {
  height: 220px;
  display: flex;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  overflow: hidden;
}

/* NbShellPanel's content region is a bare flex row, so a single child sizes to
   its content instead of spanning the panel. This is the only thing on the
   page that had to be nudged, and it is a note in the resistance log rather
   than a restyle of the empty state itself. */
.esx-panel-child {
  flex: 1;
}
</style>
