---
layout: nubisco
title: Building an inspector
---

An inspector is the tall, narrow panel that edits the currently-selected
thing: a node, a control, a layer. It is **scanned and operated**, not
read top to bottom, so it lives or dies on information design, not
typography. This guide is the correct way to build one from NubiscoUI,
and the mistakes to avoid (all of which we have shipped at least once).

The one principle everything else follows: **an inspector is dense and
quiet, so the values are the only loud thing.** A label tells you what a
field is; you already know, because you put it there. The value is what
you came to read.

## Density: use the `xs` field size

Inspectors pack many controls into a narrow column, so fields must be
compact. Every field component (`TextInput`, `NumberInput`, `Select`,
`DatePicker`) takes a `size`, and inspectors want **`xs`**:

```vue
<NbTextInput label="Name" size="xs" v-model="name" />
<NbSelect label="Orientation" size="xs" :options="opts" v-model="dir" />
```

| size | height | use                               |
| ---- | -----: | --------------------------------- |
| `xs` |   28px | inspectors, toolbars, dense grids |
| `sm` |   32px | compact forms                     |
| `md` |   40px | standalone forms (the default)    |
| `lg` |   48px | touch-first / hero forms          |

The four sizes, one control, one row. The heights in the table above are the
ones you are looking at, straight from `--nb-field-height-xs` … `-lg`:

<preview dir="col">
  <div class="nix-sizes">
    <div class="nix-size"><p class="nix-label">xs, 28px</p><NbTextInput v-model="ramp.xs" size="xs" /></div>
    <div class="nix-size"><p class="nix-label">sm, 32px</p><NbTextInput v-model="ramp.sm" size="sm" /></div>
    <div class="nix-size"><p class="nix-label">md, 40px</p><NbTextInput v-model="ramp.md" size="md" /></div>
    <div class="nix-size"><p class="nix-label">lg, 48px</p><NbTextInput v-model="ramp.lg" size="lg" /></div>
  </div>
</preview>

Four pixels of difference per step sounds like nothing until it is multiplied by
the number of rows an inspector actually carries. Below is the same five-row
section twice, in the same 280px column, differing only in the `size` passed to
its controls. Nothing else changes: same container, same `NbField` rows, same
values.

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half">
      <p class="nix-label">size="xs"</p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Properties" fluid v-model:size="densityXs">
          <NbField label="Name"><NbTextInput v-model="dense.name" size="xs" /></NbField>
          <NbField label="Channel"><NbSelect v-model="dense.channel" :options="channels" size="xs" /></NbField>
          <NbField label="Velocity"><NbNumberInput v-model="dense.velocity" size="xs" /></NbField>
          <NbField label="Transpose"><NbNumberInput v-model="dense.transpose" size="xs" /></NbField>
          <NbField label="Latch" control="fit"><NbSwitch v-model="dense.latch" name="latch-xs" /></NbField>
        </NbShellPanel>
      </div>
      <p class="nix-note">Five rows and a header cap, and the section still ends inside a screenful. This is the density the pattern is for.</p>
    </div>
    <div class="nix-half">
      <p class="nix-label">size="md"</p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Properties" fluid v-model:size="densityMd">
          <NbField label="Name"><NbTextInput v-model="loose.name" size="md" /></NbField>
          <NbField label="Channel"><NbSelect v-model="loose.channel" :options="channels" size="md" /></NbField>
          <NbField label="Velocity"><NbNumberInput v-model="loose.velocity" size="md" /></NbField>
          <NbField label="Transpose"><NbNumberInput v-model="loose.transpose" size="md" /></NbField>
          <NbField label="Latch" control="fit"><NbSwitch v-model="loose.latch" name="latch-md" /></NbField>
        </NbShellPanel>
      </div>
      <p class="nix-note">The same five rows, about 50px taller: four fields at 40px instead of 28px. `md` is right in a standalone form, where a field is the thing you came for. Here it buys nothing and costs a third of the column.</p>
    </div>
  </div>
</preview>

Neither switch is given a `size`, and that is deliberate. `NbSwitch`'s scale is
`sm | md | lg` (there is no `xs`), and outside `verbose` mode none of the three
changes anything: the size rules in `Switch.vue` are nested under `.verbose`, so
a plain switch keeps the base `.nb-switch-wrapper` box whatever you pass:
`width: calc(var(--nb-base-unit) * 4)` by `height: calc(var(--nb-base-unit) * 2)`
in `Switch.vue`, and `--nb-base-unit` is `8px` (`$base-unit: 8` in
`src/styles/variables/_layout.scss`), so 32x16. It happens to be shorter than an
`xs` row, so it costs nothing here, but do not read that as the size having been
honoured. It is the same shape of silent fallback the callout below describes.

`NbSwitch` also declares `name` as a **required** prop (it feeds `useStableId`,
which is what gives the checkbox its `id`), so every switch on this page passes
one. A switch without a `name` still renders, but it warns, and two switches
that fall back to the positional id are one refactor away from colliding.

::: warning The size must exist
`size` is a closed set (`xs` \| `sm` \| `md` \| `lg`). Every value maps to
a real style rule. Historically `xs` did **not** exist on field
components, so passing `size="xs"` silently fell back to `md` and every
field rendered ~40% too tall, the whole inspector looked crowded and
nobody could tell why. That size is real now, and the type will reject an
unknown one, but the lesson stands: if a control looks the wrong size,
check that the size you passed is one the component actually styles.
:::

