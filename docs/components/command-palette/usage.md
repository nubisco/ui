---
layout: nubisco
title: Command Palette
intro: '`NbCommandPalette` is a VS Code-style overlay for discovering and executing application commands. Any component in the tree can register commands, and users invoke them via a keyboard shortcut or programmatic API.'
source: src/components/CommandPalette.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Live demo

Click the button below to open the command palette. It has been pre-loaded with sample commands. Press **Escape** to dismiss it, or click on any command to execute it.

<preview>
  <NbGrid dir="row" gap="sm" align="center">
    <NbButton @click="palette.open()">Open Command Palette</NbButton>
    <NbButton variant="secondary" @click="palette.open('save')">Open with "save" pre-filled</NbButton>
  </NbGrid>
  <NbCommandPalette open-shortcut="Ctrl+Shift+k" placeholder="Search commands..." />
</preview>

::: tip
This documentation site uses **Ctrl+Shift+K** instead of the default Cmd+K to avoid conflicting with VitePress's own search shortcut. In your application you can configure any shortcut via the `openShortcut` prop.
:::

## On a phone

On a phone (below 672px, or a touch phone held sideways) the palette is a
full-width sheet from the top edge instead of a card 15% down the screen. It is
never taller than the visual viewport (`--nb-vvh`, falling back to `100dvh`),
so the results stay above the on-screen keyboard, and only the results scroll.
Desktops are unchanged.

## Search behavior

The command palette uses fuzzy matching with weighted scoring:

1. **Exact prefix** matches score highest
2. **Word boundary** matches (start of a word) score next
3. **Substring** matches score proportionally
4. **Fuzzy** character-by-character matches score lowest

The search matches against the command label, namespace, and optional keywords.

<!--@include: ./_shared.md-->
