---
layout: nubisco
title: Icons beyond the catalogue
intro: 'The icon set is Phosphor, about 1,500 glyphs in six weights, and almost everything a product needs is in it. This page is for the rest: the size, weight and vocabulary rules that keep many products drawing with one hand, the pictogram, and the icon Phosphor does not have.'
---

## The rules for every icon

**Size.** Four steps, `sm` 16, `md` 20, `lg` 24 and `xl` 32. 16 is the default and
sits beside 12 to 16px text, 20 beside 16 to 20px text, 24 in headings and cards, 32
in empty states and as a pictogram. Nothing goes below 16: Phosphor draws one
256-unit picture and scales it, so at 14px its stroke is under a pixel and at 12 it
is a grey smudge. Every icon in one row, menu or toolbar is the same size. Centre an
icon on its text, never on the baseline.

**Weight.** `regular` everywhere. `fill` only for a selected or active state (the
starred item, the current tab, a toggle that is on), so that the change of weight is
the signal. `thin` and `light` disappear at 16px, `bold` shouts, and `duotone` is
for pictograms only. A literal weight also links one weight of the icon rather than
six.

**Colour.** An icon takes the colour of its text (`currentColor`). When it must
differ, it differs by role, through a token: `var(--nb-c-warning)`, never a hex.

**Vocabulary.** One concept, one glyph. Phosphor ships near-twins (`trash` and
`trash-simple`, `pencil` and `pencil-simple`, `gear` and `gear-six`, `x` and
`x-circle`), and a product that uses both halves of a pair for the same action is
already drifting. Pick one name per concept and use it every time: delete is
`trash`, everywhere.

**Meaning.** An icon is decorative unless it carries meaning no text next to it
repeats; then it is named with `label`. An icon that does something is a button:
`NbButton variant="ghost"` with `icon`, named with `v-nb-tooltip`.

## Pictograms

A pictogram is a bigger, softer glyph that sets a scene rather than labelling a
control: the three cards of a first-run screen, the features of a pricing page, the
entry cards of a docs home. There is no separate pictogram set. A pictogram is a
Phosphor icon drawn this way:

- the `duotone` weight, the one place it is used,
- 32 to 48px (`size="xl"`, or `:size="48"`),
- in `var(--nb-c-primary)`,
- inside a container, an `NbCard` or a circle of `--nb-c-primary` at low strength,
  with padding of at least a quarter of the icon's size on every side (8px around a
  32px glyph, 12px around a 48px one).

<preview dir="row">
  <span
    style="display: inline-flex; padding: 12px; border-radius: 50%; background: color-mix(in srgb, var(--nb-c-primary) 12%, transparent)"
  >
    <NbIcon name="rocket-launch" weight="duotone" :size="48" color="var(--nb-c-primary)" />
  </span>
  <span
    style="display: inline-flex; padding: 8px; border-radius: 50%; background: color-mix(in srgb, var(--nb-c-primary) 12%, transparent)"
  >
    <NbIcon name="users-three" weight="duotone" size="xl" color="var(--nb-c-primary)" />
  </span>
</preview>

```vue
<span class="pictogram">
  <NbIcon
    name="rocket-launch"
    weight="duotone"
    :size="48"
    color="var(--nb-c-primary)"
  />
</span>

<style scoped>
.pictogram {
  display: inline-flex;
  padding: 12px; /* a quarter of 48 */
  border-radius: 50%;
  background: color-mix(in srgb, var(--nb-c-primary) 12%, transparent);
}
</style>
```

Use them in onboarding, marketing and pricing surfaces, and docs cards. **Never in an
empty state.** An empty state carries one plain icon at 24 or 32px, chosen by its
kind, because there the job is to say what happened and offer the next action, not
to decorate (see [Empty states](/patterns/empty-states), Rule 5). Never in a table,
a form or a toolbar, where a pictogram is just an oversized icon. A docs card loads
the icon through `NbIcon` like any other, not from an icon CDN by URL.

## An icon Phosphor does not have

First, look harder: search the gallery by tag, not only by name. Most "missing"
icons are in the set under another word. If it is genuinely missing:

**For one product,** draw it to the spec below and register it at startup. A
registered name works exactly like a built-in one, and can also override one:

```ts
import { registerIcons } from '@nubisco/ui'
import { h } from 'vue'

const Ledger = () =>
  h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 256 256',
    fill: 'currentColor',
    innerHTML: '<path d="..."/>',
  })

registerIcons({ ledger: Ledger })
```

```vue
<NbIcon name="ledger" />
```

**For every product,** add it to the library: an SVG in `src/assets/icons/<name>.svg`
becomes `@nubisco/ui/icons/<name>` the next time the assets are generated, with a
catalogue entry, a gallery tile and compile-time linking, exactly like a Phosphor
icon. `ai` is the first one there. The generator refuses a name Phosphor already
uses, a hard-coded fill and a viewBox off the 256 grid.

### The drawing spec

So that a house icon cannot be told apart from a Phosphor one:

| Property    | Value                                                                                   |
| ----------- | --------------------------------------------------------------------------------------- |
| Canvas      | `viewBox="0 0 256 256"`, the glyph inside the central 208 (24 units of margin a side)   |
| Stroke      | 16 units, round caps and joins: Phosphor regular. Outline it to a path before saving    |
| Colour      | None. No `fill` or `stroke` colour on any element; the module sets `fill: currentColor` |
| Weights     | One drawing, the regular weight. All six weight names resolve to it                     |
| Corners     | Rounded to match Phosphor; no sharp mitres                                              |
| Name        | kebab-case, what it is rather than what it does (`ledger`, not `open-accounts`)         |
| Check it at | 16px beside `regular` Phosphor icons, and at 48px. It should disappear into the set     |