## Reach for `.nb-inspector`

Do not restyle a sidebar by hand, and do not invent a new one per view. Wrap
your stacked `NbShellPanel`s in a `.nb-inspector` container, and put each row in
an [`NbField`](/ui/components/field). The row is a real component (label +
control on one grid), so alignment is **structural**: no `:has()` coercion, no
per-field CSS:

```vue
<div class="nb-inspector">
  <NbShellPanel title="Properties" fluid v-model:size="a">
    <NbField label="Name"><NbTextInput v-model="name" size="xs" /></NbField>
    <NbField label="Locked" control="fit"><NbSwitch v-model="locked" /></NbField>
    <!-- `size` on a slider reaches its readout, not the track. See below. -->
    <NbField label="Drag threshold (px)"><NbSlider v-model="t" :min="0" :max="20" size="xs" /></NbField>
  </NbShellPanel>
  <NbShellPanel title="MIDI" fluid v-model:size="b"> … </NbShellPanel>
</div>
```

You get:

- **One spine.** Every `NbField` shares `--nb-field-label-width`, so labels and
  values line up on a single edge you scan straight down, the biggest density
  and scannability win, and what UE5, Photoshop, Blender, and Figma all do.
- **Sliders stack** with a full-width track and a compact readout, so the track
  stays usable at any inspector width (a two-column slider collapses when the
  column is narrow).
- **Toggle rows** (`control="fit"`) let the label run wide and push the switch
  to the right edge, so a long toggle label never truncates.
- **Compact numerics.** Slider readouts and number steppers shrink for the dense
  rows, via the components' own CSS-var knobs (no specificity fights).
- **Cards with breathing room.** Panels are inset from the edges and separated
  by a small gap; each section carries a tinted **header cap**, and the panel
  under the pointer (or being edited) tints its top and bottom edges.
- **Muted structural headers**, so the values stay the loudest thing.

That paragraph is a list of claims, so here is the container making every one of
them. This is the real `.nb-inspector`, three real `NbShellPanel`s and nine real
`NbField` rows, in a 280px column. The two controls change the whole surface at
once: `size` is passed to every field, and `--nb-field-label-width` is set once
on the container, which is the only edit the spine ever needs.

<preview :props="inspectorProps" v-slot="{ resultingProps }">
  <div class="nb-inspector nix-col" :style="{ '--nb-field-label-width': resultingProps.labelWidth + 'rem' }">
    <NbShellPanel title="Properties" fluid v-model:size="propsPanel">
      <NbField label="Name"><NbTextInput v-model="node.name" :size="resultingProps.size" /></NbField>
      <NbField label="Orientation"><NbSelect v-model="node.dir" :options="orientations" :size="resultingProps.size" /></NbField>
      <NbField label="Locked" control="fit"><NbSwitch v-model="node.locked" name="node-locked" /></NbField>
      <NbField label="Drag threshold (px)"><NbSlider v-model="node.threshold" :min="0" :max="20" :size="resultingProps.size" /></NbField>
    </NbShellPanel>
    <NbShellPanel title="MIDI" fluid v-model:size="midiPanel">
      <NbField label="Channel"><NbSelect v-model="node.channel" :options="channels" :size="resultingProps.size" /></NbField>
      <NbField label="CC"><NbNumberInput v-model="node.cc" :min="0" :max="127" :size="resultingProps.size" /></NbField>
      <NbField label="Send host" control="fit"><NbSwitch v-model="node.sendHost" name="node-send-host" /></NbField>
    </NbShellPanel>
    <NbShellPanel title="Automation" fluid v-model:size="autoPanel">
      <NbField label="Curve"><NbSelect v-model="node.curve" :options="curves" :size="resultingProps.size" /></NbField>
      <NbField label="Smoothing"><NbSlider v-model="node.smoothing" :min="0" :max="100" :size="resultingProps.size" /></NbField>
    </NbShellPanel>
  </div>
</preview>

Read down the left edge: nine labels, one spine, no per-field CSS anywhere in
this page. The two sliders stacked themselves (label on its own line, full-width
track, compact readout) because `.nb-inspector` keys that off the control, not
off markup you write. Both switches sit on the right edge with their labels
running wide, from `control="fit"`. Hover a panel and its top and bottom edges
tint; collapse **Automation** with the header's minimise button and its title
dims to about 60% until you point at it, which is the "put away reads as put
away" claim, live.

Two honest edges of that demo. `NbSlider` accepts `size` (it inherits
`size?: 'xs' | 'sm' | 'md' | 'lg'` from `IWithFieldAppearance`) and emits
`nb-slider--xs`, but it has no `.nb-slider--xs` rule of its own, so that class
styles nothing. The prop is not inert, though: `Slider.vue` forwards it to the
`NbNumberInput` readout beside the track, which does have a `--xs` rule
(`--field-h: var(--nb-field-height-xs)`), and the track is 2px at every size, so
the row height follows the readout. `IWithFieldAppearance`'s doc comment
("Every value here is backed by a real style rule") is therefore true of the
field components and **not** true of `NbSlider`'s own root. Pass `size` anyway,
it does the work you want here, but know which half of the control it reaches.
And the panels only collapse here because each one is bound
to a `v-model:size` ref. `NbShellPanel` is fully controlled: without that
binding its own size buttons emit `update:size` into nothing and the panel never
moves.

