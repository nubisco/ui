---
layout: nubisco
title: Accordion
intro: '`NbAccordion` is a stack of headings that reveal their content when clicked. It is the plain disclosure for page body: [`NbShellPanel`](/components/shell-panel/usage) looks similar but is an inspector section, carrying a size control and expecting a panel rail around it.'
source: src/components/Accordion.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion>
      <NbAccordionItem title="What a blueprint card is">
        A node in a graph. The parent owns its position and the wires between cards.
      </NbAccordionItem>
      <NbAccordionItem title="What a port is">
        One element that is at once the pin, the click target and the point a wire is measured to.
      </NbAccordionItem>
      <NbAccordionItem title="What a lane is">
        The column a card's ports occupy, anchored to the top of the card so a pin never moves when the body does.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

```vue
<NbAccordion>
  <NbAccordionItem title="What a blueprint card is">
    A node in a graph.
  </NbAccordionItem>
  <NbAccordionItem title="What a port is"> One element. </NbAccordionItem>
</NbAccordion>
```

## When to use it

Carbon's guidance holds here, and it is mostly about restraint.

- **Do** use it to shorten a page whose content is not all essential, and to group related detail a reader can choose to open.
- **Don't** use it when the reader is likely to want everything. An accordion then charges them a click per section for no benefit; a scrolling page with ordinary headings is better.
- **Don't** use it for nested hierarchy. Reach for [`NbTree`](/components/tree/usage) instead.

Content inside a closed panel stays in the DOM, so find-in-page still reaches it. That is deliberate: an accordion is progressive disclosure, not lazy loading. If a section is genuinely expensive, defer it yourself from the `toggle` event.

## One open, or several

By default opening a section closes the last one, which keeps the page short. Set `multiple` when sections are meant to be compared.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion multiple>
      <NbAccordionItem title="Analog ports" meta="3">
        Solid pins that fill in proportion to their level.
      </NbAccordionItem>
      <NbAccordionItem title="Digital ports" meta="2">
        Striped pins that pulse once per event.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Icons and meta

`icon` puts a mark before the title; `meta` puts a count or a status after it, before the chevron.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion>
      <NbAccordionItem title="Fields" icon="tray" meta="12">
        The shape of a content type.
      </NbAccordionItem>
      <NbAccordionItem title="Permissions" icon="lock-simple" meta="Restricted">
        Who may read and who may publish.
      </NbAccordionItem>
      <NbAccordionItem title="Deleted" icon="warning-circle" disabled>
        Never shown: a disabled item cannot be opened.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## A hint and actions

`info` puts an info hint beside the title, for a section whose name alone does not say what belongs in it. The `actions` slot holds controls that act on the section rather than open it, such as a remove button. Both sit beside the header's button, never inside it, because a button cannot hold another control. A click anywhere else on the row still opens and closes the section.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion multiple>
      <NbAccordionItem title="Plan" meta="2" info="What this waits on, and what waits on it.">
        Two cards depend on this one.
      </NbAccordionItem>
      <NbAccordionItem title="Checklist" meta="3/7" info="Steps to tick off inside this card.">
        <template #actions>
          <NbButton size="xxs" variant="ghost" icon="trash-simple" aria-label="Delete checklist" />
        </template>
        Seven steps, three done.
      </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Flush, for panels and sidebars

`flush` drops the side inset so titles line up with the content above them, and stops two nearly-touching rule lines appearing where a bordered accordion meets a bordered panel. Hover and focus still reach into the gutter, so a row is still a row.

<preview>
  <div style="max-width: 22rem; width: 100%; background: var(--nb-c-surface); border: 1px solid var(--nb-c-border); padding: 1rem;">
    <NbAccordion flush size="sm">
      <NbAccordionItem title="Transform"> Position, rotation, scale. </NbAccordionItem>
      <NbAccordionItem title="Material"> Albedo, roughness, metallic. </NbAccordionItem>
    </NbAccordion>
  </div>
</preview>

## Sizes

<preview>
  <div style="max-width: 34rem; width: 100%; display: grid; gap: 1.5rem;">
    <NbAccordion size="sm"><NbAccordionItem title="Small, 32px rows">For dense panels.</NbAccordionItem></NbAccordion>
    <NbAccordion size="md"><NbAccordionItem title="Medium, 40px rows">The default.</NbAccordionItem></NbAccordion>
    <NbAccordion size="lg"><NbAccordionItem title="Large, 48px rows">For pages that are mostly accordion.</NbAccordionItem></NbAccordion>
  </div>
</preview>

## Chevron placement

The chevron sits at the end by default, so every title starts on the same line as the type around it. `align="start"` puts it in front, which makes the accordion read as a tree; use it only when the content really is hierarchical.

<preview>
  <div style="max-width: 34rem; width: 100%;">
    <NbAccordion align="start">
      <NbAccordionItem title="Chevron in front">Reads as a tree.</NbAccordionItem>
    </NbAccordion>
  </div>
</preview>
