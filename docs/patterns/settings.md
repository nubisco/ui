---
layout: nubisco
title: Settings
description: The shape of a settings page. Tabs in the fixed bar, one column, sections on the page ground with a heading and a lede, one visible save model per section, and the destructive section last and apart.
---

A settings page is read top to bottom by someone looking for one control.
Its job is to make each section look like what it is: a form that saves, a
switch that applies at once, an object with its own table, a thing that
destroys data. When every section has the same shape, those four look alike,
and the person has to read each one to find out which it is.

## Before: a column of boxes

The uniform version: tabs, then a column of panels 24px apart. Each panel has a
16px heading, a lede, its fields 16px apart. A name field with a Save button, a
policy switch that saves on change, a list editor and "Delete this project" are
four identical raised boxes with four identical headings. The destructive
section is the same distance from the one above it as every other section,
and its button is as loud as Save.

## After: sections on the ground

<preview>
  <div style="width: 100%; max-width: 40rem; display: flex; flex-direction: column">
    <section style="display: flex; flex-direction: column; gap: 16px">
      <div>
        <h2 class="type-heading-02" style="margin: 0">Project</h2>
        <p class="type-body-sm" style="margin: 4px 0 0; color: var(--nb-c-text-muted)">The name and address people see.</p>
      </div>
      <NbTextInput label="Name" model-value="Website" />
      <NbTextInput label="Address" model-value="website" />
      <div><NbButton variant="primary">Save</NbButton></div>
    </section>
    <section style="display: flex; flex-direction: column; gap: 16px; margin-top: 32px">
      <div>
        <h2 class="type-heading-02" style="margin: 0">Notifications</h2>
        <p class="type-body-sm" style="margin: 4px 0 0; color: var(--nb-c-text-muted)">Changes apply as you make them.</p>
      </div>
      <NbSwitch label="Email me when I am mentioned" :model-value="true" />
      <NbSwitch label="Send a weekly summary" :model-value="false" />
    </section>
    <section style="display: flex; flex-direction: column; gap: 16px; margin-top: 32px">
      <NbPanel title="Members" description="Its own object, so it gets its own box." heading-level="h2">
        <template #actions><NbButton size="sm" variant="primary">Invite</NbButton></template>
        <NbStructuredList
          aria-label="Members"
          condensed
          flush
          :columns="[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role', width: '8rem' }]"
          :rows="[{ id: 1, name: 'Sam Rivera', role: 'Owner' }, { id: 2, name: 'Alex Kim', role: 'Editor' }]"
        />
      </NbPanel>
    </section>
    <section style="display: flex; flex-direction: column; gap: 16px; margin-top: 48px">
      <div>
        <h2 class="type-heading-02" style="margin: 0">Delete this project</h2>
        <p class="type-body-sm" style="margin: 4px 0 0; color: var(--nb-c-text-muted)">Removes every page and file. This cannot be undone.</p>
      </div>
      <div><NbButton variant="danger" outlined>Delete project</NbButton></div>
    </section>
  </div>
</preview>

## The anatomy

1. **Tabs in the fixed bar.** `NbTabs` in the shell's `fixedbar`, one tab per
   area. No page title that repeats the last crumb: the trail already says
   "Settings".
2. **One column.** Settings are read down, and a second column splits the
   reader's attention between two forms. Cap the measure; do not stretch fields
   across a desktop.
3. **Sections on the ground.** Each section is an `<h2>` at `heading-02` with a
   `body-sm` lede under it, sitting straight on the page ground. No box.
4. **Fields at `md`, sections at `xl`.** 16px between fields, 32px between
   sections: the gap says which fields belong together without a line or a
   box.
5. **A box only when the section is its own object.** A table of members, a
   reorderable list, an integration with its own state: an `NbPanel` with a
   `title` and its one action in the header. A form is not an object.
6. **The destructive section last, after `xxl`.** 48px above it, so it reads
   as apart. Its control is `danger outlined`, never filled, and the
   confirmation dialog carries the filled one.

## One save model per section, and it shows

Each section either saves when the person presses Save, or applies each change
as it is made. Never both in one section. See
[Building a form](/patterns/forms), rule 16.

- **Explicit save:** a `primary` Save button at the foot of the section, left
  aligned. The section's one filled button.
- **Autosave:** no button, and an `NbInlineLoading` beside the heading that
  says "Saving" and "Saved". The lede says changes apply as they are made.

A reader should know which model a section uses before touching it, from the
presence of the Save button alone.

## Rules

- **Two sections that differ should look different.** A form, a switch list and
  a table are three shapes, not three boxes.
- **One filled button per section.** Save, or Invite, or nothing.
- **Danger is for the control that destroys data,** and nowhere else on the
  page.
- **No section title in a box and a heading above it.** One name per section.

## Reference

Acta's space settings is the screen this pattern is written against: a name
form, a list editor, a done-window setting and "Archive or delete" as four
identical panels. Its People tab is the reference for the object case: a table
with its own title, description and one primary in its header.