Tune the label column with `--nb-field-label-width` when labels run long, and
keep labels short (`Send host`, not `Send to host address`).

### The legacy in-place conversion, and why it breaks the spine

A bare labeled field dropped straight into `.nb-inspector` without an `NbField`
wrapper is still converted in place for backward compatibility: `_inspector.scss`
carries `:has()` rules that coerce `.nb-text-input:has(> .nb-label)`,
`.nb-select:has(> .nb-label)` and a labelled `.nb-slider` into the same
two-column shape. It looks like the pattern works either way. It does not, and
this is the state a real migration meets, so here it is.

The conversion uses its own width, `--nb-inspector-label-width: 96px`, which is
**not** `--nb-field-label-width: 7.5rem` (120px). Mix the two in one panel and
you get two spines about 24px apart. Below, the left column is one panel holding
two `NbField` rows and two bare labelled fields; the right column is the same
four values, all four wrapped.

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half nix-half--wrong">
      <p class="nix-label nix-label--wrong">Wrong: two rows wrapped, two bare</p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Voice" fluid v-model:size="legacyPanel">
          <NbField label="Name"><NbTextInput v-model="legacy.name" size="xs" /></NbField>
          <NbField label="Channel"><NbSelect v-model="legacy.channel" :options="channels" size="xs" /></NbField>
          <NbTextInput label="Preset" v-model="legacy.preset" size="xs" />
          <NbSelect label="Curve" v-model="legacy.curve" :options="curves" size="xs" />
        </NbShellPanel>
      </div>
      <p class="nix-note">Four labels, two left edges for the values. The top two sit at <code>--nb-field-label-width</code> (7.5rem), the bottom two at <code>--nb-inspector-label-width</code> (96px), and the container variable the guidance tells you to tune moves only half of them. The conversion is a compatibility shim, not the pattern.</p>
    </div>
    <div class="nix-half nix-half--right">
      <p class="nix-label nix-label--right">Right: every row an <code>NbField</code></p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Voice" fluid v-model:size="convertedPanel">
          <NbField label="Name"><NbTextInput v-model="converted.name" size="xs" /></NbField>
          <NbField label="Channel"><NbSelect v-model="converted.channel" :options="channels" size="xs" /></NbField>
          <NbField label="Preset"><NbTextInput v-model="converted.preset" size="xs" /></NbField>
          <NbField label="Curve"><NbSelect v-model="converted.curve" :options="curves" size="xs" /></NbField>
        </NbShellPanel>
      </div>
      <p class="nix-note">One spine, and one variable that moves all of it. Wrapping is the whole migration: no CSS is deleted, no override is added.</p>
    </div>
  </div>
</preview>

::: warning Migrate, do not mix
The in-place rules exist so an old inspector keeps working, not so a new one
can skip `NbField`. A panel that mixes the two shapes is the worst of both:
it looks aligned until a label runs long, and then only half the column moves.
:::

### The same inspector, hand-rolled

Every mistake this page argues against has shipped. Here they are together, on
the left, next to the container on the right. Both columns are made of the same
real components with the same values: the left one is what a call site writes
when it builds a bespoke aside instead of reaching for the pattern.

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half nix-half--wrong">
      <p class="nix-label nix-label--wrong">Wrong: a bespoke aside</p>
      <div class="nix-handrolled nix-col">
        <strong class="nix-handrolled__head">Properties</strong>
        <NbTextInput label="Name" v-model="rolled.name" />
        <NbSelect label="Orientation" v-model="rolled.dir" :options="orientations" />
        <NbSwitch label="Locked" v-model="rolled.locked" name="rolled-locked" />
        <NbSlider label="Drag threshold (px)" v-model="rolled.threshold" :min="0" :max="20" />
        <div class="nix-handrolled__actions">
          <NbButton size="sm" variant="ghost">Bind</NbButton>
          <NbButton size="sm" variant="ghost">Re-learn</NbButton>
        </div>
      </div>
      <p class="nix-note">No spine: four labels sit above four controls at four different left edges, and there is nothing to scan down. Default <code>md</code> everywhere. The section heading is as loud as the values it introduces. Spacing is a stack of per-element margins, so it drifts the moment somebody adds a row. Both actions are bare <code>ghost</code>, which is transparent at rest: two grey words that do not read as buttons until the pointer finds them.</p>
    </div>
    <div class="nix-half nix-half--right">
      <p class="nix-label nix-label--right">Right: <code>.nb-inspector</code></p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Properties" fluid v-model:size="rolledPanel">
          <NbField label="Name"><NbTextInput v-model="fixed.name" size="xs" /></NbField>
          <NbField label="Orientation"><NbSelect v-model="fixed.dir" :options="orientations" size="xs" /></NbField>
          <NbField label="Locked" control="fit"><NbSwitch v-model="fixed.locked" name="fixed-locked" /></NbField>
          <NbField label="Drag threshold (px)"><NbSlider v-model="fixed.threshold" :min="0" :max="20" size="xs" /></NbField>
          <div class="nix-actions">
            <NbButton size="xs" variant="primary">Bind</NbButton>
            <NbButton size="xs" variant="secondary">Re-learn</NbButton>
          </div>
        </NbShellPanel>
      </div>
      <p class="nix-note">One spine, one header cap, one rhythm, <code>xs</code> throughout, and two actions that look like actions at rest. The only thing written here that is not a component or a prop is the container class.</p>
    </div>
  </div>
