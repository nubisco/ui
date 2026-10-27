---
layout: nubisco
title: Blueprint Card
intro: "`NbBlueprintCard` is a node card designed to live inside an [`NbBlueprint`](/components/blueprint/usage) canvas. It renders a card with an identity rail down its left edge, typed input/output ports, a category label, an optional enable toggle, and an optional remove button. It is presentational: the parent owns the card's position and the connections between cards."
source: src/components/BlueprintCard.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

## Ports and connected state

Ports are split automatically by type: `input` on the left, `output` on the right. Pass `connectedPorts` with an array of port IDs to show which ports are wired; a wired pin is filled in its own colour.

Ports are the part of a node graph people look at most, so their anatomy, geometry and states are documented in full under [Ports](#ports) below.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 2rem;">
    <NbBlueprintCard
      id="mix"
      title="Mixer"
      category="utility"
      color="#22c55e"
      :ports="[
        { id: 'a', label: 'Channel A', type: 'input' },
        { id: 'b', label: 'Channel B', type: 'input' },
        { id: 'c', label: 'Channel C', type: 'input' },
        { id: 'out', label: 'Sum', type: 'output' },
      ]"
      :connected-ports="['a', 'out']"
    />
  </div>
</preview>

## Selected state

Pass `selected` to draw the card's border in its own identity colour, with a matching inset line. Selection is a colour change and nothing else: it does not lift the card or cast a shadow, because moving a card moves its pins, and its pins are where its wires are anchored.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="sel"
      title="Planet"
      category="geometry"
      color="#6366f1"
      selected
      :ports="[{ id: 'out', label: 'out', type: 'output' }]"
      :connected-ports="['out']"
    />
  </div>
</preview>

## Enable toggle and disabled state

When `enabled` is passed, a compact accent-tinted toggle renders in the header. Disabled cards drop to 55% opacity, collapse the body, and append " . off" to the category tag.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center; gap: 1rem;">
    <NbBlueprintCard
      id="on"
      title="Atmosphere"
      category="effect"
      color="#a855f7"
      :enabled="true"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
      :connected-ports="['in', 'out']"
      collapsed
    />
    <NbBlueprintCard
      id="off"
      title="Fog"
      category="effect"
      color="#a855f7"
      :enabled="false"
      :ports="[{ id: 'in', label: 'in', type: 'input' }]"
      collapsed
    />
  </div>
</preview>

## Status

Three states, each a distinct glyph so they stay apart in greyscale, for a reader with a colour vision deficiency, and at the zoom levels where a coloured dot would be sub-pixel.

<preview>
  <div style="padding: 2rem 3rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 2px; display: flex; justify-content: center; gap: 3.5rem; flex-wrap: wrap;">
    <NbBlueprintCard id="sv" title="Loaded" category="plugin" color="#22c55e" status="valid" />
    <NbBlueprintCard id="sw" title="Latency" category="plugin" color="#f59e0b" status="warning" />
    <NbBlueprintCard id="se" title="Missing" category="plugin" color="#dc2626" status="error" />
  </div>
</preview>

The glyph is a header cell rather than part of the title, so a long title
ellipsises without pushing the status out of view.

## Removable

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="rm"
      title="Temporary Node"
      category="scratch"
      color="#ef4444"
      removable
      :ports="[{ id: 'in', label: 'in', type: 'input' }]"
    />
  </div>
</preview>

## Custom body content

Anything placed in the default slot renders inside the card body, below the parameters.

<preview>
  <div style="padding: 2rem; background: var(--nb-c-layer-0, var(--nb-c-bg)); border-radius: 8px; display: flex; justify-content: center;">
    <NbBlueprintCard
      id="gain"
      title="Gain"
      category="effect"
      color="#38bdf8"
      :ports="[
        { id: 'in', label: 'in', type: 'input' },
        { id: 'out', label: 'out', type: 'output' },
      ]"
    >
      <span style="font-size: 11px; color: var(--nb-c-text-muted);">+6 dB</span>
    </NbBlueprintCard>
  </div>
</preview>

## Inside a blueprint

For a complete example wiring cards and ports into an `NbBlueprint` canvas, see the [Blueprint](/components/blueprint/usage) docs.
