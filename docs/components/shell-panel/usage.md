---
layout: nubisco
title: Shell Panel
intro: '`NbShellPanel` is a self-contained, collapsible panel that negotiates space with its siblings via flexbox. Each panel renders with its own border, background, and a small gap around it, so that stacked panels look visually detached from one another and from their container (similar to panels in Unity or Unreal Engine).'
source: src/components/ShellPanel.vue
tab: usage
pageTabs: ['usage', 'code']
---

Panels are layer-aware. They paint `--nb-c-surface` and `--nb-c-border`, and they derive their depth from nesting: a panel in a shell's main region takes layer 1, because that region is the page ground, and a panel inside another surface goes one deeper again, clamped at layer 3. Placing them inside a `.nb-layer-{0-3}` container still pins the whole subtree to that layer and restarts the count from there.

## Long titles

A title longer than the header has room for is cut with an ellipsis, and the
full text is in the title's `title` attribute, so hovering it shows the whole
name. The size buttons never shrink to make room, so a long title never runs
under them.

<preview dir="col">
  <div style="width: 100%; max-width: 280px; display: flex; flex-direction: column;">
    <NbShellPanel title="Answers to the second question, in the order they were agreed" size="collapsed" />
  </div>
</preview>

<!--@include: ./_shared.md-->