</preview>

The left column contains no hand-written imitation of a control: every field
there is the same `NbTextInput`, `NbSelect`, `NbSwitch` and `NbSlider` as the
right, just dropped into a `div` with its own margins. That is precisely how
these get built, and it is why the differences you can see are the pattern's
doing and not the components'.

::: tip One inspector, everywhere
Every sidebar-of-sections surface, a node inspector, a control inspector, a
settings panel, is the same pattern. Use `.nb-inspector` for all of them
rather than hand-rolling a bespoke aside per view; that is how the look stays
consistent and the fixes land once.
:::

## Hierarchy: one three-step text ramp

Use the text tokens you already have. Do not pin everything to
`--nb-c-text`, that is what makes an inspector read as a wall.

| role                              | token                | size / weight                                      | rendered by                                    |
| --------------------------------- | -------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **Value** (input text, the point) | `--nb-c-text`        | the field's own text size                          | the control (`NbTextInput`, `NbSelect`, …)     |
| **Label** (what the field is)     | `--nb-c-text-muted`  | 12px, weight 500, sentence case                    | `.nb-field__label` in `Field.vue`              |
| **Help / hint** (the fine print)  | `--nb-c-text-subtle` | 11px, the quietest                                 | `.nb-field__hint` in `Field.vue`               |
| **Panel header cap** (structure)  | `--nb-c-text-muted`  | 11px, weight 600, **uppercase**, `0.06em` tracking | `.nb-shell-panel__title` under `.nb-inspector` |

Field labels should be **quiet**: muted and small, sitting in the left column
beside their value (sentence case, not the uppercase reserved for the header
caps). If a label is as loud as its value, the eye has to work to find the
value. Help text is quieter still.

Uppercase and letter-spacing belong to the **header cap only**. That is the
whole reason the cap reads as structure and the label reads as content, and it
is worth stating twice because getting it backwards (uppercase labels, sentence-
case headers) is the single fastest way to flatten an inspector.

Four roles, one panel, nothing annotated by hand: the ramp below is a real
`NbShellPanel` inside a real `.nb-inspector`, and the label, hint and header are
whatever `Field.vue` and `_inspector.scss` render today. Squint at it. The value
should be the only thing that survives.

<preview dir="col">
  <div class="nb-inspector nix-col">
    <NbShellPanel title="Oscillator" fluid v-model:size="rampPanel">
      <NbField label="Name" hint="Shown in the patch list."><NbTextInput v-model="ramped.name" size="xs" /></NbField>
      <NbField label="Detune" hint="Cents, -50 to 50."><NbNumberInput v-model="ramped.detune" :min="-50" :max="50" size="xs" /></NbField>
    </NbShellPanel>
  </div>
</preview>

Reading down: **OSCILLATOR** is the cap (11px, uppercase, tracked, muted, on a
tinted bar). `Name` and `Detune` are labels (12px, sentence case, muted, no
tracking). The text you can edit is the value, at full `--nb-c-text`. The two
grey lines under the controls are hints at `--nb-c-text-subtle`, 11px, the
quietest thing on the surface. Three greys and one white, in that order, every
time.

One correction the demo makes for you: the hint is **not** aligned to the
field's left edge. `.nb-field__hint` sits at `grid-column: 2` (`Field.vue`), so
it aligns to the **control's** left edge, under the value it explains, which is
where you want it in a row layout. Only `.nb-field--stack` moves the hint to
column 1, because in a stacked field the control starts there too. Either way
the rule is the same: every hint in a panel shares one edge with its own
control, and a hint that does not is the bug.

## Structure: `ShellPanel` per section

Group related controls into a `ShellPanel`. Panels stack in the
inspector column; each has a muted header and its own collapse / expand
control.

```vue
<NbShellPanel title="Properties" fluid v-model:size="propsSize">
  <!-- fields -->
</NbShellPanel>
<NbShellPanel title="MIDI" fluid v-model:size="midiSize">
  <!-- fields -->
</NbShellPanel>
```

- Use **`fluid`** in a multi-section inspector so each panel takes only
  the height its content needs, instead of forcing every section to
  share the column equally.
- **Collapsed panels dim automatically** (the header drops to ~60% and
  restores on hover), so a put-away section reads as put-away at a
  glance. You do not style that yourself.
- The panel header is already muted by design. Do not override it back
  to bright white, that makes headers compete with the field labels
  below them and flattens the hierarchy.

