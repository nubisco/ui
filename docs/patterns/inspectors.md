# Building an inspector

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

::: warning The size must exist
`size` is a closed set (`xs` \| `sm` \| `md` \| `lg`). Every value maps to
a real style rule. Historically `xs` did **not** exist on field
components, so passing `size="xs"` silently fell back to `md` and every
field rendered ~40% too tall, the whole inspector looked crowded and
nobody could tell why. That size is real now, and the type will reject an
unknown one, but the lesson stands: if a control looks the wrong size,
check that the size you passed is one the component actually styles.
:::

## Hierarchy: one three-step text ramp

Use the text tokens you already have. Do not pin everything to
`--nb-c-text`, that is what makes an inspector read as a wall.

| role                              | token                | weight / size                  |
| --------------------------------- | -------------------- | ------------------------------ |
| **Value** (input text, the point) | `--nb-c-text`        | brightest                      |
| **Label** (what the field is)     | `--nb-c-text-muted`  | 11px, uppercase, letter-spaced |
| **Help / hint** (the fine print)  | `--nb-c-text-subtle` | 11px, the quietest             |
| **Panel header** (structure)      | `--nb-c-text-muted`  | 11px, a divider, not content   |

Labels should be **quiet**: muted, small, letter-spaced caps sitting
just above their field. If a label is as loud as its value, the eye has
to work to find the value. Help text is quieter still, and always aligns
to the same left edge as the field above it, a stray indent on one hint
reads as a bug.

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

## Spacing: one rhythm

Lay fields out with a single `gap` on the column, not per-field margins.
One consistent vertical rhythm between every field, one consistent gap
between a label and its input. Mixed margins are how you end up with one
panel's help text indented differently from the rest.

```vue
<div style="display: flex; flex-direction: column; gap: 12px">
  <!-- fields, each: label + control, 4px internal gap -->
</div>
```

## Checklist

Before you ship an inspector, confirm:

- [ ] Every field is `size="xs"` (and the size renders, not falls back).
- [ ] Labels are muted and quiet; values are the brightest thing.
- [ ] Help text is subtle and aligned to the field's left edge.
- [ ] Panel headers are the muted default, not overridden bright.
- [ ] Every action is a real button variant, never bare `ghost`.
- [ ] One `gap` sets the spacing, no scattered margins.
