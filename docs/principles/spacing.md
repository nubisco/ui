---
title: Spacing and rhythm
description: The Nubisco spacing scale, how to pick a step, and where space belongs when a component and its parent disagree.
---

# Spacing and rhythm

Space is the only property in this library that two people can both get "right" and still produce two different screens. Colour has semantic roles that refuse to be misread. Type has named sets. Space has a number, and a number always looks reasonable in isolation.

That is why the audit of twelve consuming applications found one app with **462 hardcoded pixel values and zero uses of the spacing scale**, and another with **287 and zero**. Neither team was careless. Both read [Design Tokens](/design-tokens), saw a rendered strip of bars, concluded the scale was an internal implementation detail of the library, and wrote `padding: 14px`. This page exists so that conclusion is no longer available.

::: warning The library is not innocent either
Across `src/components/*.vue` there are **166** `padding` / `margin` / `gap` declarations written with raw pixel literals against **48** written with `var(--nb-spacing-*)`. Some of those literals are legitimate (see [Where the scale genuinely runs out](#where-the-scale-genuinely-runs-out)). Most are not. Do not take the library's own source as a licence.
:::

## The words this page uses

Seven terms carry most of the weight here. They are used precisely and they are not interchangeable.

| Term        | Means                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step**    | One entry on the spacing scale, named by its pixel value: `--nb-spacing-16`. A step is a claim about a relationship, not a measurement.                                |
| **Rhythm**  | The pattern a reader learns from repeated steps down a page. Rhythm is what makes a group read as a group without a border. Break it and grouping stops communicating. |
| **Inset**   | Space between a container's edge and its own content. Written as `padding`. Owned by the component.                                                                    |
| **Gutter**  | Space between siblings that sit side by side or stacked. Written as `gap`. Owned by the parent.                                                                        |
| **Inside**  | Every value a component writes about itself: its inset, the gaps between its own parts. See [Inside versus between](#inside-versus-between).                           |
| **Between** | Every value about a component's relationship to its siblings. Never written by the component.                                                                          |
| **Density** | The `size` prop on field controls (`xs` `sm` `md` `lg`). It changes control height, so it changes the rhythm around it. See [Density](#density).                       |

Two more, borrowed from adjacent pages because this page leans on them: a **token** is a CSS custom property emitted on `:root` ([Design Tokens](/design-tokens)), and a **breakpoint** is one of the five min-widths `sm` 320, `md` 672, `lg` 1056, `xl` 1312, `xxl` 1584, declared in `src/styles/variables/_breakpoints.scss` and documented on [Layout](/principles/layout).

## The base unit

```css
--nb-base-unit: 8px;
```

One token, declared in `src/styles/_theme.scss`, and the geometric seed for the parts of the system that are computed. Field heights, radii, shell chrome and menu rows are all `calc(var(--nb-base-unit) * n)`, so they rescale together if you change it.

::: danger The spacing scale does not follow `--nb-base-unit`
`--nb-spacing-16` is emitted as the literal `1rem`, not as `calc(var(--nb-base-unit) * 2)`. If you set `--nb-base-unit: 10px` on `:root`, every field height, radius and shell dimension grows and the entire spacing scale stays exactly where it was. The result is a UI that looks stretched in one axis and unchanged in the other.

Treat `--nb-base-unit` as read-only unless you are prepared to re-declare the spacing scale in the same stylesheet. This is a real limitation of the current implementation, not a design position.
:::

## The scale

Twenty-five steps, named by their pixel value at a 16px root font size. The token is `--nb-spacing-<px>`.

| Token             |    rem | px  | Uses in `src/components` | Typical role                                          |
| ----------------- | -----: | --- | -----------------------: | ----------------------------------------------------- |
| `--nb-spacing-0`  |      0 | 0   |                        0 | Explicit reset, so the intent reads as deliberate.    |
| `--nb-spacing-2`  |  0.125 | 2   |                        4 | Hairline. Icon to its own label, badge inner padding. |
| `--nb-spacing-4`  |   0.25 | 4   |                       11 | Tight pair. Glyph and text inside one control.        |
| `--nb-spacing-8`  |    0.5 | 8   |                       17 | The workhorse. Related controls in a row.             |
| `--nb-spacing-9`  | 0.5625 | 9   |                        0 | Off-grid. See the note below.                         |
| `--nb-spacing-10` |  0.625 | 10  |                        3 | Off-grid.                                             |
| `--nb-spacing-11` | 0.6875 | 11  |                        0 | Off-grid.                                             |
| `--nb-spacing-12` |   0.75 | 12  |                       14 | Inside a small container. Label column gutter.        |
| `--nb-spacing-13` | 0.8125 | 13  |                        0 | Off-grid.                                             |
| `--nb-spacing-14` |  0.875 | 14  |                        1 | Off-grid.                                             |
| `--nb-spacing-16` |      1 | 16  |                       12 | Container padding. Distinct fields in a form.         |
| `--nb-spacing-18` |  1.125 | 18  |                        0 | Off-grid.                                             |
| `--nb-spacing-20` |   1.25 | 20  |                        0 |                                                       |
| `--nb-spacing-24` |    1.5 | 24  |                        5 | Between groups inside one section.                    |
| `--nb-spacing-28` |   1.75 | 28  |                        0 |                                                       |
| `--nb-spacing-32` |      2 | 32  |                        1 | Between sections of a page.                           |
| `--nb-spacing-36` |   2.25 | 36  |                        0 |                                                       |
| `--nb-spacing-42` |  2.625 | 42  |                        0 | Off-grid.                                             |
| `--nb-spacing-46` |  2.875 | 46  |                        0 | Off-grid.                                             |
| `--nb-spacing-48` |      3 | 48  |                        0 | Major break. Above and below a page header.           |
| `--nb-spacing-50` |  3.125 | 50  |                        0 | Off-grid.                                             |
| `--nb-spacing-54` |  3.375 | 54  |                        0 | Off-grid.                                             |
| `--nb-spacing-60` |   3.75 | 60  |                        0 |                                                       |
| `--nb-spacing-68` |   4.25 | 68  |                        0 |                                                       |
| `--nb-spacing-76` |   4.75 | 76  |                        0 |                                                       |

Rendered live, with the bars to scale, on [Design Tokens](/design-tokens#spacing).

### Read that table honestly

There is no elegant ratio here. Ten steps sit off the 4px grid entirely (9, 10, 11, 13, 14, 18, 42, 46, 50, 54), and the large end of the scale (36, 42, 46, 50, 54, 60, 68, 76) has never been used by a single component. They exist because `$spacingSizes` in `src/styles/variables/_type.scss` was seeded from `$fontSizes`, the type ramp, and every font size came along for the ride. `--nb-spacing-13` is 13px because 13px is a font size, not because anything needed 13px of padding.

The consequence for you is simple and worth stating flatly: **the presence of a step is not an endorsement of it.** The rhythm you should actually work in is eight steps wide:

```
2 · 4 · 8 · 12 · 16 · 24 · 32 · 48
```

Eight steps. That is the scale you should be able to recite. The other seventeen are available, and almost every use of one is a design decision that has not been made yet.

## Choosing a step

Do not ask "how much space looks right." Ask **what relationship am I expressing**, then read the answer off this table. The relationship is a fact about your content; the pixel value is a consequence.

| The two things are…                                    | Step                   | Example                                                      |
| ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------ |
| One thing. A glyph and the word it belongs to.         | `2` or `4`             | Chevron inside `NbButton`, dot inside a status badge.        |
| A label and the control it names.                      | `--nb-field-label-gap` | Not a spacing step. See [Density](#density).                 |
| Two controls that act together.                        | `8`                    | Confirm and Cancel in a footer, an input plus its unit menu. |
| Padding inside a small container.                      | `12`                   | `NbMenuItem`, a compact toolbar, an inspector row.           |
| Padding inside a normal container.                     | `16`                   | `NbPanel`, `NbCard`, a modal body.                           |
| Two fields in one form, independently labelled.        | `16`                   | Email, then Password.                                        |
| Two groups inside one section.                         | `24`                   | An address block, then a billing block.                      |
| Two sections of a page.                                | `32`                   | Profile settings, then Danger zone.                          |
| A major break the eye should treat as a page boundary. | `48`                   | Below the page header, above the footer.                     |

Two rules keep this honest.

**Never use two adjacent steps to mean two different relationships.** If the gap between fields is 16 and the gap between groups is 20, nobody sees a group. Skip a step, or do not claim a boundary. The jumps in the table above (8, 12, 16, 24, 32, 48) are roughly 1.5x apart precisely so the difference survives a glance.

**Space is the cheapest divider.** Before adding a rule, a border or a background tint to separate two blocks, try one step up. If 24 instead of 16 makes the grouping legible, the border was decoration.

::: danger Two pages currently rule on 24 and 32. This one wins.
[Layout](/principles/layout#gutters-and-gaps) publishes a second table against the `NbGrid` `gap` prop that reads `lg` (24px) as "between sections of a page" and `xl` (32px) as "between major regions". The table above reads 24 as _groups inside one section_ and 32 as _sections_. Both files ship today, so a reader following the wrong one puts 24 where this page puts 32 and the two surfaces disagree by exactly one step, which is the failure this page exists to prevent.

**This page owns what a step means.** Layout owns the `NbGrid` API: which props exist, how responsive maps cascade, what the 16-column grid does. Where the two disagree on meaning, use the choosing table above and read `gap="lg"` as 24 and `gap="xl"` as 32 with this page's semantics. The Layout table is a known documentation defect, recorded here rather than quietly corrected, because the same honesty applies to us: verify against the choosing table, not against whichever page you opened first.
:::

## Inside versus between

This is the distinction that decides who owns a value, and it is the one that produces `:deep()` selectors and specificity fights when it is ignored.

> A component owns the space **inside** its own box. Its parent owns the space **between** it and its siblings.

A component that ships an outer `margin` has made a layout decision on behalf of a parent it has never seen. Library components follow it. `NbEmptyState` documents it in its own `<style>` block: spacing comes from `gap`, and the children carry no margin at all.

```vue
<!-- Wrong: the card decides how far it sits from the next card -->
<style scoped lang="scss">
.invoice-card {
  padding: var(--nb-spacing-16);
  margin-bottom: var(--nb-spacing-16); // not this component's call
}
</style>
```

```vue
<!-- Right: the card owns its inside, the list owns the rhythm -->
<template>
  <NbGrid dir="col" gap="md">
    <InvoiceCard v-for="i in invoices" :key="i.id" :invoice="i" />
  </NbGrid>
</template>

<style scoped lang="scss">
.invoice-card {
  padding: var(--nb-spacing-16);
}
</style>
```

The second version survives being dropped into a denser context, being reordered, and having its last item removed. The first collapses margins with whatever is above it and leaves a phantom 16px under the final card.

### Prefer `gap` to `margin`

`gap` applies only between children, never at the edges, and it disappears when a child is `v-if`'d away. `margin-bottom` on every child plus a `:last-child` reset is the same idea with three more failure modes.

`NbGrid` is the intended vehicle. Its `gap` prop accepts `xxs` `xs` `sm` `md` `lg` `xl` `xxl` and is responsive:

```vue
<NbGrid dir="col" :gap="{ sm: 'sm', lg: 'md' }">
  <NbTextInput label="Email" name="email" />
  <NbTextInput label="Password" name="password" type="password" />
</NbGrid>
```

::: danger The direction prop is `dir`, and a wrong one fails silently
A vertical stack is `dir="col"`. There is no `col` prop: `IGridProps` in `src/components/Grid.d.ts` declares `dir?: TGridTypeInput` with `default: 'row'` and a validator accepting `'row' | 'col' | 'row-reverse' | 'col-reverse'`.

Write `<NbGrid col>` and Vue does not warn. `col` is not a declared prop, so it falls through `$attrs` onto the root element as an inert HTML attribute, `dir` keeps its default, and your stack renders as a **row**. The failure mode is a horizontal strip of cards, and nothing in the console says why. The same applies to any misspelt prop on any Vue component with `inheritAttrs` left on: the cost of guessing an API here is a wrong layout, not an error.
:::

The gap ratios are defined in `src/styles/variables/_grid.scss` as multiples of the base unit, and compile to literal pixels:

| `gap` value | Computed | Base units | Equivalent spacing token |
| ----------- | -------- | ---------- | ------------------------ |
| `xxs`       | `2px`    | 1/4        | `--nb-spacing-2`         |
| `xs`        | `4px`    | 1/2        | `--nb-spacing-4`         |
| `sm`        | `8px`    | 1          | `--nb-spacing-8`         |
| `md`        | `16px`   | 2          | `--nb-spacing-16`        |
| `lg`        | `24px`   | 3          | `--nb-spacing-24`        |
| `xl`        | `32px`   | 4          | `--nb-spacing-32`        |
| `xxl`       | `48px`   | 6          | `--nb-spacing-48`        |

Note what that table is: `NbGrid` uses the eight-step rhythm and nothing else. If the gap you want is not in that column, the layout is probably telling you the relationship is unclear rather than that the scale is short.

::: warning `gap-md` is not a token reference
Those class rules compile to `gap: 16px`, a literal baked in at build time, not `gap: var(--nb-spacing-16)`. `NbGrid` gaps therefore cannot be retuned from a consumer stylesheet by overriding a custom property. Set the gap through the prop.
:::

### The utility classes nobody knows about

`theme.classes` emits a padding and margin utility for **every** step of the scale, in every direction. They are real, they are in the shipped stylesheet, and no page has ever mentioned them.

```
.p-16   padding: var(--nb-spacing-16)
.ph-16  padding-left + padding-right
.pv-16  padding-top + padding-bottom
.pt-16 .pb-16 .pl-16 .pr-16
.m-16 .mh-16 .mv-16 .mt-16 .mb-16 .ml-16 .mr-16
```

Substitute any step from the table for `16`. These are useful for one-off scaffolding in a view. They are not a substitute for a component's own `<style scoped>` block, and per the house rule, CSS lives in an SFC style block, never anywhere else in the file.

## Logical properties, and why the utilities are LTR only

Space has a direction, and half of the ways to write it in CSS assume the reader starts on the left.

**In component styles, write the logical property.** `padding-inline`, `padding-block`, `margin-inline`, `inset-inline`, `border-inline-start`. These follow the writing mode, so a component styled with them mirrors correctly under `dir="rtl"` with no second stylesheet and no `[dir]` selector anywhere.

| Physical                         | Logical                 | Note                                        |
| -------------------------------- | ----------------------- | ------------------------------------------- |
| `padding-left` + `padding-right` | `padding-inline`        | One declaration, mirrors.                   |
| `padding-top` + `padding-bottom` | `padding-block`         | Vertical, so it does not mirror, but pairs. |
| `padding-left`                   | `padding-inline-start`  | The leading edge, whichever side that is.   |
| `margin-right`                   | `margin-inline-end`     | The trailing edge.                          |
| `left: 0`                        | `inset-inline-start: 0` | For popovers, badges, absolute chrome.      |
| `border-left`                    | `border-inline-start`   | Common on selected-row indicators.          |

This is already the majority position in the library rather than an aspiration: `src/components/*.vue` carries 32 `*-inline`/`*-block` declarations against 17 physical `padding-left`/`padding-right`/`margin-left`/`margin-right` ones. `Button.vue` sets every one of its seven size ramps with `padding-inline: calc(var(--nb-base-unit) * n)`. `DataTable.vue` insets every cell with `padding-inline`, `Pagination.vue` uses `padding-inline-end`, `TreeNode.vue` uses `padding-inline-end` and `inset-inline-start` for its indent guide, and `Toaster.vue` positions all four corner stacks with `inset-inline-start` / `inset-inline-end` so a toast anchors to the trailing edge rather than to the right. New code should not add to the seventeen.

::: warning The `-h`, `-l` and `-r` utilities are LTR scaffolding
`theme.classes` generates them from `$spacingTypes` (`p`, `m`) and `$spacingDir` (`r`, `l`, `t`, `b`) in `src/styles/variables/_type.scss`, and the emitted rules are physical:

```css
.ph-16 {
  padding-left: var(--nb-spacing-16);
  padding-right: var(--nb-spacing-16);
}
.pl-16 {
  padding-left: var(--nb-spacing-16);
}
```

`.pv-*`, `.pt-*` and `.pb-*` are vertical and therefore safe anywhere. `.ph-*`, `.mh-*`, `.pl-*`, `.pr-*`, `.ml-*` and `.mr-*` are not: they pin space to a physical side and will sit on the wrong edge in a right-to-left locale. There is no logical variant of these classes today and adding one would change the shipped class surface, so treat them as scaffolding for a known-LTR surface and reach for a scoped `padding-inline` the moment the value matters.
:::

The library ships no `[dir="rtl"]` rules at all, which is the honest state of things: RTL is unproven here rather than broken. Writing logical properties in your own components is what keeps that a small job rather than a rewrite.

## Vertical rhythm

Horizontal space is mostly bounded by the container. Vertical space accumulates down the page, so an inconsistency at the top is still visible three screens later.

**One spine per stack.** A column of content should change its gap only when the _relationship_ changes, and should return to the same value when the relationship returns. A settings page that runs 16, 16, 24, 16, 20, 16 has no rhythm; a reader cannot learn it, so grouping stops communicating.

**Line height is part of the gap.** Body text at `--nb-type-body-md-line-height` (1.5) on a 14px face carries 3.5px of leading above and below each line. A 12px gap under a paragraph reads as roughly 15px. This is why the step below a block of prose usually needs to be one larger than the step below a control of the same nominal height: match what the eye sees, not what the box model says.

**Never let a heading float.** A heading belongs to what follows it. Give it more space above than below, always. `heading-02` above a paragraph wants something like 32 above and 8 below. Equal space on both sides makes the heading look like it belongs to the section it just ended.

**Do not let empty containers collapse.** When a list is loading or empty, the surrounding rhythm should not change. Reserve the height. The audit found an app whose single `.empty-text` element rendered both the loading and the empty state, so a failed fetch read as "no contacts yet". Use `NbEmptyState` or `NbSkeleton`, both of which occupy space deliberately.

## Density

Density is not a slider in this library. It is a `size` prop, and it is real: it changes the height of the control, therefore the vertical rhythm of everything around it.

Every field control implementing `IWithFieldAppearance` (`src/types/Props.d.ts`) takes `size?: 'xs' | 'sm' | 'md' | 'lg'`, which selects a field height token:

| `size` | Token                  | Computed | Base units | Use it for                                                   |
| ------ | ---------------------- | -------- | ---------- | ------------------------------------------------------------ |
| `xs`   | `--nb-field-height-xs` | `28px`   | 3.5        | Inspectors, toolbars, property rows. Pair with a 13px face.  |
| `sm`   | `--nb-field-height-sm` | `32px`   | 4          | Dense tables, filter bars, a modal with many fields.         |
| `md`   | `--nb-field-height-md` | `40px`   | 5          | The default. Standalone forms, settings pages.               |
| `lg`   | `--nb-field-height-lg` | `48px`   | 6          | Marketing surfaces, a single prominent input, touch targets. |

Two supporting tokens travel with them and are the reason a mixed row of controls lines up:

- `--nb-field-padding-h` is `16px` (2 base units), the horizontal inset of every field box.
- `--nb-field-label-gap` is `6px` (0.75 base units), the vertical gap between a label and its control. This is deliberately **not** a spacing step. Every control reads the same token, so a row mixing `NbTextInput`, `NbSelect` and `NbDatePicker` lines its field tops up to the pixel. Do not substitute `--nb-spacing-8` for it in one component: you will break the alignment for the whole row.

### Pick one density per surface

The `size` prop belongs to the surface, not to the control. A panel is dense or it is not. Mixing `sm` and `md` fields in one form produces two competing baselines and no amount of gap tuning rescues it.

```vue
<!-- An inspector: one density, stated once per group -->
<NbGrid dir="col" gap="sm">
  <NbTextInput size="xs" label="Name" name="name" />
  <NbTextInput size="xs" label="Slug" name="slug" />
  <NbSelect size="xs" label="Status" name="status" :options="statuses" />
</NbGrid>
```

As density goes up, the gaps between controls must come **down**, not stay put. A 24px gap between two 28px inspector rows makes the rows look unrelated. Rough pairing:

| Density | Gap between controls | Container padding |
| ------- | -------------------- | ----------------- |
| `xs`    | `8`                  | `12`              |
| `sm`    | `8` or `12`          | `16`              |
| `md`    | `16`                 | `16`              |
| `lg`    | `16` or `24`         | `24`              |

::: danger `xs` is not implemented everywhere
`NbTextInput` and `NbSelect` both declare a `&--xs` rule that binds `--field-h` to `--nb-field-height-xs`. `NbDatePicker` does not. It accepts `size="xs"` because it extends the same interface, then falls through to its base declaration of `--nb-field-height-md` and renders at 40px next to your 28px inputs, with no error.

Until that is fixed, verify `xs` visually on every control type you put in a dense row. `sm` is implemented by all three.
:::

::: warning `NbButton` sizes are not field sizes
`NbButton` implements seven sizes (`xxs` `xs` `sm` `md` `lg` `xl` `xxl`) at 16, 24, 32, 40, 48, 64 and 128 pixels. Three of them coincide with field heights: `sm` is 32, `md` is 40, `lg` is 48. **`xs` does not.** A `size="xs"` button next to a `size="xs"` text input is 24px against 28px, and the mismatch is visible.

In an `xs` field row, use `size="sm"` on the button and accept 32 against 28, or set an explicit height. Do not assume the two scales are the same scale, because they are not.
:::

## Responsive spacing

Two questions, answered flatly, because a breakpoint map in a template implies an answer to both and gets read either way.

**Do the spacing tokens themselves change at a breakpoint? No.** `--nb-spacing-*` is declared exactly once, at `src/styles/_theme.scss:103`, inside no media query. `--nb-spacing-16` is `1rem` at 320px and `1rem` at 2560px. There is no responsive spacing layer in this library and none is planned: a token that silently means two things at two widths cannot be reasoned about from the markup.

**May I jump a step at a breakpoint? Yes, and often you must.** What changes responsively is not the value of a step, it is _which step you choose_. A 32px section break is a comfortable pause on a 1280px page and a tenth of the visible height on a 360px phone. Change the choice, in the template, where it is visible.

```vue
<!-- 24 between groups on a wide screen, 16 on a narrow one -->
<NbGrid dir="col" :gap="{ sm: 'md', lg: 'lg' }">
  <AddressBlock />
  <BillingBlock />
</NbGrid>
```

The map cascades upward from each named width, so `sm` covers 320px and up until `lg` (1056px) takes over. Read the values through the [gap table](#prefer-gap-to-margin): `md` is 16, `lg` is 24.

Three rules keep this from becoming a second, invisible scale.

**Move one step, never two.** 24 down to 16 is a narrower version of the same relationship. 32 down to 8 is a different design, and the two widths will not read as the same product.

**Only the large end moves.** Steps 2, 4 and 8 express things that are _one thing_: a glyph and its label, a control and its unit. That relationship does not get closer on a phone, so those three steps never move. Container padding (12, 16) moves only on a genuinely cramped surface. Group and section breaks (24, 32, 48) are the ones that should.

**Change it in the template, not in a media query in your style block.** `:gap="{ sm: …, lg: … }"` is greppable and lives next to the markup it governs. A `@media` block three hundred lines down in a stylesheet is the thing nobody finds when the layout is wrong.

| Relationship        | `sm` (320+) | `lg` (1056+) | Prop                            |
| ------------------- | ----------- | ------------ | ------------------------------- |
| Inside a container  | `12`        | `16`         | padding, in your style block    |
| Sibling fields      | `16`        | `16`         | `gap="md"`, no map needed       |
| Groups in a section | `16`        | `24`         | `:gap="{ sm: 'md', lg: 'lg' }"` |
| Sections of a page  | `24`        | `32`         | `:gap="{ sm: 'lg', lg: 'xl' }"` |

Everything narrower than `sm` (320px) is out of scope for the grid and for WCAG 1.4.10 alike.

## Accessibility

Spacing is an accessibility surface, not a cosmetic one. Four areas of the guidelines bite directly on the decisions this page has just told you to make, and two of them bite on the density guidance above.

### Target size

**WCAG 2.5.8 Target Size (Minimum), level AA.** Every pointer target must be at least **24 by 24 CSS pixels**, or else be spaced so that a 24px-diameter circle centred on it does not intersect the circle of any neighbouring target. This page's density table and `NbButton`'s size ramp both put you close to that line, so know exactly where you are:

| Control                         | Size        | Status                                                                    |
| ------------------------------- | ----------- | ------------------------------------------------------------------------- |
| Field at `size="lg"`            | 48px high   | Comfortable.                                                              |
| Field at `size="md"`            | 40px high   | Comfortable.                                                              |
| Field at `size="sm"`            | 32px high   | Passes.                                                                   |
| Field at `size="xs"`            | 28px high   | Passes on size, with 4px to spare. Do not shave it further.               |
| `NbButton size="sm"` and up     | 32px and up | Passes.                                                                   |
| `NbButton size="xs"`            | 24px high   | Passes **exactly** at the minimum. No margin for a border or a transform. |
| `NbButton size="xxs"`           | 16px high   | **Fails on size.** Passes only via the spacing exception.                 |
| `NbButton size="xxs" icon-only` | 16 by 16px  | **Fails on size**, in both axes. Same exception, same conditions.         |

Work the exception arithmetic rather than trusting it. Two 16px targets in a row with the `xs` density gap of 8px sit 24px centre to centre, which clears the exception by nothing at all. Tighten that gap to 4px and the row is non-conformant. Stack a second row 8px below and the vertical distance is also exactly 24px, and any padding change in the container breaks it.

The rules that follow:

- **`xxs` is not a general-purpose size.** Use it only for a target the user is not required to hit: a decorative affordance duplicated by a larger control elsewhere, or something inside a line of text (inline targets are exempt from 2.5.8). If it is the only way to do the thing, it is too small.
- **`xs` at 24px leaves no headroom.** It conforms today and stops conforming the moment someone adds a 1px inset border or a `scale(0.95)` press animation. Prefer `sm`.
- **Density does not license crowding.** The density table pairs `xs` fields with an 8px gap because 28px controls need it visually. That is also the smallest gap that keeps a row of small buttons conformant. Do not read it as an invitation to go to 4.

### Text spacing overrides

**WCAG 1.4.12 Text Spacing, level AA.** A user may impose line-height 1.5x the font size, paragraph spacing 2x, letter-spacing 0.12em and word-spacing 0.16em, and **no content or function may be lost**. A page about vertical rhythm has to say what that means for you: your rhythm is a preference, and the user's is a requirement.

- **Never set a fixed `height` on anything containing text.** Use `min-height` and let it grow. The field height tokens are the deliberate exception: they size a single-line control whose text cannot wrap.
- **Never pair a tight inset with `overflow: hidden`.** 34 components in `src/components` set `overflow: hidden` somewhere. On a text container that combination turns a user's line-height preference into a clipped descender or a vanished second line.
- **Test it.** Paste this into the console on your own view. Anything that clips, overlaps or loses a control is a defect regardless of how it looks at default settings.

```js
document.documentElement.style.cssText +=
  'line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important'
```

### Reflow and text resize

**WCAG 1.4.10 Reflow and 1.4.4 Resize Text, level AA.** Content must work at 320 CSS px wide with no horizontal scrolling, and text must survive being enlarged to 200%.

Page zoom scales pixel literals and `rem` values alike, so a literal is not automatically a reflow failure. The difference shows up in the case zoom does not cover: a user who raises the **default font size** in their browser. Every `--nb-spacing-*` token is emitted in `rem`, so it grows with that preference and the padding around larger text grows with the text. A `padding: 14px` literal does not. Text gets bigger, its container does not, and the inset that looked generous becomes a collision. That is one more thing the 166 literals in this library get wrong and the 48 token uses get right.

For the width side: use the breakpoint maps above to drop a step at `sm` rather than letting a 32px inset eat a tenth of a 320px viewport, and see [Layout](/principles/layout) for the reflow rules that govern columns and hiding.

### Focus rings and tight insets

A focus ring is drawn outside the border box unless you tell it otherwise, so tight padding plus a clipping ancestor makes it disappear. That is a WCAG 2.4.7 Focus Visible failure when the ring is gone, a 2.4.11 Focus Not Obscured failure when a container swallows part of it, and an unusable keyboard path either way.

The library resolves this by pulling the ring inward on dense controls. `Button.vue` draws `outline: 1px solid var(--nb-c-focus-ring)` with `outline-offset: -2px`, and `MenuItem.vue`, `MenuBarItem.vue`, `DatePicker.vue`, `AccordionItem.vue`, `Board.vue` and `DataTable.vue` do the same. Sixteen declarations across the components use a negative offset, seventeen a positive one, and the split is not arbitrary:

- **Negative offset** when the control is dense, is flush against a scroll container, or sits inside something with `overflow: hidden`. The ring is drawn just inside the edge and cannot be clipped.
- **Positive offset** (1px or 2px) when the control has room around it: a card, a standalone button, a banner action.

Two rules for your own components:

1. If a focusable element has an inset smaller than 8px, or any ancestor with `overflow: hidden`, use a negative `outline-offset`. Do not use a positive one and hope.
2. Never remove the ring to fix a clipping problem. `outline: none` with no replacement is the single most common accessibility regression in application code, and the fix here is two characters of offset.

## Where the scale genuinely runs out

Some of the pixel literals in this codebase are not laziness. The scale has holes, and pretending otherwise would send you looking for tokens that do not exist.

**There is no `--nb-spacing-40`, `-56`, `-64`, `-72` or `-80`.** The scale jumps 36, 42, 46, 48, 50. So the height of a menu row (`--nb-menu-item-h`, 40px) and the width of the shell rail (`--nb-shell-sidebar-width`, 56px) are expressed as `calc(var(--nb-base-unit) * n)` rather than as spacing tokens. That is correct for those two, because they are geometry rather than spacing, but it means you will not find a spacing token for a 40px gap. If you need one, use `calc(var(--nb-base-unit) * 5)` and put a comment on it.

**There is no `--nb-spacing-6`.** The scale goes 4, 8. Six pixels shows up repeatedly in real interfaces, which is exactly why `--nb-field-label-gap` had to be minted as its own token. If you find yourself wanting 6, check whether you actually want the label gap token first.

**There are no separator or hairline tokens.** `--nb-shell-panel-gap` is `1px`, with a comment in `_theme.scss` explaining that it is a hairline separator and not a spacing step. Borders are `1px` literals throughout. That is fine, and it is not a hole worth filling.

**There is no negative space scale.** Overlap effects (an avatar row, a badge notched onto a corner) use negative margins written as literals. There is no token grammar for those and inventing one per component is currently the only option.

When you do write a literal, write down why:

```scss
// 40px: --nb-menu-item-h, matched so the trigger aligns with the rows below it.
// No --nb-spacing-40 exists; the scale skips from 36 to 42.
height: calc(var(--nb-base-unit) * 5);
```

A literal with a reason is a decision. A literal without one is the 462.

## The question every hardcoded pixel answers wrongly

Here is the mechanism, because it is always the same.

You are looking at a card. There is a gap under the title. It looks slightly tight. You type `margin-bottom: 14px`, refresh, and it looks right.

You have just answered the question **"how far apart should these two things be on my screen, today, at this zoom level, in this theme?"**

That is not the question the system is asking. The system is asking **"how strongly are these two things related?"** Your answer was 14. There is no relationship in the product that means 14. If the same title and subtitle appear in a modal next week, the person building the modal will look at their screen, decide it looks slightly tight, and type 12. Two answers, one relationship, and now the two surfaces disagree for a reason no one can name or fix, because neither value points at anything.

`var(--nb-spacing-12)` is not merely a tidier way to write 12px. It is a claim: _these two things are related the way things separated by one step are related._ When the density of the product changes, or the base scale is retuned, or a designer decides that step should be 14 after all, every place that made the same claim moves together. The literal does not move, because it was never a claim about anything.

So the test before you type a number:

1. Can I name the relationship? (Inside one thing, related pair, sibling fields, groups, sections.)
2. Does the [choosing table](#choosing-a-step) have a step for it? Use that step.
3. Does the number I want differ from that step by less than 4px? Then I am tuning, not designing. Use the step.
4. Is this geometry rather than spacing, matching a control height or a chrome dimension? Use `calc(var(--nb-base-unit) * n)` and comment the match.
5. Only now, a literal, with the reason in a comment above it.

And one check after, whenever the number sits between two things a pointer can hit: does every target still clear [24 by 24, or 24px centre to centre](#target-size)? Tightening a gap is the usual way a conformant row stops being one.

## Auditing your own app

Run this in a consuming repo. It counts pixel literals in spacing properties against uses of the scale:

```bash
grep -rhoE "(padding|margin|gap|row-gap|column-gap)[a-z-]*: *[^;]*" src \
  | grep -cE "[0-9]+px"
grep -rhoE "(padding|margin|gap|row-gap|column-gap)[a-z-]*: *[^;]*" src \
  | grep -c "nb-spacing"
```

If the first number is large and the second is zero, you are one of the two applications in the audit, and the fix is not a refactor. Start with the containers: replace the padding on your panels and cards with `--nb-spacing-16`, replace each stack with an `NbGrid dir="col"` carrying a `gap`, and most of the rest falls out.

## See also

- [Design Tokens](/design-tokens) for the token grammar, the other families, and which tokens are safe to override.
- [Layout](/principles/layout) for the `NbGrid` API this page prescribes: every responsive prop, the 16-column grid, breakpoints, and the shell. That page owns the API; this page owns what a step means. See [the note on 24 and 32](#choosing-a-step).
- [Typography](/principles/typography) for type sets and line height, which set the vertical rhythm this page assumes.
- [Theming](/theming) for layers, surfaces and the shell chrome tokens.