`fluid` is the one that is hard to believe from prose, so here are both, side by
side, in the place an inspector actually lives: `NbShell`'s `inspector` column.
Each frame is the real shell inside `DemoFrame`, the shared fixed-height,
clipped box this docs site uses whenever a component sized to its parent has to
appear in a prose column. The frame is the one thing on this page that is not a
library component, which is why it is imported rather than pasted: the sentence
and the stylesheet used to be copied per page with the class prefix swapped.
Nothing about the shell is changed; it is given a viewport.

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half nix-half--wrong">
      <p class="nix-label nix-label--wrong">Wrong: no <code>fluid</code></p>
      <DemoFrame>
        <NbShell :inspector-visible="true" inspector-size="md" style="height: 100%">
          <template #topbar-left><strong>Patch 12</strong></template>
          <p style="margin: 0">A two-row section and a six-row section, each handed half the column.</p>
          <template #inspector>
            <div class="nb-inspector">
              <NbShellPanel title="Transport" v-model:size="frameA1">
                <NbField label="Tempo"><NbNumberInput v-model="frame.tempo" size="xs" /></NbField>
                <NbField label="Swing"><NbNumberInput v-model="frame.swing" size="xs" /></NbField>
              </NbShellPanel>
              <NbShellPanel title="Mixer" v-model:size="frameA2">
                <NbField label="Gain"><NbSlider v-model="frame.gain" :min="0" :max="100" size="xs" /></NbField>
                <NbField label="Pan"><NbSlider v-model="frame.pan" :min="-50" :max="50" size="xs" /></NbField>
                <NbField label="Mute" control="fit"><NbSwitch v-model="frame.mute" name="frame-mute-a" /></NbField>
              </NbShellPanel>
            </div>
          </template>
        </NbShell>
      </DemoFrame>
      <p class="nix-note">The default <code>flex: 1 1 0%</code> shares the column equally, so a two-row section is stretched to the height of a six-row one and the empty space reads as a missing control.</p>
    </div>
    <div class="nix-half nix-half--right">
      <p class="nix-label nix-label--right">Right: <code>fluid</code> on both</p>
      <DemoFrame>
        <NbShell :inspector-visible="true" inspector-size="md" style="height: 100%">
          <template #topbar-left><strong>Patch 12</strong></template>
          <p style="margin: 0">Each section takes the height its content needs, and the column ends where the content does.</p>
          <template #inspector>
            <div class="nb-inspector">
              <NbShellPanel title="Transport" fluid v-model:size="frameB1">
                <NbField label="Tempo"><NbNumberInput v-model="frame.tempo" size="xs" /></NbField>
                <NbField label="Swing"><NbNumberInput v-model="frame.swing" size="xs" /></NbField>
              </NbShellPanel>
              <NbShellPanel title="Mixer" fluid v-model:size="frameB2">
                <NbField label="Gain"><NbSlider v-model="frame.gain" :min="0" :max="100" size="xs" /></NbField>
                <NbField label="Pan"><NbSlider v-model="frame.pan" :min="-50" :max="50" size="xs" /></NbField>
                <NbField label="Mute" control="fit"><NbSwitch v-model="frame.mute" name="frame-mute-b" /></NbField>
              </NbShellPanel>
            </div>
          </template>
        </NbShell>
      </DemoFrame>
      <p class="nix-note">Same two sections, same values, one prop. Minimise <strong>Mixer</strong> in either frame to watch the collapsed header dim.</p>
    </div>
  </div>
</preview>

## Controls that look like controls

Actions in an inspector (Bind, Re-learn, Apply, Send) are **buttons**, so
they must look like buttons at rest, not only on hover. Pick the variant
by role:

```vue
<!-- The main action: filled -->
<NbButton size="xs" variant="primary">Bind</NbButton>
<!-- Standard actions: subtle fill + border -->
<NbButton size="xs" variant="secondary">Re-learn</NbButton>
<!-- Destructive / dismissive: quiet, outlined -->
<NbButton size="xs" variant="ghost" outlined icon="x">Unbind</NbButton>
```

::: danger Do not use bare `ghost` for actions
`variant="ghost"` is **transparent with a transparent border** until
hover, it is styled to look like plain text at rest. It is for
toolbar-icon affordances inside a dense header, not for a labelled action
a user must discover. An inspector full of ghost "buttons" reads as a
list of grey words. Use `primary` / `secondary`, and reach for
`ghost outlined` only when you genuinely want a quiet, dismissive control
that still carries a border.
:::

The argument is about **at rest**, so this demo is deliberately static: do not
hover it, look at it. Four real `NbButton`s, one row of a real inspector panel:

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half nix-half--wrong">
      <p class="nix-label nix-label--wrong">Wrong: bare <code>ghost</code></p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Mapping" fluid v-model:size="ghostPanel">
          <NbField label="Source"><NbSelect v-model="map.source" :options="sources" size="xs" /></NbField>
          <div class="nix-actions">
            <NbButton size="xs" variant="ghost">Bind</NbButton>
            <NbButton size="xs" variant="ghost">Re-learn</NbButton>
            <NbButton size="xs" variant="ghost">Unbind</NbButton>
          </div>
        </NbShellPanel>
      </div>
      <p class="nix-note">Transparent fill, transparent border. Three labelled actions rendered as three grey words, and a user who never hovers that strip never finds out they are buttons.</p>
    </div>
    <div class="nix-half nix-half--right">
      <p class="nix-label nix-label--right">Right: variant by role</p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Mapping" fluid v-model:size="realPanel">
          <NbField label="Source"><NbSelect v-model="map.source" :options="sources" size="xs" /></NbField>
          <div class="nix-actions">
            <NbButton size="xs" variant="primary">Bind</NbButton>
            <NbButton size="xs" variant="secondary">Re-learn</NbButton>
            <NbButton size="xs" variant="ghost" outlined>Unbind</NbButton>
          </div>
        </NbShellPanel>
      </div>
      <p class="nix-note">Filled for the main action, subtle fill plus border for the standard one, and <code>ghost outlined</code> for the dismissive one: quiet, but still visibly a control.</p>
    </div>
  </div>
</preview>

## Spacing: one rhythm

Lay fields out with a single `gap` on the column, not per-field margins.
One consistent vertical rhythm between every field, one consistent gap
between a label and its input. Mixed margins are how you end up with one
panel's help text indented differently from the rest.

You do not write that gap. `.nb-inspector` sets it once, on the panel's content
box, and every field in every panel inherits it:

```scss
// src/styles/patterns/_inspector.scss
.nb-inspector .nb-shell-panel__content {
  flex-direction: column;
  align-items: stretch;
  gap: 6px; // the whole vertical rhythm, in one place
  padding: 8px 12px;
}
```

So the correct markup for a rhythm is the correct markup for everything else on
this page: `.nb-inspector`, `NbShellPanel`, `NbField`. There is no separate
spacing wrapper to write.

```vue
<div class="nb-inspector">
  <NbShellPanel title="Properties" fluid v-model:size="a">
    <NbField label="Name"><NbTextInput v-model="name" size="xs" /></NbField>
    <NbField label="Detune"><NbNumberInput v-model="detune" size="xs" /></NbField>
  </NbShellPanel>
</div>
```

The failure mode is worth seeing rather than imagining, because it never arrives
all at once: somebody adds `margin-bottom: 14px` to one row, somebody else nudges
another to 6px to "tighten it", and six months later no two gaps match. Both
columns below hold the same four real `NbField` rows with the same values. The
left one is in a plain `div` whose children carry their own margins; the right
one is in a panel and carries none.

<preview dir="col">
  <div class="nix-pair">
    <div class="nix-half nix-half--wrong">
      <p class="nix-label nix-label--wrong">Wrong: margins per row</p>
      <div class="nix-drift nix-col">
        <NbField label="Name"><NbTextInput v-model="drift.name" size="xs" /></NbField>
        <NbField label="Detune"><NbNumberInput v-model="drift.detune" size="xs" /></NbField>
        <NbField label="Channel"><NbSelect v-model="drift.channel" :options="channels" size="xs" /></NbField>
        <NbField label="Latch" control="fit"><NbSwitch v-model="drift.latch" name="drift-latch" /></NbField>
      </div>
      <p class="nix-note">The spine still holds (that is <code>NbField</code>'s doing, not the wrapper's), but the vertical rhythm does not: 16px, then 6px, then 20px. Nothing here is broken enough to file a bug, which is exactly why it ships.</p>
    </div>
    <div class="nix-half nix-half--right">
      <p class="nix-label nix-label--right">Right: one <code>gap</code></p>
      <div class="nb-inspector nix-col">
        <NbShellPanel title="Oscillator" fluid v-model:size="rhythmPanel">
          <NbField label="Name"><NbTextInput v-model="rhythm.name" size="xs" /></NbField>
          <NbField label="Detune"><NbNumberInput v-model="rhythm.detune" size="xs" /></NbField>
          <NbField label="Channel"><NbSelect v-model="rhythm.channel" :options="channels" size="xs" /></NbField>
          <NbField label="Latch" control="fit"><NbSwitch v-model="rhythm.latch" name="rhythm-latch" /></NbField>
        </NbShellPanel>
      </div>
      <p class="nix-note">One 6px gap between every row, set once in the pattern stylesheet. Add a fifth row and it lands on the same rhythm without anyone deciding anything.</p>
    </div>
  </div>
</preview>

::: warning There is no token for the row gap
`6px` is a literal in `_inspector.scss`, not a variable, so a surface that
genuinely needs a different rhythm has to override
`.nb-shell-panel__content`'s `gap` from outside the pattern. That is a gap in
the pattern, not a licence to go back to margins: one override on the
container is still one place, and per-row margins are still four.
:::

## Keyboard and screen readers

An inspector is operated, not just read, so its keyboard story matters more
than a banner's does. A nine-row column is nine or more tab stops before the
user reaches anything else on the page.

**Tab order is DOM order, and DOM order is your section order.** Nothing on
this page reorders focus, so the order a user tabs through is exactly the order
you wrote the panels and fields in. That is the argument for grouping into
`NbShellPanel`s that match how the work is done, not how the data model is
shaped: a user tabbing from **Channel** to **CC** to **Send host** is walking
your information design.

**Collapsing really removes the stops.** `ShellPanel.vue` renders its content
under `v-if="currentSize !== 'collapsed'"`, so a minimised section is out of the
DOM, not merely hidden. A put-away section costs a keyboard user nothing, which
is what makes collapse a real density tool rather than a visual one.

**The panel size buttons are reachable and announced.** Each is a real
`<button type="button">` with `aria-label` (`Minimize` / `Default` /
`Maximize`) and `aria-pressed` reflecting the current size, inside a
`role="group"` labelled `"<title> panel size"`. So they are three tab stops per
panel. In a three-panel inspector that is nine stops of chrome sitting between
the user and the fields, which is a real cost: prefer fewer, larger sections
over many small ones.

**Associate the label with its control.** `NbField` renders a real
`<label :for>` and exposes the id it generated to the default slot, so bind it:

```vue
<NbField label="Name" v-slot="{ id }">
  <NbTextInput :id="id" v-model="name" size="xs" />
</NbField>
```

`NbTextInput`, `NbSelect` and `NbNumberInput` all take `id` and put it on the
control, so this works today. Leave it unbound and the label is visual only:
the `for` points at an id nothing carries, and a screen reader reads an unnamed
text field.

::: danger `NbSwitch` cannot take the field's id
`NbSwitch` derives its id through `useStableId` and renders the checkbox as
`` `${id}-input` ``, so `<NbField v-slot="{ id }"><NbSwitch :id="id" …>` yields
`for="x"` against `id="x-input"`: still no association. Until that is fixed,
give a `control="fit"` toggle row its own accessible name, and expect the row
to announce as a **checkbox** ("checked" / "not checked"), not as a switch
("on" / "off"), because that is the native element underneath.
:::

::: danger `NbSlider`'s track is pointer-only
`Slider.vue` has no `tabindex`, no `keydown` handler, no `role="slider"` and no
`aria-value*` on its track. The only keyboard path to a slider value is the
`NbNumberInput` readout beside it, which is why `showInput` defaults to true
and why turning it off in an inspector makes that row unreachable without a
mouse. Do not set `:show-input="false"` on an inspector slider.
:::

## What this page does not demo

Every claim above that could be shown is shown. These could not be, and saying
so is cheaper than letting you find out:

- **Screen-reader output.** Everything in the section above is read from the
  components' markup, not captured from NVDA or VoiceOver. The two `danger`
  callouts are the two places that reading predicts a bad announcement; they
  are predictions, not recordings.
- **The resize handle.** `.nb-inspector`'s 5px gutter exists to clear the
  shell's inspector resize handle. The shell frames on this page are 300px
  boxes, so dragging that handle is not usefully demonstrable at this size.
- **A real selection.** An inspector edits the currently-selected thing, and
  every demo here is bound to a fixed object. Nothing shows the empty state
  (no selection) or the multi-select state, because those are application
  concerns the pattern does not yet rule on. If your inspector has them, they
  need guidance this page does not give.
- **Theme variation.** All demos run in whichever theme you are reading in.
  The token names in the hierarchy table are the contract; the specific greys
  are the theme's business.
- **Long-label truncation.** `.nb-field__label` ellipsizes, and the fix is
  `--nb-field-label-width` (shown live in the container demo) or a shorter
  label. There is no separate demo of the ellipsis itself.

## Checklist

Before you ship an inspector, confirm:

- [ ] Every field is `size="xs"` (and the size renders, not falls back).
- [ ] Labels are muted and quiet; values are the brightest thing.
- [ ] Help text is subtle and shares its control's left edge (column 2 in a
      row field, column 1 in a `stack` field), the same for every row.
- [ ] Panel headers are the muted default, not overridden bright.
- [ ] Every action is a real button variant, never bare `ghost`.
- [ ] One `gap` sets the spacing, no scattered margins.
- [ ] Every row is an `NbField`, with no bare labelled fields left relying on
      the legacy in-place conversion.
- [ ] Each control is bound to its field's `id`, so the label names it.
- [ ] Sliders keep their readout, so the value is reachable from the keyboard.

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { PreviewPropDef } from '../.vitepress/theme/components/Preview.d'
import DemoFrame from '../shared/DemoFrame.vue'

/* Option lists. `options` on NbSelect is ISelectOption[]: { label, value }. */
const channels = [
  { label: 'Channel 1', value: 1 },
  { label: 'Channel 2', value: 2 },
  { label: 'Channel 10', value: 10 },
]
const orientations = [
  { label: 'Horizontal', value: 'h' },
  { label: 'Vertical', value: 'v' },
]
const curves = [
  { label: 'Linear', value: 'linear' },
  { label: 'Exponential', value: 'exp' },
  { label: 'S-curve', value: 's' },
]
const sources = [
  { label: 'Mod wheel', value: 'mod' },
  { label: 'Expression', value: 'exp' },
]

/* The size ramp: one model per control so each stays independently editable. */
const ramp = reactive({ xs: 'Osc 1', sm: 'Osc 1', md: 'Osc 1', lg: 'Osc 1' })

/* The xs / md density pair. Same shape twice, so the only difference on screen
   is the `size` each column passes. */
const dense = reactive({
  name: 'Osc 1',
  channel: 1,
  velocity: 96,
  transpose: 0,
  latch: true,
})
const loose = reactive({
  name: 'Osc 1',
  channel: 1,
  velocity: 96,
  transpose: 0,
  latch: true,
})

/* NbShellPanel is fully controlled: its size buttons emit `update:size` and do
   nothing unless a ref is bound, so every panel on this page has one. */
const densityXs = ref('default')
const densityMd = ref('default')
const propsPanel = ref('default')
const midiPanel = ref('default')
const autoPanel = ref('default')
const rolledPanel = ref('default')
const ghostPanel = ref('default')
const realPanel = ref('default')
const frameA1 = ref('default')
const frameA2 = ref('default')
const frameB1 = ref('default')
const frameB2 = ref('default')
const rampPanel = ref('default')
const legacyPanel = ref('default')
const convertedPanel = ref('default')
const rhythmPanel = ref('default')

/* The text ramp: a real field with a real hint, so the four roles on screen are
   whatever Field.vue and _inspector.scss render today. */
const ramped = reactive({ name: 'Osc 1', detune: -7 })

/* The legacy in-place conversion pair: same four values, wrapped on the right
   and half-bare on the left. */
const legacy = reactive({
  name: 'Osc 1',
  channel: 1,
  preset: 'Init',
  curve: 'exp',
})
const converted = reactive({
  name: 'Osc 1',
  channel: 1,
  preset: 'Init',
  curve: 'exp',
})

/* The spacing pair. */
const drift = reactive({ name: 'Osc 1', detune: -7, channel: 1, latch: true })
const rhythm = reactive({ name: 'Osc 1', detune: -7, channel: 1, latch: true })

/* The container demo. `size` is a real prop on every field component; the label
   width is the container variable the guidance names, set once. */
const inspectorProps: PreviewPropDef[] = [
  {
    name: 'size',
    label: 'Field size',
    type: 'single',
    default: 'xs',
    options: [
      { value: 'xs', label: 'xs' },
      { value: 'sm', label: 'sm' },
      { value: 'md', label: 'md' },
      { value: 'lg', label: 'lg' },
    ],
  },
  {
    name: 'labelWidth',
    label: 'Label column (rem)',
    type: 'slider',
    default: 7.5,
    min: 4,
    max: 12,
    step: 0.5,
  },
]

const node = reactive({
  name: 'Filter cutoff',
  dir: 'h',
  locked: false,
  threshold: 4,
  channel: 1,
  cc: 74,
  sendHost: true,
  curve: 'exp',
  smoothing: 35,
})

/* The hand-rolled contrast: identical values on both sides. */
const rolled = reactive({
  name: 'Filter cutoff',
  dir: 'h',
  locked: false,
  threshold: 4,
})
const fixed = reactive({
  name: 'Filter cutoff',
  dir: 'h',
  locked: false,
  threshold: 4,
})

const map = reactive({ source: 'mod' })

const frame = reactive({ tempo: 120, swing: 12, gain: 70, pan: 0, mute: false })
</script>

<style scoped>
/* An inspector is a narrow column, so every demo is given one. 280px is the
   shell's `md` inspector width, near enough. */
.nix-col {
  width: 280px;
  max-width: 100%;
}

/* The preview area stretches a single child, which would make one field as tall
   as the frame. A plain wrapper keeps each demo at its own height. */
.nix-sizes {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
}

.nix-size {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) / 2);
  min-width: 140px;
  flex: 1 1 140px;
}

/* Two columns where the docs column is wide enough, one where it is not. */
.nix-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: calc(var(--nb-base-unit) * 2);
  width: 100%;
  align-items: start;
}

.nix-half {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--nb-base-unit) * 1.5);
  padding: calc(var(--nb-base-unit) * 1.5);
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}

.nix-half--wrong {
  border-color: var(--nb-c-danger-surface);
}

.nix-half--right {
  border-color: var(--nb-c-success-surface);
}

.nix-half > .nb-demo-frame {
  width: 100%;
}

.nix-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--nb-c-text-muted);
}

.nix-label--wrong {
  color: var(--nb-c-danger);
}

.nix-label--right {
  color: var(--nb-c-success);
}

.nix-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--nb-c-text-muted);
}

/* A row of actions inside a panel. One gap, no per-button margins, which is the
   spacing rule this page ends on. */
.nix-actions {
  display: flex;
  gap: calc(var(--nb-base-unit) / 2);
  flex-wrap: wrap;
}

/* The bespoke aside, written the way call sites write them: a stack of
   per-element margins and a heading pinned to full contrast. The controls
   inside it are the real components, untouched. */
.nix-handrolled {
  padding: 12px;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
}

.nix-handrolled > * {
  margin-bottom: 14px;
}

.nix-handrolled > *:last-child {
  margin-bottom: 0;
}

.nix-handrolled__head {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--nb-c-text);
}

.nix-handrolled__actions {
  display: flex;
  gap: 6px;
}

/* The wrapper a rhythm drifts in: four real NbField rows, each carrying its own
   margin because somebody adjusted it once. No component is imitated here; only
   the container is wrong, which is the whole point. */
.nix-drift {
  padding: 8px 12px;
  border: 1px solid var(--nb-c-border);
  border-radius: var(--nb-radius-md);
  background: var(--nb-c-layer-1);
}

.nix-drift > *:nth-child(1) {
  margin-bottom: 16px;
}

.nix-drift > *:nth-child(2) {
  margin-bottom: 6px;
}

.nix-drift > *:nth-child(3) {
  margin-bottom: 20px;
}
</style>
